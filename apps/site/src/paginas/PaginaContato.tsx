'use client';

import { useScrollRig } from '@14islands/r3f-scroll-rig';
import { useEffect, useState } from 'react';
import { ConversaGuiada } from '@/componentes/contato/ConversaGuiada';
import { ConversaIA } from '@/componentes/contato/ConversaIA';
import type { ContatoServidorDTO } from '@/lib/contato/servidor';
import type { Pedido } from '@/lib/pedidoDeContato';
import { Formulario } from '@/componentes/contato/Formulario';
import { contato } from '@/conteudo/contato';
import { t } from '@/conteudo/textos';
import { useIdioma } from '@/lib/useIdioma';
import '@/componentes/contato/estilo.css';

// A página controla a composição B; a esfera apenas recebe os estados verificados.
export function PaginaContato({ estado, servidor }: { estado?: string; servidor?: ContatoServidorDTO }) {
  const idioma = useIdioma();
  const [enviado, setEnviado] = useState(false);
  const [pronto, setPronto] = useState(false);
  const [pedido, setPedido] = useState<Pedido>({ nome: '', empresa: '', contato: '', mensagem: '' });
  const Conversa = servidor?.conversaDisponivel ? ConversaIA : ConversaGuiada;
  const { reflow } = useScrollRig();
  // O ScrollRig precisa reler a posição da esfera quando a conversa cresce.
  useEffect(() => reflow(), [pronto, enviado, reflow]);
  void estado;
  return (
    <main className="pagina-contato" data-fundo="claro" id="topo">
      <h1 className="frase-contato">{t(contato.frase, idioma)}</h1>
      <div className="pagina-contato-corpo contato-guiada-corpo">
        {/* Com o Gemini configurado, a conversa é com a IA; sem ele, segue o roteiro fixo de perguntas. */}
        <Conversa aoConcluir={p => { setPedido(p); setPronto(true); }} aoEditar={() => setPronto(false)}>
          {pronto ? <Formulario key={JSON.stringify(pedido)} servidor={servidor} pedido={pedido} revisarAgora semResumo aoEnviar={() => setEnviado(true)} /> : undefined}
        </Conversa>
        {/* Sem JavaScript a conversa não anda: o formulário simples só existe para esse caso, nunca atrás da conversa. */}
        <noscript><Formulario servidor={servidor} /></noscript>
      </div>
    </main>
  );
}
