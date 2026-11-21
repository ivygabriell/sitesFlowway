'use client';

import { SmoothScrollbar } from '@14islands/r3f-scroll-rig';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ScrollTrigger } from '@/gsap';
import { useAbertura } from '@/estado/abertura';
import { prefereMenosMovimento } from '@/lib/ambiente';
import { paginaDoCaminho } from '@/lib/idioma';
import { guardarRolagem as guardar, marcarVolta, mostrarPagina, posicaoGuardada, voltouNestaCarga } from '@/lib/restauracao';

// Depois de a hero montar a saída (1 s) e os gatilhos recalcularem: antes disso, a altura dos pins ainda não existe.
const ESPERA_RESTAURAR = 1300;
const TENTATIVAS = 24;
let montou = false;

// Com scrollRestoration manual e pins montados depois, quem recoloca o lugar ao voltar (navegador) é o site.
function useRestaurarRolagem() {
  const caminho = usePathname() ?? '/';
  useEffect(() => {
    // O voltar (decidido no head) vale só para a carga do documento, não para as trocas de página seguintes.
    const primeira = !montou;
    montou = true;
    // Só o voltar do navegador devolve ao lugar; recarregar começa do topo (Rafael, 2026-11-09).
    const restaurar = primeira && voltouNestaCarga();
    const destino = restaurar ? posicaoGuardada(caminho) : 0;
    const aoRolar = () => guardar(caminho);
    // Do cache de ida e volta a página voltaria com o círculo da transição cobrindo a tela: carrega de novo, marcando
    // que é um voltar (a carga nova é do tipo reload, que sozinha iria ao topo).
    const aoMostrar = (e: PageTransitionEvent) => {
      if (!e.persisted) return;
      marcarVolta();
      window.location.reload();
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

// Lenis com os valores padrão (rolagem lenta e limpa), desligado só para quem pede menos movimento. No celular também
// (syncTouch): com o scroll nativo, os pins e o canvas andavam separados da rolagem e travavam (versão B, 2026-11-11).
export function Rolagem() {
  const { terminou } = useAbertura();
  // Só a Início tem abertura (e só ela chama terminar): nas outras páginas a rolagem começa livre (issue #15).
  const naInicio = paginaDoCaminho(usePathname() ?? '/') === 'inicio';
  const travada = !terminou && naInicio;
  const [ligada, setLigada] = useState(false);
  useRestaurarRolagem();

  useEffect(() => {
    setLigada(!prefereMenosMovimento());
  }, []);

  return (
    <SmoothScrollbar enabled={ligada} locked={travada} scrollRestoration="manual" config={{ syncTouch: true }} onScroll={() => ScrollTrigger.update()} />
  );
}
