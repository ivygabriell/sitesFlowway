'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { Idioma } from '@/conteudo/textos';

// A língua da página, dada pela casca, para nenhuma seção precisar receber `idioma` por props.
const Contexto = createContext<Idioma>('pt');

export function ProvedorIdioma({ idioma, children }: { idioma: Idioma; children: ReactNode }) {
  return <Contexto.Provider value={idioma}>{children}</Contexto.Provider>;
}

export const useIdioma = () => useContext(Contexto);
