import { expect, test } from '@playwright/test';

const SITES = ['ferramenta-criativa', 'companhia-aerea', 'banco-digital', 'estudio-de-marca', 'plataforma-de-deploy'];

// Issue #8: página Trabalhos (spec 4.4), etapa 1: lista de cartões nos dois idiomas.
for (const [caminho, lang, titulo] of [['/trabalhos', 'pt-BR', 'Trabalhos · Floway'], ['/en/work', 'en', 'Work · Floway']] as const) {
  test(`${caminho} existe, lista os 5 conceitos e abre cada site em outra aba`, async ({ page }) => {
    const erros: string[] = [];
    page.on('pageerror', (e) => erros.push(e.message));
    const resposta = await page.goto(caminho);
    expect(resposta?.status()).toBe(200);
    await expect(page.locator('html')).toHaveAttribute('lang', lang);
    await expect(page).toHaveTitle(titulo);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    const links = page.locator('main a.cartao');
    await expect(links).toHaveCount(5);
    const hrefs = await links.evaluateAll((as) => as.map((a) => [a.getAttribute('href'), a.getAttribute('target'), a.getAttribute('rel')]));
    expect(hrefs).toEqual(SITES.map((s) => [`/conceitos/${s}/index.html`, '_blank', 'noopener']));
    // Sem página de case ainda (spec 4.5): nenhum link para /trabalhos/<case>.
    await expect(page.locator('main a[href^="/trabalhos/"], main a[href^="/en/work/"]')).toHaveCount(0);
    expect(erros).toEqual([]);
  });

  test(`${caminho} não tem rolagem lateral no desktop nem no celular`, async ({ page }) => {
    for (const largura of [1440, 390]) {
      await page.setViewportSize({ width: largura, height: 844 });
      await page.goto(caminho);
      const [rolagem, janela] = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
      expect(rolagem, `${largura}px`).toBeLessThanOrEqual(janela);
    }
  });
}

test('o menu da Início leva à página Trabalhos, nos dois idiomas', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('abertura-tocou', '1'));
  for (const [inicio, destino] of [['/', '/trabalhos'], ['/en', '/en/work']] as const) {
    await page.goto(inicio);
    await expect(page.locator(`.cabecalho nav a[href="${destino}"]`)).toHaveCount(1);
  }
});

test('um caminho dentro de Trabalhos continua 404', async ({ page }) => {
  for (const caminho of ['/trabalhos/qualquer', '/en/work/qualquer']) {
    expect((await page.goto(caminho))?.status(), caminho).toBe(404);
  }
});
