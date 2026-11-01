import { expect, test, type Page } from '@playwright/test';
import { PNG } from 'pngjs';

// A esfera (raio 230 px numa tela de 900 px) fica no meio da tela enquanto o contato está preso.
// Caixa no miolo da esfera e caixa logo abaixo dela, entre a esfera e o convite do rodapé.
const MIOLO = { x: 560, y: 340, width: 320, height: 220 };
const ABAIXO = { x: 560, y: 705, width: 320, height: 40 };

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
    expect(await tinta(page, ABAIXO), `${nome}: nada da esfera abaixo dela`).toBeLessThan(0.01);
  }
});
