import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('landing Floway', () => {
  it('mantém a capa original do relógio no projeto Vértice', () => {
    const capas = {
      'desktop.webp': '34cc6c9e762f45e284ca28f1a4692ae41bf8ff64f0bdf0471c15fa1b89575b1d',
      'mobile.webp': '60f6552980280812d4b6bc6ac7d0bfbd322ac5173acfbb5134f0a1d9b132ca6b',
    };

    for (const [arquivo, esperado] of Object.entries(capas)) {
      const capa = readFileSync(resolve(process.cwd(), `public/conceitos/landing-floway/img/work/vertice/${arquivo}`));
      expect(createHash('sha256').update(capa).digest('hex')).toBe(esperado);
    }
  });
});
