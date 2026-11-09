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

// Pedido de 2026-11-09: recarregar no meio da página não pode mostrar o topo (com a logo subindo) antes de voltar ao lugar.
test('recarregar no meio da página não mostra o topo antes de voltar', async ({ page }) => {
  await page.addInitScript(semAbertura);
  // Amostra, a cada quadro desde o HTML pronto, a rolagem e se a página está visível.
  await page.addInitScript(() => {
    const amostras: [number, string][] = ((window as unknown as { amostras: [number, string][] }).amostras = []);
    document.addEventListener('DOMContentLoaded', () => {
      const fim = performance.now() + 3000;
      const passo = () => {
        amostras.push([scrollY, getComputedStyle(document.documentElement).visibility]);
        if (performance.now() < fim) requestAnimationFrame(passo);
      };
      passo();
    });
  });
  await page.goto('/');
  await page.waitForTimeout(2000);
  await page.evaluate(() => window.scrollTo(0, 3840));
  await page.waitForTimeout(1500);
  const antes = await page.evaluate(() => scrollY);
  await page.reload();
  await page.waitForTimeout(3500);
  const amostras = await page.evaluate(() => (window as unknown as { amostras: [number, string][] }).amostras);
  expect(amostras.length).toBeGreaterThan(10);
  expect(amostras.filter(([y, vis]) => vis === 'visible' && Math.abs(y - antes) > 150)).toEqual([]);
  expect(amostras.at(-1)?.[1]).toBe('visible');
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
