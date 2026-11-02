import { expect, test } from '@playwright/test';
import { PNG } from 'pngjs';

// A logo de vidro acompanha o mouse: com o ponteiro em lados opostos, o hero desenhado muda de forma visível.
test('o vidro do hero reage ao mouse (o ponteiro chega às cenas 3D)', async ({ page }) => {
  // No CI o WebGL roda em software, a poucos quadros por segundo; o comportamento é conferido na máquina com GPU.
  test.skip(!!process.env.CI, 'WebGL sem GPU no CI');
  await page.goto('/');
  await expect(page.locator('.abertura')).toHaveCount(0, { timeout: 8000 });
  await page.waitForTimeout(3500);
  const foto = async (x: number) => {
    await page.mouse.move(x, 450, { steps: 5 });
    await page.waitForTimeout(900);
    return PNG.sync.read(await page.screenshot({ clip: { x: 100, y: 150, width: 1240, height: 280 } })).data;
  };
  const a = await foto(5);
  const b = await foto(1435);
  let diferentes = 0;
  for (let i = 0; i < a.length; i += 4) if (Math.abs(a[i] - b[i]) > 40) diferentes++;
  expect(diferentes / (a.length / 4)).toBeGreaterThan(0.01);
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
