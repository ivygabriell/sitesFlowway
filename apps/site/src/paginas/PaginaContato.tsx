'use client';

import { useScrollRig } from '@14islands/r3f-scroll-rig';
import { useEffect, useState } from 'react';
import { EsferaDeLetras } from '@/compartilhados/esfera/EsferaDeLetras';
import { GloboDoChat, type StatusDoGlobo } from '@/componentes/contato/ChatContato';
import { ConversaGuiada } from '@/componentes/contato/ConversaGuiada';
import { ConversaIA } from '@/componentes/contato/ConversaIA';
import { Formulario } from '@/componentes/contato/Formulario';
import { contato } from '@/conteudo/contato';
import { t } from '@/conteudo/textos';
import type { ContatoServidorDTO } from '@/lib/contato/servidor';
import { rota } from '@/lib/idioma';
import { useIdioma } from '@/lib/useIdioma';
import { alvoDoSimbolo } from '@/marca/amostrar';
import '@/componentes/contato/estilo.css';

// Estado 02 do contato por chat (spec 2026-11-22): o chat no meio e o globo de letras no canto inferior direito.
// O globo só recebe os estados verificados: respondendo enquanto a IA pensa; o F (formarAlvo) só no sucesso real do envio.
export function PaginaContato({ estado, servidor }: { estado?: string; servidor?: ContatoServidorDTO }) {
  const idioma = useIdioma();
  const c = contato.chat;
  const [status, setStatus] = useState<StatusDoGlobo>('online');
  // Celular (M02): o globo grande no vazio, acima do título; no desktop o lugar fica escondido e o globo, no canto.
  const [grande, setGrande] = useState<HTMLDivElement | null>(null);
  const Conversa = servidor?.conversaDisponivel ? ConversaIA : ConversaGuiada;
  const { reflow } = useScrollRig();
  // O ScrollRig precisa reler a posição da esfera quando a página monta e quando o globo forma o F.
  useEffect(() => reflow(), [status, reflow]);
  void estado;
  return (
    <main className="pagina-contato" data-fundo="claro" id="topo">
      <h1 className="frase-contato">{t(contato.frase, idioma)}</h1>
      <div className="chat-topo">
        <p className="chat-iniciar">{t(c.iniciar, idioma)}</p>
        <a className="chat-fechar" href={rota('inicio', idioma)}><span className="chat-fechar-texto">{t(c.fechar, idioma)}</span><span aria-hidden="true">✕</span></a>
      </div>
      {/* Com o Gemini configurado, a conversa é com a IA; sem ele, segue o roteiro fixo de perguntas. */}
      <Conversa servidor={servidor} aoStatus={setStatus} lugarDoGlobo={setGrande} />
      <GloboDoChat status={status}>
        <EsferaDeLetras alvo={alvoDoSimbolo} respondendo={status === 'pensando'} formarAlvo={status === 'enviado'} lugar={grande} />
      </GloboDoChat>
      {/* Sem JavaScript a conversa não anda: o formulário simples só existe para esse caso, nunca atrás da conversa. */}
      <noscript>
        <style>{'.chat, .contato-globo { display: none; }'}</style>
        <div className="contato-sem-js"><Formulario servidor={servidor} /></div>
      </noscript>
    </main>
  );
}
