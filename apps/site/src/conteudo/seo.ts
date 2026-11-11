import type { Pagina } from '@/lib/idioma';
import { pendente, type Texto, type Textos } from './textos';

// Títulos com até 60 caracteres e descrições com até 155 (02-site, "Buscadores"). Os da 02-site falam dos
// nichos, que a spec tirou do foco; por isso ficam pendentes até C2, exceto os títulos que não citam nicho.
export const seo = {
  inicio: {
    titulo: { pt: 'Floway', en: 'Floway' },
    descricao: pendente('descrição da Início, até 155 caracteres'),
  },
  trabalhos: { titulo: { pt: 'Trabalhos · Floway', en: 'Work · Floway' }, descricao: pendente('descrição de Trabalhos, até 155 caracteres') },
  contato: { titulo: { pt: 'Contato · Floway', en: 'Contact · Floway' }, descricao: pendente('descrição de Contato, até 155 caracteres') },
  privacidade: { titulo: pendente('título de Privacidade, até 60 caracteres'), descricao: pendente('descrição de Privacidade, até 155 caracteres') },
} as const satisfies Record<Pagina, { titulo: Texto; descricao: Texto }> & Textos;
