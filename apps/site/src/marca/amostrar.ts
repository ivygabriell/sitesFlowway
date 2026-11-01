// Esboço: a implementação entra no passo verde.
export type Poligonos = [number, number][][];
export type AlvoDaEsfera = { posicoes: Float32Array; azul: Uint8Array };
export const achatar = (_d: string, _passos = 8): Poligonos => [];
export const dentro = (_p: Poligonos, _x: number, _y: number): boolean => false;
export const semente = (_s: number) => () => 0;
export const pontosSimbolo = (_n: number, _a: () => number): AlvoDaEsfera => ({ posicoes: new Float32Array(0), azul: new Uint8Array(0) });
export const alvoDoSimbolo = (n: number): AlvoDaEsfera => pontosSimbolo(n, semente(1));
