import { type Idioma, type Texto, type Textos, pendente, t } from './textos';

// Trabalhos em destaque da Início (spec 4.3 e 5). Cada trabalho com case pronto entra em listaDeTrabalhos;
// se ela ficar vazia, a Início mostra os marcadores de construção ("Conceito · …"), que a trava de
// publicação (tests/publicacao/trava.test.ts) não deixa ir ao ar.

export type Oferta = 'landing-page' | 'site-institucional' | 'automacao';

export type Trabalho = {
  slug: string;
  nome: Texto;
  setor: Texto;
  mesAno: Texto;
  oferta: Oferta;
  conceito: boolean;
  capa?: string; // imagem da capa: liga o ASCII e o hover
  site?: string; // o site do conceito, que o clique no cartão abre numa aba nova
};

export const NOMES_OFERTA = {
  'landing-page': { pt: 'Landing page', en: 'Landing page' },
  'site-institucional': { pt: 'Site institucional', en: 'Company website' },
  automacao: { pt: 'Automação', en: 'Automation' },
} as const satisfies Record<Oferta, Texto>;

// A lista real: as peças conceito do repositório de Sites (spec 2026-11-09, P1), nomeadas pelo setor, sem a
// marca fictícia. Capa capturada do build de cada peça em 1280×1894 e reduzida a 730×1080; mês e ano do primeiro
// commit da pasta da peça. O site é o build da peça (repositório CreateHubAI/sitesOfertas) com a base /conceitos/<slug>/, em
// public/; o caminho leva o index.html porque o Next não serve o índice de uma pasta.
const peca = (slug: string, nome: Texto, setor: Texto, oferta: Oferta): Trabalho => ({
  slug,
  nome,
  setor,
  mesAno: { pt: 'Novembro 2026', en: 'November 2026' },
  oferta,
  conceito: true,
  capa: `/trabalhos/${slug}/capa.webp`,
  site: `/conceitos/${slug}/index.html`,
});

export const listaDeTrabalhos: Trabalho[] = [
  peca('ferramenta-criativa', { pt: 'Ferramenta criativa', en: 'Creative tool' }, { pt: 'Tecnologia', en: 'Technology' }, 'landing-page'),
  peca('companhia-aerea', { pt: 'Companhia aérea', en: 'Airline' }, { pt: 'Aviação', en: 'Aviation' }, 'site-institucional'),
  peca('banco-digital', { pt: 'Banco digital', en: 'Digital bank' }, { pt: 'Finanças', en: 'Finance' }, 'landing-page'),
  peca('estudio-de-marca', { pt: 'Estúdio de marca', en: 'Brand studio' }, { pt: 'Design', en: 'Design' }, 'site-institucional'),
  peca('plataforma-de-deploy', { pt: 'Plataforma de deploy', en: 'Deploy platform' }, { pt: 'Tecnologia', en: 'Technology' }, 'landing-page'),
];

// Árvore de textos da seção (o índice pede o export com o nome do arquivo).
const trabalhos = {
  rotulo: { pt: '(Trabalhos)', en: '(Work)' },
  ofertas: NOMES_OFERTA,
  conceito: { pt: 'Conceito', en: 'Concept' },
  lista: listaDeTrabalhos.map(({ nome, setor, mesAno }) => ({ nome, setor, mesAno })),
} as const satisfies Textos;

// Marcadores de construção: as ofertas do protótipo 05, sem data nem setor (a spec não fixa).
const marcador = (n: number, oferta: Oferta): Trabalho => ({
  slug: `marcador-${n}`,
  nome: { pt: `Conceito · ${NOMES_OFERTA[oferta].pt}`, en: `Concept · ${NOMES_OFERTA[oferta].en}` },
  setor: pendente('setor do trabalho'),
  mesAno: pendente('mês e ano do trabalho'),
  oferta,
  conceito: true,
});

export const marcadoresDeConstrucao: Trabalho[] = [
  marcador(1, 'site-institucional'),
  marcador(2, 'landing-page'),
  marcador(3, 'automacao'),
  marcador(4, 'site-institucional'),
];

export const trabalhosVisiveis = (lista: Trabalho[] = listaDeTrabalhos): Trabalho[] => (lista.length ? lista : marcadoresDeConstrucao);

// Linha de informações do cartão: mês e ano / oferta · Conceito.
export function linhaDoCartao(trabalho: Trabalho, idioma: Idioma): [string, string] {
  const oferta = t(NOMES_OFERTA[trabalho.oferta], idioma);
  return [t(trabalho.mesAno, idioma), trabalho.conceito ? `${oferta} · ${t(trabalhos.conceito, idioma)}` : oferta];
}

// O índice (tests/unit/indice.test.ts) pede o export com o nome do arquivo.
export { trabalhos };
