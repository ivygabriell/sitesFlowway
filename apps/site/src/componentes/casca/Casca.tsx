import type { ReactNode } from 'react';
import '@14islands/r3f-scroll-rig/css';
import '../../../app/globals.css';
import { CabecalhoDaPagina } from '@/componentes/cabecalho/Cabecalho';
import { CanvasGlobal } from '@/componentes/canvas/CanvasGlobal';
import { RecarregarAoRedimensionar } from '@/componentes/canvas/RecarregarAoRedimensionar';
import { Rolagem } from '@/componentes/canvas/Rolagem';
import type { Idioma } from '@/conteudo/textos';
import { ProvedorAbertura } from '@/estado/abertura';

// Tudo o que fica dentro do <body> em todas as páginas, nas duas línguas.
export function Casca({ idioma, children }: { idioma: Idioma; children: ReactNode }) {
  return (
    <ProvedorAbertura>
      <Rolagem />
      <RecarregarAoRedimensionar />
      <CabecalhoDaPagina />
      {children}
      <CanvasGlobal />
    </ProvedorAbertura>
  );
}
