import { expect, test } from '@playwright/test';

// Texto visível de cada cartão (spec 4.4): nome e a linha setor / mês e ano / oferta · Conceito.
const CARTOES = {
  pt: [
    ['Ferramenta criativa', 'Tecnologia / Novembro 2026 / Landing page · Conceito'],
    ['Companhia aérea', 'Aviação / Novembro 2026 / Site institucional · Conceito'],
    ['Banco digital', 'Finanças / Novembro 2026 / Landing page · Conceito'],
    ['Estúdio de marca', 'Design / Novembro 2026 / Site institucional · Conceito'],
    ['Plataforma de deploy', 'Tecnologia / Novembro 2026 / Landing page · Conceito'],
  ],
  en: [
    ['Creative tool', 'Technology / November 2026 / Landing page · Concept'],
    ['Airline', 'Aviation / November 2026 / Company website · Concept'],
    ['Digital bank', 'Finance / November 2026 / Landing page · Concept'],
    ['Brand studio', 'Design / November 2026 / Company website · Concept'],
    ['Deploy platform', 'Technology / November 2026 / Landing page · Concept'],
  ],
};

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

  test(`${caminho} mostra em cada cartão o nome em h2 e setor / mês e ano / oferta, traduzidos`, async ({ page }) => {
    await page.goto(caminho);
    const cartoes = page.locator('main a.cartao');
    await expect(cartoes).toHaveCount(5);
    const esperado = CARTOES[lang === 'en' ? 'en' : 'pt'];
    for (const [i, [nome, detalhes]] of esperado.entries()) {
      const cartao = cartoes.nth(i);
      await expect(cartao.locator('h2.cartao-titulo')).toHaveText(nome);
      await expect(cartao.locator('h2.cartao-titulo')).toBeVisible();
      await expect(cartao.locator('.cartao-detalhes')).toHaveText(detalhes);
      await expect(cartao.locator('.cartao-detalhes')).toBeVisible();
      await expect(cartao).toHaveAccessibleName(new RegExp(`^${nome}, ${detalhes} `));
    }
    await expect(page.locator('main h3')).toHaveCount(0);
  });

  test(`${caminho} carrega as 5 capas`, async ({ page }) => {
    await page.goto(caminho);
    const capas = page.locator('main a.cartao .cartao-img img');
    await expect(capas).toHaveCount(5);
    for (let i = 0; i < 5; i++) {
      const capa = capas.nth(i);
      await capa.scrollIntoViewIfNeeded();
      await expect.poll(() => capa.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0), `capa ${i + 1}`).toBe(true);
    }
  });

  test(`${caminho}: o Tab percorre os 5 cartões na ordem, com foco visível`, async ({ page }) => {
    await page.goto(caminho);
    const primeiro = SITES.map((s) => `/conceitos/${s}/index.html`);
    let href: string | null = null;
    for (let n = 0; n < 40 && href !== primeiro[0]; n++) {
      await page.keyboard.press('Tab');
      href = await page.evaluate(() => document.activeElement?.getAttribute('href') ?? null);
    }
    const visitados: string[] = [];
    for (let i = 0; i < 5; i++) {
      if (i > 0) await page.keyboard.press('Tab');
      const foco = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement;
        const css = getComputedStyle(el);
        return { href: el.getAttribute('href'), visivel: el.matches(':focus-visible'), contorno: css.outlineStyle !== 'none' && parseFloat(css.outlineWidth) > 0 };
      });
      expect(foco.visivel && foco.contorno, `foco visível no cartão ${i + 1}`).toBe(true);
      visitados.push(foco.href ?? '');
    }
    expect(visitados).toEqual(primeiro);
  });

  // Issue #12: a linha de detalhes só quebra entre segmentos; nenhuma linha renderizada começa ou termina com "/".
  test(`${caminho} não quebra a linha de detalhes junto a um "/"`, async ({ page }) => {
    for (const largura of [1920, 1440, 1100, 900, 390]) {
      await page.setViewportSize({ width: largura, height: 900 });
      await page.goto(caminho);
      await page.evaluate(() => document.fonts.ready);
      const linhas = await page.locator('main .cartao-detalhes').evaluateAll((ps) =>
        ps.map((p) => {
          // Agrupa cada caractere pelo topo do retângulo em que foi desenhado.
          const porTopo = new Map<number, string>();
          const andador = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
          for (let no = andador.nextNode(); no; no = andador.nextNode()) {
            const texto = no.textContent ?? '';
            for (let i = 0; i < texto.length; i++) {
              const r = document.createRange();
              r.setStart(no, i);
              r.setEnd(no, i + 1);
              const ret = r.getClientRects()[0];
              if (!ret) continue;
              const topo = Math.round(ret.top);
              porTopo.set(topo, (porTopo.get(topo) ?? '') + texto[i]);
            }
          }
          return [...porTopo.entries()].sort((a, b) => a[0] - b[0]).map(([, l]) => l.trim()).filter(Boolean);
        }),
      );
      expect(linhas).toHaveLength(5);
      for (const cartao of linhas)
        for (const linha of cartao)
          expect(linha.startsWith('/') || linha.endsWith('/'), `${largura}px: "${linha}" em ${JSON.stringify(cartao)}`).toBe(false);
    }
  });

  test(`${caminho} não tem rolagem lateral no desktop, em 1100 px, no celular nem com movimento reduzido`, async ({ page }) => {
    for (const [largura, reduzido] of [[1440, false], [1100, false], [390, false], [1440, true], [390, true]] as const) {
      await page.emulateMedia({ reducedMotion: reduzido ? 'reduce' : 'no-preference' });
      await page.setViewportSize({ width: largura, height: 844 });
      await page.goto(caminho);
      const [rolagem, janela] = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
      expect(rolagem, `${largura}px${reduzido ? ' reduzido' : ''}`).toBeLessThanOrEqual(janela);
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
