import type { Textos } from './textos';

// Manifesto, cubo da marca e "(O que é único)" da Início (spec 4.3).
const inicioManifesto = {
  rotulo: { pt: '(Quem somos)', en: '(Who we are)' },
  // Um vão entre cada parte.
  partes: [
    { pt: 'A Floway transforma tecnologia em vantagem para o seu negócio.', en: 'Floway turns technology into an edge for your business.' },
    { pt: 'Estratégia, branding e inteligência artificial', en: 'Strategy, branding and artificial intelligence' },
    { pt: 'em soluções que simplificam processos', en: 'shaped into solutions that simplify processes' },
    { pt: 'e impulsionam negócios.', en: 'and drive businesses forward.' },
  ],
  apoio: {
    pt: 'Boas experiências digitais não acontecem por acaso. Cada interação é uma oportunidade de aproximar marcas e pessoas. Na Floway, exploramos novas possibilidades da tecnologia e da inteligência artificial para criar experiências intuitivas, marcantes e feitas para gerar impacto.',
    en: 'Great digital experiences do not happen by chance. Every interaction is a chance to bring brands and people closer. At Floway, we explore new possibilities in technology and artificial intelligence to create experiences that are intuitive, striking and built to make an impact.',
  },
  legenda: { pt: 'Experiências digitais que transformam a forma de conectar', en: 'Digital experiences that change the way we connect' },
  unico: {
    rotulo: { pt: '(O que é único)', en: '(What makes us unique)' },
    paragrafos: [
      {
        pt: 'Cada marca carrega uma identidade, uma visão e uma história própria. Nosso trabalho é interpretar esses elementos sob diferentes perspectivas, explorando a criatividade para construir uma presença digital autêntica, capaz de despertar interesse e estabelecer conexões duradouras.',
        en: 'Every brand carries its own identity, vision and story. Our job is to read these elements from different angles, using creativity to build an authentic digital presence that sparks interest and creates lasting connections.',
      },
      {
        pt: 'Para dar vida a essa visão, combinamos tecnologia, inteligência artificial e atenção aos detalhes. Cada escolha tem um propósito: tornar a navegação mais intuitiva, valorizar a comunicação e transformar cada ponto de contato em algo relevante e memorável.',
        en: 'To bring that vision to life, we combine technology, artificial intelligence and attention to detail. Every choice has a purpose: making navigation more intuitive, strengthening communication and turning every touchpoint into something relevant and memorable.',
      },
    ],
  },
  palavraCubo: { pt: 'FLOWAY', en: 'FLOWAY' },
} as const satisfies Textos;

// O índice (tests/unit/indice.test.ts) pede o export com o nome do arquivo.
export { inicioManifesto as 'inicio-manifesto' };
