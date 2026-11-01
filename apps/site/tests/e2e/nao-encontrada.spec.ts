import { expect, test } from '@playwright/test';

// Endereço fora do mapa: 404 de verdade, na língua do caminho e fora dos buscadores (a 404 da marca entra depois).
for (const [caminho, lang] of [['/qualquer', 'pt-BR'], ['/en/qualquer', 'en'], ['/trabalhos/qualquer/coisa', 'pt-BR']] as const) {
  test(`${caminho} responde 404 em ${lang} com noindex`, async ({ page }) => {
    const resposta = await page.goto(caminho);
    expect(resposta?.status()).toBe(404);
    await expect(page.locator('html')).toHaveAttribute('lang', lang);
    // O Next acrescenta o próprio noindex na 404; todas as metas robots precisam dizer noindex.
    const robots = await page.locator('meta[name="robots"]').evaluateAll((ms) => ms.map((m) => m.getAttribute('content')));
    expect(robots.length).toBeGreaterThan(0);
    for (const r of robots) expect(r).toMatch(/noindex/);
    await expect(page.locator('.cabecalho')).toBeAttached();
  });
}
