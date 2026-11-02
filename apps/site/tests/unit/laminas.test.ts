import { describe, expect, it } from 'vitest';
import { criarLogoDeVidro } from '@/componentes/hero/laminas';

describe('criarLogoDeVidro', () => {
  it('é o símbolo extrudado: proporção 730×512 e profundidade ≈ 0.32 (0.2 + chanfro de 0.06 dos dois lados)', () => {
    const g = criarLogoDeVidro();
    g.computeBoundingBox();
    const { max, min } = g.boundingBox!;
    expect(max.z - min.z).toBeCloseTo(0.32, 2);
    expect((max.x - min.x) / (max.y - min.y)).toBeCloseTo(730 / 512, 1);
  });
});
