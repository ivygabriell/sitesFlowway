'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { contato } from '@/conteudo/contato';
import { t, type Texto } from '@/conteudo/textos';
import type { ContatoServidorDTO } from '@/lib/contato/servidor';
import { useIdioma } from '@/lib/useIdioma';
import { emailValido, whatsappValido } from './ConversaGuiada';
import { Formulario } from './Formulario';

export type Campos = { nome: string; empresa: string; whatsapp: string; email: string; projeto: string };
export type StatusDoCartao = 'enviando' | 'falha' | 'enviado';
type Chave = keyof Campos;
const ORDEM: Chave[] = ['nome', 'empresa', 'projeto', 'whatsapp', 'email'];

// "Rótulo: valor" no texto do projeto vira uma linha do cartão (Prazo, Investimento...); o resto fica em "Projeto".
// Só a exibição: o que vai para a equipe é o texto inteiro, como a pessoa conferiu.
function linhasDo(projeto: string) {
  const linhas: [string, string][] = [];
  const resto: string[] = [];
  for (const l of projeto.split('\n')) {
    const m = /^([^:]{1,24}):\s*(\S.*)$/.exec(l.trim());
    if (m) linhas.push([m[1], m[2]]); else if (l.trim()) resto.push(l.trim());
  }
  return { linhas, resto: resto.join('\n') };
}

// Cartão de resumo dentro do chat (frames 05 a 07). "Ajustar algo" edita no próprio cartão com a validação de sempre;
// "Confirmar e enviar" é o envio do Formulario (/api/contato, trava contra duplo envio). Depois de começar, a cópia não muda.
export function CartaoResumo({ campos, aoMudar, servidor, aoStatus }: { campos: Campos; aoMudar: (c: Campos) => void; servidor?: ContatoServidorDTO; aoStatus?: (s: StatusDoCartao) => void }) {
  const idioma = useIdioma();
  const k = contato.chat.cartao, g = contato.guiada, ia = contato.ia;
  const [editando, setEditando] = useState(false);
  const [rascunho, setRascunho] = useState(campos);
  const [erros, setErros] = useState<Partial<Record<Chave, string>>>({});
  const [enviadoAs, setEnviadoAs] = useState('');
  const titulo = useRef<HTMLHeadingElement>(null);
  const primeiro = useRef<HTMLInputElement>(null);
  const resumoErros = useRef<HTMLDivElement>(null);
  const [tentativas, setTentativas] = useState(0);
  useEffect(() => { if (tentativas) resumoErros.current?.focus(); }, [tentativas]);
  const temErro = Object.values(erros).some(Boolean);
  useEffect(() => { if (editando) primeiro.current?.focus(); }, [editando]);
  useEffect(() => { if (enviadoAs) titulo.current?.focus(); }, [enviadoAs]);
  // Com erro, o padrão do formulário (GOV.UK): resumo com foco e "Erro: " no título enquanto houver erro.
  useEffect(() => {
    if (!temErro) return;
    const antes = document.title; document.title = `${t(contato.formulario.erro, idioma)} ${antes}`;
    return () => { document.title = antes; };
  }, [temErro, idioma]);

  function revisar(e: FormEvent) {
    e.preventDefault();
    const r = rascunho;
    const regra: [Chave, boolean, Texto][] = [
      ['nome', r.nome.trim().length >= 2 && r.nome.trim().length <= 200, ia.erroNome],
      ['empresa', !!r.empresa.trim() && r.empresa.trim().length <= 200, ia.erroEmpresa],
      ['projeto', !!r.projeto.trim() && r.projeto.trim().length <= 5000, ia.erroResumo],
      ['whatsapp', whatsappValido(r.whatsapp), g.erroWhatsapp],
      ['email', emailValido(r.email) && r.email.trim().length <= 120, g.erroEmail],
    ];
    const novos = Object.fromEntries(regra.filter(([, ok]) => !ok).map(([c, , msg]) => [c, t(msg, idioma)]));
    setErros(novos);
    if (regra.some(([, ok]) => !ok)) return setTentativas(n => n + 1);
    aoMudar(Object.fromEntries(ORDEM.map(c => [c, r[c].trim()])) as Campos);
    setEditando(false);
  }

  const { linhas, resto } = linhasDo(campos.projeto);
  const pedido = { nome: campos.nome, empresa: campos.empresa, contato: `WhatsApp: ${campos.whatsapp} · E-mail: ${campos.email}`, mensagem: campos.projeto };
  return (
    <section className={`cartao-resumo${enviadoAs ? ' cartao-enviado' : ''}`} aria-label={t(k.titulo, idioma)}>
      <h3 ref={titulo} tabIndex={-1}>{enviadoAs ? <><span aria-hidden="true">✓ </span>{t(k.enviado, idioma)}</> : t(k.titulo, idioma)}</h3>
      {editando ? (
        <form className="cartao-edicao" onSubmit={revisar} noValidate>
          {temErro && (
            <div className="formulario-erros" ref={resumoErros} tabIndex={-1}>
              <h4 role="alert">{t(contato.formulario.problema, idioma)}</h4>
              <ul>{ORDEM.filter(c => erros[c]).map(c => <li key={c}><a href={`#cartao-${c}`} onClick={e => { e.preventDefault(); document.getElementById(`cartao-${c}`)?.focus(); }}>{erros[c]}</a></li>)}</ul>
            </div>
          )}
          {ORDEM.map((c, i) => {
            const props = { id: `cartao-${c}`, value: rascunho[c], 'aria-invalid': erros[c] ? true : undefined, 'aria-describedby': erros[c] ? `cartao-${c}-erro` : undefined,
              onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => { setRascunho(r => ({ ...r, [c]: e.target.value })); if (erros[c]) setErros(x => ({ ...x, [c]: undefined })); } };
            return (
              <div className="cartao-campo" key={c}>
                <label htmlFor={props.id}>{t(k[c], idioma)}</label>
                {c === 'projeto' ? <textarea {...props} rows={Math.min(8, rascunho.projeto.split('\n').length + 1)} maxLength={5000} data-lenis-prevent="" />
                  : <input {...props} ref={i === 0 ? primeiro : undefined} type={c === 'email' ? 'email' : c === 'whatsapp' ? 'tel' : 'text'} inputMode={c === 'whatsapp' ? 'tel' : undefined}
                    autoComplete={({ nome: 'name', empresa: 'organization', whatsapp: 'tel', email: 'email' } as Record<string, string>)[c]} />}
                {erros[c] && <em id={`cartao-${c}-erro`}><span className="resposta-acessivel">{t(contato.formulario.erro, idioma)} </span>{erros[c]}</em>}
              </div>
            );
          })}
          <div className="formulario-acoes"><button type="submit">{t(k.pronto, idioma)}</button></div>
        </form>
      ) : (
        <>
          <dl>
            <div><dt>{t(k.nome, idioma)}</dt><dd>{[campos.nome, campos.empresa].filter(Boolean).join(' · ')}</dd></div>
            {resto && <div><dt>{t(k.projeto, idioma)}</dt><dd>{resto}</dd></div>}
            {linhas.map(([rotulo, valor], i) => <div key={i}><dt>{rotulo}</dt><dd>{valor}</dd></div>)}
            <div><dt>{t(k.contato, idioma)}</dt><dd>{campos.whatsapp} · {campos.email}</dd></div>
          </dl>
          {enviadoAs
            ? <p className="cartao-rodape">{t(k.enviadoAs, idioma).replace('{hora}', enviadoAs)}<span aria-hidden="true"> · </span>{t(k.prazo, idioma)}</p>
            : <Formulario key={JSON.stringify(pedido)} servidor={servidor} pedido={pedido} revisarAgora semResumo aoAjustar={() => { setRascunho(campos); setErros({}); setEditando(true); }}
              aoBloquear={() => aoStatus?.('enviando')} aoFalhar={() => aoStatus?.('falha')}
              aoEnviar={() => { setEnviadoAs(new Date().toLocaleTimeString(idioma === 'pt' ? 'pt-BR' : 'en-GB', { hour: '2-digit', minute: '2-digit' })); aoStatus?.('enviado'); }} />}
        </>
      )}
    </section>
  );
}
