import { describe, expect, it } from 'vitest';
import { SIMBOLO } from '@/marca/simbolo';
import { achatar, alvoDoSimbolo, dentro, pontosSimbolo, semente } from '@/marca/amostrar';

const quadrado = achatar('M0 0 L10 0 L10 10 L0 10 Z');
const caminhos = [SIMBOLO.lamina, SIMBOLO.braco, SIMBOLO.haste].map((d) => achatar(d));
const [, braco] = caminhos;

// Volta das coordenadas da esfera para as do SVG: x = (px - 365)/365 * 1.15 e y = -(py - 256)/365 * 1.15.
const doSvg = (x: number, y: number): [number, number] => [(x / 1.15) * 365 + 365, (-y / 1.15) * 365 + 256];

describe('achatar', () => {
  it('um quadrado fechado vira 1 polígono de 5 pontos', () => {
    expect(quadrado).toHaveLength(1);
    expect(quadrado[0]).toHaveLength(5);
    expect(quadrado[0][0]).toEqual([0, 0]);
    expect(quadrado[0][4]).toEqual([0, 0]);
  });

  it('aceita H e V e divide cada curva em passos segmentos', () => {
    expect(achatar('M0 0 H10 V10 Z')[0]).toEqual([[0, 0], [10, 0], [10, 10], [0, 0]]);
    const curva = achatar('M0 0 C0 10 10 10 10 0', 4)[0];
    expect(curva).toHaveLength(5);
    expect(curva[2]).toEqual([5, 7.5]);
  });

  it('cada path do símbolo vira 1 polígono', () => {
    expect(caminhos.map((p) => p.length)).toEqual([1, 1, 1]);
  });
});

describe('dentro', () => {
  it('usa a regra par-ímpar', () => {
    expect(dentro(quadrado, 5, 5)).toBe(true);
    expect(dentro(quadrado, 15, 5)).toBe(false);
    const comFuro = achatar('M0 0 L10 0 L10 10 L0 10 Z M3 3 L7 3 L7 7 L3 7 Z');
    expect(dentro(comFuro, 5, 5)).toBe(false);
    expect(dentro(comFuro, 1, 5)).toBe(true);
  });
});

describe('pontosSimbolo', () => {
  const n = 2000;
  const { posicoes, azul } = pontosSimbolo(n, semente(7));

  it('devolve n pontos com z em ±0.03', () => {
    expect(posicoes).toHaveLength(3 * n);
    expect(azul).toHaveLength(n);
    for (let i = 0; i < n; i++) expect(Math.abs(posicoes[3 * i + 2])).toBeLessThanOrEqual(0.03);
  });

  it('todos os pontos caem dentro de um dos 3 paths achatados', () => {
    for (let i = 0; i < n; i++) {
      const [x, y] = doSvg(posicoes[3 * i], posicoes[3 * i + 1]);
      expect(caminhos.some((p) => dentro(p, x, y)), `ponto ${i} (${x}, ${y})`).toBe(true);
    }
  });

  it('azul é 1 exatamente quando o ponto cai no braço', () => {
    for (let i = 0; i < n; i++) {
      const [x, y] = doSvg(posicoes[3 * i], posicoes[3 * i + 1]);
      expect(azul[i], `ponto ${i}`).toBe(dentro(braco, x, y) ? 1 : 0);
    }
  });

  it('a fração azul fica entre 0.15 e 0.35 (a área do braço)', () => {
    const fracao = azul.reduce((s, a) => s + a, 0) / n;
    expect(fracao).toBeGreaterThan(0.15);
    expect(fracao).toBeLessThan(0.35);
  });

  it('a silhueta: cada borda da caixa dos pontos fica a menos de 2% da altura da caixa do SVG', () => {
    const grande = pontosSimbolo(20000, semente(11)).posicoes;
    const caixa = { x0: Infinity, x1: -Infinity, y0: Infinity, y1: -Infinity };
    for (let i = 0; i < grande.length; i += 3) {
      const [x, y] = doSvg(grande[i], grande[i + 1]);
      caixa.x0 = Math.min(caixa.x0, x);
      caixa.x1 = Math.max(caixa.x1, x);
      caixa.y0 = Math.min(caixa.y0, y);
      caixa.y1 = Math.max(caixa.y1, y);
    }
    const svg = { x0: Infinity, x1: -Infinity, y0: Infinity, y1: -Infinity };
    for (const [x, y] of caminhos.flat(2)) {
      svg.x0 = Math.min(svg.x0, x);
      svg.x1 = Math.max(svg.x1, x);
      svg.y0 = Math.min(svg.y0, y);
      svg.y1 = Math.max(svg.y1, y);
    }
    const tolerancia = 0.02 * (svg.y1 - svg.y0);
    expect(Math.abs(caixa.x0 - svg.x0)).toBeLessThan(tolerancia);
    expect(Math.abs(caixa.x1 - svg.x1)).toBeLessThan(tolerancia);
    expect(Math.abs(caixa.y0 - svg.y0)).toBeLessThan(tolerancia);
    expect(Math.abs(caixa.y1 - svg.y1)).toBeLessThan(tolerancia);
  });

  it('a mesma semente dá os mesmos pontos', () => {
    expect(pontosSimbolo(500, semente(3)).posicoes).toEqual(pontosSimbolo(500, semente(3)).posicoes);
  });
});

describe('alvoDoSimbolo', () => {
  it('calcula uma vez por sessão para cada quantidade (cache no módulo)', () => {
    const a = alvoDoSimbolo(1000);
    expect(alvoDoSimbolo(1000)).toBe(a);
    expect(a.posicoes).toHaveLength(3000);
    expect(alvoDoSimbolo(500).azul).toHaveLength(500);
  });
});
