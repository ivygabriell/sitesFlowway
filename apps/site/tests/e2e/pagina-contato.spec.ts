import { expect, test } from '@playwright/test';
import { PNG } from 'pngjs';

// A página de contato (spec 4.6): o selo e o CTA chegam nela, nas duas línguas, e o formulário cabe em qualquer tela.
for (const [caminho, lang, privacidade] of [['/contato', 'pt-BR', '/privacidade'], ['/en/contact', 'en', '/en/privacy']] as const) {
  test(`${caminho} responde 200 em ${lang}, com o formulário e o menu riscado`, async ({ page }) => {
    const resposta = await page.goto(caminho);
    expect(resposta?.status()).toBe(200);
    await expect(page.locator('html')).toHaveAttribute('lang', lang);
    await expect(page.locator('.formulario-contato')).toBeVisible();
    await expect(page.locator('.frase-contato')).toBeVisible();
    await expect(page.locator('nav a[aria-current="page"]')).toHaveCount(1);
    await expect(page.locator('a.selo')).toHaveCount(0);
    await expect(page.locator('.rodape')).toBeVisible();
    await expect(page.locator(`.formulario-contato a[href="${privacidade}"]`)).toBeVisible();
    expect((await page.goto(privacidade))?.status()).toBe(200);
  });
}

test('o selo da Início chega ao contato', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('abertura-tocou', '1'));
  await page.goto('/');
  await page.locator('a.selo.visivel').click();
  await page.waitForURL('**/contato');
  await expect(page.locator('.formulario-contato')).toBeVisible();
});

test('enviado: mock da rota, a confirmação aparece', async ({ page }) => {
  await page.route('**/api/contato', (r) => r.fulfill({ status: 200, json: { ok: true } }));
  await page.goto('/contato');
  await page.waitForLoadState('networkidle');
  await page.fill('[name=nome]', 'Teste');
  await page.fill('[name=contato]', 'teste');
  await page.fill('[name=mensagem]', 'Teste');
  await page.locator('.formulario-contato button[type=submit]').click();
  await expect(page.getByText(/Pedido enviado/)).toBeVisible();
});

test('sem destino configurado, o envio real mostra a falha e mantém o texto', async ({ page }) => {
  await page.goto('/contato');
  await page.waitForLoadState('networkidle');
  await page.fill('[name=nome]', 'Teste');
  await page.fill('[name=contato]', 'teste');
  await page.fill('[name=mensagem]', 'Meu texto');
  await page.locator('.formulario-contato button[type=submit]').click();
  await expect(page.getByRole('button', { name: 'Tentar de novo' })).toBeVisible();
  await expect(page.locator('[name=mensagem]')).toHaveValue('Meu texto');
});

for (const [largura, altura] of [[1440, 900], [1883, 703], [390, 844], [360, 640]] as const) {
  test(`${largura}×${altura}: sem rolagem lateral, e nada se sobrepõe ao formulário`, async ({ page }) => {
    await page.setViewportSize({ width: largura, height: altura });
    await page.goto('/contato');
    await page.waitForTimeout(800);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const retangulo = (s: string) => page.locator(s).evaluate((e) => { const r = e.getBoundingClientRect(); return { top: r.top, bottom: r.bottom, left: r.left, right: r.right }; });
    const frase = await retangulo('.frase-contato');
    const form = await retangulo('.formulario-contato');
    const esfera = await retangulo('.pagina-contato .esfera');
    const rodape = await retangulo('.rodape');
    expect(form.top).toBeGreaterThanOrEqual(frase.bottom);
    expect(rodape.top).toBeGreaterThanOrEqual(form.bottom);
    const separados = form.right <= esfera.left || form.left >= esfera.right || form.top >= esfera.bottom || form.bottom <= esfera.top;
    expect(separados).toBe(true);
    await page.locator('.formulario-contato button[type=submit]').scrollIntoViewIfNeeded();
    await expect(page.locator('.formulario-contato button[type=submit]')).toBeInViewport();
  });
}

test.describe('com movimento reduzido', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });
  test('sem círculo, tudo à vista', async ({ page }) => {
    await page.goto('/contato');
    await expect(page.locator('.pagina-contato .circulo-escuro')).toBeHidden();
    await expect(page.locator('.formulario-contato')).toBeVisible();
  });
});

test.describe('sem JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('o formulário envia pela rota e volta com a mensagem de falha, sem destino configurado', async ({ page }) => {
    await page.goto('/contato');
    await page.fill('[name=nome]', 'Teste');
    await page.fill('[name=contato]', 'teste');
    await page.fill('[name=mensagem]', 'Teste');
    await page.locator('.formulario-contato button[type=submit]').click();
    await page.waitForURL('**/contato?estado=falha');
    await expect(page.getByRole('button', { name: 'Tentar de novo' })).toBeVisible();
  });
});

// A esfera fica fora do eixo da câmera: sem correção, a perspectiva a estica na horizontal.
for (const [largura, altura] of [[1440, 900], [1883, 703]] as const) {
  test(`${largura}×${altura}: o globo é redondo`, async ({ page }) => {
    await page.setViewportSize({ width: largura, height: altura });
    await page.goto('/contato');
    await page.waitForTimeout(3000); // antes da morfose, com o círculo já fora
    const caixa = await page.locator('.pagina-contato .esfera').boundingBox();
    const png = PNG.sync.read(await page.screenshot({ clip: caixa! }));
    let [x0, x1, y0, y1] = [1e9, -1, 1e9, -1];
    for (let y = 0; y < png.height; y++)
      for (let x = 0; x < png.width; x++)
        if (png.data[(y * png.width + x) * 4] < 120) {
          x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
        }
    expect(x1).toBeGreaterThan(0);
    const razao = (x1 - x0) / (y1 - y0);
    expect(razao).toBeGreaterThan(0.93);
    expect(razao).toBeLessThan(1.07);
  });
}
