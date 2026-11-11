'use client';

import { useScrollRig } from '@14islands/r3f-scroll-rig';
import { useEffect, useState } from 'react';
import { ConversaGuiada } from '@/componentes/contato/ConversaGuiada';
import type { ContatoServidorDTO } from '@/lib/contato/servidor';
import type { Pedido } from '@/lib/pedidoDeContato';
import { Formulario } from '@/componentes/contato/Formulario';
import { Rodape } from '@/componentes/contato/Rodape';
import { contato } from '@/conteudo/contato';
import { t } from '@/conteudo/textos';
import { useIdioma } from '@/lib/useIdioma';
import '@/componentes/contato/estilo.css';

// A página controla a composição B; a esfera apenas recebe os estados verificados.
export function PaginaContato({ estado, servidor }: { estado?: string; servidor?: ContatoServidorDTO }) {
  const idioma = useIdioma();
  const [enviado, setEnviado] = useState(false);
  const [comJS, setComJS] = useState(false);
  const [pronto, setPronto] = useState(false);
  const [rodada, setRodada] = useState(0);
  useEffect(() => setComJS(true), []);
  const [pedido, setPedido] = useState<Pedido>({ nome: '', empresa: '', contato: '', mensagem: '' });
  const { reflow } = useScrollRig();
  // O ScrollRig precisa reler a posição da esfera quando a conversa cresce.
  useEffect(() => reflow(), [pronto, enviado, reflow]);
  void estado;
  return (
    <main className="pagina-contato" data-fundo="claro" id="topo">
      <h1 className="frase-contato">{t(contato.frase, idioma)}</h1>
      <div className="pagina-contato-corpo contato-guiada-corpo">
        {comJS ? (
          <ConversaGuiada key={rodada} aoConcluir={p => { setPedido(p); setPronto(true); }}>
            {pronto && <div className="guiada-balao floway guiada-resumo"><Formulario servidor={servidor} pedido={pedido} revisarAgora aoAjustar={() => { setPronto(false); setRodada(r => r + 1); }} aoEnviar={() => setEnviado(true)} /></div>}
          </ConversaGuiada>
        ) : (
          <Formulario servidor={servidor} />
        )}
      </div>
      <Rodape naPaginaDeContato />
    </main>
  );
}
