'use client';

import { useState } from 'react';
import { contato } from '@/conteudo/contato';
import { t, type Idioma, type Texto } from '@/conteudo/textos';
import type { ContatoServidorDTO } from '@/lib/contato/servidor';
import { useIdioma } from '@/lib/useIdioma';
import { CartaoResumo, type Campos } from './CartaoResumo';
import { ChatContato, useFimDoChat, type MensagemChat, type StatusDoGlobo } from './ChatContato';

// Roteiro fixo, sem IA, no mesmo visual do chat: o vazio recebe o projeto e a Floway pergunta uma coisa por vez,
// todas obrigatórias. O pedido sai no formato do formulário, pelo envio que já existe. Perguntas de exemplo até a
// pessoa mandar as definitivas.
type Respostas = { nome: string; empresa: string; necessidades: string[]; prazo: string; whatsapp: string; email: string; descricao: string };
type Passo = keyof Respostas | 'resumo';
const ORDEM: Passo[] = ['descricao', 'nome', 'empresa', 'necessidades', 'prazo', 'whatsapp', 'email', 'resumo'];
const LIMITE: Partial<Record<Passo, number>> = { nome: 200, empresa: 200, whatsapp: 30, email: 120, descricao: 4500 };
const AUTOCOMPLETAR: Partial<Record<Passo, string>> = { nome: 'name', empresa: 'organization', whatsapp: 'tel', email: 'email' };

export const emailValido = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
// WhatsApp brasileiro: DDD (11 a 99) + 8 dígitos (fixo) ou 9 começando por 9 (celular), com ou sem +55 e pontuação.
export function whatsappValido(valor: string): boolean {
  const v = valor.trim();
  if (/[^\d\s()+.-]/.test(v)) return false;
  const digitos = v.replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, '');
  return /^[1-9][1-9]\d{8,9}$/.test(digitos) && (digitos.length === 10 || digitos[2] === '9');
}

export function projetoDe(r: Pick<Respostas, 'necessidades' | 'prazo' | 'descricao'>, idioma: Idioma): string {
  const g = contato.guiada;
  return `${t(g.rotuloNecessidades, idioma)}: ${r.necessidades.join(', ')}\n${t(g.rotuloPrazo, idioma)}: ${r.prazo}\n\n${r.descricao.trim()}`;
}

export function ConversaGuiada({ servidor, aoStatus }: { servidor?: ContatoServidorDTO; aoStatus?: (s: StatusDoGlobo) => void }) {
  const idioma = useIdioma();
  const g = contato.guiada, c = contato.chat;
  const [mensagens, setMensagens] = useState<MensagemChat[]>([]);
  const [passo, setPasso] = useState(0);
  const [respostas, setRespostas] = useState<Respostas>({ nome: '', empresa: '', necessidades: [], prazo: '', whatsapp: '', email: '', descricao: '' });
  const [entrada, setEntrada] = useState('');
  const [marcados, setMarcados] = useState<string[]>([]);
  const [outro, setOutro] = useState('');
  const [campos, setCampos] = useState<Campos | null>(null);
  const fim = useFimDoChat(setMensagens, !!campos, aoStatus);
  const atual = ORDEM[passo];
  const rotuloOutro = t(g.necessidades[g.necessidades.length - 1], idioma);

  const perguntas: Partial<Record<Passo, Texto>> = { nome: c.pedirNome, empresa: g.perguntas.empresa, necessidades: g.perguntas.necessidades, prazo: g.perguntas.prazo, whatsapp: g.perguntas.whatsapp, email: g.perguntas.email };
  function responder(valor: string | string[]) {
    const texto = Array.isArray(valor) ? valor.join(', ') : valor.trim();
    if (atual === 'resumo') {
      // Depois do resumo, o que a pessoa acrescenta entra no projeto do cartão.
      setMensagens(m => [...m, { de: 'voce', texto }, { de: 'ia', texto: t(c.anotado, idioma) }]); setEntrada('');
      return setCampos(k => k && { ...k, projeto: `${k.projeto}\n${texto}` });
    }
    const erro = atual === 'nome' && texto.length < 2 ? contato.ia.erroNome : atual === 'whatsapp' && !whatsappValido(texto) ? g.erroWhatsapp : atual === 'email' && !emailValido(texto) ? g.erroEmail : null;
    if (erro) return setMensagens(m => [...m, { de: 'ia', texto: t(erro, idioma), erro: true }]);
    // Quem digita em vez de marcar o checklist também responde: vira uma necessidade só.
    const novas = { ...respostas, [atual]: atual === 'necessidades' && !Array.isArray(valor) ? [texto] : Array.isArray(valor) ? valor : texto };
    const proximo = ORDEM[passo + 1];
    setRespostas(novas); setEntrada(''); setMarcados([]); setOutro(''); setPasso(passo + 1);
    if (proximo !== 'resumo') return setMensagens(m => [...m, { de: 'voce', texto }, { de: 'ia', texto: t(perguntas[proximo]!, idioma).replace('{nome}', novas.nome.split(' ')[0]) }]);
    setMensagens(m => [...m, { de: 'voce', texto }, { de: 'ia', texto: t(c.confira, idioma).replace('{nome}', novas.nome.split(' ')[0]) }, { de: 'cartao' }]);
    setCampos({ nome: novas.nome, empresa: novas.empresa, whatsapp: novas.whatsapp, email: novas.email, projeto: projetoDe(novas, idioma) });
  }

  const outroMarcado = marcados.includes(rotuloOutro);
  const checklistPronto = marcados.length > 0 && (!outroMarcado || outro.trim().length > 0);
  const escolhidas = () => marcados.map(m => (m === rotuloOutro ? `${rotuloOutro}: ${outro.trim()}` : m));
  const checklist = atual === 'necessidades' && (
    <fieldset className="chat-respostas chat-checklist">
      <legend className="resposta-acessivel">{t(g.perguntas.necessidades, idioma)}</legend>
      {g.necessidades.map(o => {
        const r = t(o, idioma); const on = marcados.includes(r);
        return (
          <label key={r} className={on ? 'marcada' : undefined}>
            <input type="checkbox" checked={on} onChange={() => setMarcados(m => (on ? m.filter(x => x !== r) : [...m, r]))} />{r}
          </label>
        );
      })}
      {outroMarcado && <input className="chat-outro" type="text" aria-label={t(g.qual, idioma)} placeholder={t(g.qualPlaceholder, idioma)} value={outro} maxLength={100} autoFocus
        onChange={e => setOutro(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && checklistPronto) responder(escolhidas()); }} />}
      <button type="button" className="chat-continuar" disabled={!checklistPronto} onClick={() => responder(escolhidas())}>{t(g.continuar, idioma)} →</button>
    </fieldset>
  );
  const ultima = mensagens[mensagens.length - 1];
  const opcoes = atual === 'descricao' ? c.atalhos : atual === 'prazo' ? g.prazos : [];
  const placeholder = atual === 'descricao' ? contato.conversa.convite : atual === 'resumo' ? c.acrescentar : atual === 'nome' || atual === 'empresa' || atual === 'whatsapp' || atual === 'email' ? g.placeholders[atual] : c.escreva;

  return (
    <ChatContato mensagens={mensagens} pensando={false} entrada={entrada} aoMudar={setEntrada} aoEnviar={responder} aoOcupado={fim.setOcupado}
      placeholder={t(placeholder, idioma)} respostas={opcoes.map(o => t(o, idioma))} extra={fim.links ?? (checklist || undefined)} travado={fim.travado}
      invalido={ultima?.de === 'ia' && !!ultima.erro} aviso="roteiro"
      campo={{ maxLength: LIMITE[atual] ?? 2000, inputMode: atual === 'whatsapp' ? 'tel' : atual === 'email' ? 'email' : undefined, autoComplete: AUTOCOMPLETAR[atual] ?? 'off' }}
      cartao={campos && <CartaoResumo campos={campos} aoMudar={setCampos} servidor={servidor} aoStatus={fim.aoStatusDoCartao} />} />
  );
}
