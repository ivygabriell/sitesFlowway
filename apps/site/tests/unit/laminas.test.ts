import { describe, expect, it } from 'vitest';
import { contornoLamina, criarLaminas } from '@/componentes/hero/laminas';

describe('contornoLamina', () => {
  it('é um paralelogramo cujos dois lados inclinados sobem a 45° ± 1°', () => {
    const pontos = contornoLamina(1.9, 0.42, 0.05).getPoints();
    const segmentos = pontos.slice(1).map((p, i) => ({ dx: p.x - pontos[i].x, dy: p.y - pontos[i].y }));
    const inclinados = segmentos
      .filter((s) => Math.abs(s.dy) > 1e-6)
      .sort((a, b) => Math.hypot(b.dx, b.dy) - Math.hypot(a.dx, a.dy))
      .slice(0, 2);
    expect(inclinados).toHaveLength(2);
    for (const s of inclinados) {
      const graus = (Math.atan2(Math.abs(s.dy), Math.abs(s.dx)) * 180) / Math.PI;
      expect(graus).toBeGreaterThan(44);
      expect(graus).toBeLessThan(46);
      // Os dois sobem para o mesmo lado (paralelogramo, não trapézio).
      expect(Math.sign(s.dx * s.dy)).toBe(Math.sign(inclinados[0].dx * inclinados[0].dy));
    }
  });
});

describe('criarLaminas', () => {
  it('devolve as três lâminas extrudadas com profundidade ≈ 0.32 (0.2 + chanfro de 0.06 dos dois lados)', () => {
    const laminas = criarLaminas();
    expect(Object.keys(laminas).sort()).toEqual(['principal', 'segunda', 'terceira']);
    for (const g of Object.values(laminas)) {
      expect(g.attributes.position.count).toBeGreaterThan(0);
      g.computeBoundingBox();
      const caixa = g.boundingBox!;
      expect(caixa.max.z - caixa.min.z).toBeCloseTo(0.32, 2);
    }
  });

  it('a principal é a mais larga e a terceira, a menor', () => {
    const { principal, segunda, terceira } = criarLaminas();
    const largura = (g: typeof principal) => (g.computeBoundingBox(), g.boundingBox!.max.x - g.boundingBox!.min.x);
    expect(largura(principal)).toBeGreaterThan(largura(segunda));
    expect(largura(segunda)).toBeGreaterThan(largura(terceira));
  });
});
