import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// O CI fica na raiz do monorepo; os testes rodam dentro de apps/site.
const ci = readFileSync('../../.github/workflows/ci.yml', 'utf8');
const layouts = ['app/(pt)/layout.tsx', 'app/(en)/en/layout.tsx'].map((p) => readFileSync(p, 'utf8'));

describe('CI', () => {
  it('roda instalação, testes, tipos e o teste do build com o Chromium do Playwright', () => {
    const passos = ['npm ci', 'npm test', 'npm run check', 'npx playwright install --with-deps chromium', 'npm run test:build'];
    let ultimo = -1;
    for (const passo of passos) {
      const i = ci.indexOf(`run: ${passo}`);
      expect(i, passo).toBeGreaterThan(ultimo);
      ultimo = i;
    }
  });

  it('o job se chama "Testes, tipos e build", o check exigido pela main', () => {
    expect(ci).toMatch(/name: Testes, tipos e build/);
  });
});

describe('buscadores', () => {
  it('os dois layouts raiz são cascas finas em volta do LayoutRaiz e usam a metadata base', () => {
    for (const layout of layouts) {
      expect(layout).toContain('<LayoutRaiz idioma=');
      expect(layout).toMatch(/export const metadata(: Metadata)? = METADADOS_BASE;/);
    }
  });

  it('a metadata base mantém o site fora dos buscadores até a publicação', async () => {
    const { METADADOS_BASE } = await import('@/seo/paginas');
    expect(METADADOS_BASE.robots).toEqual({ index: false, follow: false });
  });
});
