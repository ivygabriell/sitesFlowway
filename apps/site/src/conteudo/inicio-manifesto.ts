import type { Textos } from './textos';

// Manifesto, cubo da marca e "(O que é único)" da Início (spec 4.3). O inglês ainda não foi aprovado:
// sem `en`, a página em /en mostra o português, e a trava de publicação aponta cada texto.
const inicioManifesto = {
  rotulo: { pt: '(Quem somos)', en: '(Who we are)' },
  // Um vão entre cada parte.
  partes: [
    { pt: 'A Floway transforma tecnologia em vantagem para o seu negócio.' },
    { pt: 'Estratégia, branding e inteligência artificial' },
    { pt: 'em soluções que simplificam processos' },
    { pt: 'e impulsionam negócios.' },
  ],
  apoio: {
    pt: 'Boas experiências digitais não acontecem por acaso. Cada interação é uma oportunidade de aproximar marcas e pessoas. Na Floway, exploramos novas possibilidades da tecnologia e da inteligência artificial para criar experiências intuitivas, marcantes e feitas para gerar impacto.',
  },
  legenda: { pt: 'Experiências digitais que transformam a forma de conectar' },
  unico: {
    rotulo: { pt: '(O que é único)' },
    paragrafos: [
      {
        pt: 'Cada marca carrega uma identidade, uma visão e uma história própria. Nosso trabalho é interpretar esses elementos sob diferentes perspectivas, explorando a criatividade para construir uma presença digital autêntica, capaz de despertar interesse e estabelecer conexões duradouras.',
      },
      {
        pt: 'Para dar vida a essa visão, combinamos tecnologia, inteligência artificial e atenção aos detalhes. Cada escolha tem um propósito: tornar a navegação mais intuitiva, valorizar a comunicação e transformar cada ponto de contato em algo relevante e memorável.',
      },
    ],
  },
  palavraCubo: { pt: 'FLOWAY', en: 'FLOWAY' },
} as const satisfies Textos;

// O índice (tests/unit/indice.test.ts) pede o export com o nome do arquivo.
export { inicioManifesto as 'inicio-manifesto' };
