'use client';

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { contato } from '@/conteudo/contato';
import { t, type Idioma } from '@/conteudo/textos';
import { useIdioma } from '@/lib/useIdioma';
import type { Pedido } from '@/lib/pedidoDeContato';

// Conversa em formato de chat: a Floway pergunta uma coisa por vez, todas obrigatórias, e o pedido sai no mesmo
// formato do formulário, para seguir pelo envio que já existe. As perguntas são exemplos até a pessoa mandar as definitivas.
type Respostas = { nome: string; empresa: string; necessidades: string[]; prazo: string; contato: string; descricao: string };
type Passo = keyof Respostas;
const ORDEM: Passo[] = ['nome', 'empresa', 'necessidades', 'prazo', 'contato', 'descricao'];
const LIMITE: Record<Passo, number> = { nome: 200, empresa: 200, necessidades: 0, prazo: 0, contato: 200, descricao: 4500 };
type Balao = { de: 'floway' | 'voce'; texto: string; hora: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// WhatsApp brasileiro: DDD válido (11 a 99) + 8 ou 9 dígitos, com ou sem +55 e pontuação.
export function contatoValido(valor: string): boolean {
  const v = valor.trim();
  if (v.includes('@')) return EMAIL.test(v);
  if (/[^\d\s()+.-]/.test(v)) return false;
  const digitos = v.replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, '');
  return /^[1-9][1-9]\d{8,9}$/.test(digitos) && (digitos.length === 10 || digitos[2] === '9');
}

export function montarPedido(r: Respostas, idioma: Idioma): Pedido {
  const g = contato.guiada;
  const mensagem = `${t(g.rotuloNecessidades, idioma)}: ${r.necessidades.join(', ')}\n${t(g.rotuloPrazo, idioma)}: ${r.prazo}\n\n${r.descricao.trim()}`;
  return { nome: r.nome.trim(), empresa: r.empresa.trim(), contato: r.contato.trim(), mensagem };
}

const hora = () => new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

export function ConversaGuiada({ aoConcluir, children }: { aoConcluir: (p: Pedido) => void; children?: ReactNode }) {
  const idioma = useIdioma();
  const g = contato.guiada;
  const [baloes, setBaloes] = useState<Balao[]>([]);
  const [passo, setPasso] = useState(-1);
  const [digitando, setDigitando] = useState(true);
  const [entrada, setEntrada] = useState('');
  const [erro, setErro] = useState('');
  const [marcados, setMarcados] = useState<string[]>([]);
  const respostas = useRef<Respostas>({ nome: '', empresa: '', necessidades: [], prazo: '', contato: '', descricao: '' });
  const lista = useRef<HTMLDivElement>(null);
  const campo = useRef<HTMLTextAreaElement>(null);
  const atual = ORDEM[passo];
  const respondidas = Math.min(baloes.filter(b => b.de === 'voce').length, ORDEM.length);

  // A Floway "digita" um instante antes de cada pergunta, como num chat.
  function perguntar(indice: number) {
    setDigitando(true);
    const timer = setTimeout(() => {
      const texto = t(g.perguntas[ORDEM[indice]], idioma).replace('{nome}', respostas.current.nome.trim().split(' ')[0] ?? '');
      setBaloes(b => [...b, { de: 'floway', texto, hora: hora() }]);
      setPasso(indice); setDigitando(false);
      requestAnimationFrame(() => campo.current?.focus());
    }, 700);
    return () => clearTimeout(timer);
  }
  useEffect(() => perguntar(0), []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { lista.current?.scrollTo?.({ top: lista.current.scrollHeight, behavior: 'smooth' }); }, [baloes, digitando, children]);

  function responder(valor: string | string[], mostrado: string) {
    if (!atual) return;
    (respostas.current as Record<Passo, string | string[]>)[atual] = valor;
    setBaloes(b => [...b, { de: 'voce', texto: mostrado, hora: hora() }]);
    setEntrada(''); setMarcados([]); setErro('');
    const proximo = passo + 1;
    if (proximo < ORDEM.length) { setPasso(-1); perguntar(proximo); }
    else { setPasso(ORDEM.length); aoConcluir(montarPedido(respostas.current, idioma)); }
  }
  const texto = entrada.trim();
  const valido = !!atual && texto.length >= (atual === 'nome' ? 2 : 1) && entrada.length <= LIMITE[atual];
  function tentar() {
    if (!valido) return;
    if (atual === 'contato' && !contatoValido(texto)) { setErro(t(g.erroContato, idioma)); campo.current?.focus(); return; }
    responder(texto, texto);
  }
  function enviar(e: FormEvent) { e.preventDefault(); tentar(); }

  return (
    <section className="guiada" aria-label={t(g.titulo, idioma)}>
      <header className="guiada-topo">
        <span className="guiada-avatar" aria-hidden="true">F</span>
        <span className="guiada-quem"><strong>Floway</strong><small>{digitando ? t(g.digitando, idioma) : 'online'}</small></span>
        <span className="guiada-progresso" aria-label={`${respondidas} / ${ORDEM.length}`}>
          <span>{respondidas}/{ORDEM.length}</span>
          <i style={{ '--p': `${(respondidas / ORDEM.length) * 100}%` } as React.CSSProperties} />
        </span>
      </header>
      <div className="guiada-lista" ref={lista} role="log" aria-live="polite" data-lenis-prevent="">
        <div className="guiada-coluna">
          {baloes.map((b, i) => <div key={i} className={`guiada-balao ${b.de}`}><p>{b.texto}</p><time>{b.hora}</time></div>)}
          {digitando && <div className="guiada-balao floway guiada-digitando" aria-hidden="true"><i /><i /><i /></div>}
          {children}
        </div>
      </div>
      {atual && (
        <div className="guiada-rodape">
          <div className="guiada-coluna">
            {atual === 'necessidades' ? (
              <fieldset className="guiada-opcoes">
                <legend className="resposta-acessivel">{t(g.perguntas.necessidades, idioma)}</legend>
                <div className="guiada-grade">
                  {g.necessidades.map(o => { const r = t(o, idioma); const on = marcados.includes(r); return (
                    <label key={r} className={on ? 'marcado' : ''}>
                      <input type="checkbox" checked={on} onChange={() => setMarcados(m => on ? m.filter(x => x !== r) : [...m, r])} />
                      <span className="guiada-check" aria-hidden="true" />{r}
                    </label>); })}
                </div>
                <button type="button" className="guiada-continuar" disabled={!marcados.length} onClick={() => responder(marcados, marcados.join(', '))}>{t(g.continuar, idioma)} →</button>
              </fieldset>
            ) : atual === 'prazo' ? (
              <div className="guiada-opcoes" role="group" aria-label={t(g.perguntas.prazo, idioma)}>
                <div className="guiada-grade guiada-grade-3">
                  {g.prazos.map(o => { const r = t(o, idioma); return <button key={r} type="button" onClick={() => responder(r, r)}>{r}</button>; })}
                </div>
              </div>
            ) : (
              <form className="guiada-entrada" onSubmit={enviar} noValidate>
                {erro && <p className="guiada-erro" role="alert" id="guiada-erro">{erro}</p>}
                <div className="guiada-linha">
                  <label className="resposta-acessivel" htmlFor="guiada-campo">{t(g.suaResposta, idioma)}</label>
                  <textarea id="guiada-campo" ref={campo} rows={atual === 'descricao' ? 3 : 1} value={entrada} placeholder={t(g.placeholders[atual], idioma)}
                    inputMode={atual === 'contato' ? 'email' : undefined} autoComplete={atual === 'nome' ? 'name' : atual === 'empresa' ? 'organization' : 'off'}
                    aria-invalid={erro ? true : undefined} aria-describedby={erro ? 'guiada-erro' : undefined}
                    onChange={e => { setEntrada(e.target.value); if (erro) setErro(''); }}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); tentar(); } }} data-lenis-prevent="" />
                  <button type="submit" className="guiada-enviar" disabled={!valido} aria-label={t(g.enviarResposta, idioma)}>→</button>
                </div>
                <p className="guiada-dica">{t(g.obrigatoria, idioma)}</p>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
