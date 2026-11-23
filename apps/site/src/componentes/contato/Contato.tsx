'use client';

import { useScrollbar } from '@14islands/r3f-scroll-rig';
import { useEffect, useRef, useState, type KeyboardEvent, type MouseEvent } from 'react';
import { EsferaDeLetras } from '@/compartilhados/esfera/EsferaDeLetras';
import { contato } from '@/conteudo/contato';
import { t } from '@/conteudo/textos';
import { cena } from '@/estado/cena';
import { PRIORIDADE, gsap, recalcularGatilhos } from '@/gsap';
import { ehCelular, prefereMenosMovimento } from '@/lib/ambiente';
import { useEfeitoDeLayout } from '@/lib/useEfeitoDeLayout';
import { useIdioma } from '@/lib/useIdioma';
import { alvoDoSimbolo } from '@/marca/amostrar';
import { CURVAS, TEMPOS } from '@/movimento/tokens';
import { ehCliqueSimples } from '@/componentes/transicao/cliqueSimples';
import { emitirContato } from '@/lib/contato/acao';
import type { ContatoServidorDTO } from '@/lib/contato/servidor';
import { rota } from '@/lib/idioma';
import { GloboDoChat, type StatusDoGlobo } from './ChatContato';
import { ConversaGuiada } from './ConversaGuiada';
import { ConversaIA } from './ConversaIA';
import { Rodape } from './Rodape';
import './estilo.css';

type Modo = 'desktop' | 'celular' | 'reduzido';
const PRAZO_EMISSAO = 10_000;

// O círculo escuro encolhe e devolve o claro; atrás dele, a esfera de letras FLOWAY que forma o F do símbolo.
// A esfera recebe alvoDoSimbolo, a fábrica do módulo (com cache): uma arrow aqui recriaria os 20 mil atributos
// a cada render (R1 da Arquitetura). O fundo da seção é o claro #F7F7F5, o mesmo que a esfera supõe.
// No desktop a tela e a esfera ficam presas por position: sticky (não pelo pin do GSAP, que a cena da esfera não acompanha).
// Issue #29: "Iniciar um projeto" abre o chat na própria cena (estado 02): a cena fica presa, frase e rodapé saem, o globo vai
// ao canto (lugar) e o chat entra de baixo. "Fechar" desfaz, sem desmontar a conversa da sessão.
export function Contato() {
  const idioma = useIdioma();
  const c = contato.chat;
  const [modo, setModo] = useState<Modo | null>(null);
  const [aberto, setAberto] = useState(false);
  const [montado, setMontado] = useState(false);
  const [status, setStatus] = useState<StatusDoGlobo>('online');
  const [canto, setCanto] = useState<HTMLDivElement | null>(null);
  const [grande, setGrande] = useState<HTMLDivElement | null>(null);
  const secaoRef = useRef<HTMLElement>(null);
  const { __lenis: lenis } = useScrollbar();
  // Emenda 1 do contato-b.1 (registro 008): a Início é estática; o DTO (com a intenção) vem da Server Action, uma vez por
  // abertura, e fica só aqui, em memória. Falha ou 10 s sem resposta: o padrão da tela 07, sem campo para enviar.
  const [servidor, setServidor] = useState<ContatoServidorDTO | null>(null);
  const [emissao, setEmissao] = useState<'ociosa' | 'emitindo' | 'falha'>('ociosa');
  const emitindo = useRef(false);
  const Conversa = servidor?.conversaDisponivel ? ConversaIA : ConversaGuiada;
  function emitir() {
    if (emitindo.current) return;
    emitindo.current = true;
    setEmissao('emitindo');
    let prazo: ReturnType<typeof setTimeout> | undefined;
    Promise.race([emitirContato(idioma), new Promise<never>((_, rejeitar) => { prazo = setTimeout(rejeitar, PRAZO_EMISSAO); })])
      .then(dto => { setServidor(dto); setEmissao('ociosa'); }, () => setEmissao('falha'))
      .finally(() => { clearTimeout(prazo); emitindo.current = false; });
  }

  function iniciar(e: MouseEvent<HTMLAnchorElement>) {
    if (!ehCliqueSimples(e)) return;
    e.preventDefault();
    setMontado(true);
    setAberto(true);
    if (!servidor) emitir();
  }
  function fechar() {
    setAberto(false);
  }
  const teclar = (e: KeyboardEvent) => { if (e.key === 'Escape') fechar(); };

  // Aberto: a cena fica presa no fim da seção (sem rolar a página) e o foco vai ao campo; fechado, volta ao CTA.
  const abriu = useRef(false);
  useEffect(() => {
    const html = document.documentElement;
    const secao = secaoRef.current!;
    if (!aberto) {
      if (abriu.current) secao.querySelector<HTMLElement>('.rodape-cta')?.focus();
      return;
    }
    abriu.current = true;
    const fim = Math.min(secao.offsetTop + secao.offsetHeight - innerHeight, html.scrollHeight - innerHeight);
    if (Math.abs(scrollY - fim) > 1) {
      // Imediato: o stop() logo abaixo cancelaria uma rolagem animada. Dentro do trecho preso a tela não se move; só o
      // círculo termina de encolher pelo scrub.
      if (lenis) lenis.scrollTo(fim, { force: true, immediate: true });
      else window.scrollTo(0, fim);
    }
    lenis?.stop();
    html.classList.add('contato-aberto');
    return () => {
      html.classList.remove('contato-aberto');
      lenis?.start();
    };
  }, [aberto, lenis]);
  // O foco vai ao campo quando o chat aparece (abrir, reabrir, emissão que chega) e ao "Tentar de novo" na falha.
  useEffect(() => {
    if (!aberto || emissao === 'emitindo') return;
    secaoRef.current!.querySelector<HTMLElement>('.contato-chat textarea, .chat-inicio-falha button')?.focus({ preventScroll: true });
  }, [aberto, emissao, servidor]);
  // A intenção é emitida por língua: trocar a língua antes de qualquer envio descarta o DTO e a conversa (a próxima abertura
  // emite na língua nova). Depois de uma tentativa (falha ou enviado), a intenção fica imutável e o corpo já está fixado.
  const linguaDoDto = useRef(idioma);
  useEffect(() => {
    if (linguaDoDto.current === idioma) return;
    linguaDoDto.current = idioma;
    if (status === 'falha' || status === 'enviado') return;
    setServidor(null); setStatus('online'); setEmissao('ociosa'); setMontado(false); setAberto(false);
  }, [idioma, status]);
  const statusDoGlobo: StatusDoGlobo = emissao === 'falha' ? 'falha' : emissao === 'emitindo' ? 'pensando' : status;
  // No celular, o globo grande fica no vazio (M02) até a conversa começar; depois, vira o ícone da barra.
  const lugar = !aberto ? null : grande?.getClientRects().length ? grande : canto;

  useEffect(() => {
    // O celular usa o mesmo caminho do desktop (sticky + scrub); a classe modo-celular só ajusta o CSS.
    setModo(prefereMenosMovimento() ? 'reduzido' : ehCelular(window.innerWidth) ? 'celular' : 'desktop');
  }, []);

  useEfeitoDeLayout(() => {
    if (!modo) return;
    const secao = document.querySelector<HTMLElement>('.secao-contato')!;
    const rodape = secao.querySelector<HTMLElement>('.rodape')!;
    // Celular: a esfera fica só na área livre abaixo da frase (a altura da frase muda com a língua).
    if (modo === 'celular') {
      const frase = secao.querySelector<HTMLElement>('.frase-contato')!;
      secao.style.setProperty('--topo', `${frase.offsetTop + frase.offsetHeight + 12}px`);
    }
    const ativar = (sim: boolean) => {
      cena.contatoAtivo = sim;
      rodape.classList.toggle('visivel', sim);
      secao.classList.toggle('ativo', sim);
    };

    if (modo === 'reduzido') {
      // Sem círculo e sem nada ligado à rolagem: o rodapé aparece quando a seção entra na tela.
      const io = new IntersectionObserver(([e]) => ativar(e.isIntersecting), { threshold: 0.3 });
      io.observe(secao);
      return () => {
        io.disconnect();
        cena.contatoAtivo = false;
      };
    }

    const ctx = gsap.context(() => {
      const circulo = secao.querySelector<HTMLElement>('.circulo-escuro')!;
      const encolher = { scale: 0, duration: TEMPOS['tempo-circulo'], ease: CURVAS['curva-circulo'] };
      // A tela fica presa por CSS (position: sticky) enquanto a seção, 1,8 altura da tela, passa: o círculo encolhe nesse trecho.
      gsap
        .timeline({
          scrollTrigger: {
            trigger: secao,
            start: 'top top',
            end: 'bottom bottom',
            scrub: 1,
            refreshPriority: PRIORIDADE.contato,
            onUpdate: ({ progress }) => {
              if (progress > 0.001 && !secao.classList.contains('ativo')) ativar(true);
              if (progress <= 0.001 && secao.classList.contains('ativo')) ativar(false);
            },
          },
        })
        .to(circulo, encolher);
      recalcularGatilhos();
    }, secao);
    return () => {
      ctx.revert();
      cena.contatoAtivo = false;
    };
  }, [modo]);

  return (
    <section ref={secaoRef} data-fundo="claro" className={`secao-contato modo-${modo ?? 'desktop'}${aberto ? ' com-chat' : ''}`} id="contato">
      <div className="contato-tela">
        <p className="frase-contato">{t(contato.frase, idioma)}</p>
        <div className="circulo-escuro" aria-hidden="true" />
        <Rodape aoIniciar={iniciar} />
        {montado && (
          <div className="contato-chat" hidden={!aberto} onKeyDown={teclar}>
            <div className="chat-topo">
              <p className="chat-iniciar">{t(c.iniciar, idioma)}</p>
              <button type="button" className="chat-fechar" onClick={fechar}><span className="chat-fechar-texto">{t(c.fechar, idioma)}</span><span aria-hidden="true">✕</span></button>
            </div>
            {servidor && <Conversa servidor={servidor} aoStatus={setStatus} lugarDoGlobo={setGrande} />}
            {emissao === 'falha' && (
              <section className="chat chat-inicio-falha" aria-label={t(contato.guiada.titulo, idioma)}>
                <div className="chat-ia chat-erro"><span className="chat-rotulo">{t(c.rotulo, idioma)}</span><p role="alert">{t(c.falhaInicio, idioma)}</p></div>
                <div className="formulario-acoes">
                  <button type="button" onClick={emitir}>{t(contato.conversa.repetir, idioma)}</button>
                  <a href={rota('contato', idioma)}>{t(c.abrirContato, idioma)}</a>
                </div>
              </section>
            )}
            <GloboDoChat status={statusDoGlobo}><div className="contato-globo-lugar" ref={setCanto} /></GloboDoChat>
          </div>
        )}
      </div>
      {/* Aberto, o globo segue o estado do chat (o F só no sucesso real); fechado, volta à alternância da Início. */}
      <EsferaDeLetras alvo={alvoDoSimbolo} fixa lugar={lugar} respondendo={aberto && statusDoGlobo === 'pensando'} formarAlvo={aberto ? statusDoGlobo === 'enviado' : undefined} />
    </section>
  );
}
