'use client';

import { useScrollRig } from '@14islands/r3f-scroll-rig';
import { useEffect, useState } from 'react';
import { CartaoTrabalho } from '@/compartilhados/CartaoTrabalho';
import { PilhaTrabalhos } from '@/componentes/pilha-trabalhos/PilhaTrabalhos';
import { t } from '@/conteudo/textos';
import { trabalhos, trabalhosVisiveis } from '@/conteudo/trabalhos';
import { prefereMenosMovimento } from '@/lib/ambiente';
import { useIdioma } from '@/lib/useIdioma';
import { temWebgl } from '@/lib/webgl';
import { modoDeExibicao } from '@/movimento/modo';
import './trabalhos.css';

// Página Trabalhos (spec 4.4). No desktop com WebGL, a pilha de planos presa; no celular, com movimento reduzido e sem
// WebGL, a lista de cartões. Com um trabalho só, ou sem capa e site em todos, a página não prende: fica a lista.
export function PaginaTrabalhos() {
  const idioma = useIdioma();
  const { isCanvasAvailable } = useScrollRig();
  const [desktop, setDesktop] = useState(false);
  const lista = trabalhosVisiveis();

  useEffect(() => {
    setDesktop(modoDeExibicao(window.innerWidth, prefereMenosMovimento(), temWebgl()) === 'desktop');
  }, []);

  const pilha = desktop && isCanvasAvailable && lista.length > 1 && lista.every((tr) => tr.capa && tr.site);

  return (
    <main className={`pagina-trabalhos${pilha ? ' com-pilha' : ''}`} data-fundo="escuro" id="topo">
      <h1 className="pagina-trabalhos-titulo">{t(trabalhos.rotulo, idioma)}</h1>
      {pilha ? (
        <PilhaTrabalhos />
      ) : (
        <div className="pagina-trabalhos-lista">
          {lista.map((trabalho, i) => (
            <CartaoTrabalho key={trabalho.slug} trabalho={trabalho} idioma={idioma} indice={i} detalhes />
          ))}
        </div>
      )}
    </main>
  );
}
