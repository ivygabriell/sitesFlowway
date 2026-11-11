'use client';

import { useEffect, useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from 'react';
import { contato } from '@/conteudo/contato';
import { t, type Idioma, type Texto } from '@/conteudo/textos';
import { useIdioma } from '@/lib/useIdioma';
import type { Pedido } from '@/lib/pedidoDeContato';

// Conversa em formato de chat: a Floway pergunta uma coisa por vez, todas obrigatórias, e o pedido sai no mesmo
// formato do formulário, para seguir pelo envio que já existe. As perguntas são exemplos até a pessoa mandar as definitivas.
type Respostas = { nome: string; empresa: string; necessidades: string[]; prazo: string; whatsapp: string; email: string; descricao: string };
type Passo = keyof Respostas;
const ORDEM: Passo[] = ['nome', 'empresa', 'necessidades', 'prazo', 'whatsapp', 'email', 'descricao'];
const LIMITE: Record<Passo, number> = { nome: 200, empresa: 200, necessidades: 0, prazo: 0, whatsapp: 30, email: 120, descricao: 4500 };
const VAZIO: Respostas = { nome: '', empresa: '', necessidades: [], prazo: '', whatsapp: '', email: '', descricao: '' };
const AUTOCOMPLETAR: Partial<Record<Passo, string>> = { nome: 'name', empresa: 'organization', whatsapp: 'tel', email: 'email' };
type Balao = { de: 'floway' | 'voce'; texto: string; hora: string };

export const emailValido = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
// WhatsApp brasileiro: DDD (11 a 99) + 8 dígitos (fixo) ou 9 começando por 9 (celular), com ou sem +55 e pontuação.
export function whatsappValido(valor: string): boolean {
  const v = valor.trim();
  if (/[^\d\s()+.-]/.test(v)) return false;
  const digitos = v.replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, '');
  return /^[1-9][1-9]\d{8,9}$/.test(digitos) && (digitos.length === 10 || digitos[2] === '9');
}

export function montarPedido(r: Respostas, idioma: Idioma): Pedido {
  const g = contato.guiada;
  const mensagem = `${t(g.rotuloNecessidades, idioma)}: ${r.necessidades.join(', ')}\n${t(g.rotuloPrazo, idioma)}: ${r.prazo}\n\n${r.descricao.trim()}`;
  return { nome: r.nome.trim(), empresa: r.empresa.trim(), contato: `WhatsApp: ${r.whatsapp.trim()} · E-mail: ${r.email.trim()}`, mensagem };
}

const hora = () => new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
const mostrar = (v: string | string[]) => (Array.isArray(v) ? v.join(', ') : v);

// bloqueado: o envio já começou; o resumo fica fixo para não descartar uma tentativa pendente.
export function ConversaGuiada({ aoConcluir, aoEditar, children, bloqueado = false }: { aoConcluir: (p: Pedido) => void; aoEditar?: () => void; children?: ReactNode; bloqueado?: boolean }) {
  const idioma = useIdioma();
  const g = contato.guiada;
  const [baloes, setBaloes] = useState<Balao[]>([]);
  const [passo, setPasso] = useState(-1);
  const [digitando, setDigitando] = useState(true);
  const [entrada, setEntrada] = useState('');
  const [erro, setErro] = useState('');
  const [marcados, setMarcados] = useState<string[]>([]);
  const [outro, setOutro] = useState('');
  const [concluido, setConcluido] = useState(false);
  const [editando, setEditando] = useState(false);
  const respostas = useRef<Respostas>({ ...VAZIO });
  const lista = useRef<HTMLDivElement>(null);
  const campo = useRef<HTMLTextAreaElement>(null);
  const atual = ORDEM[passo];
  const rotuloOutro = t(g.necessidades[g.necessidades.length - 1], idioma);
  const prefixoOutro = `${rotuloOutro}: `;
  const respondidas = concluido ? ORDEM.length : Math.max(0, passo);

  // A Floway "digita" um instante antes de cada pergunta, como num chat. Ao editar, a resposta anterior volta preenchida.
  function perguntar(indice: number, reabrir = false) {
    setDigitando(true); setPasso(-1);
    setTimeout(() => {
      const p = ORDEM[indice];
      const pergunta = t(g.perguntas[p], idioma).replace('{nome}', respostas.current.nome.trim().split(' ')[0] ?? '');
      setBaloes(b => [...b, { de: 'floway', texto: reabrir ? t(g.reperguntar, idioma).replace('{pergunta}', pergunta) : pergunta, hora: hora() }]);
      if (reabrir) {
        const antes = respostas.current[p];
        if (Array.isArray(antes)) {
          setMarcados(antes.map(v => (v.startsWith(prefixoOutro) ? rotuloOutro : v)));
          setOutro(antes.find(v => v.startsWith(prefixoOutro))?.slice(prefixoOutro.length) ?? '');
        } else if (p !== 'prazo') setEntrada(antes);
      }
      setPasso(indice); setDigitando(false);
      requestAnimationFrame(() => campo.current?.focus());
    }, 700);
  }
  useEffect(() => perguntar(0), []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { lista.current?.scrollTo?.({ top: lista.current.scrollHeight, behavior: 'smooth' }); }, [baloes, digitando, concluido, children]);

  function responder(valor: string | string[]) {
    if (!atual) return;
    (respostas.current as Record<Passo, string | string[]>)[atual] = valor;
    setBaloes(b => [...b, { de: 'voce', texto: mostrar(valor), hora: hora() }]);
    setEntrada(''); setMarcados([]); setOutro(''); setErro('');
    const proximo = passo + 1;
    if (!editando && proximo < ORDEM.length) return perguntar(proximo);
    // Na última pergunta, ou ao terminar de editar uma etapa, volta direto ao resumo.
    setPasso(ORDEM.length); setConcluido(true); setEditando(false);
    aoConcluir(montarPedido(respostas.current, idioma));
  }
  function editar(p: Passo) {
    setConcluido(false); setEditando(true); aoEditar?.();
    perguntar(ORDEM.indexOf(p), true);
  }

  const texto = entrada.trim();
  const valido = !!atual && texto.length >= (atual === 'nome' ? 2 : 1) && entrada.length <= LIMITE[atual];
  function falhar(msg: Texto) { setErro(t(msg, idioma)); campo.current?.focus(); }
  function tentar() {
    if (!valido) return;
    if (atual === 'whatsapp' && !whatsappValido(texto)) return falhar(g.erroWhatsapp);
    if (atual === 'email' && !emailValido(texto)) return falhar(g.erroEmail);
    responder(texto);
  }
  function enviar(e: FormEvent) { e.preventDefault(); tentar(); }
  const outroMarcado = marcados.includes(rotuloOutro);
  const checklistPronto = marcados.length > 0 && (!outroMarcado || outro.trim().length > 0);
  const escolhidas = () => marcados.map(m => (m === rotuloOutro ? prefixoOutro + outro.trim() : m));

  return (
    <section className="guiada" aria-label={t(g.titulo, idioma)}>
      <header className="guiada-topo">
        <span className="guiada-avatar" aria-hidden="true">F</span>
        <span className="guiada-quem"><strong>Floway</strong><small>{digitando ? t(g.digitando, idioma) : 'online'}</small></span>
        <span className="guiada-progresso" aria-label={`${respondidas} / ${ORDEM.length}`}>
          <span>{respondidas}/{ORDEM.length}</span>
          <i style={{ '--p': `${(respondidas / ORDEM.length) * 100}%` } as CSSProperties} />
        </span>
      </header>
      <div className="guiada-lista" ref={lista} role="log" aria-live="polite" data-lenis-prevent="">
        <div className="guiada-coluna">
          {baloes.map((b, i) => <div key={i} className={`guiada-balao ${b.de}`}><p>{b.texto}</p><time>{b.hora}</time></div>)}
          {digitando && <div className="guiada-balao floway guiada-digitando" aria-hidden="true"><i /><i /><i /></div>}
          {concluido && (
            <section className="guiada-resumo" aria-label={t(g.resumo, idioma)}>
              <header>
                <h2>{t(g.resumo, idioma)}</h2>
                <p>{t(g.resumoDica, idioma)}</p>
              </header>
              <dl>
                {ORDEM.map(p => (
                  <div key={p} className="guiada-resumo-linha">
                    <dt>{t(g.rotulos[p], idioma)}</dt>
                    <dd>{mostrar(respostas.current[p])}</dd>
                    {!bloqueado && <button type="button" onClick={() => editar(p)} aria-label={`${t(g.editar, idioma)} ${t(g.rotulos[p], idioma)}`}>{t(g.editar, idioma)}</button>}
                  </div>
                ))}
              </dl>
              {children}
            </section>
          )}
        </div>
      </div>
      {atual && (
        <div className="guiada-rodape">
          {atual === 'necessidades' ? (
            <fieldset className="guiada-opcoes">
              <legend className="resposta-acessivel">{t(g.perguntas.necessidades, idioma)}</legend>
              <div className="guiada-grade">
                {g.necessidades.map(o => {
                  const r = t(o, idioma); const on = marcados.includes(r); const ehOutro = r === rotuloOutro;
                  return (
                    <div key={r} className={`guiada-op${on ? ' marcado' : ''}${ehOutro && on ? ' com-texto' : ''}`}>
                      <label>
                        <input type="checkbox" checked={on} onChange={() => setMarcados(m => (on ? m.filter(x => x !== r) : [...m, r]))} />
                        <span className="guiada-check" aria-hidden="true" />{r}
                      </label>
                      {ehOutro && on && (
                        <input className="guiada-outro" type="text" aria-label={t(g.qual, idioma)} placeholder={t(g.qualPlaceholder, idioma)} value={outro} maxLength={100} autoFocus
                          onChange={e => setOutro(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && checklistPronto) responder(escolhidas()); }} />
                      )}
                    </div>
                  );
                })}
              </div>
              <button type="button" className="guiada-continuar" disabled={!checklistPronto} onClick={() => responder(escolhidas())}>{t(g.continuar, idioma)} →</button>
            </fieldset>
          ) : atual === 'prazo' ? (
            <div className="guiada-opcoes" role="group" aria-label={t(g.perguntas.prazo, idioma)}>
              <div className="guiada-grade guiada-grade-3">
                {g.prazos.map(o => { const r = t(o, idioma); return <button key={r} type="button" aria-pressed={editando && respostas.current.prazo === r} onClick={() => responder(r)}>{r}</button>; })}
              </div>
            </div>
          ) : (
            <form className="guiada-entrada" onSubmit={enviar} noValidate>
              {erro && <p className="guiada-erro" role="alert" id="guiada-erro">{erro}</p>}
              <div className="guiada-linha">
                <label className="resposta-acessivel" htmlFor="guiada-campo">{t(g.suaResposta, idioma)}</label>
                <textarea id="guiada-campo" ref={campo} rows={atual === 'descricao' ? 3 : 1} value={entrada} placeholder={t(g.placeholders[atual], idioma)}
                  inputMode={atual === 'whatsapp' ? 'tel' : atual === 'email' ? 'email' : undefined} autoComplete={AUTOCOMPLETAR[atual] ?? 'off'}
                  aria-invalid={erro ? true : undefined} aria-describedby={erro ? 'guiada-erro' : undefined}
                  onChange={e => { setEntrada(e.target.value); if (erro) setErro(''); }}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); tentar(); } }} data-lenis-prevent="" />
                <button type="submit" className="guiada-enviar" disabled={!valido} aria-label={t(g.enviarResposta, idioma)}>→</button>
              </div>
              <p className="guiada-dica">{t(g.obrigatoria, idioma)}</p>
            </form>
          )}
        </div>
      )}
    </section>
  );
}
