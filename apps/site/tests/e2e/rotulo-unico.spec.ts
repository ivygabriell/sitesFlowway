import { expect, test } from '@playwright/test';

// Issue #7: o rótulo de "(O que é único)" não pode tocar o parágrafo nem sair da tela, em PT e EN.
for (const caminho of ['/', '/en']) {
  for (const largura of [1920, 1440, 1300, 1100, 900, 390]) {
    test(`${caminho} ${largura}px: rótulo de "único" livre do texto e dentro da tela`, async ({ page }) => {
      await page.addInitScript(() => sessionStorage.setItem('abertura-tocou', '1'));
      await page.setViewportSize({ width: largura, height: 900 });
      await page.goto(caminho);
      const caixas = await page.evaluate(() => {
        const r = (el: Element | null) => {
          const c = el!.getBoundingClientRect();
          return { esq: c.left, dir: c.right, topo: c.top, base: c.bottom };
        };
        return { rotulo: r(document.querySelector('.rotulo-unico')), texto: r(document.querySelector('.unico p')) };
      });
      const { rotulo, texto } = caixas;
      expect(rotulo.esq).toBeGreaterThanOrEqual(0);
      const sobrepoe = rotulo.dir > texto.esq && rotulo.esq < texto.dir && rotulo.base > texto.topo && rotulo.topo < texto.base;
      expect(sobrepoe).toBe(false);
    });
  }
}
