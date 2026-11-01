import type { ReactNode } from 'react';
import { LayoutRaiz, METADADOS_BASE } from '@/componentes/casca/LayoutRaiz';

export const metadata = METADADOS_BASE;

export default function Layout({ children }: { children: ReactNode }) {
  return <LayoutRaiz idioma="en">{children}</LayoutRaiz>;
}
