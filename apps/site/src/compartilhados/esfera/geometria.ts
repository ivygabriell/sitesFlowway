// Esboço: a implementação entra no passo verde.
import type { AlvoDaEsfera } from '@/marca/amostrar';
export const QUANTIDADE = { desktop: 0, celular: 0 } as const;
export const pontosEsfera = (_n: number) => new Float32Array(0);
export const tamanhoDaLetra = (_n: number, _raio: number) => 1;
export const atributosDaEsfera = (_n: number, alvo: AlvoDaEsfera, _a: () => number) => ({
  aEsfera: new Float32Array(0), aAlvo: alvo.posicoes, aLetra: new Float32Array(0), aAzul: new Float32Array(0),
});
