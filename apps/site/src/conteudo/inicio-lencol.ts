import type { Textos } from './textos';

// Lençol "(O que entregamos)" da Início (spec 4.3). A lista é a oferta: um item novo é só mais uma linha aqui.
const inicioLencol = {
  // O título partido pela linha que cresce: "(O que" ——— "entregamos)".
  titulo: [
    { pt: '(O que', en: '(What we' },
    { pt: 'entregamos)', en: 'deliver)' },
  ],
  frases: [
    { pt: 'Do primeiro esboço à automação rodando, cuidamos de cada etapa.', en: 'From the first sketch to live automation, we handle every step.' },
    { pt: 'Cada entrega nasce para resolver um problema real do seu negócio.', en: 'Every delivery is built to solve a real problem for your business.' },
  ],
  itens: [
    { pt: 'Estratégia digital', en: 'Digital strategy' },
    { pt: 'Design de interfaces', en: 'Interface design' },
    { pt: 'Desenvolvimento web', en: 'Web development' },
    { pt: 'Inteligência artificial', en: 'Artificial intelligence' },
    { pt: 'Automações e integrações', en: 'Automation and integrations' },
    { pt: 'Experiências digitais', en: 'Digital experiences' },
    { pt: 'Manutenção e evolução', en: 'Maintenance and growth' },
  ],
} as const satisfies Textos;

// O índice (tests/unit/indice.test.ts) pede o export com o nome do arquivo.
export { inicioLencol as 'inicio-lencol' };
