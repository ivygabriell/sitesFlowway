import { expect, test } from '@playwright/test';
import { PNG } from 'pngjs';

// Rafael, 2026-11-09: o mouse não mexe no F. Com o ponteiro trocando de lado, o hero quase não muda (só a flutuação
// lenta do F e a ondulação do vidro); antes, o F andava ~115 px e girava com o mouse.
test('o vidro do hero não reage ao mouse', async ({ page }) => {
  // No CI o WebGL roda em software, a poucos quadros por segundo; o comportamento é conferido na máquina com GPU.
  test.skip(!!process.env.CI, 'WebGL sem GPU no CI');
  await page.goto('/');
  await expect(page.locator('.abertura')).toHaveCount(0, { timeout: 8000 });
  await page.waitForTimeout(3500);
  const foto = async (x: number) => {
    await page.mouse.move(x, 450);
    await page.waitForTimeout(120);
    return PNG.sync.read(await page.screenshot({ clip: { x: 0, y: 150, width: 1440, height: 750 } })).data;
  };
  const diferenca = (a: Buffer, b: Buffer) => {
    let n = 0;
    for (let i = 0; i < a.length; i += 4) if (Math.abs(a[i] - b[i]) > 10) n++;
    return n / (a.length / 4);
  };
  // O vidro ondula com o tempo: a régua é a diferença entre duas fotos com o mouse parado no mesmo lugar.
  const a = await foto(5);
  const parado = diferenca(a, await foto(5));
  const trocado = diferenca(await foto(5), await foto(1435));
  expect(trocado).toBeLessThan(2 * parado + 0.002);
});

// A esfera de letras substituiu o cubo com física (spec 4.3 e protótipo 07): não há arraste, o cursor só empurra as letras.
test('no contato não há arraste: a seção não usa cursor "grab" e a esfera de letras está nela', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.abertura')).toHaveCount(0, { timeout: 8000 });
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(2500);
  await expect(page.locator('.secao-contato .esfera')).toHaveCount(1);
  await expect(page.locator('.secao-contato')).not.toHaveCSS('cursor', 'grab');
});
