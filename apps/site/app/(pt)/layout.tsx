import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Raiz } from '@/componentes/casca/Raiz';

// Padrão de toda página desta língua: fora dos buscadores até a publicação (C5).
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function Layout({ children }: { children: ReactNode }) {
  return <Raiz idioma="pt">{children}</Raiz>;
}
