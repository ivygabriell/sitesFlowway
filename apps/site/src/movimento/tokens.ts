// Tokens de tempo e de curva da 02-site.md (identidadeFloway@ec93f7b). Todo tempo e toda curva do site vêm daqui;
// as mesmas variáveis existem em CSS (tokens.css), conferidas pelo teste movimento.test.ts.

// Durações, em segundos.
export const TEMPOS = {
  'tempo-piscar': 0.1,
  'tempo-rapido': 0.2,
  'tempo-curto': 0.3,
  'tempo-hover': 0.4,
  'tempo-esmaecer': 0.5,
  'tempo-transicao': 0.6,
  'tempo-digitar-curto': 0.6,
  'tempo-lista': 0.7,
  'tempo-cabecalho': 0.8,
  'tempo-curvar': 0.8,
  'tempo-glitch': 1,
  'tempo-selo': 1,
  'tempo-linha': 1,
  'tempo-cubo-celular': 1,
  'tempo-digitar-frase': 1.2,
  'tempo-vidro': 1.4,
  'tempo-circulo': 1.5,
  'tempo-filme-minimo': 1.6,
  'tempo-ponto-relogio': 1.6,
  'tempo-vidro-principal': 1.8,
  'tempo-planos': 2,
  'tempo-fitas': 2,
  'tempo-palavras-cubo': 12,
  'tempo-faixas': 200,
  'tempo-scrub': 1,
} as const;

// Atrasos e espaçamentos entre animações, em segundos.
export const INTERVALOS = {
  'intervalo-minimo': 0.01,
  'intervalo-curto': 0.1,
  'intervalo-seguir': 0.15,
  'intervalo-lista': 0.2,
  'intervalo-meio': 0.5,
  'intervalo-cabecalho': 1,
  'intervalo-glitch': 1.2,
  'intervalo-intro': 1.5,
  'intervalo-palavras-cubo': 2.4,
} as const;

// Curvas com o nome do GSAP ou a função do CSS.
export const CURVAS = {
  'curva-linear': 'none',
  'curva-padrao': 'power1.out',
  'curva-suave': 'power1.inOut',
  'curva-giro': 'power2.inOut',
  'curva-saida': 'power2.out',
  'curva-entrada': 'power1.in',
  'curva-fitas': 'power3.in',
  'curva-linha': 'power4.inOut',
  'curva-circulo': 'expoScale(3, 1)',
  'curva-cabecalho': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  'curva-hover': 'cubic-bezier(0.25, 0.1, 0.25, 1)',
  'curva-piscar': 'steps(1)',
} as const;

export type NomeDoTempo = keyof typeof TEMPOS;

export const tempo = (nome: NomeDoTempo): number => TEMPOS[nome];
