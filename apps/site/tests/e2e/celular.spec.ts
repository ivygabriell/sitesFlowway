import { devices, expect, test } from '@playwright/test';

test.use({ ...devices['iPhone 13'], defaultBrowserType: 'chromium' });

// Rafael, 2026-11-10: a abertura toca também no celular, uma vez por sessão, com os trechos dentro da tela.
test('no celular a abertura toca uma vez, cabe na tela, e some', async ({ page }) => {
  await page.goto('/');
  const abertura = page.locator('.abertura');
  await expect(abertura).toBeVisible();
  await expect(abertura.locator('.trecho')).toHaveCount(3);
  // Mede tudo de uma vez, enquanto a abertura está na tela (no CI ela pode sair entre uma medida e outra).
  const caixas = await abertura.evaluate((a) => [...a.querySelectorAll('.trechos, .filme')].map((e) => e.getBoundingClientRect().toJSON()));
  expect(caixas).toHaveLength(2);
  for (const r of caixas) {
    expect(r.left).toBeGreaterThanOrEqual(0);
    expect(r.right).toBeLessThanOrEqual(page.viewportSize()!.width);
  }
  await expect(abertura).toHaveCount(0, { timeout: 8000 });
  await page.reload();
  await page.waitForTimeout(800);
  await expect(page.locator('.abertura')).toBeHidden();
});

// Rafael, 2026-11-10: o celular roda a mesma galeria presa e o mesmo lençol do desktop.
test('no celular os capítulos são a galeria em fileira e as decisões, o lençol', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('abertura-tocou', '1'));
  await page.goto('/');
  await page.waitForTimeout(1000);
  await expect(page.locator('.abertura')).toBeHidden();
  await expect(page.locator('.secao-capitulos')).toHaveClass(/modo-galeria/);
  const caixas = await page.$$eval('.cartao', (cs) => cs.map((c) => c.getBoundingClientRect().toJSON()));
  expect(caixas).toHaveLength(5);
  for (let i = 1; i < caixas.length; i++) {
    expect(Math.abs(caixas[i].top - caixas[0].top)).toBeLessThan(2);
    expect(caixas[i].left).toBeGreaterThan(caixas[i - 1].left);
  }
  // No toque, a capa fica parada e cada cartão é um link para o site do conceito.
  await expect(page.locator('a.cartao[target="_blank"]')).toHaveCount(5);
  await expect(page.locator('.cartao video, [role="dialog"]')).toHaveCount(0);
  await expect(page.locator('.secao-decisoes')).toHaveClass(/com-lencol/, { timeout: 5000 });
  await expect(page.locator('html')).not.toHaveClass(/js-smooth-scrollbar-enabled/);
});
