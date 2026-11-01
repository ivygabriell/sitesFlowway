import type { Metadata } from 'next';
import { pendente, registrar, t, type Idioma, type Texto } from '@/conteudo/textos';
import { rota, type Pagina } from '@/lib/idioma';

// Só vira true na publicação (C5), com as quatro condições da 02-site cumpridas.
export const INDEXAR = false;

// Títulos com até 60 caracteres e descrições com até 155 (02-site, "Buscadores"). Os da 02-site falam dos
// nichos, que a spec tirou do foco; por isso ficam pendentes até C2, exceto os títulos que não citam nicho.
export const paginas = registrar('seo', {
  inicio: {
    titulo: pendente('título da Início, até 60 caracteres, sem nichos'),
    descricao: pendente('descrição da Início, até 155 caracteres'),
  },
  trabalhos: { titulo: { pt: 'Trabalhos · Floway' }, descricao: pendente('descrição de Trabalhos, até 155 caracteres') },
  contato: { titulo: { pt: 'Contato · Floway' }, descricao: pendente('descrição de Contato, até 155 caracteres') },
  privacidade: { titulo: pendente('título de Privacidade, até 60 caracteres'), descricao: pendente('descrição de Privacidade, até 155 caracteres') },
} satisfies Record<Pagina, { titulo: Texto; descricao: Texto }>);

export function metadadosDaPagina(pagina: Pagina, idioma: Idioma): Metadata {
  const { titulo, descricao } = paginas[pagina];
  return {
    title: t(titulo, idioma),
    description: t(descricao, idioma),
    robots: INDEXAR ? { index: true, follow: true } : { index: false, follow: false },
    alternates: { languages: { 'pt-BR': rota(pagina, 'pt'), en: rota(pagina, 'en'), 'x-default': rota(pagina, 'pt') } },
  };
}
