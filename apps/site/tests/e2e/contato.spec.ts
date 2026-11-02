import { expect, test, type Page } from '@playwright/test';
import { PNG } from 'pngjs';

// A esfera (raio de 35% da altura da tela) fica no meio da tela enquanto o contato está preso.
// Caixa no miolo da esfera e caixa ao lado dela, à esquerda, onde não há letras nem texto.
const MIOLO = { x: 560, y: 340, width: 320, height: 220 };
const AO_LADO = { x: 60, y: 400, width: 200, height: 200 };

// Fração dos pixels da caixa que não são o claro do fundo (letras da esfera).
async function tinta(page: Page, caixa: typeof MIOLO) {
  const png = PNG.sync.read(await page.screenshot({ clip: caixa }));
  let marcados = 0;
  for (let i = 0; i < png.data.length; i += 4) {
    const [r, g, b] = [png.data[i], png.data[i + 1], png.data[i + 2]];
    if (Math.abs(r - 0xf7) + Math.abs(g - 0xf7) + Math.abs(b - 0xf5) > 60) marcados++;
  }
  return marcados / (caixa.width * caixa.height);
}

test('a esfera acompanha a seção de contato presa: no meio da tela no início, no meio e no fim do trecho preso', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('/');
  await expect(page.locator('.abertura')).toHaveCount(0, { timeout: 8000 });
  // O círculo escuro sai da frente para a medida ver só a esfera; a coreografia dele é conferida em cor.spec.
  await page.addStyleTag({ content: '.circulo-escuro { visibility: hidden !important; }' });
  const fim = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  // A esfera monta antes de o contato chegar ao topo, como na rolagem normal.
  await page.evaluate((y) => scrollTo(0, y), fim - 1200);
  await page.waitForTimeout(2500);
  // O trecho preso tem 0,8 da altura da tela e termina no fim da página.
  for (const [nome, recuo] of [['início', 700], ['meio', 360], ['fim', 0]] as const) {
    await page.evaluate((y) => scrollTo(0, y), fim - recuo);
    await page.waitForTimeout(2500);
    await expect.poll(() => tinta(page, MIOLO), { message: `${nome}: letras no miolo`, timeout: 20_000 }).toBeGreaterThan(0.05);
    expect(await tinta(page, AO_LADO), `${nome}: nada da esfera ao lado dela`).toBeLessThan(0.01);
  }
});

for (const viewport of [{ width: 1440, height: 900 }, { width: 820, height: 1180 }, { width: 390, height: 720 }]) {
  test.describe(`contato legível em ${viewport.width}×${viewport.height}`, () => {
    test.use({ viewport });
    // Sem separar as áreas no contato, as partículas ficam atrás das últimas linhas da frase.
    test('a esfera deixa a área da frase livre de partículas', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('.abertura')).toHaveCount(0, { timeout: 8000 });
      await page.evaluate(() => document.fonts.ready);
      await page.locator('.secao-contato').scrollIntoViewIfNeeded();
      await expect(page.locator('.rodape')).toBeVisible();
      // Só retiramos a tinta do texto e o círculo: o retângulo da frase mantém seu tamanho real.
      await page.addStyleTag({ content: '.circulo-escuro { visibility:hidden!important } .frase-contato { color:transparent!important }' });
      const frase = (await page.locator('.frase-contato').boundingBox())!;
      const esfera = (await page.locator('.secao-contato .esfera').boundingBox())!;
      const rodape = (await page.locator('.rodape').boundingBox())!;
      expect(frase.y + frase.height, 'a área da frase termina antes da esfera').toBeLessThanOrEqual(esfera.y);
      expect(esfera.y + esfera.height, 'a área da esfera termina antes do rodapé').toBeLessThanOrEqual(rodape.y);
      const miolo = { x: Math.round(esfera.x + esfera.width / 2 - 40), y: Math.round(esfera.y + esfera.height / 2 - 40), width: 80, height: 80 };
      await expect.poll(() => tinta(page, miolo), { message: 'a esfera está desenhando antes de conferir a frase', timeout: 20_000 }).toBeGreaterThan(0.05);
      const recorte = { x: Math.ceil(frase.x), y: Math.ceil(frase.y), width: Math.floor(frase.width), height: Math.floor(frase.height) };
      // No salto de scroll, lâminas do hero ainda atravessam o canvas global; espera a pintura estável, mantendo zero.
      await expect.poll(() => tinta(page, recorte), { message: 'nenhuma partícula na área reservada à frase', timeout: 20_000 }).toBe(0);
    });
  });
}

test.describe('frase do contato em paisagem', () => {
  test.use({ viewport: { width: 899, height: 600 } });
  test('nenhum glifo fica sob o selo fixo na entrada ou no topo da seção', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    for (const topo of [150, 0]) {
      await page.evaluate((topo) => {
        const secao = document.querySelector('.secao-contato')!;
        scrollTo(0, scrollY + secao.getBoundingClientRect().top - topo);
      }, topo);
      await expect(page.locator('.selo')).toHaveClass(/visivel/);
      const cobertos = await page.evaluate(() => {
        const selo = document.querySelector('.selo')!.getBoundingClientRect();
        const texto = document.createTreeWalker(document.querySelector('.frase-contato')!, NodeFilter.SHOW_TEXT);
        const cobertos: string[] = [];
        let no: Node | null;
        while ((no = texto.nextNode())) {
          for (let i = 0; i < no.textContent!.length; i++) {
            const letra = no.textContent![i];
            if (!letra.trim()) continue;
            const range = document.createRange();
            range.setStart(no, i);
            range.setEnd(no, i + 1);
            if ([...range.getClientRects()].some((r) => r.right > selo.left && r.left < selo.right && r.bottom > selo.top && r.top < selo.bottom)) cobertos.push(letra);
          }
        }
        return cobertos;
      });
      expect(cobertos, `glifos cobertos com a seção a ${topo}px do topo`).toEqual([]);
    }
  });
});
