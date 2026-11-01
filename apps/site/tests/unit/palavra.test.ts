import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PALAVRA } from '@/marca/palavra';

// A palavra do hero vem do arquivo da assinatura, sem o símbolo: é o 4º path de floway-assinatura-horizontal-fundo-claro.svg.
const svg = readFileSync('../../assets/brand/floway-assinatura-horizontal-fundo-claro.svg', 'utf8');
const paths = [...svg.matchAll(/<path([^>]*)\/>/g)].map((m) => m[1]);

describe('PALAVRA', () => {
  it('tem o mesmo desenho do 4º path da assinatura', () => {
    expect(paths).toHaveLength(4);
    expect(PALAVRA.d).toBe(paths[3].match(/\sd="([^"]+)"/)![1]);
  });

  it('leva a mesma translação do path e o recorte da palavra', () => {
    const [, x, y] = paths[3].match(/translate\(([\d.]+) ([\d.]+)\)/)!;
    expect(PALAVRA.translacao).toEqual([Number(x), Number(y)]);
    expect(PALAVRA.viewBox).toEqual([850, 110, 1360, 292]);
  });
});
