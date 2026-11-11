import { expect, test } from '@playwright/test';

const semAbertura = () => sessionStorage.setItem('abertura-tocou', '1');

// Rafael, 2026-11-09: recarregar a página precisa ir para o topo (e ficar lá, sem saltar depois).
test('recarregar no meio da página volta ao topo e fica lá', async ({ page }) => {
  await page.addInitScript(semAbertura);
  await page.goto('/');
  await page.waitForTimeout(2000);
  await page.evaluate(() => window.scrollTo(0, 3840));
  await page.waitForTimeout(1500);
  await page.reload();
  await page.waitForTimeout(800);
  expect(await page.evaluate(() => scrollY)).toBe(0);
  await expect(page.locator('html')).not.toHaveClass(/restaurando/);
  await page.waitForTimeout(3000);
  expect(await page.evaluate(() => scrollY)).toBe(0);
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
  await page.locator('.guiada').waitFor();
  await page.waitForTimeout(500);
  await page.goBack();
  await page.waitForURL((u) => u.pathname === '/');
  await page.waitForTimeout(3500);
  expect(Math.abs((await page.evaluate(() => scrollY)) - antes)).toBeLessThan(150);
});

// Amostra, a cada quadro desde o HTML pronto e por 3 s, a rolagem e se a página está visível.
const amostrar = () => {
  const w = window as unknown as { amostras: [number, string][] };
  w.amostras = [];
  document.addEventListener('DOMContentLoaded', () => {
    const fim = performance.now() + 3000;
    const passo = () => {
      w.amostras.push([scrollY, getComputedStyle(document.documentElement).visibility]);
      if (performance.now() < fim) requestAnimationFrame(passo);
    };
    passo();
  });
};
const amostras = (page: import('@playwright/test').Page) => page.evaluate(() => (window as unknown as { amostras: [number, string][] }).amostras);

// Revisão de 2026-11-09: no voltar, nenhum quadro visível fora do lugar guardado (o topo com a logo, por exemplo),
// também no celular, onde a abertura nunca toca.
for (const [nome, opcoes] of [
  ['desktop', { viewport: { width: 1440, height: 900 } }],
  ['celular', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }],
] as const) {
  test(`voltar do contato não mostra o topo antes de voltar ao lugar (${nome})`, async ({ browser }) => {
    const contexto = await browser.newContext(opcoes);
    const page = await contexto.newPage();
    if (nome === 'desktop') await page.addInitScript(semAbertura);
    await page.addInitScript(amostrar);
    await page.goto('/');
    await page.waitForTimeout(2000);
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(2500);
    const antes = await page.evaluate(() => scrollY);
    await page.locator('.rodape-cta').click();
    await page.waitForURL('**/contato');
    await page.locator('.guiada').waitFor();
    await page.waitForTimeout(500);
    await page.goBack();
    await page.waitForURL((u) => u.pathname === '/');
    await page.waitForTimeout(3500);
    const lista = await amostras(page);
    expect(lista.length).toBeGreaterThan(10);
    expect(lista.filter(([y, vis]) => vis === 'visible' && Math.abs(y - antes) > 150)).toEqual([]);
    expect(Math.abs((await page.evaluate(() => scrollY)) - antes)).toBeLessThan(150);
    await contexto.close();
  });
}

// O Chromium do Playwright desliga o bfcache; o navegador real devolve a página com pageshow persisted, e o site a
// recarrega. Aqui o mesmo evento é disparado: a recarga tem de voltar ao lugar, sem mostrar o topo.
test('voltar pelo bfcache (pageshow persisted) recarrega e volta ao lugar, sem mostrar o topo', async ({ page }) => {
  await page.addInitScript(semAbertura);
  await page.addInitScript(amostrar);
  await page.goto('/');
  await page.waitForTimeout(2000);
  await page.evaluate(() => window.scrollTo(0, 3840));
  await page.waitForTimeout(1500);
  const antes = await page.evaluate(() => scrollY);
  await Promise.all([page.waitForEvent('load'), page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })))]);
  await page.waitForTimeout(3500);
  const lista = await amostras(page);
  expect(lista.filter(([y, vis]) => vis === 'visible' && Math.abs(y - antes) > 150)).toEqual([]);
  expect(Math.abs((await page.evaluate(() => scrollY)) - antes)).toBeLessThan(150);
  // A marca do bfcache vale uma vez: a recarga seguinte vai ao topo.
  await page.reload();
  await page.waitForTimeout(1500);
  expect(await page.evaluate(() => scrollY)).toBe(0);
});

test('entrar pela primeira vez começa no topo', async ({ page }) => {
  await page.addInitScript(semAbertura);
  await page.goto('/');
  await page.waitForTimeout(2500);
  expect(await page.evaluate(() => scrollY)).toBe(0);
});
