import { expect, test } from '@playwright/test';

const semAbertura = () => sessionStorage.setItem('abertura-tocou', '1');

test('recarregar no meio da página volta ao mesmo lugar', async ({ page }) => {
  await page.addInitScript(semAbertura);
  await page.goto('/');
  await page.waitForTimeout(2000);
  await page.evaluate(() => window.scrollTo(0, 3840));
  await page.waitForTimeout(1500);
  const antes = await page.evaluate(() => scrollY);
  await page.reload();
  await page.waitForTimeout(3500);
  expect(Math.abs((await page.evaluate(() => scrollY)) - antes)).toBeLessThan(150);
});

test('voltar do contato devolve ao fundo da Início', async ({ page }) => {
  await page.addInitScript(semAbertura);
  await page.goto('/');
  await page.waitForTimeout(2000);
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(2500);
  const antes = await page.evaluate(() => scrollY);
  await page.locator('.rodape-cta').click();
  await page.waitForURL('**/contato');
  await page.locator('.formulario-contato').waitFor();
  await page.waitForTimeout(500);
  await page.goBack();
  await page.waitForURL((u) => u.pathname === '/');
  await page.waitForTimeout(3500);
  expect(Math.abs((await page.evaluate(() => scrollY)) - antes)).toBeLessThan(150);
});

test('entrar pela primeira vez começa no topo', async ({ page }) => {
  await page.addInitScript(semAbertura);
  await page.goto('/');
  await page.waitForTimeout(2500);
  expect(await page.evaluate(() => scrollY)).toBe(0);
});
