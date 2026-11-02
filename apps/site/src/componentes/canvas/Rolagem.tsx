'use client';

import { SmoothScrollbar } from '@14islands/r3f-scroll-rig';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ScrollTrigger } from '@/gsap';
import { useAbertura } from '@/estado/abertura';
import { ehCelular, prefereMenosMovimento } from '@/lib/ambiente';

// Depois de a hero montar a saída (1 s) e os gatilhos recalcularem: antes disso, a altura dos pins ainda não existe.
const ESPERA_RESTAURAR = 1300;
const TENTATIVAS = 24;
const CHAVE = 'rolagem:';
let montou = false;

function guardar(caminho: string) {
  try {
    sessionStorage.setItem(CHAVE + caminho, String(window.scrollY));
  } catch {}
}

function posicaoGuardada(caminho: string) {
  try {
    return Number(sessionStorage.getItem(CHAVE + caminho)) || 0;
  } catch {
    return 0;
  }
}

// Com scrollRestoration manual e pins montados depois, quem recoloca o lugar ao recarregar ou voltar é o site.
function useRestaurarRolagem() {
  const caminho = usePathname() ?? '/';
  useEffect(() => {
    const [nav] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    // O tipo da navegação vale só para a carga do documento, não para as trocas de página seguintes.
    const primeira = !montou;
    montou = true;
    const restaurar = primeira && (nav?.type === 'reload' || nav?.type === 'back_forward');
    const destino = restaurar ? posicaoGuardada(caminho) : 0;
    const aoRolar = () => guardar(caminho);
    // Voltar ou avançar entre páginas recarrega o documento: remontadas no cliente, as timelines da Início recalculam
    // em série e o ScrollTrigger recoloca a rolagem num ponto errado, brigando com a restauração.
    const aoVoltar = () => {
      if (window.location.pathname !== caminho) window.location.reload();
    };
    const ligarGuarda = () => window.addEventListener('scroll', aoRolar, { passive: true });
    // Os pins ainda aumentam a página depois de montar: insiste até chegar, com teto, e para se a pessoa rolar.
    let tentativas: ReturnType<typeof setInterval> | undefined;
    const parar = () => {
      clearInterval(tentativas);
      window.removeEventListener('wheel', parar);
      window.removeEventListener('touchstart', parar);
      ligarGuarda();
    };
    const inicio = setTimeout(() => {
      if (!destino) return ligarGuarda();
      let resta = TENTATIVAS;
      window.addEventListener('wheel', parar, { passive: true });
      window.addEventListener('touchstart', parar, { passive: true });
      tentativas = setInterval(() => {
        window.scrollTo(0, destino);
        if (--resta === 0 || Math.abs(window.scrollY - destino) < 2) parar();
      }, 250);
    }, destino ? ESPERA_RESTAURAR : 0);
    // Na captura: o Next troca a página dentro do próprio popstate, antes de um ouvinte comum.
    window.addEventListener('popstate', aoVoltar, { capture: true });
    return () => {
      clearTimeout(inicio);
      clearInterval(tentativas);
      window.removeEventListener('wheel', parar);
      window.removeEventListener('touchstart', parar);
      window.removeEventListener('scroll', aoRolar);
      window.removeEventListener('popstate', aoVoltar, { capture: true });
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
