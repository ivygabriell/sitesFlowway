'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { contato } from '@/conteudo/contato';
import { t, type Idioma } from '@/conteudo/textos';
import { useIdioma } from '@/lib/useIdioma';
import type { Pedido } from '@/lib/pedidoDeContato';

// Conversa em formato de chat: a Floway pergunta uma coisa por vez e o pedido sai no mesmo formato do formulário,
// para seguir pelo envio que já existe. As perguntas são exemplos até a pessoa mandar as definitivas.
type Respostas = { nome: string; empresa: string; necessidades: string[]; prazo: string; contato: string; descricao: string };
type Passo = keyof Respostas;
const ORDEM: Passo[] = ['nome', 'empresa', 'necessidades', 'prazo', 'contato', 'descricao'];
const LIMITE: Record<Passo, number> = { nome: 200, empresa: 200, necessidades: 0, prazo: 0, contato: 200, descricao: 4500 };
type Balao = { de: 'floway' | 'voce'; texto: string; hora: string };

export function montarPedido(r: Respostas, idioma: Idioma): Pedido {
  const g = contato.guiada;
  const mensagem = `${t(g.rotuloNecessidades, idioma)}: ${r.necessidades.join(', ')}\n${t(g.rotuloPrazo, idioma)}: ${r.prazo}\n\n${r.descricao.trim()}`;
  return { nome: r.nome.trim(), empresa: r.empresa.trim(), contato: r.contato.trim(), mensagem };
}

const hora = () => new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

export function ConversaGuiada({ aoConcluir, children }: { aoConcluir: (p: Pedido) => void; children?: React.ReactNode }) {
  const idioma = useIdioma();
  const g = contato.guiada;
  const [baloes, setBaloes] = useState<Balao[]>([]);
  const [passo, setPasso] = useState(-1);
  const [digitando, setDigitando] = useState(true);
  const [entrada, setEntrada] = useState('');
  const [marcados, setMarcados] = useState<string[]>([]);
  const respostas = useRef<Respostas>({ nome: '', empresa: '', necessidades: [], prazo: '', contato: '', descricao: '' });
  const lista = useRef<HTMLDivElement>(null);
  const campo = useRef<HTMLTextAreaElement>(null);
  const atual = ORDEM[passo];

  // A Floway "digita" um instante antes de cada pergunta, como num chat.
  function perguntar(indice: number) {
    setDigitando(true);
    const timer = setTimeout(() => {
      const pergunta = ORDEM[indice];
      const texto = t(g.perguntas[pergunta], idioma).replace('{nome}', respostas.current.nome.trim().split(' ')[0] ?? '');
      setBaloes(b => [...b, { de: 'floway', texto, hora: hora() }]);
      setPasso(indice); setDigitando(false);
      requestAnimationFrame(() => campo.current?.focus());
    }, 700);
    return () => clearTimeout(timer);
  }
  useEffect(() => perguntar(0), []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { lista.current?.scrollTo?.({ top: lista.current.scrollHeight, behavior: 'smooth' }); }, [baloes, digitando]);

  function responder(valor: string | string[], mostrado: string) {
    if (!atual) return;
    (respostas.current as Record<Passo, string | string[]>)[atual] = valor;
    setBaloes(b => [...b, { de: 'voce', texto: mostrado, hora: hora() }]);
    setEntrada(''); setMarcados([]);
    const proximo = passo + 1;
    if (proximo < ORDEM.length) { setPasso(-1); perguntar(proximo); }
    else { setPasso(ORDEM.length); aoConcluir(montarPedido(respostas.current, idioma)); }
  }
  const texto = entrada.trim();
  const valido = !!atual && texto.length > 0 && entrada.length <= LIMITE[atual];
  function enviar(e: FormEvent) { e.preventDefault(); if (valido) responder(entrada, texto); }

  return (
    <section className="guiada" aria-label={t(g.titulo, idioma)}>
      <header className="guiada-topo">
        <span className="guiada-avatar" aria-hidden="true">F</span>
        <span><strong>Floway</strong><small>{digitando ? t(g.digitando, idioma) : 'online'}</small></span>
      </header>
      <div className="guiada-lista" ref={lista} role="log" aria-live="polite" data-lenis-prevent="">
        {baloes.map((b, i) => <div key={i} className={`guiada-balao ${b.de}`}><p>{b.texto}</p><time>{b.hora}</time></div>)}
        {digitando && <div className="guiada-balao floway guiada-digitando" aria-hidden="true"><i /><i /><i /></div>}
        {children}
      </div>
      {atual === 'necessidades' && (
        <fieldset className="guiada-opcoes">
          <legend className="resposta-acessivel">{t(g.perguntas.necessidades, idioma)}</legend>
          {g.necessidades.map(o => { const r = t(o, idioma); return (
            <label key={r} className={marcados.includes(r) ? 'marcado' : ''}>
              <input type="checkbox" checked={marcados.includes(r)} onChange={() => setMarcados(m => m.includes(r) ? m.filter(x => x !== r) : [...m, r])} />{r}
            </label>); })}
          <button type="button" className="guiada-continuar" disabled={!marcados.length} onClick={() => responder(marcados, marcados.join(', '))}>{t(g.continuar, idioma)}</button>
        </fieldset>
      )}
      {atual === 'prazo' && (
        <div className="guiada-opcoes" role="group" aria-label={t(g.perguntas.prazo, idioma)}>
          {g.prazos.map(o => { const r = t(o, idioma); return <button key={r} type="button" onClick={() => responder(r, r)}>{r}</button>; })}
        </div>
      )}
      {atual && atual !== 'necessidades' && atual !== 'prazo' && (
        <form className="guiada-entrada" onSubmit={enviar}>
          {atual === 'empresa' && <button type="button" className="guiada-pular" onClick={() => responder('', t(g.pular, idioma))}>{t(g.pular, idioma)}</button>}
          <label className="resposta-acessivel" htmlFor="guiada-campo">{t(g.suaResposta, idioma)}</label>
          <textarea id="guiada-campo" ref={campo} rows={1} value={entrada} placeholder={t(g.placeholders[atual], idioma)} onChange={e => setEntrada(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (valido) responder(entrada, texto); } }} data-lenis-prevent="" />
          <button type="submit" className="guiada-enviar" disabled={!valido} aria-label={t(g.enviarResposta, idioma)}>→</button>
        </form>
      )}
    </section>
  );
}
