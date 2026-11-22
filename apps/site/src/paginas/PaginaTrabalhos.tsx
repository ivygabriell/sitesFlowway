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
  // null até o modo ser decidido no cliente (o servidor não sabe largura nem WebGL).
  const [desktop, setDesktop] = useState<boolean | null>(null);
  const lista = trabalhosVisiveis();

  // A pilha só é decidida quando o canvas já está pronto: se até lá o CSS já devolveu a lista (hidratação depois de 4 s,
  // rede lenta), a lista fica nesta carga, sem tela dupla.
  useEffect(() => {
    if (modoDeExibicao(window.innerWidth, prefereMenosMovimento(), temWebgl()) !== 'desktop') return setDesktop(false);
    if (!isCanvasAvailable) return;
    // getComputedStyle, não checkVisibility: o Safari 17.0–17.3 aceita a consulta do CSS mas não tem checkVisibility.
    const lista = document.querySelector('.pagina-trabalhos-lista');
    setDesktop(!lista || getComputedStyle(lista).visibility !== 'visible');
  }, [isCanvasAvailable]);

  const podePilha = lista.length > 1 && lista.every((tr) => tr.capa && tr.site);
  const pilha = desktop === true && isCanvasAvailable && podePilha;
  // Issue #23: enquanto a pilha pode vir, a lista fica no HTML (sem JS, leitores) mas o CSS não a desenha no desktop.
  const esperando = desktop !== false && podePilha && !pilha;

  return (
    <main className={`pagina-trabalhos${pilha ? ' com-pilha' : ''}${esperando ? ' esperando-pilha' : ''}`} data-fundo="escuro" id="topo">
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
