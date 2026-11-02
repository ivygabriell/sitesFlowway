'use client';

import { useState, type FormEvent } from 'react';
import { contato } from '@/conteudo/contato';
import { t } from '@/conteudo/textos';
import { rota } from '@/lib/idioma';
import { useIdioma } from '@/lib/useIdioma';

const { formulario } = contato;
const CAMPOS = ['nome', 'empresa', 'contato'] as const;

type Estado = 'vazio' | 'enviando' | 'enviado' | 'falha';

// O formulário simples da spec 4.6, até a IA entrar. Sem JavaScript, o próprio <form> envia para a rota do servidor.
export function Formulario({ estadoInicial }: { estadoInicial?: 'enviado' | 'falha' }) {
  const idioma = useIdioma();
  const [estado, setEstado] = useState<Estado>(estadoInicial ?? 'vazio');

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEstado('enviando');
    try {
      const r = await fetch('/api/contato', { method: 'POST', body: new FormData(e.currentTarget), headers: { accept: 'application/json' } });
      setEstado(r.ok ? 'enviado' : 'falha');
    } catch {
      setEstado('falha');
    }
  }

  if (estado === 'enviado') {
    return (
      <p className="formulario-contato formulario-enviado" role="status">
        {t(formulario.enviado, idioma)}
      </p>
    );
  }

  return (
    <form className="formulario-contato" method="post" action="/api/contato" onSubmit={enviar}>
      <input type="hidden" name="idioma" value={idioma} />
      {/* Campo-isca: fora da tela e do teclado; só robô preenche. */}
      <div className="formulario-isca" aria-hidden="true">
        <input type="text" name="site" tabIndex={-1} autoComplete="off" />
      </div>
      {CAMPOS.map((campo) => (
        <label key={campo} className="formulario-campo">
          <span>{t(formulario[campo], idioma)}</span>
          <input type="text" name={campo} required={campo !== 'empresa'} maxLength={200} />
        </label>
      ))}
      <label className="formulario-campo">
        <span>{t(formulario.mensagem, idioma)}</span>
        <textarea name="mensagem" required maxLength={5000} rows={3} data-lenis-prevent="" />
      </label>
      <div className="formulario-acoes" aria-live="polite">
        {estado === 'falha' && <p className="formulario-falha">{t(formulario.falha, idioma)}</p>}
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
