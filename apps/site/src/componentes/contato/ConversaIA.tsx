'use client';

import { useEffect, useRef, useState } from 'react';
import { contato } from '@/conteudo/contato';
import { t, type Texto } from '@/conteudo/textos';
import type { ContatoServidorDTO } from '@/lib/contato/servidor';
import { useIdioma } from '@/lib/useIdioma';
import { CartaoResumo, type Campos } from './CartaoResumo';
import { ChatContato, useFimDoChat, type MensagemChat, type StatusDoGlobo } from './ChatContato';
import { emailValido, whatsappValido } from './ConversaGuiada';

// Conversa com o Gemini no visual do chat: 1. a IA qualifica o projeto (rota /api/contato/conversa) até devolver um
// resumo; 2. perguntas fixas pedem nome, empresa, WhatsApp e e-mail (validados); 3. o cartão de resumo, editável.
// Só as mensagens da parte 1 vão para a IA: dados de contato nunca saem para o modelo.
type Mensagem = MensagemChat & { turno?: boolean; opcoes?: string[] };
type Fase = 'ia' | 'nome' | 'empresa' | 'whatsapp' | 'email' | 'resumo';
type Dados = Omit<Campos, 'projeto'>;
const PERGUNTA_ORCAMENTO = /investimento|orçamento|budget|investment/i;

export function ConversaIA({ servidor, aoStatus }: { servidor?: ContatoServidorDTO; aoStatus?: (s: StatusDoGlobo) => void }) {
  const idioma = useIdioma();
  const g = contato.guiada, ia = contato.ia, c = contato.chat;
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [fase, setFase] = useState<Fase>('ia');
  const [entrada, setEntrada] = useState('');
  const [pensando, setPensando] = useState(false);
  const [resumo, setResumo] = useState('');
  const [dados, setDados] = useState<Dados>({ nome: '', empresa: '', whatsapp: '', email: '' });
  const [campos, setCampos] = useState<Campos | null>(null);
  const abortar = useRef<AbortController | null>(null);
  // O turno no ar: "parar" devolve a conversa e o texto na hora, sem esperar a chamada abortada terminar.
  const turno = useRef<{ antes: Mensagem[]; mensagem: string; parado: boolean } | null>(null);
  const fim = useFimDoChat(setMensagens, !!campos, aoStatus);
  useEffect(() => () => abortar.current?.abort(), []);

  const dizer = (texto: string, extra: Partial<Mensagem> = {}) => setMensagens(m => [...m, { de: 'ia', texto, ...extra } as Mensagem]);
  const errar = (msg: Texto) => dizer(t(msg, idioma), { erro: true });

  async function falarComIA(mensagem: string) {
    const historico = mensagens.filter(m => m.turno && m.de !== 'cartao').map(m => ({ papel: m.de === 'voce' ? 'usuario' : 'assistente', texto: (m as { texto: string }).texto }));
    if (mensagem.length > 2000 || historico.length >= 18) return errar(ia.limite);
    const antes = mensagens;
    setMensagens([...antes, { de: 'voce', texto: mensagem, turno: true }]); setEntrada(''); setPensando(true);
    const turnoId = crypto.randomUUID();
    const controller = new AbortController(); abortar.current = controller;
    const atual = { antes, mensagem, parado: false }; turno.current = atual;
    const prazo = setTimeout(() => controller.abort(), 25000);
    try {
      const r = await fetch('/api/contato/conversa', { method: 'POST', signal: controller.signal, headers: { accept: 'application/json', 'content-type': 'application/json' }, body: JSON.stringify({ idioma, turnoId, historico, mensagem }) });
      const d = await r.json();
      if (atual.parado) return;
      if (r.status !== 200 || d?.turnoId !== turnoId || typeof d.resposta !== 'string' || !d.resposta.trim()) throw new Error('resposta');
      dizer(d.resposta, { turno: true, opcoes: Array.isArray(d.opcoes) ? d.opcoes.filter((o: unknown): o is string => typeof o === 'string' && !!o.trim()).slice(0, 4) : [] });
      if (typeof d.mensagemSugerida === 'string' && d.mensagemSugerida.trim()) {
        setResumo(d.mensagemSugerida.trim());
        dizer(t(c.pedirNome, idioma)); setFase('nome');
      }
    } catch {
      // A mensagem volta ao campo para a pessoa tentar de novo sem redigitar; "parar" não é erro.
      if (atual.parado) return;
      setMensagens([...antes, { de: 'ia', texto: t(ia.falha, idioma), erro: true }]); setEntrada(mensagem);
    } finally { clearTimeout(prazo); if (!atual.parado) setPensando(false); }
  }

  function parar() {
    const atual = turno.current;
    if (!atual) return;
    atual.parado = true; abortar.current?.abort();
    setMensagens(atual.antes); setEntrada(atual.mensagem); setPensando(false);
  }

  function responder(texto: string) {
    if (fase === 'ia') return void falarComIA(texto);
    if (fase === 'resumo') {
      // Depois do resumo, o que a pessoa acrescenta entra no projeto do cartão (sem nova volta à IA).
      setMensagens(m => [...m, { de: 'voce', texto }, { de: 'ia', texto: t(c.anotado, idioma) }]); setEntrada('');
      return setCampos(k => k && { ...k, projeto: `${k.projeto}\n${texto}` });
    }
    const recusa: Record<Exclude<Fase, 'ia' | 'resumo'>, [boolean, Texto]> = {
      nome: [texto.length >= 2 && texto.length <= 200, ia.erroNome], empresa: [texto.length <= 200, ia.erroEmpresa],
      whatsapp: [whatsappValido(texto), g.erroWhatsapp], email: [emailValido(texto) && texto.length <= 120, g.erroEmail],
    };
    const [ok, msg] = recusa[fase];
    if (!ok) return errar(msg);
    const novos = { ...dados, [fase]: texto };
    setDados(novos); setEntrada('');
    const proxima: [Fase, string] | null = fase === 'nome' ? ['empresa', t(g.perguntas.empresa, idioma).replace('{nome}', texto.split(' ')[0])]
      : fase === 'empresa' ? ['whatsapp', t(g.perguntas.whatsapp, idioma)] : fase === 'whatsapp' ? ['email', t(g.perguntas.email, idioma)] : null;
    if (proxima) { setMensagens(m => [...m, { de: 'voce', texto }, { de: 'ia', texto: proxima[1] }]); return setFase(proxima[0]); }
    setMensagens(m => [...m, { de: 'voce', texto }, { de: 'ia', texto: t(c.confira, idioma).replace('{nome}', novos.nome.split(' ')[0]) }, { de: 'cartao' }]);
    setCampos({ ...novos, projeto: resumo }); setFase('resumo');
  }

  const ultima = mensagens[mensagens.length - 1];
  // Respostas rápidas: as de entrada no vazio; as opções da IA; sem opções, as faixas na pergunta de investimento
  // (a IA devolve opções vazias nessa pergunta, e uma frase que só cita "orçamento" não pode escondê-las).
  const daIA = fase === 'ia' && ultima?.de === 'ia' && ultima.turno && !ultima.erro;
  const respostas = fase === 'ia' && !mensagens.length ? c.atalhos.map(o => t(o, idioma))
    : daIA && ultima.opcoes?.length ? ultima.opcoes : daIA && PERGUNTA_ORCAMENTO.test(ultima.texto) ? ia.faixas.map(o => t(o, idioma)) : [];
  const placeholder = !mensagens.length ? contato.conversa.convite : fase === 'resumo' ? c.acrescentar : fase === 'ia' ? c.escreva : g.placeholders[fase];

  return (
    <ChatContato mensagens={mensagens} pensando={pensando} entrada={entrada} aoMudar={setEntrada} aoEnviar={responder} aoOcupado={fim.setOcupado}
      aoParar={parar}
      placeholder={t(placeholder, idioma)} respostas={respostas} extra={fim.links} travado={fim.travado} invalido={!!(ultima?.de === 'ia' && ultima.erro)}
      campo={{ maxLength: 2000, inputMode: fase === 'whatsapp' ? 'tel' : fase === 'email' ? 'email' : undefined, autoComplete: ({ nome: 'name', empresa: 'organization', whatsapp: 'tel', email: 'email' } as Record<string, string>)[fase] ?? 'off' }}
      cartao={campos && <CartaoResumo campos={campos} aoMudar={setCampos} servidor={servidor} aoStatus={fim.aoStatusDoCartao} />} />
  );
}
