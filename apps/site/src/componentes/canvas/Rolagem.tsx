'use client';

import { SmoothScrollbar } from '@14islands/r3f-scroll-rig';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ScrollTrigger } from '@/gsap';
import { useAbertura } from '@/estado/abertura';
import { ehCelular, prefereMenosMovimento } from '@/lib/ambiente';
import { guardarRolagem as guardar, mostrarPagina, posicaoGuardada } from '@/lib/restauracao';

// Depois de a hero montar a saída (1 s) e os gatilhos recalcularem: antes disso, a altura dos pins ainda não existe.
const ESPERA_RESTAURAR = 1300;
const TENTATIVAS = 24;
let montou = false;

// Com scrollRestoration manual e pins montados depois, quem recoloca o lugar ao voltar (navegador) é o site.
function useRestaurarRolagem() {
  const caminho = usePathname() ?? '/';
  useEffect(() => {
    const [nav] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    // O tipo da navegação vale só para a carga do documento, não para as trocas de página seguintes.
    const primeira = !montou;
    montou = true;
    // Só o voltar do navegador devolve ao lugar; recarregar começa do topo (Rafael, 2026-11-09).
    const restaurar = primeira && nav?.type === 'back_forward';
    const destino = restaurar ? posicaoGuardada(caminho) : 0;
    const aoRolar = () => guardar(caminho);
    // Do cache de ida e volta a página voltaria com o círculo da transição cobrindo a tela: carrega de novo.
    const aoMostrar = (e: PageTransitionEvent) => {
      if (e.persisted) window.location.reload();
    };
    const ligarGuarda = () => window.addEventListener('scroll', aoRolar, { passive: true });
    // Os pins ainda aumentam a página depois de montar: insiste até chegar, com teto, e para se a pessoa rolar.
    let tentativas: ReturnType<typeof setInterval> | undefined;
    // A página escondida pelo script do head (lib/restauracao) aparece quando a rolagem chega, ou quando a pessoa rola.
    const parar = () => {
      clearInterval(tentativas);
      window.removeEventListener('wheel', parar);
      window.removeEventListener('touchstart', parar);
      ligarGuarda();
      mostrarPagina();
    };
    const inicio = setTimeout(() => {
      if (!destino) {
        mostrarPagina();
        return ligarGuarda();
      }
      let resta = TENTATIVAS;
      window.addEventListener('wheel', parar, { passive: true });
      window.addEventListener('touchstart', parar, { passive: true });
      tentativas = setInterval(() => {
        window.scrollTo(0, destino);
        if (--resta === 0 || Math.abs(window.scrollY - destino) < 2) parar();
      }, 250);
    }, destino ? ESPERA_RESTAURAR : 0);
    window.addEventListener('pageshow', aoMostrar);
    return () => {
      clearTimeout(inicio);
      clearInterval(tentativas);
      window.removeEventListener('wheel', parar);
      window.removeEventListener('touchstart', parar);
      window.removeEventListener('scroll', aoRolar);
      window.removeEventListener('pageshow', aoMostrar);
    };
  }, [caminho]);
}

// Lenis com os valores padrão (rolagem lenta e limpa). Desligado no celular e para quem pede menos movimento.
export function Rolagem() {
  const { terminou } = useAbertura();
  const [ligada, setLigada] = useState(false);
  useRestaurarRolagem();

  useEffect(() => {
    setLigada(!ehCelular(window.innerWidth) && !prefereMenosMovimento());
  }, []);

  return (
    <SmoothScrollbar enabled={ligada} locked={!terminou} scrollRestoration="manual" config={{ syncTouch: true }} onScroll={() => ScrollTrigger.update()} />
  );
}
