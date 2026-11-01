import type { Metadata } from 'next';
import { seo } from '@/conteudo/seo';
import { t, type Idioma } from '@/conteudo/textos';
import { rota, type Pagina } from '@/lib/idioma';

// Só vira true na publicação (C5), com as quatro condições da 02-site cumpridas.
export const INDEXAR = false;

const ROBOTS = INDEXAR ? { index: true, follow: true } : { index: false, follow: false };

// Padrão de toda página, inclusive a 404, usado pelos dois layouts raiz (via LayoutRaiz).
export const METADADOS_BASE: Metadata = { robots: ROBOTS };

export function metadadosDaPagina(pagina: Pagina, idioma: Idioma): Metadata {
  const { titulo, descricao } = seo[pagina];
  return {
    title: t(titulo, idioma),
    description: t(descricao, idioma),
    robots: ROBOTS,
    alternates: { languages: { 'pt-BR': rota(pagina, 'pt'), en: rota(pagina, 'en'), 'x-default': rota(pagina, 'pt') } },
  };
}
