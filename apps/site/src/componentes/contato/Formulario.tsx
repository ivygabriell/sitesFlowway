'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { contato } from '@/conteudo/contato';
import { t } from '@/conteudo/textos';
import { rota } from '@/lib/idioma';
import { useIdioma } from '@/lib/useIdioma';
import type { Pedido } from '@/lib/pedidoDeContato';
import type { ContatoServidorDTO } from '@/lib/contato/servidor';

const CAMPOS = ['nome', 'empresa', 'contato', 'mensagem'] as const;
type Campo = typeof CAMPOS[number];
type Erros = Partial<Record<Campo, string>>;
const VAZIO: Pedido = { nome: '', empresa: '', contato: '', mensagem: '' };
const INDISPONIVEL: ContatoServidorDTO = { versao: 'contato-b.1', intencao: null, chave: null, repetirAte: null, conversaDisponivel: false, envioDisponivel: false };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function Formulario({ servidor = INDISPONIVEL, pedido: recebido, aoEditar, aoEnviar, aoBloquear, revisarAgora = false, aoAjustar }: { servidor?: ContatoServidorDTO; pedido?: Pedido; aoEditar?: (p: Pedido) => void; aoEnviar?: () => void; aoBloquear?: (v: boolean) => void; revisarAgora?: boolean; aoAjustar?: () => void }) {
  const idioma = useIdioma();
  const f = contato.formulario, c = contato.conversa;
  const [local, setLocal] = useState<Pedido>(VAZIO);
  const pedido = recebido ?? local;
  const [comJS, setComJS] = useState(false);
  const [estado, setEstado] = useState<'edicao' | 'revisao' | 'enviando' | 'pendente' | 'aceito'>('edicao');
  const [erros, setErros] = useState<Erros>({});
  const [copia, setCopia] = useState<Pedido | null>(null);
  const [aviso, setAviso] = useState('');
  const [demorado, setDemorado] = useState(false);
  const [expirado, setExpirado] = useState(false);
  const [aguardarAte, setAguardarAte] = useState(0);
  const [agora, setAgora] = useState(0);
  const corpoConfirmado = useRef<FormData | null>(null);
  const isca = useRef('');
  const emCurso = useRef(false);
  const vivo = useRef(true);
  const tentativa = useRef(0);
  const abortar = useRef<AbortController | null>(null);
  const retentativa = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resumo = useRef<HTMLDivElement>(null);
  const status = useRef<HTMLParagraphElement>(null);
  const revisao = useRef<HTMLHeadingElement>(null);
  const fim = Date.parse(servidor.repetirAte ?? '');
  useEffect(() => setComJS(true), []);
  // Vindo da conversa guiada, o pedido já chega validado: abre direto na revisão.
  useEffect(() => { if (revisarAgora && recebido) { setCopia(Object.fromEntries(CAMPOS.map(campo => [campo, recebido[campo].trim()])) as Pedido); setEstado('revisao'); } }, [revisarAgora]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { vivo.current = true; return () => { vivo.current = false; abortar.current?.abort(); if (retentativa.current) clearTimeout(retentativa.current); }; }, []);
  useEffect(() => {
    if (estado !== 'pendente' && estado !== 'enviando') return;
    const timer = setInterval(() => { const n = Date.now(); setAgora(n); if (!Number.isFinite(fim) || n >= fim - 30000) setExpirado(true); }, 250);
    return () => clearInterval(timer);
  }, [estado, fim]);
  useEffect(() => {
    if (Object.keys(erros).length) resumo.current?.focus();
    else if (estado === 'pendente' || estado === 'aceito' || aviso) status.current?.focus();
    else if (estado === 'revisao') revisao.current?.focus();
  }, [erros, estado, aviso]);
  useEffect(() => {
    if (!Object.keys(erros).length) return;
    const titulo = document.title; document.title = `${t(f.erro, idioma)} ${titulo}`;
    return () => { document.title = titulo; };
  }, [erros, idioma, f]);
  function editar(campo: Campo, valor: string) {
    const novo = { ...pedido, [campo]: valor };
    setLocal(novo); aoEditar?.(novo);
  }
  function revisar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (emCurso.current || corpoConfirmado.current) return;
    const site = new FormData(e.currentTarget).get('site');
    isca.current = typeof site === 'string' ? site : '';
    const novos: Erros = {};
    for (const campo of CAMPOS) {
      const valor = pedido[campo].trim();
      if (campo !== 'empresa' && !valor) novos[campo] = t(f.preencher[campo], idioma);
      else if (valor.length > (campo === 'mensagem' ? 5000 : 200)) novos[campo] = t(campo === 'mensagem' ? f.limiteMensagem : f.limiteCampo, idioma);
    }
    setErros(novos); if (Object.keys(novos).length) return;
    const normalizado = Object.fromEntries(CAMPOS.map(campo => [campo, pedido[campo].trim()])) as Pedido;
    setCopia(normalizado); setEstado('revisao'); setAviso('');
  }
  async function enviar() {
    if (!vivo.current || emCurso.current || expirado || Date.now() < aguardarAte) return;
    if (!servidor.envioDisponivel || !servidor.intencao || !servidor.chave || !Number.isFinite(fim)) { setAviso(t(c.indisponivel, idioma)); return; }
    if (Date.now() >= fim - 30000) { setExpirado(true); setAviso(t(c.expirado, idioma)); return; }
    if (!corpoConfirmado.current) {
      if (!copia) return;
      const corpo = new FormData();
      for (const campo of CAMPOS) corpo.set(campo, copia[campo]);
      corpo.set('versao', servidor.versao); corpo.set('idioma', idioma); corpo.set('intencao', servidor.intencao); corpo.set('site', isca.current); corpo.set('acao', 'enviar'); corpo.set('confirmar', 'true');
      corpoConfirmado.current = corpo;
    }
    emCurso.current = true; aoBloquear?.(true); setEstado('enviando'); setDemorado(false); setAviso('');
    const controller = new AbortController(); abortar.current = controller;
    const timeout = setTimeout(() => controller.abort(), 15000);
    const longo = setTimeout(() => setDemorado(true), 10000);
    let espera = 0, repetir = true, vencida = false;
    try {
      const r = await fetch('/api/contato', { method: 'POST', signal: controller.signal, body: corpoConfirmado.current, headers: { accept: 'application/json', 'Idempotency-Key': servidor.chave } });
      const retry = Number(r.headers.get('Retry-After'));
      if (Number.isFinite(retry) && retry > 0) espera = retry * 1000;
      const d = await r.json();
      if (!vivo.current) return;
      if (!controller.signal.aborted && r.status === 200 && d?.ok === true && d.estado === 'aceito' && typeof d.requestId === 'string' && UUID.test(d.requestId) && d.repetirAte === servidor.repetirAte) {
        setEstado('aceito'); aoEnviar?.(); corpoConfirmado.current = null; return;
      }
      vencida = r.status === 410;
      repetir = !vencida && ((r.status === 202 && d?.estado !== 'recebido') || d?.codigo === 'ENVIO_EM_ANDAMENTO' || ([429, 503].includes(r.status) && d?.repetivel !== false));
    } catch { /* A rede não exclui aceitação; a cópia permanece imutável. */ }
    finally { clearTimeout(timeout); clearTimeout(longo); emCurso.current = false; setDemorado(false); }
    if (!vivo.current) return;
    setEstado('pendente'); setAgora(Date.now());
    const atraso = Math.max(espera, (tentativa.current === 0 ? 2000 : 4000) + Math.random() * 500);
    setAguardarAte(Date.now() + Math.max(espera, atraso));
    if (vencida || Date.now() + atraso >= fim - 30000) { setExpirado(true); return; }
    if (repetir && tentativa.current < 2) {
      tentativa.current++;
      retentativa.current = setTimeout(() => { retentativa.current = null; void enviar(); }, atraso);
    }
  }
  const pendente = estado === 'pendente' || estado === 'enviando';
  if (estado === 'aceito') return <p className="formulario-contato formulario-enviado" role="status" ref={status} tabIndex={-1}>{t(c.aceito, idioma)}</p>;
  return <section className="pedido-contato">
    {Object.keys(erros).length > 0 && <div className="formulario-erros" ref={resumo} tabIndex={-1}><h2 role="alert">{t(f.problema, idioma)}</h2><ul>{CAMPOS.filter(campo => erros[campo]).map(campo => <li key={campo}><a href={`#pedido-${campo}`} onClick={e => { e.preventDefault(); document.getElementById(`pedido-${campo}`)?.focus(); }}><span className="formulario-erro-prefixo">{t(f.erro, idioma)} </span>{erros[campo]}</a></li>)}</ul></div>}
    {estado === 'edicao' ? <form className="formulario-contato" method="post" action="/api/contato" onSubmit={revisar} noValidate={comJS}>
      <input type="hidden" name="idioma" value={idioma} /><input type="hidden" name="versao" value={servidor.versao} /><input type="hidden" name="intencao" value={servidor.intencao ?? ''} /><input type="hidden" name="acao" value="revisar" />
      <div className="formulario-isca" aria-hidden="true"><input type="text" name="site" defaultValue={isca.current} tabIndex={-1} autoComplete="off" /></div>
      {CAMPOS.map(campo => {
        const props = { id: `pedido-${campo}`, name: campo, value: pedido[campo], onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => editar(campo, e.target.value), 'aria-invalid': erros[campo] ? true : undefined, 'aria-describedby': erros[campo] ? `erro-${campo}` : undefined };
        return <div key={campo} className="formulario-campo"><label htmlFor={props.id}><span>{t(f[campo], idioma)}</span></label>{erros[campo] && <p id={`erro-${campo}`}><span className="formulario-erro-prefixo">{t(f.erro, idioma)} </span>{erros[campo]}</p>}{campo === 'mensagem' ? <textarea {...props} rows={3} data-lenis-prevent="" /> : <input {...props} type="text" />}</div>;
      })}
      <div className="formulario-acoes"><button type="submit">{t(c.revisar, idioma)}</button></div>
      <p className="formulario-aviso"><a href={rota('privacidade', idioma)}>{t(c.privacidade, idioma)}</a></p>
    </form> : <div className="formulario-contato formulario-revisao">
      <h2 ref={revisao} tabIndex={-1}>{t(c.resumo, idioma)}</h2>
      <dl>{CAMPOS.map(campo => <div key={campo}><dt>{t(f[campo], idioma)}</dt><dd>{copia?.[campo]}</dd></div>)}</dl>
      {!pendente && <div className="formulario-acoes"><button type="button" onClick={() => { if (aoAjustar) { aoAjustar(); return; } setEstado('edicao'); setAviso(''); requestAnimationFrame(() => document.getElementById('pedido-nome')?.focus()); }}>{t(c.ajustar, idioma)}</button><button type="button" onClick={() => void enviar()} disabled={expirado}>{t(c.confirmar, idioma)}</button></div>}
      {estado === 'pendente' && !expirado && <div className="formulario-acoes"><button type="button" disabled={agora < aguardarAte || !!retentativa.current} onClick={() => void enviar()}>{t(c.repetir, idioma)}</button></div>}
    </div>}
    <p className="formulario-falha" role={estado === 'pendente' || aviso ? 'alert' : 'status'} tabIndex={-1} ref={status}>{estado === 'enviando' ? t(f.enviando, idioma) : estado === 'pendente' ? t(expirado ? c.expirado : c.pendente, idioma) : aviso}</p>
    {estado === 'pendente' && !expirado && agora < aguardarAte && <p className="formulario-aviso">{t(c.aguardar, idioma)}</p>}
    {demorado && <p>{t(c.demorado, idioma)}</p>}
    {estado === 'enviando' && <div className="formulario-acoes"><button type="button" onClick={() => abortar.current?.abort()}>{t(c.cancelar, idioma)}</button></div>}
  </section>;
}
