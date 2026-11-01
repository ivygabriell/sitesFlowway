import { expect, test } from '@playwright/test';

test.use({ launchOptions: { args: ['--disable-3d-apis', '--disable-webgl'] } });

// Foco da revisão, item 4: sem WebGL a palavra do hero aparece em SVG, em #121212, sem lâminas.
test('sem WebGL, a palavra FLOWAY do hero aparece em SVG e nada fica escondido', async ({ page }) => {
  await page.goto('/');
  const svg = page.locator('.titulo-hero svg');
  await expect(svg).toBeVisible();
  await expect(page.locator('.titulo-hero')).toHaveCSS('color', 'rgb(18, 18, 18)');
  const caixa = (await svg.boundingBox())!;
  const largura = page.viewportSize()!.width;
  expect(caixa.width).toBeGreaterThan(0.8 * largura);
  expect(caixa.y).toBeGreaterThanOrEqual(0);
  await expect(page.locator('.secao-hero').getByText('IDENTIDADE', { exact: true })).toHaveCount(0);
});

test('sem WebGL, faixas, intro e convite a rolar ficam visíveis', async ({ page }) => {
  await page.goto('/');
  for (const sel of ['.secao-hero .faixas', '.secao-hero .intro', '.secao-hero .role-para-baixo']) {
    await expect(page.locator(sel)).toHaveCSS('opacity', '1');
  }
});
