import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Os ícones vêm só de assets/brand/favicon/, na raiz do monorepo.
const MARCA = '../../assets/brand/favicon';

describe('ícones da Floway', () => {
  for (const arquivo of ['icon.svg', 'apple-icon.png', 'favicon.ico']) {
    it(`app/${arquivo} é igual byte a byte ao da marca`, () => {
      expect(readFileSync(`app/${arquivo}`).equals(readFileSync(`${MARCA}/${arquivo}`))).toBe(true);
    });
  }

  it('o icon.svg não é mais o ponto antigo', () => {
    expect(readFileSync('app/icon.svg', 'utf8')).not.toContain('r="4"');
  });
});
