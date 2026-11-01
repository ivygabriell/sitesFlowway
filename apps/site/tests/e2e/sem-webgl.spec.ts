import { expect, test } from '@playwright/test';

test.use({ launchOptions: { args: ['--disable-3d-apis', '--disable-webgl'] } });

test('sem WebGL a página não quebra: o trecho escuro tem fundo escuro e os cartões sem capa aparecem em cor estática', async ({ page }) => {
  const erros: string[] = [];
  page.on('pageerror', (e) => erros.push(e.message));
  await page.goto('/');
  await page.waitForTimeout(2500);
  await expect(page.getByText('Application error')).toHaveCount(0);
  await expect(page.locator('main section')).toHaveCount(5);
  const manifesto = page.locator('.secao-manifesto');
  await manifesto.scrollIntoViewIfNeeded();
  await expect(manifesto).toHaveCSS('background-color', 'rgb(18, 18, 18)');
  await expect(page.locator('.manifesto-texto')).toBeVisible();
  const cartao = page.locator('.cartao.sem-capa').first();
  await cartao.scrollIntoViewIfNeeded();
  await expect(cartao).toBeVisible();
  await expect(cartao).toHaveCSS('background-color', 'rgb(220, 220, 216)');
  expect(erros).toEqual([]);
});
