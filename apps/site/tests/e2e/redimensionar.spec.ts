import { expect, test } from '@playwright/test';

// A página monta cada seção para a largura que encontra (galeria ou lista, lençol ou folha). Ao mudar a largura,
// ela recarrega e remonta, como a referência faz: nada fica com posições ou modo de outra largura.
test('redimensionar recarrega a página no modo certo para a nova largura', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.abertura')).toHaveCount(0, { timeout: 8000 });
  await expect(page.locator('.secao-capitulos')).toHaveClass(/modo-galeria/);

  // No celular a galeria continua, mas remontada com os cartões de retrato (até 80% da largura).
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('.secao-capitulos')).toHaveClass(/modo-galeria/, { timeout: 5000 });
  await expect.poll(() => page.locator('.cartao').first().evaluate((e) => e.getBoundingClientRect().width), { timeout: 5000 }).toBeLessThanOrEqual(390 * 0.8);
  await expect(page.locator('.secao-decisoes')).toHaveClass(/com-lencol/, { timeout: 5000 });
  // Versão B (2026-11-11): o celular também usa a rolagem suave, para os pins e o canvas andarem com ela.
  await expect(page.locator('html')).toHaveClass(/js-smooth-scrollbar-enabled/);

  await page.setViewportSize({ width: 1100, height: 800 });
  await expect(page.locator('.secao-capitulos')).toHaveClass(/modo-galeria/, { timeout: 5000 });
  const extraEsperado = await page.locator('.cartoes').evaluate((e) => e.scrollWidth - innerWidth + 60);
  await page.waitForTimeout(1500);
  const inicio = await page.locator('.secao-capitulos').evaluate((e) => e.getBoundingClientRect().top + scrollY);
  await page.evaluate(([y, extra]) => scrollTo(0, y + 0.95 * Math.max(extra - 500, innerHeight)), [inicio, extraEsperado]);
  await page.waitForTimeout(2500);
  const ultimo = await page.locator('.cartao').last().evaluate((e) => e.getBoundingClientRect().right);
  expect(ultimo).toBeLessThanOrEqual(1100);
});
