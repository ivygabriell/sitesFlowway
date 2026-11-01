import { expect, test } from '@playwright/test';

for (const [caminho, lang] of [['/', 'pt-BR'], ['/en', 'en']] as const) {
  test(`${caminho} abre em ${lang}, com o hero e fora dos buscadores`, async ({ page }) => {
    const erros: string[] = [];
    page.on('pageerror', (e) => erros.push(e.message));
    const resposta = await page.goto(caminho);
    expect(resposta?.status()).toBe(200);
    await expect(page.locator('html')).toHaveAttribute('lang', lang);
    await expect(page.locator('.secao-hero')).toBeAttached();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    expect(erros).toEqual([]);
  });
}
