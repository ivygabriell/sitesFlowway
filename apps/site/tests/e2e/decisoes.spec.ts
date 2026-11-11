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

  // Rafael, 2026-11-10: com WebGL, o celular segue o desktop (lençol preso); a folha estática fica para quem não tem WebGL.
  test('com WebGL, o lençol prende a seção e a linha e as frases animam com a rolagem', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.abertura')).toHaveCount(0, { timeout: 8000 });
    const secao = page.locator('.secao-decisoes');
    await expect(secao).toHaveClass(/com-lencol/, { timeout: 5000 });
    expect(await secao.evaluate((e) => e.parentElement?.classList.contains('pin-spacer'))).toBe(true);
    await expect(page.locator('.lista-decisoes li')).toHaveCount(ITENS.length);
    const inicio = await secao.evaluate((e) => e.getBoundingClientRect().top + scrollY);
    await page.evaluate((y) => scrollTo(0, y), inicio + 2);
    await page.waitForTimeout(1000);
    const frase = page.locator('.frase').first();
    const textoInicial = (await frase.textContent()) ?? '';
    await page.evaluate((y) => scrollTo(0, y + 0.7 * innerHeight), inicio);
    await page.waitForTimeout(2000);
    expect(await page.locator('.titulo-decisoes .linha').evaluate((e) => e.getBoundingClientRect().width)).toBeGreaterThan(50);
    expect(((await frase.textContent()) ?? '').length).toBeGreaterThan(textoInicial.length);
  });
});
