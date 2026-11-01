import { type Idioma, type Texto, type Textos, pendente, t } from './textos';

// Trabalhos em destaque da Início (spec 4.3 e 5). Cada trabalho com case pronto entra em listaDeTrabalhos;
// enquanto ela estiver vazia, a Início mostra os marcadores de construção ("Conceito · …"), que a trava de
// publicação (tests/publicacao/trava.test.ts) não deixa ir ao ar.

export type Oferta = 'landing-page' | 'site-institucional' | 'automacao';

export type Trabalho = {
  slug: string;
  nome: Texto;
  setor: Texto;
  mesAno: Texto;
  oferta: Oferta;
  conceito: boolean;
  capa?: string; // imagem da capa: liga o ASCII, o hover e a prévia
  previa?: string; // vídeo curto da prévia (hover)
};

export const NOMES_OFERTA = {
  'landing-page': { pt: 'Landing page' },
  'site-institucional': { pt: 'Site institucional' },
  automacao: { pt: 'Automação' },
} as const satisfies Record<Oferta, Texto>;

// Árvore de textos da seção (o índice pede o export com o nome do arquivo). O inglês das ofertas e do
// rótulo "Conceito" ainda não foi aprovado: sem `en`, /en mostra o português e a trava aponta cada um.
const trabalhos = {
  rotulo: { pt: '(Trabalhos)', en: '(Work)' },
  ofertas: NOMES_OFERTA,
  conceito: { pt: 'Conceito' },
} as const satisfies Textos;

// A lista real, que começa vazia.
export const listaDeTrabalhos: Trabalho[] = [];

// Marcadores de construção: as ofertas do protótipo 05, sem data nem setor (a spec não fixa).
const marcador = (n: number, oferta: Oferta): Trabalho => ({
  slug: `marcador-${n}`,
  nome: { pt: `Conceito · ${NOMES_OFERTA[oferta].pt}` },
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
