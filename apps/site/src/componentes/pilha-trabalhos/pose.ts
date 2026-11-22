// Medidas da pilha de planos (spec 4.4, valores medidos na referência, issue #24): planos de 74vh com 13vh de vão
// (87vh de centro a centro); a pilha orbita um eixo vertical 800 unidades atrás do plano assentado, meia volta por
// trabalho; na entrada, cada plano desce de 8 telas acima com π de giro a mais por 1000 px de queda (7,2π em 900).
export const ALTURA_PLANO = 0.74;
export const ESPACO = 0.13;
export const PROFUNDIDADE = 800; // raio da órbita
export const QUEDA = 8;
export const GIRO_POR_PX = Math.PI / 1000;
export const CURVA_MAXIMA = 200; // a borda recua CURVA_MAXIMA·(1 − cos 45°), com a curva cheia
export const VELOCIDADE_CHEIA = 25; // px por quadro em que a curva chega ao máximo

// Pose de um plano a `d` trabalhos do atual; `entrada` vai de 0 (no alto) a 1 (assentado). `altura` é a da tela.
// O giro tem o sentido da rolagem: no meio da troca, o plano que sai vai para a direita e o que entra vem da esquerda.
export function posePlano(d: number, entrada: number, altura: number) {
  const queda = (1 - entrada) * QUEDA * altura;
  const giro = -Math.PI * d - queda * GIRO_POR_PX;
  return {
    x: PROFUNDIDADE * Math.sin(giro),
    y: -d * (ALTURA_PLANO + ESPACO) * altura + queda,
    z: PROFUNDIDADE * (Math.cos(giro) - 1),
    giro,
  };
}

// Fração da curva (0 a 1) pela velocidade da rolagem, em px por quadro: smoothstep de 0 a VELOCIDADE_CHEIA.
export function curvaDaVelocidade(v: number) {
  const t = Math.min(VELOCIDADE_CHEIA, Math.abs(v)) / VELOCIDADE_CHEIA;
  return t * t * (3 - 2 * t);
}

const doisDigitos = (n: number) => String(n).padStart(2, '0');
export const contador = (i: number, n: number) => `(${doisDigitos(i + 1)}/${doisDigitos(n)})`;
