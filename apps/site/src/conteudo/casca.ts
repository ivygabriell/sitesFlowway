import { pendente, type Textos } from './textos';

// Textos de todas as páginas: cabeçalho, menu e selo (spec 4.2).
export const casca = {
  nome: { pt: '©FLOWAY', en: '©FLOWAY' },
  descritor: pendente('descritor do cabeçalho, até 3 palavras'),
  menu: {
    trabalhos: { pt: 'Trabalhos', en: 'Work' },
    contato: { pt: 'Contato', en: 'Contact' },
  },
  voltar: { pt: 'Voltar ao início', en: 'Back to home' },
  selo: { pt: 'Iniciar projeto', en: 'Start a project' },
} as const satisfies Textos;
