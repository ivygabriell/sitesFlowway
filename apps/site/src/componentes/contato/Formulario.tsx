'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { contato } from '@/conteudo/contato';
import { t } from '@/conteudo/textos';
import { rota } from '@/lib/idioma';
import { useIdioma } from '@/lib/useIdioma';

const { formulario } = contato;
const CAMPOS = ['nome', 'empresa', 'contato', 'mensagem'] as const;
type Campo = typeof CAMPOS[number];
type Erros = Partial<Record<Campo, string>>;

type Estado = 'vazio' | 'enviando' | 'enviado' | 'falha';

// O formulário simples da spec 4.6, até a IA entrar. Sem JavaScript, o próprio <form> envia para a rota do servidor.
export function Formulario({ estadoInicial, aoEnviar }: { estadoInicial?: 'enviado' | 'falha'; aoEnviar?: () => void }) {
  const idioma = useIdioma();
  const [estado, setEstado] = useState<Estado>(estadoInicial ?? 'vazio');

  const [comJS, setComJS] = useState(false);
  const [erros, setErros] = useState<Erros>({});
  const emCurso = useRef(false);
  const resumo = useRef<HTMLDivElement>(null);
  const aviso = useRef<HTMLParagraphElement>(null);
  const confirmado = useRef(false);
  useEffect(() => setComJS(true), []);
  useEffect(() => {
    if (Object.keys(erros).length) resumo.current?.focus();
    else if (estado === 'falha' || confirmado.current) aviso.current?.focus();
  }, [erros, estado]);
  useEffect(() => {
    const titulo = document.title;
    if (Object.keys(erros).length) document.title = `${t(formulario.erro, idioma)} ${titulo}`;
    return () => { document.title = titulo; };
  }, [erros, idioma]);

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (emCurso.current) return;
    const corpo = new FormData(e.currentTarget);
    const novos: Erros = {};
    for (const campo of CAMPOS) {
      const valor = String(corpo.get(campo) ?? '').trim();
      if (campo !== 'empresa' && !valor) novos[campo] = t(formulario.preencher[campo], idioma);
      else if (valor.length > (campo === 'mensagem' ? 5000 : 200)) novos[campo] = t(campo === 'mensagem' ? formulario.limiteMensagem : formulario.limiteCampo, idioma);
    }
    setErros(novos);
    if (Object.keys(novos).length) return;
    emCurso.current = true;
    setEstado('enviando');
    try {
      const r = await fetch('/api/contato', { method: 'POST', body: corpo, headers: { accept: 'application/json' } });
      const ok = r.ok && (await r.json()).ok === true;
      confirmado.current = ok;
      setEstado(ok ? 'enviado' : 'falha');
      if (ok) aoEnviar?.();
    } catch {
      setEstado('falha');
    } finally {
      emCurso.current = false;
    }
  }

  if (estado === 'enviado') {
    return (
      <p className="formulario-contato formulario-enviado" role="status" ref={aviso} tabIndex={-1}>
        {t(confirmado.current ? formulario.enviado : formulario.retorno, idioma)}
      </p>
    );
  }

  return (
    <form className="formulario-contato" method="post" action="/api/contato" onSubmit={enviar} noValidate={comJS}>
      {Object.keys(erros).length > 0 && (
        <div className="formulario-erros" ref={resumo} tabIndex={-1}>
          <h2 role="alert">{t(formulario.problema, idioma)}</h2>
          <ul>{CAMPOS.filter((campo) => erros[campo]).map((campo) => (
            <li key={campo}><a href={`#pedido-${campo}`} onClick={(e) => { e.preventDefault(); document.getElementById(`pedido-${campo}`)?.focus(); }}><span className="formulario-erro-prefixo">{t(formulario.erro, idioma)} </span>{erros[campo]}</a></li>
          ))}</ul>
        </div>
      )}
      <input type="hidden" name="idioma" value={idioma} />
      {/* Campo-isca: fora da tela e do teclado; só robô preenche. */}
      <div className="formulario-isca" aria-hidden="true">
        <input type="text" name="site" tabIndex={-1} autoComplete="off" />
      </div>
      {CAMPOS.map((campo) => {
        const props = {
          id: `pedido-${campo}`, name: campo, readOnly: estado === 'enviando', required: campo !== 'empresa', maxLength: campo === 'mensagem' ? 5000 : 200,
          'aria-invalid': erros[campo] ? true : undefined,
          'aria-describedby': erros[campo] ? `erro-${campo}` : undefined,
        };
        return (
          <div key={campo} className="formulario-campo">
            <label htmlFor={props.id}><span>{t(formulario[campo], idioma)}</span></label>
            {erros[campo] && <p id={`erro-${campo}`}><span className="formulario-erro-prefixo">{t(formulario.erro, idioma)} </span>{erros[campo]}</p>}
            {campo === 'mensagem' ? <textarea {...props} rows={3} data-lenis-prevent="" /> : <input {...props} type="text" />}
          </div>
        );
      })}
      <div className="formulario-acoes">
        <p className="formulario-falha" role={estado === 'falha' ? 'alert' : 'status'} ref={aviso} tabIndex={-1}>
          {estado === 'falha' ? t(formulario.falha, idioma) : estado === 'enviando' ? t(formulario.enviando, idioma) : ''}
        </p>
        <button type="submit" disabled={estado === 'enviando'}>
          {t(estado === 'falha' ? formulario.tentar : formulario.enviar, idioma)}
        </button>
      </div>
      <p className="formulario-aviso">
        {t(formulario.aviso.antes, idioma)} <a href={rota('privacidade', idioma)}>{t(formulario.aviso.link, idioma)}</a>
        {t(formulario.aviso.depois, idioma)}
      </p>
    </form>
  );
}
