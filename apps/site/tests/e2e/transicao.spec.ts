import { expect, test, type Page } from '@playwright/test';

// Registra se algum .transicao chegou a aparecer, mesmo que por um quadro.
const vigiarTransicao = (page: Page) =>
  page.evaluate(() => {
    const w = window as unknown as { houveTransicao: boolean };
    w.houveTransicao = !!document.querySelector('.transicao');
    new MutationObserver(() => {
      if (document.querySelector('.transicao')) w.houveTransicao = true;
    }).observe(document.body, { childList: true, subtree: true });
  });
const houveTransicao = (page: Page) => page.evaluate(() => (window as unknown as { houveTransicao: boolean }).houveTransicao);

const esperarAbertura = async (page: Page) => {
  await page.goto('/');
  await expect(page.locator('.abertura')).toBeHidden({ timeout: 8000 });
};

test('clique no selo: o círculo escuro cresce antes de a URL virar /contato', async ({ page }) => {
  await esperarAbertura(page);
  await expect(page.locator('html')).toHaveClass(/(^|\s)modo-desktop(\s|$)/);
  // A troca carrega outro documento, e sem GPU a animação pode pular para o fim num quadro só: em vez de tentar ver o
  // círculo a tempo, um vigia anota a cor e a URL quando ele nasce, no sessionStorage, que sobrevive à troca.
  await page.evaluate(() => {
    new MutationObserver(() => {
      const c = document.querySelector<HTMLElement>('.transicao');
      if (c && !sessionStorage.getItem('circulo')) sessionStorage.setItem('circulo', JSON.stringify({ cor: getComputedStyle(c).backgroundColor, caminho: location.pathname }));
    }).observe(document.body, { childList: true, subtree: true });
  });
  await page.locator('a.selo').click();
  await page.waitForURL('**/contato');
  const circulo = await page.evaluate(() => sessionStorage.getItem('circulo'));
  expect(JSON.parse(circulo!)).toEqual({ cor: 'rgb(18, 18, 18)', caminho: '/' });
  // Na página nova o círculo some de uma vez.
  await expect(page.locator('.transicao')).toHaveCount(0);
});

test('Cmd/Ctrl+clique no selo abre como o navegador faz, sem círculo, e a aba atual não muda', async ({ page, context }) => {
  await esperarAbertura(page);
  await vigiarTransicao(page);
  const novaAba = context.waitForEvent('page');
  await page.locator('a.selo').click({ modifiers: ['ControlOrMeta'] });
  await (await novaAba).close();
  await page.waitForTimeout(800);
  expect(await houveTransicao(page)).toBe(false);
  expect(new URL(page.url()).pathname).toBe('/');
});

test('um link de protocolo relativo (//) não cria o círculo', async ({ page }) => {
  await esperarAbertura(page);
  await vigiarTransicao(page);
  await page.evaluate(() => {
    const a = document.createElement('a');
    a.href = '//exemplo.com';
    a.textContent = 'externo';
    a.className = 'link-teste';
    Object.assign(a.style, { position: 'fixed', top: '200px', left: '200px', zIndex: '1000' });
    document.body.append(a);
    // Depois de passar pela transição (no document), o teste cancela a navegação para fora.
    window.addEventListener('click', (e) => e.preventDefault());
  });
  await page.locator('.link-teste').click();
  await page.waitForTimeout(800);
  expect(await houveTransicao(page)).toBe(false);
});

test.describe('com movimento reduzido', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });
  test('a URL muda sem círculo', async ({ page }) => {
    // A navegação carrega outro documento: o vigia guarda no sessionStorage, que sobrevive à troca.
    await page.addInitScript(() => {
      new MutationObserver(() => {
        if (document.querySelector('.transicao')) sessionStorage.setItem('houve-transicao', '1');
      }).observe(document, { childList: true, subtree: true });
    });
    await page.goto('/');
    await expect(page.locator('html')).toHaveClass(/(^|\s)modo-reduzido(\s|$)/);
    await page.locator('a.selo').click();
    await page.waitForURL('**/contato');
    expect(await page.evaluate(() => sessionStorage.getItem('houve-transicao'))).toBeNull();
  });
});
