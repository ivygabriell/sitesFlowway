import { expect, test } from '@playwright/test';

const testSemWebgl = test.extend({
  browser: async ({ playwright, channel }, executar) => {
    const browser = await playwright.chromium.launch({ channel, args: ['--disable-3d-apis', '--disable-webgl'] });
    await executar(browser);
    await browser.close();
  },
});

// Com 5 cartões de 50vh, a fileira só cabe sem andar a partir de ~2066 px de largura numa tela de 703 px de altura.
test.describe('2300×703, sem percurso horizontal', () => {
  test.use({ viewport: { width: 2300, height: 703 } });

  test('os cinco cartões cabem centrados e a seção passa sem prender nem indicar percurso', async ({ page }, info) => {
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
    expect(medidas.cartoes).toHaveLength(5);
    expect(medidas.cartoes[0].left).toBeGreaterThanOrEqual(30);
    expect(medidas.cartoes[4].right).toBeLessThanOrEqual(2300 - 30);
    expect(Math.abs(medidas.cartoes[0].left - (2300 - medidas.cartoes[4].right))).toBeLessThan(1);
    expect(parseFloat(medidas.vao)).toBeCloseTo(103.5, 1);
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

test.describe('1883×703, percurso curto', () => {
  test.use({ viewport: { width: 1883, height: 703 } });

  test('os cinco cartões passam um pouco da tela: a seção prende e a fileira anda só o excedente (~270 px)', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.abertura')).toHaveCount(0, { timeout: 8000 });
    const secao = page.locator('.secao-capitulos');
    const inicio = await secao.evaluate((e) => e.getBoundingClientRect().top + scrollY);
    await page.evaluate((y) => scrollTo(0, y), inicio + 2);
    await page.waitForTimeout(1500);
    await expect(secao.locator('.cartao')).toHaveCount(5);
    await expect(page.locator('.pin-spacer > .secao-capitulos')).toHaveCount(1);
    const excedente = await page.locator('.cartoes').evaluate((e) => e.scrollWidth - innerWidth);
    expect(excedente).toBeGreaterThan(200);
    expect(excedente).toBeLessThan(350);
    await page.evaluate((y) => scrollTo(0, y), inicio + 703);
    await page.waitForTimeout(2000);
    const deslocamento = await page.locator('.cartoes').evaluate((e) => new DOMMatrix(getComputedStyle(e).transform).m41);
    expect(deslocamento).toBeCloseTo(-excedente, 0);
    const ultimo = await page.locator('.cartao').last().boundingBox();
    expect(ultimo!.x + ultimo!.width).toBeLessThanOrEqual(1883 - 29);
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
  expect(vao).toBeCloseTo(64.8, 1);
  await page.evaluate((y) => scrollTo(0, y), inicio + 855);
  await page.waitForTimeout(2000);
  const ultimo = await page.locator('.cartao').last().boundingBox();
  expect(ultimo!.x + ultimo!.width).toBeLessThanOrEqual(1440 - 29);
  const primeiro = await page.locator('.cartao').first().evaluate((e) => e.getBoundingClientRect().left);
  const rotulo = await page.locator('.rotulo-capitulos').boundingBox();
  expect(rotulo!.x).toBe(30);
  expect(primeiro).toBeLessThan(0);
});

test('os cartões são as cinco peças com capa, cada uma um link para o site do conceito', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.abertura')).toHaveCount(0, { timeout: 8000 });
  const cartoes = page.locator('.secao-capitulos .cartao');
  await expect(cartoes).toHaveCount(5);
  await expect(page.locator('.secao-capitulos .cartao.com-capa')).toHaveCount(5);
  await expect(page.locator('.secao-capitulos a.cartao[target="_blank"]')).toHaveCount(5);
  await expect(page.locator('.secao-capitulos .cartao-img img')).toHaveCount(5);
  for (const cartao of await cartoes.all()) await expect(cartao.locator('.cartao-subtitulo')).toContainText('Conceito');
});

// Rafael, 2026-11-09: com o mouse em cima fica a capa; clicar abre o site do conceito numa aba nova, logo que a
// seção aparece (antes os cartões só aceitavam o mouse depois de 15% do percurso).
test('o mouse em cima deixa a capa; clicar abre o site do conceito numa aba nova, que carrega sem erro', async ({ page, context }) => {
  await page.goto('/');
  await expect(page.locator('.abertura')).toHaveCount(0, { timeout: 8000 });
  const inicio = await page.locator('.secao-capitulos').evaluate((e) => e.getBoundingClientRect().top + scrollY);
  await page.evaluate((y) => scrollTo(0, y), inicio + 2);
  await page.waitForTimeout(1500);
  const indice = await page.$$eval('.cartao', (cs) =>
    cs.findIndex((c) => {
      const r = c.getBoundingClientRect();
      return r.left >= 0 && r.right <= innerWidth;
    }),
  );
  expect(indice).toBeGreaterThanOrEqual(0);
  const cartao = page.locator('.cartao').nth(indice);
  await cartao.hover();
  await page.waitForTimeout(800);
  await expect(page.locator('[role="dialog"], .cartao video')).toHaveCount(0);
  const destino = await cartao.getAttribute('href');
  const [aba] = await Promise.all([context.waitForEvent('page'), cartao.click()]);
  const erros: string[] = [];
  aba.on('pageerror', (e) => erros.push(e.message));
  aba.on('response', (r) => r.status() >= 400 && erros.push(`${r.status()} ${r.url()}`));
  await aba.waitForLoadState('load');
  expect(new URL(aba.url()).pathname).toBe(destino);
  expect(new URL(page.url()).pathname).toBe('/');
  await aba.waitForTimeout(1000);
  expect(erros).toEqual([]);
});

// Revisão de 2026-11-09: na fileira presa (overflow clip), o Tab levava o foco a cartões fora da tela. Agora a página
// rola até a fileira mostrar o cartão focado.
test('com o teclado, o Tab leva a fileira até o cartão focado, que fica inteiro na tela', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.abertura')).toHaveCount(0, { timeout: 8000 });
  // No CI (WebGL em software) a seção demora a montar: espera a fileira presa antes de usar o teclado.
  await expect(page.locator('.secao-capitulos')).toHaveClass(/modo-galeria/, { timeout: 10000 });
  await page.waitForTimeout(1500);
  const cartoes = page.locator('.secao-capitulos .cartao');
  await cartoes.first().focus();
  await expect(cartoes.first()).toBeFocused();
  for (let i = 1; i < 5; i++) {
    await page.keyboard.press('Tab');
    await expect(cartoes.nth(i)).toBeFocused();
  }
  await expect(cartoes.last()).toBeFocused();
  await page.waitForTimeout(2500);
  const r = (await cartoes.last().boundingBox())!;
  expect(r.x).toBeGreaterThanOrEqual(0);
  expect(r.x + r.width).toBeLessThanOrEqual(1440);
  expect(r.y).toBeGreaterThanOrEqual(0);
  expect(r.y + r.height).toBeLessThanOrEqual(900);
});

// Revisão de 2026-11-09: as capas viravam texturas por um TextureLoader e eram baixadas de novo pelo <img>. Agora a
// textura usa o próprio <img>: uma requisição por capa. (Quando o lazy começa depende do navegador: o Chromium headless
// do CI carrega de mais longe; por isso o teste não exige nada no topo.)
test('as capas carregam uma vez cada', async ({ page }) => {
  const pedidos: string[] = [];
  page.on('request', (r) => r.url().includes('/capa.webp') && pedidos.push(new URL(r.url()).pathname));
  await page.goto('/');
  await expect(page.locator('.abertura')).toHaveCount(0, { timeout: 8000 });
  const inicio = await page.locator('.secao-capitulos').evaluate((e) => e.getBoundingClientRect().top + scrollY);
  await page.evaluate((y) => scrollTo(0, y + 2), inicio);
  await page.waitForTimeout(1500);
  await page.evaluate((y) => scrollTo(0, y + 1500), inicio);
  await page.waitForTimeout(2500);
  const contagem = Object.fromEntries([...new Set(pedidos)].map((p) => [p, pedidos.filter((x) => x === p).length]));
  expect(Object.keys(contagem)).toHaveLength(5);
  expect(Object.values(contagem).every((n) => n === 1), JSON.stringify(contagem)).toBe(true);
});

test('enquanto a página Trabalhos não existe, /trabalhos e /en/work respondem 404', async ({ page }) => {
  for (const caminho of ['/trabalhos', '/en/work']) {
    const resposta = await page.goto(caminho);
    expect(resposta?.status(), caminho).toBe(404);
  }
});

test.describe('no celular', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('os cartões ocupam a largura da lista', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.secao-capitulos')).toHaveClass(/modo-lista/, { timeout: 5000 });
    const larguras = await page.$$eval('.cartao', (cs) => cs.map((c) => c.getBoundingClientRect().width));
    expect(larguras).toHaveLength(5);
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

  test('a grade mostra os cinco cartões e informações sem pin nem indicador', async ({ page }) => {
    await page.goto('/');
    const secao = page.locator('.secao-capitulos');
    await expect(secao).toHaveClass(/modo-grade/);
    await secao.scrollIntoViewIfNeeded();
    await expect(secao.locator('.barra-progresso')).toHaveCount(0);
    await expect(page.locator('.pin-spacer > .secao-capitulos')).toHaveCount(0);
    await expect(secao.locator('.cartao')).toHaveCount(5);
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
  testSemWebgl.use({ viewport: { width: 2300, height: 703 } });

  testSemWebgl('a galeria sem excedente exibe as capas como imagens comuns, com as informações, sem prender', async ({ page }) => {
    const erros: string[] = [];
    page.on('pageerror', (e) => erros.push(e.message));
    await page.goto('/');
    await expect(page.locator('.abertura')).toHaveCount(0, { timeout: 8000 });
    const secao = page.locator('.secao-capitulos');
    await secao.scrollIntoViewIfNeeded();
    await expect(secao.locator('.barra-progresso')).toHaveCount(0);
    await expect(page.locator('.pin-spacer > .secao-capitulos')).toHaveCount(0);
    await expect(secao.locator('.cartao')).toHaveCount(5);
    for (const cartao of await secao.locator('.cartao').all()) {
      await expect(cartao.locator('.cartao-img img')).toBeVisible();
      await expect(cartao.locator('.cartao-img img')).toHaveCSS('opacity', '1');
      await expect(cartao.locator('.cartao-titulo')).toBeVisible();
      await expect(cartao.locator('.cartao-subtitulo')).toBeVisible();
    }
    expect(erros).toEqual([]);
  });
});
