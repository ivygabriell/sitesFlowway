'use client';

import { useState } from 'react';
import { Formulario } from '@/componentes/contato/Formulario';
import { Rodape } from '@/componentes/contato/Rodape';
import { EsferaDeLetras } from '@/compartilhados/esfera/EsferaDeLetras';
import { contato } from '@/conteudo/contato';
import { t } from '@/conteudo/textos';
import { useIdioma } from '@/lib/useIdioma';
import { alvoDoSimbolo } from '@/marca/amostrar';
import '@/componentes/contato/estilo.css';

// A página de contato (spec 4.6, protótipo 12, disposição B aberta): frase, círculo que encolhe na entrada,
// formulário à esquerda, esfera à direita e rodapé. A conversa com IA entra na etapa própria.
export function PaginaContato({ estado }: { estado?: string }) {
  const idioma = useIdioma();
  const [enviado, setEnviado] = useState(false);
  return (
    <main className="pagina-contato" data-fundo="claro" id="topo">
      <h1 className="frase-contato">{t(contato.frase, idioma)}</h1>
      <div className="pagina-contato-corpo">
        <Formulario aoEnviar={() => setEnviado(true)} estadoInicial={estado === 'enviado' || estado === 'falha' ? estado : undefined} />
        <EsferaDeLetras alvo={alvoDoSimbolo} formarAlvo={enviado} />
      </div>
      <Rodape naPaginaDeContato />
      <div className="circulo-escuro" aria-hidden="true" />
    </main>
  );
}
