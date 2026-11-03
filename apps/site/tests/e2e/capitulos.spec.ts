import { expect, test } from '@playwright/test';

const testSemWebgl = test.extend({
  browser: async ({ playwright, channel }, executar) => {
    const browser = await playwright.chromium.launch({ channel, args: ['--disable-3d-apis', '--disable-webgl'] });
    await executar(browser);
    await browser.close();
  },
});

test.describe('1883×703, sem percurso horizontal', () => {
  test.use({ viewport: { width: 1883, height: 703 } });

  test('os quatro cartões cabem centrados e a seção passa sem prender nem indicar percurso', async ({ page }, info) => {
    await page.goto('/');
    await expect(page.locator('.abertura')).toHaveCount(0, { timeout: 8000 });
    await page.waitForTimeout(1500);
    const secao = page.locator('.secao-capitulos');
    const inicio = await secao.evaluate((e) => e.getBoundingClientRect().top + scrollY);
    await page.evaluate((y) => scrollTo(0, y), inicio + 2);
    await page.waitForTimeout(1500);
    const medidas = await secao.evaluate((e) => {
      const cs = [...e.querySelectorAll('.cartao')].map((c) => c.getBoundingClientRect().toJSON());
      return {
        cartoes: cs,
        rotulo: e.querySelector('.rotulo-capitulos')!.getBoundingClientRect().toJSON(),
        vao: getComputedStyle(e.querySelector('.cartoes')!).gap,
      };
    });
    await info.attach('geometria-sem-percurso', { body: JSON.stringify(medidas, null, 2), contentType: 'application/json' });
    await info.attach('galeria-sem-percurso', { body: await page.screenshot({ path: info.outputPath('galeria-sem-percurso.png') }), contentType: 'image/png' });
    expect(medidas.cartoes).toHaveLength(4);
    expect(medidas.cartoes[0].left).toBeGreaterThanOrEqual(30);
    expect(medidas.cartoes[3].right).toBeLessThanOrEqual(1883 - 30);
    expect(Math.abs(medidas.cartoes[0].left - (1883 - medidas.cartoes[3].right))).toBeLessThan(1);
    expect(parseFloat(medidas.vao)).toBeCloseTo(56.49, 1);
    const topoAntes = await secao.evaluate((e) => e.getBoundingClientRect().top);
    await page.evaluate((y) => scrollTo(0, y), inicio + 302);
    await page.waitForTimeout(1500);
    const topoDepois = await secao.evaluate((e) => e.getBoundingClientRect().top);
    expect(topoAntes - topoDepois, 'a seção deve acompanhar os 300px de rolagem vertical').toBeCloseTo(300, 0);
    await expect(secao.locator('.barra-progresso')).toHaveCount(0);
    await expect(page.locator('.pin-spacer > .secao-capitulos')).toHaveCount(0);
    expect(Math.abs(medidas.rotulo.left - medidas.cartoes[0].left), 'rótulo alinhado ao primeiro cartão').toBeLessThan(1);
    expect(medidas.rotulo.bottom).toBeLessThan(medidas.cartoes[0].top);
    for (const c of medidas.cartoes) {
      expect(c.top).toBeGreaterThan(0);
      expect(c.bottom).toBeLessThan(703);
    }
  });
});

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
  await expect(page.locator('.secao-capitulos .tracinho')).toHaveCount(29);
  const vao = await page.locator('.cartoes').evaluate((e) => parseFloat(getComputedStyle(e).gap));
  expect(vao).toBeCloseTo(43.2, 1);
  await page.evaluate((y) => scrollTo(0, y), inicio + 855);
  await page.waitForTimeout(2000);
  const ultimo = await page.locator('.cartao').last().boundingBox();
  expect(ultimo!.x + ultimo!.width).toBeLessThanOrEqual(1440 - 29);
  const primeiro = await page.locator('.cartao').first().evaluate((e) => e.getBoundingClientRect().left);
  const rotulo = await page.locator('.rotulo-capitulos').boundingBox();
  expect(rotulo!.x).toBe(30);
  expect(primeiro).toBeLessThan(0);
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

test.describe('no celular', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('os cartões sem capa ocupam a largura da lista', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.secao-capitulos')).toHaveClass(/modo-lista/, { timeout: 5000 });
    const larguras = await page.$$eval('.cartao.sem-capa', (cs) => cs.map((c) => c.getBoundingClientRect().width));
    expect(larguras).toHaveLength(4);
    for (const l of larguras) expect(l).toBeGreaterThan(300);
    await expect(page.locator('.secao-capitulos .barra-progresso')).toHaveCount(0);
    await expect(page.locator('.pin-spacer > .secao-capitulos')).toHaveCount(0);
    const medidas = await page.locator('.cartoes').boundingBox();
    expect(medidas!.x).toBe(18);
    expect(medidas!.x + medidas!.width).toBe(372);
  });
});

test.describe('movimento reduzido', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });

  test('a grade mostra os quatro cartões e informações sem pin nem indicador', async ({ page }) => {
    await page.goto('/');
    const secao = page.locator('.secao-capitulos');
    await expect(secao).toHaveClass(/modo-grade/);
    await secao.scrollIntoViewIfNeeded();
    await expect(secao.locator('.barra-progresso')).toHaveCount(0);
    await expect(page.locator('.pin-spacer > .secao-capitulos')).toHaveCount(0);
    for (const cartao of await secao.locator('.cartao').all()) {
      await expect(cartao.locator('.cartao-titulo')).toBeVisible();
      await expect(cartao.locator('.cartao-subtitulo')).toBeVisible();
      const caixa = await cartao.boundingBox();
      expect(caixa!.x).toBeGreaterThanOrEqual(18);
      expect(caixa!.x + caixa!.width).toBeLessThanOrEqual(1422);
    }
  });
});

test.describe('sem WebGL', () => {
  testSemWebgl.use({ viewport: { width: 1883, height: 703 } });

  testSemWebgl('a galeria sem excedente exibe cartões e informações comuns sem prender', async ({ page }) => {
    const erros: string[] = [];
    page.on('pageerror', (e) => erros.push(e.message));
    await page.goto('/');
    await expect(page.locator('.abertura')).toHaveCount(0, { timeout: 8000 });
    const secao = page.locator('.secao-capitulos');
    await secao.scrollIntoViewIfNeeded();
    await expect(secao.locator('.barra-progresso')).toHaveCount(0);
    await expect(page.locator('.pin-spacer > .secao-capitulos')).toHaveCount(0);
    for (const cartao of await secao.locator('.cartao').all()) {
      await expect(cartao).toHaveCSS('background-color', 'rgb(220, 220, 216)');
      await expect(cartao.locator('.cartao-titulo')).toBeVisible();
      await expect(cartao.locator('.cartao-subtitulo')).toBeVisible();
    }
    expect(erros).toEqual([]);
  });
});
