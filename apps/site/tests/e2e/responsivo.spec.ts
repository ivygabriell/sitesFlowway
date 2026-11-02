import { expect, test } from '@playwright/test';

const celular = (largura: number, altura: number) => ({ viewport: { width: largura, height: altura }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });

// Achados da auditoria (spec 2026-11-01): nenhum tamanho abaixo de 900 px pode alargar a página.
for (const [largura, altura] of [[390, 844], [360, 640], [375, 667], [768, 1024], [844, 390]] as const) {
  test.describe(`${largura}×${altura}`, () => {
    test.use(celular(largura, altura));
    test('a página não alarga e fica em modo celular', async ({ page }) => {
      await page.goto('/');
      await page.waitForTimeout(800);
      const medidas = await page.evaluate(() => ({ janela: innerWidth, documento: document.documentElement.scrollWidth }));
      expect(medidas.janela).toBe(largura);
      expect(medidas.documento).toBeLessThanOrEqual(largura);
      await expect(page.locator('.secao-contato')).toHaveClass(/modo-celular/);
      const selo = await page.locator('a.selo').boundingBox();
      expect(selo!.x + selo!.width).toBeLessThanOrEqual(largura);
    });
  });
}

test.describe('390×844, detalhes', () => {
  test.use(celular(390, 844));

  test('o selo não cobre o texto do manifesto nem o "único"', async ({ page }) => {
    await page.goto('/');
    for (const seletor of ['.manifesto-texto', '.manifesto-apoio', '.unico']) {
      const direita = await page.locator(seletor).first().evaluate((e) => {
        const r = document.createRange();
        r.selectNodeContents(e);
        return r.getBoundingClientRect().right;
      });
      expect(direita, seletor).toBeLessThanOrEqual(390 - 34);
    }
  });

  test('os cartões respeitam a margem direita', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(500);
    const direita = await page.locator('.cartoes').evaluate((e) => e.getBoundingClientRect().right);
    expect(direita).toBeLessThanOrEqual(390 - 18);
  });

  test('tocar na outra língua troca o idioma', async ({ page }) => {
    await page.goto('/contato');
    await page.locator('.cabecalho .idioma .menu-texto2').tap();
    await page.waitForURL('**/en/contact');
  });

  test('os links do cabeçalho têm alvo de toque de 44 px', async ({ page }) => {
    await page.goto('/contato');
    for (const seletor of ['.cabecalho .voltar', '.cabecalho .idioma', '.cabecalho nav a >> nth=0']) {
      const caixa = await page.locator(seletor).boundingBox();
      expect(caixa!.height, seletor).toBeGreaterThanOrEqual(44);
    }
  });
});

test.describe('360×640, cabeçalho fora da Início', () => {
  test.use(celular(360, 640));
  test('uma linha só, sem encostar', async ({ page }) => {
    await page.goto('/contato');
    const voltar = await page.locator('.cabecalho .voltar .menu-texto').boundingBox();
    expect(voltar!.height).toBeLessThan(20);
    await expect(page.locator('.cabecalho .nome')).toBeHidden();
  });
});

test('a 404 mostra a mensagem e os dois links', async ({ page }) => {
  await page.goto('/qualquer');
  await expect(page.getByText('(404)')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Página não encontrada' })).toBeVisible();
  await expect(page.locator('main a[href="/"]')).toBeVisible();
  await expect(page.locator('main a[href="/contato"]')).toBeVisible();
});

test.describe('sem JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('o rodapé da Início leva ao contato, sem o círculo por cima', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.rodape-cta')).toBeVisible();
    await expect(page.locator('.secao-contato .circulo-escuro')).toBeHidden();
  });
});
