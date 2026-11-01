'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { gsap } from '@/gsap';
import { prefereMenosMovimento } from '@/lib/ambiente';
import { marcarModo } from '@/lib/webgl';
import { CURVAS, INTERVALOS, tempo } from '@/movimento/tokens';
import { corDaTransicao, destinoDaTransicao, ehCliqueSimples } from './cliqueSimples';
import './estilo.css';

const SUAVIZAR_TRAVADAS = [500, 33] as const;

// Transição de página (02-site): um círculo cresce do centro, logo abaixo do cabeçalho, e só então a página troca.
// Com movimento reduzido não há círculo. Também marca o modo de exibição no <html>.
export function Transicao() {
  const router = useRouter();
  const caminho = usePathname() ?? '/';
  const [cor, setCor] = useState<string | null>(null);
  const circulo = useRef<HTMLDivElement>(null);
  const indo = useRef(false);
  const caminhoAtual = useRef(caminho);
  caminhoAtual.current = caminho;

  useEffect(() => {
    marcarModo();
  }, []);

  // Na página nova, o círculo some de uma vez depois de intervalo-curto.
  useEffect(() => {
    if (!indo.current) return;
    const id = window.setTimeout(() => {
      indo.current = false;
      setCor(null);
    }, INTERVALOS['intervalo-curto'] * 1000);
    return () => clearTimeout(id);
  }, [caminho]);

  useEffect(() => {
    const aoClicar = (e: MouseEvent) => {
      if (e.defaultPrevented || !ehCliqueSimples(e) || indo.current) return;
      const a = (e.target as Element | null)?.closest?.('a');
      if (!a) return;
      const destino = destinoDaTransicao(a, caminhoAtual.current);
      if (!destino) return;
      e.preventDefault();
      if (prefereMenosMovimento()) {
        router.push(destino);
        return;
      }
      indo.current = true;
      setCor(corDaTransicao(destino));
      requestAnimationFrame(() => {
        // Segue o relógio de verdade, como a abertura: sem GPU, a suavização de travadas arrastaria o círculo.
        gsap.ticker.lagSmoothing(0);
        gsap.fromTo(
          circulo.current,
          { scale: 0 },
          {
            scale: 1,
            duration: tempo('tempo-transicao'),
            ease: CURVAS['curva-padrao'],
            onComplete: () => {
              gsap.ticker.lagSmoothing(...SUAVIZAR_TRAVADAS);
              router.push(destino);
            },
          },
        );
      });
    };
    document.addEventListener('click', aoClicar);
    return () => document.removeEventListener('click', aoClicar);
  }, [router]);

  if (!cor) return null;
  return <div ref={circulo} className="transicao" style={{ background: cor }} aria-hidden="true" />;
}
