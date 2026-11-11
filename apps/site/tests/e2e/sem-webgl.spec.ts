import { expect, test } from '@playwright/test';

test.use({ launchOptions: { args: ['--disable-3d-apis', '--disable-webgl'] } });

test('sem WebGL a página não quebra: o trecho escuro tem fundo escuro e as capas dos cartões aparecem como imagens comuns', async ({ page }) => {
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
  const capa = page.locator('.cartao-img img').first();
  await capa.scrollIntoViewIfNeeded();
  await expect(capa).toBeVisible();
  await expect(capa).toHaveCSS('opacity', '1');
  await expect.poll(() => capa.evaluate((i: HTMLImageElement) => i.naturalWidth)).toBe(730);
  expect(erros).toEqual([]);
});

// Sem WebGL, as decisões são a folha estática (no celular e no desktop): sem lençol e sem prender.
test('sem WebGL a folha estática mostra os 7 itens, e a linha e as frases animam ao entrar, sem prender', async ({ page }) => {
  const itensEsperados = ['Estratégia digital', 'Design de interfaces', 'Desenvolvimento web', 'Inteligência artificial', 'Automações e integrações', 'Experiências digitais', 'Manutenção e evolução'];
  await page.goto('/');
  await page.waitForTimeout(1000);
  const secao = page.locator('.secao-decisoes');
  await expect(secao).not.toHaveClass(/com-lencol/);
  const itens = page.locator('.lista-decisoes li');
  await expect(itens).toHaveCount(7);
  // A folha é tracejada em cima e embaixo, como no protótipo 06.
  for (const lado of ['::before', '::after']) {
    expect(await page.locator('.lista-decisoes').evaluate((e, l) => getComputedStyle(e, l).borderTopStyle, lado)).toBe('dashed');
  }
  for (let i = 0; i < itensEsperados.length; i++) {
    await itens.nth(i).scrollIntoViewIfNeeded();
    await expect(itens.nth(i)).toBeVisible();
    await expect(itens.nth(i)).toHaveText(`${itensEsperados[i]}(${i + 1})`);
  }
  expect(await secao.evaluate((e) => e.parentElement?.classList.contains('pin-spacer'))).toBe(false);
  await expect(page.locator('.frase').first()).toHaveText('Do primeiro esboço à automação rodando, cuidamos de cada etapa.', { timeout: 5000 });
  expect(await page.locator('.titulo-decisoes .linha').evaluate((e) => e.getBoundingClientRect().width)).toBeGreaterThan(50);
});
