import type { Textos } from './textos';

// Textos da abertura e do hero da Início (spec 4.3). Trechos e intro escolhidos por Rafael em 2026-11-10; o inglês
// segue pendente (sem `en`, /en mostra o português e a trava aponta).
const inicioTopo = {
  trechos: [{ pt: 'Estratégia.' }, { pt: 'Design.' }, { pt: 'Tecnologia.' }],
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
  intro: { pt: 'Sites, landing pages e automações para empresas que querem crescer com tecnologia.' },
  rolar: { pt: 'Role para baixo', en: 'Scroll down' },
} as const satisfies Textos;

export { inicioTopo as 'inicio-topo' };
