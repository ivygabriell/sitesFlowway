import { expect, test } from '@playwright/test';

test('os capítulos andam na horizontal enquanto a página rola, com a seção fixada', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.abertura')).toHaveCount(0, { timeout: 8000 });
  const inicio = await page.locator('.secao-capitulos').evaluate((e) => e.getBoundingClientRect().top + scrollY);
  await page.evaluate((y) => scrollTo(0, y), inicio + 2);
  await page.waitForTimeout(1500);
  const larguraAntes = await page.locator('.barra-ativa').evaluate((e) => e.getBoundingClientRect().width);
  await page.evaluate((y) => scrollTo(0, y), inicio + 800);
  await page.waitForTimeout(2000);
  const topo = await page.locator('.secao-capitulos').evaluate((e) => e.getBoundingClientRect().top);
  expect(Math.abs(topo)).toBeLessThan(2);
  const deslocamento = await page.locator('.cartoes').evaluate((e) => new DOMMatrix(getComputedStyle(e).transform).m41);
  expect(deslocamento).toBeLessThan(-100);
  const larguraDepois = await page.locator('.barra-ativa').evaluate((e) => e.getBoundingClientRect().width);
  expect(larguraDepois).toBeGreaterThan(larguraAntes);
});

test('os cartões são blocos em cor estática, sem capa e sem link, e clicar num deles não sai da página', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.abertura')).toHaveCount(0, { timeout: 8000 });
  const cartoes = page.locator('.secao-capitulos .cartao');
  await expect(cartoes).toHaveCount(4);
  await expect(page.locator('.secao-capitulos .cartao.sem-capa')).toHaveCount(4);
  await expect(page.locator('.secao-capitulos a')).toHaveCount(0);
  await expect(page.locator('.secao-capitulos .cartao-img, .secao-capitulos .cartao-previa')).toHaveCount(0);
  await expect(cartoes.first()).toHaveCSS('background-color', 'rgb(220, 220, 216)');
  await expect(cartoes.first().locator('.cartao-subtitulo')).toContainText('Conceito');
  await cartoes.first().click({ force: true });
  await page.waitForTimeout(300);
  expect(new URL(page.url()).pathname).toBe('/');
});

test('enquanto a página Trabalhos não existe, /trabalhos e /en/work respondem 404', async ({ page }) => {
  for (const caminho of ['/trabalhos', '/en/work']) {
    const resposta = await page.goto(caminho);
    expect(resposta?.status(), caminho).toBe(404);
  }
});
