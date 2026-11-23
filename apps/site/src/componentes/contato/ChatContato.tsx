'use client';

import { useEffect, useRef, useState, type Dispatch, type FormEvent, type ReactNode, type SetStateAction, type TextareaHTMLAttributes } from 'react';
import { contato } from '@/conteudo/contato';
import { t } from '@/conteudo/textos';
import { ehCelular, prefereMenosMovimento } from '@/lib/ambiente';
import { rota } from '@/lib/idioma';
import { useIdioma } from '@/lib/useIdioma';
import type { StatusDoCartao } from './CartaoResumo';

// 'cartao' marca onde o cartão de resumo entra na conversa (frames 05 a 07: depois do "confira", antes do agradecimento).
export type MensagemChat = { de: 'ia' | 'voce'; texto: string; erro?: boolean } | { de: 'cartao' };

export type StatusDoGlobo = 'online' | 'pensando' | 'resumo' | 'enviado' | 'falha';

// O que as duas fontes têm em comum depois do resumo: o status do globo (frame 00, "Estados do globo"), a cópia
// travada depois que o envio começa e, no sucesso real, o agradecimento com os links (frame 06).
export function useFimDoChat<M extends MensagemChat>(setMensagens: Dispatch<SetStateAction<M[]>>, temCartao: boolean, aoStatus?: (s: StatusDoGlobo) => void) {
  const idioma = useIdioma();
  const c = contato.chat;
  const [ocupado, setOcupado] = useState(false);
  const [cartao, setCartao] = useState<StatusDoCartao | null>(null);
  const [travado, setTravado] = useState(false);
  const status: StatusDoGlobo = cartao === 'enviado' ? 'enviado' : ocupado || cartao === 'enviando' ? 'pensando' : cartao === 'falha' ? 'falha' : temCartao ? 'resumo' : 'online';
  useEffect(() => { aoStatus?.(status); }, [status, aoStatus]);
  function aoStatusDoCartao(s: StatusDoCartao) {
    setCartao(s);
    if (s === 'enviando') setTravado(true);
    if (s === 'enviado') setMensagens(m => [...m, { de: 'ia', texto: t(c.obrigado, idioma) } as M]);
  }
  const links = cartao === 'enviado' ? (
    <div className="chat-respostas">
      <a href={rota('trabalhos', idioma)}>{t(c.verTrabalhos, idioma)}</a>
      <a href={rota('inicio', idioma)}>{t(c.voltarInicio, idioma)}</a>
    </div>
  ) : undefined;
  return { setOcupado, aoStatusDoCartao, travado, links };
}

// A rota devolve a resposta inteira; o tempo real é só no cliente (spec, seção 3): uma palavra a cada PASSO ms.
const PASSO = 45;
const LINHAS = 5;

function Revelar({ texto, aoFim }: { texto: string; aoFim: () => void }) {
  const palavras = texto.match(/\S+\s*/g) ?? [texto];
  const [n, setN] = useState(0);
  const fim = useRef(aoFim);
  fim.current = aoFim;
  useEffect(() => {
    // Pelo relógio, não por tique: com poucos quadros, uma resposta longa não se arrasta.
    const inicio = Date.now();
    const timer = setInterval(() => {
      const k = Math.min(palavras.length, Math.floor((Date.now() - inicio) / PASSO));
      setN(k);
      if (k === palavras.length) { clearInterval(timer); fim.current(); }
    }, PASSO / 3);
    return () => clearInterval(timer);
  }, [texto]); // eslint-disable-line react-hooks/exhaustive-deps
  return <>{palavras.slice(0, n).join('')}</>;
}

type Props = {
  mensagens: MensagemChat[];
  pensando: boolean;
  entrada: string;
  aoMudar: (v: string) => void;
  aoEnviar: (texto: string) => void;
  aoParar?: () => void;
  aoOcupado?: (v: boolean) => void;
  placeholder: string;
  respostas?: string[];
  // No lugar das pílulas simples (o checklist do roteiro, os links depois do envio).
  extra?: ReactNode;
  cartao?: ReactNode;
  travado?: boolean;
  invalido?: boolean;
  aviso?: 'ia' | 'roteiro';
  campo?: Pick<TextareaHTMLAttributes<HTMLTextAreaElement>, 'inputMode' | 'autoComplete' | 'maxLength'>;
};

// Chat comum às duas fontes (ConversaIA e ConversaGuiada): mensagens, campo, respostas rápidas e o lugar do cartão.
export function ChatContato({ mensagens, pensando, entrada, aoMudar, aoEnviar, aoParar, aoOcupado, placeholder, respostas = [], extra, cartao, travado = false, invalido = false, aviso = 'ia', campo: atributos }: Props) {
  const idioma = useIdioma();
  const c = contato.chat;
  const [reduzido] = useState(prefereMenosMovimento);
  // Quantas mensagens já foram mostradas inteiras; a primeira mensagem da IA depois delas está sendo revelada.
  const [mostradas, setMostradas] = useState(mensagens.length);
  const lista = useRef<HTMLDivElement>(null);
  const campo = useRef<HTMLTextAreaElement>(null);
  let k = Math.min(mostradas, mensagens.length);
  while (k < mensagens.length && (mensagens[k].de !== 'ia' || reduzido)) k++;
  const revelando = k < mensagens.length ? k : -1;
  const ocupado = pensando || revelando >= 0;
  const vazio = mensagens.length === 0 && !pensando;
  // Espera que varia (a IA leva de 1 a 25 s): passados 10 s, avisa que está demorando (o "Parar" já está à mão).
  const [demorado, setDemorado] = useState(false);
  useEffect(() => {
    setDemorado(false);
    if (!pensando) return;
    const timer = setTimeout(() => setDemorado(true), 10000);
    return () => clearTimeout(timer);
  }, [pensando]);

  // A conversa desce sozinha sempre que cresce (mensagem nova, revelação, cartão, aviso de falha dentro dele).
  useEffect(() => {
    const el = lista.current;
    if (!el?.firstElementChild || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => { el.scrollTop = el.scrollHeight; });
    ro.observe(el.firstElementChild);
    return () => ro.disconnect();
  }, [vazio]);
  useEffect(() => { aoOcupado?.(ocupado); }, [ocupado, aoOcupado]);
  // O foco volta ao campo depois de cada resposta (frame 00, acessibilidade); no vazio do desktop, já começa nele.
  const estava = useRef(ocupado);
  useEffect(() => {
    if (estava.current && !ocupado) campo.current?.focus();
    estava.current = ocupado;
  }, [ocupado]);
  useEffect(() => { if (!ehCelular(window.innerWidth)) campo.current?.focus(); }, []);
  // Cresce com o texto até 5 linhas; depois rola por dentro.
  useEffect(() => {
    const el = campo.current;
    if (!el) return;
    el.style.height = '';
    const linha = parseFloat(getComputedStyle(el).lineHeight) || 24;
    if (el.scrollHeight > el.clientHeight) el.style.height = `${Math.min(el.scrollHeight, linha * LINHAS + 2)}px`;
  }, [entrada]);

  function enviar(e?: FormEvent) {
    e?.preventDefault();
    if (ocupado || travado || !entrada.trim()) return;
    aoEnviar(entrada.trim());
  }
  function parar() {
    if (pensando) aoParar?.();
    else setMostradas(mensagens.length);
    campo.current?.focus();
  }

  const pilulas = !ocupado && (extra ?? (!travado && respostas.length > 0 && (
    <div className="chat-respostas" role="group" aria-label={t(c.respostas, idioma)}>
      {respostas.map(r => <button key={r} type="button" onClick={() => aoEnviar(r)}>{r}</button>)}
    </div>
  )));
  const rotulo = <span className="chat-rotulo">{t(c.rotulo, idioma)}</span>;

  return (
    <section className={`chat${vazio ? ' chat-vazio' : ''}`} aria-label={t(contato.guiada.titulo, idioma)}>
      {vazio && <div className="chat-abertura"><h2>{t(c.titulo, idioma)}</h2><p>{t(c.subtitulo, idioma)}</p></div>}
      {!vazio && (
        <div className="chat-lista" ref={lista} role="log" aria-live="polite" aria-label={t(contato.conversa.historico, idioma)} data-lenis-prevent="">
          <div className="chat-coluna">
            {mensagens.slice(0, revelando >= 0 ? revelando : mensagens.length).map((m, i) =>
              m.de === 'cartao' ? <div key={i} className="chat-cartao">{cartao}</div>
                : m.de === 'voce' ? <div key={i} className="chat-voce"><p>{m.texto}</p></div>
                  : <div key={i} className={`chat-ia${m.erro ? ' chat-erro' : ''}`}>{rotulo}<p id={m.erro && i === mensagens.length - 1 ? 'chat-erro' : undefined}>{m.texto}</p></div>)}
            {/* Enquanto revela, a mensagem fica fora da leitura; ela entra inteira na região viva quando termina. */}
            {revelando >= 0 && (() => { const m = mensagens[revelando] as { texto: string; erro?: boolean }; return (
              <div key={`r${revelando}`} className={`chat-ia chat-revelando${m.erro ? ' chat-erro' : ''}`} aria-hidden="true">
                {rotulo}<i className="chat-ponto" />
                <p><Revelar texto={m.texto} aoFim={() => setMostradas(revelando + 1)} /><span className="chat-cursor" /></p>
              </div>
            ); })()}
            {pensando && revelando < 0 && <div className="chat-ia chat-pensando" aria-hidden="true">{rotulo}<i className="chat-ponto" /><p><span className="chat-cursor" /></p></div>}
            {pensando && demorado && <p className="chat-demorado" role="status">{t(c.demorado, idioma)}</p>}
            {pilulas}
          </div>
        </div>
      )}
      <form className="chat-composer" onSubmit={enviar} noValidate>
        <label className="resposta-acessivel" htmlFor="chat-campo">{t(c.campo, idioma)}</label>
        <textarea id="chat-campo" ref={campo} rows={1} value={entrada} readOnly={ocupado} disabled={travado} aria-invalid={invalido || undefined} aria-describedby={invalido ? 'chat-erro' : undefined}
          placeholder={ocupado ? t(c.respondendo, idioma) : placeholder} {...atributos}
          onChange={e => aoMudar(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar(); } }} data-lenis-prevent="" />
        {ocupado
          // Chaves diferentes: o clique em "parar" não pode virar envio quando o mesmo botão troca de tipo no meio do clique.
          ? <button key="parar" type="button" className="chat-botao chat-parar" aria-label={t(c.parar, idioma)} onClick={parar}><span aria-hidden="true" /></button>
          : <button key="enviar" type="submit" className="chat-botao" aria-label={t(c.enviar, idioma)} disabled={travado}><span aria-hidden="true">↑</span></button>}
      </form>
      <p className="chat-aviso">{t(aviso === 'ia' ? c.avisoIA : c.avisoRoteiro, idioma)}<span aria-hidden="true"> · </span><a href={rota('privacidade', idioma)}>{t(contato.conversa.privacidade, idioma)}</a></p>
      {vazio && pilulas}
    </section>
  );
}
