import { expect, test } from '@playwright/test';

// Issue #15: fora da Início não há abertura, e a roda do mouse precisa rolar a página desde a primeira carga.
const PAGINAS = ['/trabalhos', '/en/work', '/contato', '/en/contact', '/privacidade', '/en/privacy', '/nao-existe', '/en/nao-existe'];

for (const caminho of PAGINAS) {
  test(`a roda do mouse rola ${caminho}`, async ({ page }) => {
    await page.goto(caminho);
    await page.waitForTimeout(1500);
    await expect(page.locator('html')).not.toHaveClass(/lenis-stopped/);
    // Página mais baixa que a janela não teria o que rolar: o teste garante altura sem mexer na página.
    await page.evaluate(() => {
      if (document.documentElement.scrollHeight > innerHeight + 600) return;
      const espaco = document.createElement('div');
      espaco.style.height = '2000px';
      document.body.append(espaco);
    });
    await page.waitForTimeout(500);
    // Na margem: no meio do /contato fica a lista da conversa, que rola por dentro (overscroll contido) e não a página.
    await page.mouse.move(40, 450);
    for (let i = 0; i < 5; i++) await page.mouse.wheel(0, 300);
    await expect.poll(() => page.evaluate(() => scrollY), { timeout: 3000 }).toBeGreaterThan(200);
  });
}
