import { expect, test } from '@playwright/test';

// Issue #15: fora da Início não há abertura, e a roda do mouse precisa rolar a página desde a primeira carga.
const PAGINAS = ['/trabalhos', '/en/work', '/contato', '/en/contact', '/privacidade', '/en/privacy', '/nao-existe', '/en/nao-existe'];

for (const caminho of PAGINAS) {
  test(`a roda do mouse rola ${caminho}`, async ({ page }) => {
    await page.goto(caminho);
    const html = page.locator('html');
    // O Lenis precisa ter montado e ligado: sem isso a roda rolaria nativa e o teste passaria até sem a correção.
    await expect(html).toHaveClass(/\bjs-smooth-scrollbar-enabled\b/);
    await expect(html).toHaveClass(/\blenis\b/);
    await expect(html).not.toHaveClass(/\blenis-stopped\b/);
    // Página mais baixa que a janela não teria o que rolar: o teste garante altura sem mexer na página.
    // A classe lenis-smooth só aparece quando é o próprio Lenis que anima a rolagem; o observador guarda se ela apareceu.
    await page.evaluate(() => {
      const w = window as unknown as { rolouSuave: boolean };
      w.rolouSuave = false;
      new MutationObserver(() => {
        if (document.documentElement.classList.contains('lenis-smooth')) w.rolouSuave = true;
      }).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
      if (document.documentElement.scrollHeight > innerHeight + 600) return;
      const espaco = document.createElement('div');
      espaco.style.height = '2000px';
      document.body.append(espaco);
    });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollHeight - innerHeight)).toBeGreaterThan(600);
    // Na margem: no meio do /contato fica a lista da conversa, que rola por dentro (overscroll contido) e não a página.
    await page.mouse.move(40, 450);
    // Repete a roda até a rolagem aparecer (o Lenis recalcula o limite depois que a altura muda).
    await expect
      .poll(async () => {
        await page.mouse.wheel(0, 300);
        return page.evaluate(() => scrollY);
      }, { timeout: 10_000 })
      .toBeGreaterThan(200);
    expect(await page.evaluate(() => (window as unknown as { rolouSuave: boolean }).rolouSuave)).toBe(true);
  });
}
