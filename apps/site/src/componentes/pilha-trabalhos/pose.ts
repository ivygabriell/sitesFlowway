// Medidas da pilha de planos (spec 4.4, valores medidos na referência): 13vh entre planos, 800 unidades de profundidade
// por trabalho, meia volta (π) por trabalho; na entrada, cada plano desce de 8 telas acima com 7,2π de giro a mais.
export const ESPACO = 0.13;
export const PROFUNDIDADE = 800;
export const QUEDA = 8;
export const GIRO_ENTRADA = 7.2 * Math.PI;
export const CURVA_MAXIMA = 200; // unidades de profundidade nas bordas do plano, com a curva cheia
export const VELOCIDADE_CHEIA = 25; // px por quadro em que a curva chega ao máximo

// Pose de um plano a `d` trabalhos do atual; `entrada` vai de 0 (no alto) a 1 (assentado). `altura` é a da tela.
export function posePlano(d: number, entrada: number, altura: number) {
  const falta = 1 - entrada;
  return { y: -d * ESPACO * altura + falta * QUEDA * altura, z: -Math.abs(d) * PROFUNDIDADE, giro: Math.PI * d + falta * GIRO_ENTRADA };
}

// Fração da curva (0 a 1) pela velocidade da rolagem, em px por quadro.
export const curvaDaVelocidade = (v: number) => Math.min(VELOCIDADE_CHEIA, Math.abs(v)) / VELOCIDADE_CHEIA;

const doisDigitos = (n: number) => String(n).padStart(2, '0');
export const contador = (i: number, n: number) => `(${doisDigitos(i + 1)}/${doisDigitos(n)})`;
