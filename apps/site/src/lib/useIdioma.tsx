'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import type { Idioma } from '@/conteudo/textos';

// A língua da página, dada pela casca, para nenhuma seção precisar receber `idioma` por props.
// A troca PT/EN muda só esta língua, sem recarregar nem remontar a página (Rafael, 2026-11-10: troca "clean").
const Contexto = createContext<Idioma>('pt');
const Troca = createContext<(idioma: Idioma) => void>(() => {});

export function ProvedorIdioma({ idioma, children }: { idioma: Idioma; children: ReactNode }) {
  const [atual, setAtual] = useState(idioma);
  return (
    <Troca.Provider value={setAtual}>
      <Contexto.Provider value={atual}>{children}</Contexto.Provider>
    </Troca.Provider>
  );
}

export const useIdioma = () => useContext(Contexto);
export const useTrocarIdioma = () => useContext(Troca);
