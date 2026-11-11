import type { Textos } from './textos';

// Textos da abertura e do hero da Início (spec 4.3). Trechos e intro escolhidos por Rafael em 2026-11-10.
const inicioTopo = {
  trechos: [{ pt: 'Estratégia.', en: 'Strategy.' }, { pt: 'Design.', en: 'Design.' }, { pt: 'Tecnologia.', en: 'Technology.' }],
  faixas: [
    [
      { pt: 'Landing pages', en: 'Landing pages' },
      { pt: 'Sites institucionais', en: 'Company websites' },
      { pt: 'Automações', en: 'Automation' },
      { pt: 'Integrações', en: 'Integrations' },
      { pt: 'Interface', en: 'Interface' },
      { pt: 'Desenvolvimento web', en: 'Web development' },
      { pt: 'Tecnologia B2B', en: 'B2B technology' },
      { pt: '(01)', en: '(01)' },
      { pt: 'Feito para o seu negócio', en: 'Built for your business' },
    ],
    [
      { pt: 'Branding', en: 'Branding' },
      { pt: 'Autoridade', en: 'Authority' },
      { pt: 'Posicionamento', en: 'Positioning' },
      { pt: 'Credibilidade', en: 'Credibility' },
      { pt: 'Presença digital', en: 'Digital presence' },
      { pt: 'Percepção de valor', en: 'Perceived value' },
      { pt: 'Diferenciação', en: 'Differentiation' },
      { pt: '(02)', en: '(02)' },
      { pt: 'Experiência premium', en: 'Premium experience' },
      { pt: 'Confiança', en: 'Trust' },
    ],
  ],
  intro: { pt: 'Sites, landing pages e automações para empresas que querem crescer com tecnologia.', en: 'Websites, landing pages and automation for companies that want to grow with technology.' },
  rolar: { pt: 'Role para baixo', en: 'Scroll down' },
} as const satisfies Textos;

export { inicioTopo as 'inicio-topo' };
