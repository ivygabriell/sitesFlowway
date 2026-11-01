import { devices, expect, test } from '@playwright/test';

// Lençol "(O que entregamos)" (spec 4.3, protótipo 06).
const ITENS = [
  'Estratégia digital',
  'Design de interfaces',
  'Desenvolvimento web',
  'Inteligência artificial',
  'Automações e integrações',
  'Experiências digitais',
  'Manutenção e evolução',
];

test('a linha cresce e as frases se digitam enquanto a seção de decisões está fixada', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.abertura')).toHaveCount(0, { timeout: 8000 });
  const inicio = await page.locator('.secao-decisoes').evaluate((e) => e.getBoundingClientRect().top + scrollY);
  await page.evaluate((y) => scrollTo(0, y), inicio + 2);
  await page.waitForTimeout(1000);
  const frase = page.locator('.frase').first();
  const textoInicial = (await frase.textContent()) ?? '';
  await page.evaluate((y) => scrollTo(0, y + 0.7 * innerHeight), inicio);
  await page.waitForTimeout(2000);
  expect(await page.locator('.titulo-decisoes .linha').evaluate((e) => e.getBoundingClientRect().width)).toBeGreaterThan(50);
  expect(((await frase.textContent()) ?? '').length).toBeGreaterThan(textoInicial.length);
});

test.describe('no celular', () => {
  // Só as medidas do iPhone 13: o navegador continua o do projeto (Chromium), sem forçar outro worker.
  const { viewport, userAgent, deviceScaleFactor, isMobile, hasTouch } = devices['iPhone 13'];
  test.use({ viewport, userAgent, deviceScaleFactor, isMobile, hasTouch });

  test('a folha estática mostra os 7 itens, e a linha e as frases animam ao entrar, sem prender', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);
    const secao = page.locator('.secao-decisoes');
    await expect(secao).not.toHaveClass(/com-lencol/);
    const itens = page.locator('.lista-decisoes li');
    await expect(itens).toHaveCount(7);
    for (let i = 0; i < ITENS.length; i++) {
      await itens.nth(i).scrollIntoViewIfNeeded();
      await expect(itens.nth(i)).toBeVisible();
      await expect(itens.nth(i)).toHaveText(`${ITENS[i]}(${i + 1})`);
    }
    expect(await secao.evaluate((e) => e.parentElement?.classList.contains('pin-spacer'))).toBe(false);
    await expect(page.locator('.frase').first()).toHaveText('Do primeiro esboço à automação rodando, cuidamos de cada etapa.', { timeout: 5000 });
    expect(await page.locator('.titulo-decisoes .linha').evaluate((e) => e.getBoundingClientRect().width)).toBeGreaterThan(50);
  });
});
