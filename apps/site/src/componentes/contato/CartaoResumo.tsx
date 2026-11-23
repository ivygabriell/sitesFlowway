'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { contato } from '@/conteudo/contato';
import { t, type Idioma, type Texto } from '@/conteudo/textos';
import type { ContatoServidorDTO } from '@/lib/contato/servidor';
import { useIdioma } from '@/lib/useIdioma';
import { emailValido, whatsappValido } from './ConversaGuiada';
import { Formulario } from './Formulario';

export type Campos = { nome: string; empresa: string; whatsapp: string; email: string; projeto: string };
export type StatusDoCartao = 'enviando' | 'falha' | 'enviado';
type Chave = keyof Campos;
const ORDEM: Chave[] = ['nome', 'empresa', 'projeto', 'whatsapp', 'email'];

// Rótulos que as próprias fontes escrevem no projeto: o roteiro (Preciso de, Prazo) e o resumo do Gemini
// (lista em src/lib/contato/gemini.ts). Só essas linhas viram linha do cartão, na ordem do texto; o resto fica como a
// pessoa escreveu, em "Projeto" (um link ou "Obs: ..." não viram rótulo). O que vai para a equipe é o texto inteiro.
const ROTULOS = new Set([
  ...[contato.guiada.rotuloNecessidades, contato.guiada.rotuloPrazo].flatMap(r => [r.pt, r.en]),
  'Projeto', 'Objetivo', 'Situação atual', 'Prazo desejado', 'Orçamento previsto', 'Decisão', 'Sistemas envolvidos', 'Referências', 'Observações',
  'Project', 'Goal', 'Current situation', 'Desired timeline', 'Planned budget', 'Decision', 'Systems involved', 'References', 'Notes',
]);
function linhasDo(projeto: string) {
  const linhas: [string | null, string][] = [];
  for (const l of projeto.split('\n')) {
    const m = /^([^:]+):\s*(.*)$/.exec(l.trim());
    const ultima = linhas[linhas.length - 1];
    if (m && ROTULOS.has(m[1])) linhas.push([m[1], m[2]]);
    else if (ultima && ultima[0] === null) ultima[1] += `\n${l}`;
    else linhas.push([null, l]);
  }
  return linhas.map(([r, v]) => [r, v.trim()] as const).filter(([, v]) => v);
}

const contatoDe = (c: Campos) => `WhatsApp: ${c.whatsapp} · E-mail: ${c.email}`;
// As regras do envio (as do servidor: projeto até 5000, contato até 200), valendo para o cartão inteiro: um acréscimo
// depois do resumo também precisa caber, senão o servidor recusaria e "Tentar de novo" repetiria o mesmo corpo.
function errosDo(r: Campos, idioma: Idioma) {
  const g = contato.guiada, ia = contato.ia, f = contato.formulario;
  const projeto = r.projeto.trim();
  const regra: [Chave, boolean, Texto][] = [
    ['nome', r.nome.trim().length >= 2 && r.nome.trim().length <= 200, ia.erroNome],
    ['empresa', !!r.empresa.trim() && r.empresa.trim().length <= 200, ia.erroEmpresa],
    ['projeto', !!projeto, ia.erroResumo],
    ['projeto', projeto.length <= 5000, f.limiteMensagem],
    ['whatsapp', whatsappValido(r.whatsapp), g.erroWhatsapp],
    ['whatsapp', contatoDe(r).trim().length <= 200, f.limiteContato],
    ['email', emailValido(r.email) && r.email.trim().length <= 120, g.erroEmail],
  ];
  const erros: Partial<Record<Chave, string>> = {};
  for (const [c, ok, msg] of regra) if (!ok) erros[c] ??= t(msg, idioma);
  return erros;
}

// Cartão de resumo dentro do chat (frames 05 a 07). "Ajustar algo" edita no próprio cartão com a validação de sempre;
// "Confirmar e enviar" é o envio do Formulario (/api/contato, trava contra duplo envio). Depois de começar, a cópia não muda.
export function CartaoResumo({ campos, aoMudar, servidor, aoStatus }: { campos: Campos; aoMudar: (c: Campos) => void; servidor?: ContatoServidorDTO; aoStatus?: (s: StatusDoCartao | null) => void }) {
  const idioma = useIdioma();
  const k = contato.chat.cartao;
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
  // Abrir a edição põe o foco no primeiro campo; fechar com "Revisar pedido" devolve ao cartão (não ao body).
  const editou = useRef(false);
  useEffect(() => {
    if (editando) primeiro.current?.focus();
    else if (editou.current) titulo.current?.focus();
    editou.current = editando;
  }, [editando]);
  useEffect(() => { if (enviadoAs) titulo.current?.focus(); }, [enviadoAs]);
  // Com erro, o padrão do formulário (GOV.UK): resumo com foco e "Erro: " no título enquanto houver erro.
  useEffect(() => {
    if (!temErro) return;
    const antes = document.title; document.title = `${t(contato.formulario.erro, idioma)} ${antes}`;
    return () => { document.title = antes; };
  }, [temErro, idioma]);

  function revisar(e: FormEvent) {
    e.preventDefault();
    const novos = errosDo(rascunho, idioma);
    setErros(novos);
    if (Object.keys(novos).length) return setTentativas(n => n + 1);
    aoMudar(Object.fromEntries(ORDEM.map(c => [c, rascunho[c].trim()])) as Campos);
    setEditando(false);
  }
  // Ajustar depois de uma falha (envio indisponível, intenção vencida) volta o globo ao "resumo pronto".
  const ajustar = () => { setRascunho(campos); setErros({}); setEditando(true); aoStatus?.(null); };

  const pedido = { nome: campos.nome, empresa: campos.empresa, contato: contatoDe(campos), mensagem: campos.projeto };
  // Fora do limite, nada de CONFIRMAR: o erro e o caminho para ajustar.
  const foraDoLimite = Object.values(errosDo(campos, idioma))[0];
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
            {linhasDo(campos.projeto).map(([rotulo, valor], i) => <div key={i}><dt>{rotulo ?? t(k.projeto, idioma)}</dt><dd>{valor}</dd></div>)}
            <div><dt>{t(k.contato, idioma)}</dt><dd>{campos.whatsapp} · {campos.email}</dd></div>
          </dl>
          {enviadoAs
            ? <p className="cartao-rodape">{t(k.enviadoAs, idioma).replace('{hora}', enviadoAs)}<span aria-hidden="true"> · </span>{t(k.prazo, idioma)}</p>
            : foraDoLimite
              ? <div className="pedido-contato"><p className="formulario-falha" role="alert">{foraDoLimite}</p><div className="formulario-acoes cartao-acoes-limite"><button type="button" onClick={ajustar}>{t(k.ajustar, idioma)}</button></div></div>
              : <Formulario key={JSON.stringify(pedido)} servidor={servidor} pedido={pedido} revisarAgora semResumo aoAjustar={ajustar}
              aoBloquear={() => aoStatus?.('enviando')} aoFalhar={() => aoStatus?.('falha')}
              aoEnviar={() => { setEnviadoAs(new Date().toLocaleTimeString(idioma === 'pt' ? 'pt-BR' : 'en-GB', { hour: '2-digit', minute: '2-digit' })); aoStatus?.('enviado'); }} />}
        </>
      )}
    </section>
  );
}
