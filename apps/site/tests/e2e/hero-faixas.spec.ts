import { expect, test, type Page } from '@playwright/test';

// Issue #17: rolar durante a entrada do hero (logo depois de recarregar ou de abrir a outra língua) e voltar ao topo
// deixava as faixas e o convite a rolar apagados: a saída gravava a opacidade do meio da entrada como ponto de partida.
const REPETICOES = 3;
const opacidades = (page: Page) =>
  page.evaluate(() => ['.faixas', '.role-para-baixo'].map((s) => getComputedStyle(document.querySelector(`.secao-hero ${s}`)!).opacity));

for (const [nome, viewport] of [['desktop', { width: 1440, height: 900 }], ['celular', { width: 390, height: 844 }]] as const) {
  test.describe(nome, () => {
    test.use({ viewport });
    for (const caminho of ['/', '/en']) {
      test(`${caminho}: rolar no meio da entrada e voltar ao topo mostra as faixas e o convite a rolar`, async ({ page }) => {
        test.setTimeout(120_000);
        await page.addInitScript(() => sessionStorage.setItem('abertura-tocou', '1'));
        await page.goto(caminho);
        await page.mouse.move(viewport.width / 2, viewport.height / 3);
        const medidas: string[][] = [];
        for (let i = 0; i < REPETICOES; i++) {
          await page.reload();
          // A entrada começou (a intro aparece no instante 0 dela); as faixas e o convite ainda estão entrando.
          await expect(page.locator('.secao-hero .intro')).toHaveCSS('opacity', '1');
          await page.waitForTimeout(1200);
          await page.mouse.wheel(0, 300);
          await page.waitForTimeout(1200);
          await page.mouse.wheel(0, -600);
          await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
          await page.waitForTimeout(2500);
          medidas.push(await opacidades(page));
        }
        console.log(`hero-faixas ${nome} ${caminho}:`, JSON.stringify(medidas));
        expect(medidas).toEqual(Array(REPETICOES).fill(['1', '1']));
      });
    }
  });
}
