import { devices, expect, test, type Page } from '@playwright/test';
import { PNG } from 'pngjs';

// Issue #15: a palavra FLOWAY do hero precisa ficar legível sob as lâminas de vidro, como na referência.
// Critério medido: no recorte da palavra, 9 s depois de carregar, pelo menos 25% dos pixels com luminância
// abaixo de 0,35 e o percentil 10 da luminância em no máximo 0,25.
const ESPERA = 9000;
// O iPhone 13 do Playwright, no Chromium (defaultBrowserType não pode mudar dentro de um describe).
const IPHONE = Object.fromEntries(Object.entries(devices['iPhone 13']).filter(([chave]) => chave !== 'defaultBrowserType'));

type Recorte = { x: number; y: number; width: number; height: number };

async function luminancias(page: Page, clip: Recorte) {
  const png = PNG.sync.read(await page.screenshot({ clip }));
  const lum: number[] = [];
  for (let i = 0; i < png.data.length; i += 4) {
    lum.push((0.2126 * png.data[i] + 0.7152 * png.data[i + 1] + 0.0722 * png.data[i + 2]) / 255);
  }
  lum.sort((a, b) => a - b);
  const escuros = lum.filter((l) => l < 0.35).length / lum.length;
  const p10 = lum[Math.floor(0.1 * lum.length)];
  return { escuros, p10 };
}

// O recorte é a caixa da palavra em SVG, que ocupa o mesmo lugar do plano da palavra no canvas
// (em 1440×900 dá x 101, y 157, 1238×266, o recorte da medição da issue).
async function medirPalavra(page: Page) {
  await page.goto('/');
  await page.waitForTimeout(ESPERA);
  const c = (await page.locator('.titulo-hero svg').boundingBox())!;
  const medida = await luminancias(page, { x: Math.round(c.x), y: Math.round(c.y), width: Math.round(c.width), height: Math.round(c.height) });
  console.log(`hero-legivel ${page.viewportSize()!.width}px:`, JSON.stringify(medida));
  return medida;
}

function legivel({ escuros, p10 }: { escuros: number; p10: number }) {
  expect(escuros, 'fração de pixels com luminância < 0,35').toBeGreaterThanOrEqual(0.25);
  expect(p10, 'percentil 10 da luminância').toBeLessThanOrEqual(0.25);
}

test.describe('desktop', () => {
  test('no recorte da issue (x 100, y 150, 1240×280), a palavra FLOWAY fica legível sob as lâminas', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(ESPERA);
    const medida = await luminancias(page, { x: 100, y: 150, width: 1240, height: 280 });
    console.log('hero-legivel recorte da issue:', JSON.stringify(medida));
    legivel(medida);
  });
});

test.describe('movimento reduzido', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });
  test('com movimento reduzido, a palavra FLOWAY fica legível sob as lâminas', async ({ page }) => {
    legivel(await medirPalavra(page));
  });
});

test.describe('celular', () => {
  test.use(IPHONE);
  test('no celular, a palavra FLOWAY fica legível sob a lâmina', async ({ page }) => {
    legivel(await medirPalavra(page));
  });
});
