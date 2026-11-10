import { devices, expect, test } from '@playwright/test';

test.use({ ...devices['iPhone 13'], defaultBrowserType: 'chromium' });

test('no celular não há abertura, os capítulos viram lista e as decisões, folha estática', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(1000);
  await expect(page.locator('.abertura')).toBeHidden();
  const topos = await page.$$eval('.cartao', (cs) => cs.map((c) => c.getBoundingClientRect().top));
  expect(topos).toHaveLength(5);
  for (let i = 1; i < topos.length; i++) expect(topos[i]).toBeGreaterThan(topos[i - 1]);
  // No toque, a capa fica parada e tocar no cartão abre o pop-up com a página inteira, que cabe na tela.
  await page.locator('.cartao').first().scrollIntoViewIfNeeded();
  await page.locator('.cartao').first().tap();
  const popup = page.getByRole('dialog');
  await expect(popup).toBeVisible();
  const caixa = (await popup.boundingBox())!;
  const tela = page.viewportSize()!;
  expect(caixa.x).toBeGreaterThanOrEqual(0);
  expect(caixa.x + caixa.width).toBeLessThanOrEqual(tela.width);
  expect(caixa.y + caixa.height).toBeLessThanOrEqual(tela.height);
  await page.getByRole('button', { name: 'Fechar' }).tap();
  await expect(popup).toHaveCount(0);
  await page.locator('.lista-decisoes').scrollIntoViewIfNeeded();
  await expect(page.locator('.lista-decisoes')).toBeVisible();
  await expect(page.locator('html')).not.toHaveClass(/js-smooth-scrollbar-enabled/);
});
