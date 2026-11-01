'use client';

import { UseCanvas, useScrollRig } from '@14islands/r3f-scroll-rig';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ehCelular, prefereMenosMovimento } from '@/lib/ambiente';
import type { AlvoDaEsfera } from '@/marca/amostrar';
import { semente } from '@/marca/amostrar';
import { modoDeExibicao, type ModoDeExibicao } from '@/movimento/modo';
import { CenaEsfera } from './CenaEsfera';
import { atributosDaEsfera, QUANTIDADE } from './geometria';
import './estilo.css';

// O alvo da morfose, pronto: recebe a quantidade de letras e devolve as posições e o azul de cada uma
// (por exemplo, alvoDoSimbolo, com cache no módulo). O shader não sabe o que é o alvo: o "404" entra com outro.
// Deve manter a mesma referência entre renders (função de módulo ou useCallback): uma arrow inline recria os atributos.
export type FabricaDoAlvo = (n: number) => AlvoDaEsfera;

// Distância (em altura da tela) em que a esfera começa a se preparar: amostra o alvo e compila o shader.
const ANTECEDENCIA = '100% 0px';

// Esfera de letras FLOWAY que forma o alvo (o F do símbolo no contato). Acompanha a div.esfera com um <UseCanvas>;
// sem WebGL, fica só a div, sem nada desenhado. Com `fixa`, a div é position: sticky e a cena acompanha a parte presa
// (quem usa dá o sticky e top em px no CSS); sem esse CSS, usa ScrollScene. A prop alvo deve ser uma fábrica estável.
export function EsferaDeLetras({ alvo, className, fixa = false }: { alvo: FabricaDoAlvo; className?: string; fixa?: boolean }) {
  const { isCanvasAvailable } = useScrollRig();
  const ref = useRef<HTMLDivElement>(null);
  const [modo, setModo] = useState<ModoDeExibicao | null>(null);
  const [celular, setCelular] = useState(false);
  const [perto, setPerto] = useState(false);

  // O modo decide o movimento; a largura decide a quantidade (o celular com movimento reduzido também fica com 8 mil).
  useEffect(() => {
    setModo(modoDeExibicao(window.innerWidth, prefereMenosMovimento(), true));
    setCelular(ehCelular(window.innerWidth));
  }, []);

  // Só amostra e monta a cena quando a esfera se aproxima da tela.
  useEffect(() => {
    const el = ref.current;
    if (!isCanvasAvailable || !el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setPerto(true);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        setPerto(true);
        io.disconnect();
      },
      { rootMargin: ANTECEDENCIA },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [isCanvasAvailable]);

  const atributos = useMemo(() => {
    if (!perto || !modo || !isCanvasAvailable) return null;
    const n = celular ? QUANTIDADE.celular : QUANTIDADE.desktop;
    return atributosDaEsfera(n, alvo(n), semente(n));
  }, [perto, modo, celular, isCanvasAvailable, alvo]);

  return (
    <div ref={ref} className={className ? `esfera ${className}` : 'esfera'} aria-hidden="true">
      {atributos && modo && (
        <UseCanvas atributos={atributos} modo={modo} fixa={fixa}>
          <CenaEsfera track={ref as React.MutableRefObject<HTMLElement>} atributos={atributos} modo={modo} fixa={fixa} />
        </UseCanvas>
      )}
    </div>
  );
}
