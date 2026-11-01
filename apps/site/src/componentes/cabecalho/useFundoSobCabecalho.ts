'use client';

import { useEffect, useState } from 'react';

export type Fundo = 'claro' | 'escuro';

// Altura da linha do cabeçalho onde o fundo é lido (o ponto do relógio fica nela).
const Y = 20;

// O fundo da seção que está sob o cabeçalho. Lê pela caixa das seções com [data-fundo], e não por
// elementFromPoint: o hero e o contato têm pointer-events: none e não seriam achados.
export function fundoEm(y: number): Fundo {
  for (const el of document.querySelectorAll<HTMLElement>('[data-fundo]')) {
    const caixa = el.getBoundingClientRect();
    if (caixa.top <= y && caixa.bottom > y) return el.dataset.fundo === 'escuro' ? 'escuro' : 'claro';
  }
  return 'claro';
}

export function useFundoSobCabecalho(): Fundo {
  const [fundo, setFundo] = useState<Fundo>('claro');
  useEffect(() => {
    let quadro = 0;
    const ler = () => {
      cancelAnimationFrame(quadro);
      quadro = requestAnimationFrame(() => setFundo(fundoEm(Y)));
    };
    ler();
    window.addEventListener('scroll', ler, { passive: true });
    window.addEventListener('resize', ler);
    return () => {
      cancelAnimationFrame(quadro);
      window.removeEventListener('scroll', ler);
      window.removeEventListener('resize', ler);
    };
  }, []);
  return fundo;
}
