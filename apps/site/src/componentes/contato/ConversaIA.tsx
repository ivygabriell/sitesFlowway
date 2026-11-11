'use client';

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { contato } from '@/conteudo/contato';
import { t } from '@/conteudo/textos';
import { useIdioma } from '@/lib/useIdioma';
import type { Pedido } from '@/lib/pedidoDeContato';
import { emailValido, whatsappValido } from './ConversaGuiada';

// Conversa com o Gemini (rota /api/contato/conversa): a IA qualifica o projeto seguindo o roteiro do servidor e,
// quando tem o suficiente, devolve um resumo. A pessoa confere o resumo e preenche os dados de contato aqui.
type Mensagem = { papel: 'usuario' | 'assistente'; texto: string };
type Campos = { nome: string; empresa: string; whatsapp: string; email: string };
const PERGUNTA_ORCAMENTO = /investimento|orçamento|budget|investment/i;

const hora = () => new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

export function ConversaIA({ aoConcluir, aoEditar, children }: { aoConcluir: (p: Pedido) => void; aoEditar?: () => void; children?: ReactNode }) {
  const idioma = useIdioma();
  const g = contato.guiada, ia = contato.ia;
  const [historico, setHistorico] = useState<(Mensagem & { hora: string })[]>([]);
  const [entrada, setEntrada] = useState('');
  const [digitando, setDigitando] = useState(false);
  const [erro, setErro] = useState('');
  const [resumo, setResumo] = useState<string | null>(null);
  const [campos, setCampos] = useState<Campos>({ nome: '', empresa: '', whatsapp: '', email: '' });
  const [errosResumo, setErrosResumo] = useState<Partial<Record<keyof Campos | 'resumo', string>>>({});
  const emCurso = useRef(false);
  const lista = useRef<HTMLDivElement>(null);
  const campo = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { lista.current?.scrollTo?.({ top: lista.current.scrollHeight, behavior: 'smooth' }); }, [historico, digitando, resumo, children]);

  async function falar(texto: string) {
    const mensagem = texto.trim();
    if (!mensagem || emCurso.current) return;
    if (mensagem.length > 2000 || historico.length >= 18) { setErro(t(ia.limite, idioma)); return; }
    emCurso.current = true; setErro(''); setDigitando(true);
    const anterior = historico;
    setHistorico([...anterior, { papel: 'usuario', texto: mensagem, hora: hora() }]); setEntrada('');
    const turnoId = crypto.randomUUID();
    const controller = new AbortController();
    const prazo = setTimeout(() => controller.abort(), 25000);
    try {
      const r = await fetch('/api/contato/conversa', { method: 'POST', signal: controller.signal, headers: { accept: 'application/json', 'content-type': 'application/json' },
        body: JSON.stringify({ idioma, turnoId, historico: anterior.map(({ papel, texto }) => ({ papel, texto })), mensagem }) });
      const d = await r.json();
      if (r.status !== 200 || d?.turnoId !== turnoId || typeof d.resposta !== 'string' || !d.resposta.trim()) throw new Error('resposta');
      setHistorico(h => [...h, { papel: 'assistente', texto: d.resposta, hora: hora() }]);
      if (typeof d.mensagemSugerida === 'string' && d.mensagemSugerida.trim()) setResumo(d.mensagemSugerida.trim());
    } catch {
      // A mensagem volta ao campo para a pessoa tentar de novo sem redigitar.
      setHistorico(anterior); setEntrada(mensagem); setErro(t(ia.falha, idioma));
    } finally { clearTimeout(prazo); emCurso.current = false; setDigitando(false); requestAnimationFrame(() => campo.current?.focus()); }
  }
  function enviar(e: FormEvent) { e.preventDefault(); void falar(entrada); }

  function revisar() {
    const e: typeof errosResumo = {};
    if (campos.nome.trim().length < 2) e.nome = t(ia.erroNome, idioma);
    if (!campos.empresa.trim()) e.empresa = t(ia.erroEmpresa, idioma);
    if (!whatsappValido(campos.whatsapp)) e.whatsapp = t(g.erroWhatsapp, idioma);
    if (!emailValido(campos.email)) e.email = t(g.erroEmail, idioma);
    if (!resumo?.trim() || resumo.length > 5000) e.resumo = t(ia.erroResumo, idioma);
    setErrosResumo(e);
    if (Object.keys(e).length) return;
    aoConcluir({ nome: campos.nome.trim(), empresa: campos.empresa.trim(), contato: `WhatsApp: ${campos.whatsapp.trim()} · E-mail: ${campos.email.trim()}`, mensagem: resumo!.trim() });
  }
  const editar = <K extends keyof Campos | 'resumo'>(k: K, v: string) => {
    if (k === 'resumo') setResumo(v); else setCampos(c => ({ ...c, [k]: v }));
    if (errosResumo[k]) setErrosResumo(e => ({ ...e, [k]: undefined }));
    aoEditar?.();
  };

  const ultima = historico[historico.length - 1];
  const mostrarFaixas = !resumo && !digitando && ultima?.papel === 'assistente' && PERGUNTA_ORCAMENTO.test(ultima.texto);
  const inicio = historico.length === 0 && !digitando;
  // O erro fica fora do rótulo e ligado ao campo por aria-describedby, para o nome do campo não mudar.
  const campoDe = (k: keyof Campos, tipo: string, auto: string) => (
    <div className="guiada-campo" key={k}>
      <label htmlFor={`ia-${k}`}>{t(g.rotulos[k], idioma)}</label>
      <input id={`ia-${k}`} type={tipo} value={campos[k]} autoComplete={auto} inputMode={k === 'whatsapp' ? 'tel' : undefined} placeholder={t(ia.placeholders[k], idioma)}
        aria-invalid={errosResumo[k] ? true : undefined} aria-describedby={errosResumo[k] ? `ia-${k}-erro` : undefined} onChange={ev => editar(k, ev.target.value)} />
      {errosResumo[k] && <em id={`ia-${k}-erro`}>{errosResumo[k]}</em>}
    </div>
  );

  return (
    <section className="guiada" aria-label={t(g.titulo, idioma)}>
      <header className="guiada-topo">
        <span className="guiada-avatar" aria-hidden="true">F</span>
        <span className="guiada-quem"><strong>Floway</strong><small>{digitando ? t(g.digitando, idioma) : 'online'}</small></span>
      </header>
      <div className="guiada-lista" ref={lista} role="log" aria-live="polite" data-lenis-prevent="">
        <div className="guiada-coluna">
          <div className="guiada-balao floway"><p>{t(ia.abertura, idioma)}</p></div>
          {historico.map((m, i) => <div key={i} className={`guiada-balao ${m.papel === 'usuario' ? 'voce' : 'floway'}`}><p>{m.texto}</p><time>{m.hora}</time></div>)}
          {digitando && <div className="guiada-balao floway guiada-digitando" aria-hidden="true"><i /><i /><i /></div>}
          {resumo !== null && (
            <section className="guiada-resumo" aria-label={t(g.resumo, idioma)}>
              <header><h2>{t(g.resumo, idioma)}</h2><p>{t(ia.resumoDica, idioma)}</p></header>
              <div className="guiada-form">
                <div className="guiada-campo guiada-campo-largo">
                  <label htmlFor="ia-resumo">{t(ia.resumoCampo, idioma)}</label>
                  <textarea id="ia-resumo" value={resumo} rows={Math.min(10, resumo.split('\n').length + 1)} maxLength={5000} aria-invalid={errosResumo.resumo ? true : undefined} aria-describedby={errosResumo.resumo ? 'ia-resumo-erro' : undefined} onChange={ev => editar('resumo', ev.target.value)} data-lenis-prevent="" />
                  {errosResumo.resumo && <em id="ia-resumo-erro">{errosResumo.resumo}</em>}
                </div>
                {campoDe('nome', 'text', 'name')}
                {campoDe('empresa', 'text', 'organization')}
                {campoDe('whatsapp', 'tel', 'tel')}
                {campoDe('email', 'email', 'email')}
              </div>
              {children ?? <div className="formulario-acoes guiada-acoes"><button type="button" onClick={revisar}>{t(ia.revisar, idioma)}</button></div>}
            </section>
          )}
        </div>
      </div>
      {resumo === null && (
        <div className="guiada-rodape">
          {(inicio || mostrarFaixas) && (
            <div className="guiada-atalhos" role="group" aria-label={t(inicio ? ia.atalhosRotulo : ia.faixasRotulo, idioma)}>
              {(inicio ? ia.atalhos : ia.faixas).map(o => { const r = t(o, idioma); return <button key={r} type="button" onClick={() => void falar(r)}>{r}</button>; })}
            </div>
          )}
          <form className="guiada-entrada" onSubmit={enviar} noValidate>
            {erro && <p className="guiada-erro" role="alert">{erro}</p>}
            <div className="guiada-linha">
              <label className="resposta-acessivel" htmlFor="ia-campo">{t(g.suaResposta, idioma)}</label>
              <textarea id="ia-campo" ref={campo} rows={1} value={entrada} placeholder={t(ia.placeholder, idioma)} maxLength={2000} disabled={digitando}
                onChange={e => { setEntrada(e.target.value); if (erro) setErro(''); }}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void falar(entrada); } }} data-lenis-prevent="" />
              <button type="submit" className="guiada-enviar" disabled={digitando || !entrada.trim()} aria-label={t(g.enviarResposta, idioma)}>→</button>
            </div>
            <p className="guiada-dica">{t(ia.aviso, idioma)}</p>
          </form>
        </div>
      )}
    </section>
  );
}
