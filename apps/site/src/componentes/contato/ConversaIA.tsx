'use client';

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { contato } from '@/conteudo/contato';
import { t, type Texto } from '@/conteudo/textos';
import { useIdioma } from '@/lib/useIdioma';
import type { Pedido } from '@/lib/pedidoDeContato';
import { emailValido, whatsappValido } from './ConversaGuiada';

// Conversa em duas partes, numa janela só:
// 1. perguntas fixas: nome, empresa, WhatsApp e e-mail (validados); 2. o Gemini qualifica o projeto
// (rota /api/contato/conversa) até devolver um resumo. No fim, o resumo editável com tudo preenchido.
// Só as mensagens da parte 2 vão para a IA: dados de contato nunca saem para o modelo.
type Mensagem = { de: 'floway' | 'voce'; texto: string; hora: string; ia: boolean; opcoes?: string[] };
type Campos = { nome: string; empresa: string; whatsapp: string; email: string };
type Fase = 'nome' | 'empresa' | 'ia' | 'whatsapp' | 'email' | 'resumo';
const PERGUNTA_ORCAMENTO = /investimento|orçamento|budget|investment/i;
const hora = () => new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

export function ConversaIA({ aoConcluir, aoEditar, children }: { aoConcluir: (p: Pedido) => void; aoEditar?: () => void; children?: ReactNode }) {
  const idioma = useIdioma();
  const g = contato.guiada, ia = contato.ia;
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [fase, setFase] = useState<Fase | null>(null);
  const [entrada, setEntrada] = useState('');
  const [digitando, setDigitando] = useState(true);
  const [erro, setErro] = useState('');
  const [resumo, setResumo] = useState('');
  const [campos, setCampos] = useState<Campos>({ nome: '', empresa: '', whatsapp: '', email: '' });
  const [errosResumo, setErrosResumo] = useState<Partial<Record<keyof Campos | 'resumo', string>>>({});
  const emCurso = useRef(false);
  const lista = useRef<HTMLDivElement>(null);
  const campo = useRef<HTMLTextAreaElement>(null);
  // Desce até a última mensagem já com a área de opções no tamanho final (o efeito roda depois da pintura do mesmo render).
  useEffect(() => { if (lista.current) lista.current.scrollTop = lista.current.scrollHeight; }, [mensagens, digitando, fase, erro, children]);

  const dizer = (texto: string, ia = false, opcoes: string[] = []) => setMensagens(m => [...m, { de: 'floway', texto, hora: hora(), ia, opcoes }]);
  // Pergunta fixa: a Floway "digita" um instante e pergunta.
  function perguntar(proxima: Fase, texto: string) {
    setDigitando(true); setFase(null);
    setTimeout(() => { dizer(texto); setFase(proxima); setDigitando(false); requestAnimationFrame(() => campo.current?.focus()); }, 350);
  }
  useEffect(() => perguntar('nome', t(g.perguntas.nome, idioma)), []); // eslint-disable-line react-hooks/exhaustive-deps

  async function falarComIA(mensagem: string) {
    if (emCurso.current) return;
    const historico = mensagens.filter(m => m.ia).map(m => ({ papel: m.de === 'voce' ? 'usuario' : 'assistente', texto: m.texto }));
    if (mensagem.length > 2000 || historico.length >= 18) { setErro(t(ia.limite, idioma)); return; }
    emCurso.current = true; setErro(''); setDigitando(true);
    const antes = mensagens;
    setMensagens([...antes, { de: 'voce', texto: mensagem, hora: hora(), ia: true }]); setEntrada('');
    const turnoId = crypto.randomUUID();
    const controller = new AbortController();
    const prazo = setTimeout(() => controller.abort(), 25000);
    try {
      const r = await fetch('/api/contato/conversa', { method: 'POST', signal: controller.signal, headers: { accept: 'application/json', 'content-type': 'application/json' }, body: JSON.stringify({ idioma, turnoId, historico, mensagem }) });
      const d = await r.json();
      if (r.status !== 200 || d?.turnoId !== turnoId || typeof d.resposta !== 'string' || !d.resposta.trim()) throw new Error('resposta');
      dizer(d.resposta, true, Array.isArray(d.opcoes) ? d.opcoes.filter((o: unknown): o is string => typeof o === 'string' && !!o.trim()).slice(0, 4) : []);
      if (typeof d.mensagemSugerida === 'string' && d.mensagemSugerida.trim()) {
        setResumo(d.mensagemSugerida.trim());
        perguntar('resumo', t(ia.confira, idioma));
      }
    } catch {
      // A mensagem volta ao campo para a pessoa tentar de novo sem redigitar.
      setMensagens(antes); setEntrada(mensagem); setErro(t(ia.falha, idioma));
    } finally { clearTimeout(prazo); emCurso.current = false; setDigitando(false); requestAnimationFrame(() => campo.current?.focus()); }
  }

  function responder(bruto: string) {
    const texto = bruto.trim();
    if (!texto || !fase || digitando) return;
    if (fase === 'ia') return void falarComIA(texto);
    const recusa: Partial<Record<Fase, [boolean, Texto]>> = {
      nome: [texto.length >= 2 && texto.length <= 200, ia.erroNome], empresa: [texto.length <= 200, ia.erroEmpresa],
      whatsapp: [whatsappValido(texto), g.erroWhatsapp], email: [emailValido(texto), g.erroEmail],
    };
    const [ok, msg] = recusa[fase] ?? [true, ia.erroNome];
    if (!ok) { setErro(t(msg, idioma)); campo.current?.focus(); return; }
    setErro(''); setEntrada('');
    setMensagens(m => [...m, { de: 'voce', texto, hora: hora(), ia: false }]);
    setCampos(c => ({ ...c, [fase]: texto }));
    if (fase === 'nome') perguntar('empresa', t(g.perguntas.empresa, idioma).replace('{nome}', texto.split(' ')[0]));
    else if (fase === 'empresa') perguntar('whatsapp', t(g.perguntas.whatsapp, idioma));
    else if (fase === 'whatsapp') perguntar('email', t(g.perguntas.email, idioma));
    else if (fase === 'email') perguntar('ia', t(ia.abertura, idioma));
  }
  function enviar(e: FormEvent) { e.preventDefault(); responder(entrada); }

  function revisar() {
    const e: typeof errosResumo = {};
    if (campos.nome.trim().length < 2) e.nome = t(ia.erroNome, idioma);
    if (!campos.empresa.trim()) e.empresa = t(ia.erroEmpresa, idioma);
    if (!whatsappValido(campos.whatsapp)) e.whatsapp = t(g.erroWhatsapp, idioma);
    if (!emailValido(campos.email)) e.email = t(g.erroEmail, idioma);
    if (!resumo.trim() || resumo.length > 5000) e.resumo = t(ia.erroResumo, idioma);
    setErrosResumo(e);
    if (Object.keys(e).length) return;
    aoConcluir({ nome: campos.nome.trim(), empresa: campos.empresa.trim(), contato: `WhatsApp: ${campos.whatsapp.trim()} · E-mail: ${campos.email.trim()}`, mensagem: resumo.trim() });
  }
  const editar = (k: keyof Campos | 'resumo', v: string) => {
    if (k === 'resumo') setResumo(v); else setCampos(c => ({ ...c, [k]: v }));
    if (errosResumo[k]) setErrosResumo(e => ({ ...e, [k]: undefined }));
    aoEditar?.();
  };

  const ultima = mensagens[mensagens.length - 1];
  const naIA = fase === 'ia' && !digitando;
  // Atalhos: os 4 de entrada; as faixas na pergunta de investimento; senão, as opções que a IA sugeriu para a pergunta.
  const daIA = naIA && ultima?.ia && ultima.de === 'floway';
  const tipoAtalho = naIA && !mensagens.some(m => m.ia) ? 'entrada' : daIA && PERGUNTA_ORCAMENTO.test(ultima.texto) ? 'faixas' : daIA && ultima.opcoes?.length ? 'ia' : null;
  const atalhos = tipoAtalho === 'entrada' ? ia.atalhos.map(o => t(o, idioma)) : tipoAtalho === 'faixas' ? ia.faixas.map(o => t(o, idioma)) : tipoAtalho === 'ia' ? ultima!.opcoes! : null;
  const placeholder = fase === 'nome' ? g.placeholders.nome : fase === 'empresa' ? g.placeholders.empresa : fase === 'whatsapp' ? g.placeholders.whatsapp : fase === 'email' ? g.placeholders.email : ia.placeholder;
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
          {mensagens.map((m, i) => <div key={i} className={`guiada-balao ${m.de}`}><p>{m.texto}</p><time>{m.hora}</time></div>)}
          {digitando && <div className="guiada-balao floway guiada-digitando" aria-hidden="true"><i /><i /><i /></div>}
          {fase === 'resumo' && (
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
      {fase !== 'resumo' && (
        <div className="guiada-rodape">
          {atalhos && (
            <div className="guiada-atalhos" role="group" aria-label={t(tipoAtalho === 'faixas' ? ia.faixasRotulo : ia.atalhosRotulo, idioma)}>
              {atalhos.map(r => <button key={r} type="button" onClick={() => void falarComIA(r)}>{r}</button>)}
            </div>
          )}
          <form className="guiada-entrada" onSubmit={enviar} noValidate>
            {erro && <p className="guiada-erro" role="alert">{erro}</p>}
            <div className="guiada-linha">
              <label className="resposta-acessivel" htmlFor="ia-campo">{t(g.suaResposta, idioma)}</label>
              <textarea id="ia-campo" ref={campo} rows={1} value={entrada} placeholder={t(placeholder, idioma)} maxLength={2000} disabled={digitando}
                inputMode={fase === 'whatsapp' ? 'tel' : fase === 'email' ? 'email' : undefined}
                autoComplete={fase === 'nome' ? 'name' : fase === 'empresa' ? 'organization' : fase === 'whatsapp' ? 'tel' : fase === 'email' ? 'email' : 'off'}
                onChange={e => { setEntrada(e.target.value); if (erro) setErro(''); }}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); responder(entrada); } }} data-lenis-prevent="" />
              <button type="submit" className="guiada-enviar" disabled={digitando || !entrada.trim()} aria-label={t(g.enviarResposta, idioma)}>→</button>
            </div>
            <p className="guiada-dica">{t(fase === 'ia' ? ia.aviso : g.obrigatoria, idioma)}</p>
          </form>
        </div>
      )}
    </section>
  );
}
