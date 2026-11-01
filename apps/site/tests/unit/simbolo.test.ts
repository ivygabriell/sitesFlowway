import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SIMBOLO } from '@/marca/simbolo';

// O F da esfera é o desenho exato do símbolo para fundo claro: os 3 paths, na ordem do arquivo.
const svg = readFileSync('../../assets/brand/floway-simbolo-fundo-claro.svg', 'utf8');
const paths = [...svg.matchAll(/<path\s+d="([^"]+)"\s+fill="([^"]+)"/g)].map((m) => ({ d: m[1], cor: m[2] }));

describe('SIMBOLO', () => {
  it('tem os 3 paths do SVG no disco, na ordem do arquivo (lâmina, braço azul, haste)', () => {
    expect(paths).toHaveLength(3);
    expect(SIMBOLO.lamina).toBe(paths[0].d);
    expect(SIMBOLO.braco).toBe(paths[1].d);
    expect(SIMBOLO.haste).toBe(paths[2].d);
    expect(paths[1].cor).toBe('#002FA7');
  });

  it('tem a caixa do viewBox do arquivo', () => {
    expect(svg).toContain('viewBox="0 0 730 512"');
    expect(SIMBOLO.largura).toBe(730);
    expect(SIMBOLO.altura).toBe(512);
  });
});
