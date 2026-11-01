import type { Textos } from './textos';

// Lençol "(O que entregamos)" da Início (spec 4.3). A lista é a oferta: um item novo é só mais uma linha aqui.
// O inglês só foi aprovado para o título: sem `en`, a página em /en mostra o português, e a trava de publicação aponta cada texto.
const inicioLencol = {
  // O título partido pela linha que cresce: "(O que" ——— "entregamos)".
  titulo: [
    { pt: '(O que', en: '(What we' },
    { pt: 'entregamos)', en: 'deliver)' },
  ],
  frases: [
    { pt: 'Do primeiro esboço à automação rodando, cuidamos de cada etapa.' },
    { pt: 'Cada entrega nasce para resolver um problema real do seu negócio.' },
  ],
  itens: [
    { pt: 'Estratégia digital' },
    { pt: 'Design de interfaces' },
    { pt: 'Desenvolvimento web' },
    { pt: 'Inteligência artificial' },
    { pt: 'Automações e integrações' },
    { pt: 'Experiências digitais' },
    { pt: 'Manutenção e evolução' },
  ],
} as const satisfies Textos;

// O índice (tests/unit/indice.test.ts) pede o export com o nome do arquivo.
export { inicioLencol as 'inicio-lencol' };
