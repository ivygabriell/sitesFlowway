'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { contato } from '@/conteudo/contato';
import { t } from '@/conteudo/textos';
import { rota } from '@/lib/idioma';
import { useIdioma } from '@/lib/useIdioma';

function Resposta({ texto }: { texto: string }) {
  const [visivel, setVisivel] = useState(() => typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches ? texto.length : 0);
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    let tamanho = 0;
    const timer = setInterval(() => { tamanho = Math.min(texto.length, tamanho + 2); setVisivel(tamanho); if (tamanho === texto.length) clearInterval(timer); }, 18);
    return () => clearInterval(timer);
  }, [texto]);
  return <><span className="resposta-acessivel">{texto}</span><span className="resposta-visual" aria-hidden="true">{texto.slice(0, visivel)}</span></>;
}

type Mensagem = { papel: 'usuario' | 'assistente'; texto: string };
export function Conversa({ aoAbrir, aoResponder, aoSugerir, aoFormulario }: { aoAbrir: () => void; aoResponder: (v: boolean) => void; aoSugerir: (s: string) => void; aoFormulario: () => void }) {
  const idioma = useIdioma();
  const c = contato.conversa;
  const [historico, setHistorico] = useState<Mensagem[]>([]);
  const [entrada, setEntrada] = useState('');
  const [pendente, setPendente] = useState<Mensagem | null>(null);
  const [erro, setErro] = useState('');
  const [demorado, setDemorado] = useState(false);
  const [ate, setAte] = useState(0);
  const [agora, setAgora] = useState(0);
  const emCurso = useRef(false);
  const abortar = useRef<AbortController | null>(null);
  const resumo = useRef<HTMLDivElement>(null);
  const entradaRef = useRef<HTMLTextAreaElement>(null);
  const lista = useRef<HTMLDivElement>(null);
  useEffect(() => () => abortar.current?.abort(), []);
  useEffect(() => { if (erro) resumo.current?.focus(); }, [erro]);
  useEffect(() => { if (lista.current) lista.current.scrollTop = lista.current.scrollHeight; }, [historico, pendente]);
  useEffect(() => {
    if (!ate) return;
    const timer = setInterval(() => setAgora(Date.now()), 250);
    return () => clearInterval(timer);
  }, [ate]);
  useEffect(() => {
    if (!erro) return;
    const titulo = document.title; document.title = `${t(contato.formulario.erro, idioma)} ${titulo}`;
    return () => { document.title = titulo; };
  }, [erro, idioma]);
  async function enviar(e?: FormEvent, texto = entrada) {
    e?.preventDefault();
    if (emCurso.current || Date.now() < ate) return;
    const mensagem = texto.trim();
    if (!mensagem) { setErro(t(contato.formulario.preencher.mensagem, idioma)); return; }
    if (mensagem.length > 2000 || historico.length > 18 || historico.reduce((n, m) => n + m.texto.length, mensagem.length) > 10000) { setErro(t(c.limite, idioma)); return; }
    emCurso.current = true; setErro(''); setDemorado(false); aoAbrir(); aoResponder(true);
    setEntrada(texto); aoSugerir(mensagem); setPendente({ papel: 'usuario', texto: mensagem });
    const controller = new AbortController(); abortar.current = controller;
    const timeout = setTimeout(() => controller.abort(), 25000);
    const longo = setTimeout(() => setDemorado(true), 10000);
    const turnoId = crypto.randomUUID();
    try {
      const r = await fetch('/api/contato/conversa', { method: 'POST', signal: controller.signal, headers: { accept: 'application/json', 'content-type': 'application/json' }, body: JSON.stringify({ idioma, turnoId, historico, mensagem }) });
      if (r.status === 429) { const segundos = Number(r.headers.get('Retry-After')); if (Number.isFinite(segundos) && segundos > 0) { setAte(Date.now() + segundos * 1000); setAgora(Date.now()); } }
      const d = await r.json();
      if (controller.signal.aborted || r.status !== 200 || !d || d.turnoId !== turnoId || typeof d.resposta !== 'string' || !d.resposta.trim() || d.resposta.length > 1500 || !(d.mensagemSugerida === null || (typeof d.mensagemSugerida === 'string' && d.mensagemSugerida.length <= 5000))) throw new Error('resposta');
      setHistorico([...historico, { papel: 'usuario', texto: mensagem }, { papel: 'assistente', texto: d.resposta }]);
      if (d.mensagemSugerida !== null) aoSugerir(d.mensagemSugerida);
      setEntrada(''); setPendente(null); entradaRef.current?.focus();
    } catch { setErro(t(contato.formulario.falha, idioma)); }
    finally { clearTimeout(timeout); clearTimeout(longo); emCurso.current = false; aoResponder(false); setDemorado(false); }
  }
  return <section className="conversa-contato" aria-label="Floway">
    {(historico.length > 0 || pendente) && <div className="conversa-historico" ref={lista} role="log" tabIndex={0} aria-label={t(c.historico, idioma)} data-lenis-prevent="" aria-live="polite">
      {[...historico, ...(pendente ? [pendente] : [])].map((m, i) => <div className={`conversa-mensagem ${m.papel}`} key={i}><span>{m.papel === 'usuario' ? t(c.voce, idioma) : 'Floway'}</span><p>{m.papel === 'assistente' ? <Resposta texto={m.texto} /> : m.texto}</p></div>)}
    </div>}

    {erro && <div className="formulario-erros" tabIndex={-1} ref={resumo}><h2 role="alert">{t(contato.formulario.problema, idioma)}</h2><a id="conversa-erro" href="#conversa-entrada" onClick={e => { e.preventDefault(); entradaRef.current?.focus(); }}>{erro}</a></div>}
    <form onSubmit={enviar} noValidate>
      <label className="formulario-erro-prefixo" htmlFor="conversa-entrada">{t(c.convite, idioma)}</label>
      <textarea id="conversa-entrada" placeholder={t(c.convite, idioma)} ref={entradaRef} value={entrada} onChange={e => setEntrada(e.target.value)} readOnly={emCurso.current} aria-invalid={!!erro} aria-describedby={erro ? 'conversa-erro' : undefined} rows={2} data-lenis-prevent="" />
      <div className="formulario-acoes"><button type="submit" disabled={emCurso.current || agora < ate}>{t(erro ? contato.formulario.tentar : contato.formulario.enviar, idioma)}</button></div>
    </form>
    {!historico.length && !pendente && <div className="conversa-atalhos">{c.atalhos.map(a => <button key={a.pt} type="button" onClick={() => void enviar(undefined, t(a, idioma))}>{t(a, idioma)}</button>)}</div>}
    <p role="status" className={emCurso.current ? 'conversa-respondendo' : ''}>{emCurso.current ? t(c.respondendo, idioma) : agora < ate ? t(c.aguardar, idioma) : ''}</p>
    {demorado && <p>{t(c.demorado, idioma)}</p>}
    {emCurso.current && <button type="button" onClick={() => abortar.current?.abort()}>{t(c.cancelar, idioma)}</button>}
    <div className="formulario-acoes"><button type="button" disabled={emCurso.current} onClick={() => { if (entrada.trim()) aoSugerir(entrada); aoFormulario(); }}>{t(c.alternativa, idioma)}</button>{historico.length > 0 && <button type="button" disabled={emCurso.current} onClick={() => { if (entrada.trim()) aoSugerir(entrada); aoFormulario(); }}>{t(c.revisar, idioma)}</button>}</div>
    <p className="formulario-aviso"><a href={rota('privacidade', idioma)}>{t(c.privacidade, idioma)}</a></p>
  </section>;
}
