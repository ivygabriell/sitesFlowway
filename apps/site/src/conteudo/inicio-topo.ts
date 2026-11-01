import { pendente, type Textos } from './textos';

// Textos da abertura e do hero da Início (spec 4.3). Os trechos e a intro são de C2.
const inicioTopo = {
  trechos: [pendente('trecho 1 da abertura'), pendente('trecho 2'), pendente('trecho 3')],
  faixas: [
    [
      { pt: 'Landing pages' },
      { pt: 'Sites institucionais' },
      { pt: 'Automações' },
      { pt: 'Integrações' },
      { pt: 'Interface' },
      { pt: 'Desenvolvimento web' },
      { pt: 'Tecnologia B2B' },
      { pt: '(01)', en: '(01)' },
      { pt: 'Feito para o seu negócio' },
    ],
    [
      { pt: 'Branding' },
      { pt: 'Autoridade' },
      { pt: 'Posicionamento' },
      { pt: 'Credibilidade' },
      { pt: 'Presença digital' },
      { pt: 'Percepção de valor' },
      { pt: 'Diferenciação' },
      { pt: '(02)', en: '(02)' },
      { pt: 'Experiência premium' },
      { pt: 'Confiança' },
    ],
  ],
  intro: pendente('intro do hero, até 30 palavras'),
  rolar: { pt: 'Role para baixo', en: 'Scroll down' },
} as const satisfies Textos;

export { inicioTopo as 'inicio-topo' };
