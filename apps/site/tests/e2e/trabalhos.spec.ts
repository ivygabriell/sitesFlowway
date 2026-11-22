import { type Page, expect, test } from '@playwright/test';
import { PNG } from 'pngjs';
import { corNoPonto, perto } from './util/pixel';

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

const PAGINAS = [['/trabalhos', 'pt-BR', 'Trabalhos · Floway'], ['/en/work', 'en', 'Work · Floway']] as const;

// Issue #8: página Trabalhos (spec 4.4), etapa 1: lista de cartões nos dois idiomas. Desde a etapa 2 (issue #11) a lista
// é a página do celular, do movimento reduzido e do sem WebGL; no desktop com WebGL entra a pilha (abaixo).
test.describe('lista no celular', () => {
  test.use({ viewport: { width: 390, height: 844 } });
for (const [caminho, lang, titulo] of PAGINAS) {
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
  // Com movimento reduzido, para a lista existir também nas larguras de desktop.
  test(`${caminho} não quebra a linha de detalhes junto a um "/"`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
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

}
});

for (const [caminho] of PAGINAS) {
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

// Issue #11: página Trabalhos, etapa 2 (spec 4.4): no desktop com WebGL, a pilha de planos presa por (n − 1) telas.
const PILHA = {
  pt: { rotulo: 'Ver trabalho', nomes: CARTOES.pt.map(([n]) => n), info: CARTOES.pt.map(([, d]) => d) },
  en: { rotulo: 'View work', nomes: CARTOES.en.map(([n]) => n), info: CARTOES.en.map(([, d]) => d) },
};
const infoDigitada = (linha: string) => linha.split(' / ').join('');

test.describe('pilha no desktop com WebGL', () => {
  for (const [caminho, lang] of PAGINAS) {
    const esperado = PILHA[lang === 'en' ? 'en' : 'pt'];
    test(`${caminho}: pilha presa por 4 telas, contador (01/05), nome em serifa 3,4vw e info digitada, sem a lista`, async ({ page }) => {
      const erros: string[] = [];
      page.on('pageerror', (e) => erros.push(e.message));
      await page.goto(caminho);
      const pilha = page.locator('.pilha-trabalhos');
      await expect(pilha).toBeVisible();
      await expect(page.locator('main a.cartao')).toHaveCount(0);
      await expect(page.locator('.pilha-contador')).toHaveText('(01/05)');
      const alvos = page.locator('a.pilha-alvo');
      await expect(alvos).toHaveCount(5);
      expect(await alvos.evaluateAll((as) => as.map((a) => [a.getAttribute('href'), a.getAttribute('target')]))).toEqual(SITES.map((s) => [`/conceitos/${s}/index.html`, '_blank']));
      const nome = alvos.first().locator('.pilha-nome');
      await expect(nome).toHaveText(esperado.nomes[0]);
      await expect(nome).toBeVisible();
      await expect(nome).toHaveCSS('font-size', `${(1440 * 3.4) / 100}px`);
      expect(await nome.evaluate((e) => getComputedStyle(e).fontFamily)).toMatch(/Instrument Serif/);
      await expect(page.locator('.pilha-info')).toHaveText(infoDigitada(esperado.info[0]), { timeout: 6000 });
      await expect(page.locator('.pilha-miniaturas img')).toHaveCount(5);
      await expect(page.locator('.pilha-moldura')).toBeVisible();
      // (n − 1) telas de rolagem presa: a página tem 5 alturas de tela.
      expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBe(5 * 900);
      // Sem página de case (spec 4.5).
      await expect(page.locator('main a[href^="/trabalhos/"], main a[href^="/en/work/"]')).toHaveCount(0);
      expect(erros).toEqual([]);
    });

    test(`${caminho}: cada tela de rolagem troca o trabalho, e a rolagem assenta no mais próximo`, async ({ page }) => {
      await page.goto(caminho);
      await expect(page.locator('.pilha-contador')).toHaveText('(01/05)');
      await page.waitForTimeout(2500); // fim da entrada
      await page.evaluate(() => window.scrollTo(0, 900));
      await expect(page.locator('.pilha-contador')).toHaveText('(02/05)');
      await expect(page.locator('.pilha-info')).toHaveText(infoDigitada(esperado.info[1]));
      await expect(page.locator('a.pilha-alvo.ativo .pilha-nome')).toHaveText(esperado.nomes[1]);
      // Parada a 3/4 do caminho para o 4º trabalho: assenta nele.
      await page.evaluate(() => window.scrollTo(0, 2 * 900 + 700));
      await expect.poll(() => page.evaluate(() => window.scrollY), { timeout: 5000 }).toBeGreaterThan(3 * 900 - 3);
      await expect(page.locator('.pilha-contador')).toHaveText('(04/05)');
    });
  }

  // Issue #15: fora da Início ninguém encerrava a abertura e o Lenis ficava travado; a roda do mouse não rolava a pilha.
  test('a roda do mouse rola a pilha e assenta no trabalho seguinte', async ({ page }) => {
    await page.goto('/trabalhos');
    await expect(page.locator('.pilha-contador')).toHaveText('(01/05)');
    await page.waitForTimeout(2500);
    await page.mouse.move(720, 450);
    for (let i = 0; i < 5; i++) {
      await page.mouse.wheel(0, 100);
      await page.waitForTimeout(50);
    }
    await expect.poll(() => page.evaluate(() => window.scrollY), { timeout: 5000 }).toBe(900);
    await expect(page.locator('.pilha-contador')).toHaveText('(02/05)');
  });

  // Assentar é no mais próximo da parada, não no sentido da rolagem: 300 px (1/3 da tela) voltam ao 1º trabalho.
  test('uma rodada curta (300 px) assenta de volta no trabalho atual', async ({ page }) => {
    await page.goto('/trabalhos');
    await expect(page.locator('.pilha-contador')).toHaveText('(01/05)');
    await page.waitForTimeout(2500);
    await page.mouse.move(720, 450);
    for (let i = 0; i < 3; i++) {
      await page.mouse.wheel(0, 100);
      await page.waitForTimeout(50);
    }
    await expect.poll(() => page.evaluate(() => window.scrollY), { timeout: 3000 }).toBeGreaterThan(200);
    await page.waitForTimeout(2500);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    await expect(page.locator('.pilha-contador')).toHaveText('(01/05)');
  });

  // Protótipo 10: o convite é frase normal, sem caixa-alta (dentro da pílula escura da decisão de contraste).
  test('"Ver trabalho" aparece como frase, sem caixa-alta, na pílula escura', async ({ page }) => {
    await page.goto('/trabalhos');
    const rotulo = page.locator('a.pilha-alvo.ativo .pilha-rotulo');
    await expect(rotulo).toHaveText('Ver trabalho');
    await expect(rotulo).toHaveCSS('text-transform', 'none');
    await expect(rotulo).toHaveCSS('background-color', 'rgb(18, 18, 18)');
  });

  test('o plano do trabalho atual é desenhado no centro, sobre o fundo escuro', async ({ page }) => {
    await page.goto('/trabalhos');
    await page.waitForTimeout(3000);
    // Pontos dentro do plano (50vh × 74vh no centro): a maioria mostra a capa, não o fundo #121212.
    const dentro = [[-150, -250], [150, -250], [-150, 0], [150, 250], [-150, 250]];
    let capa = 0;
    for (const [dx, dy] of dentro) if (!perto(await corNoPonto(page, 720 + dx, 450 + dy), '#121212', 10)) capa++;
    expect(capa).toBeGreaterThanOrEqual(3);
    // Fora do plano, o fundo.
    expect(perto(await corNoPonto(page, 200, 450 - 300), '#121212', 10)).toBe(true);
  });

  test('teclado: o Tab percorre os 5 "Ver trabalho", com foco visível, e o Enter abre o site em outra aba', async ({ page, context }) => {
    await page.goto('/trabalhos');
    await page.waitForTimeout(2500);
    let classe = '';
    for (let n = 0; n < 40 && !classe.includes('pilha-alvo'); n++) {
      await page.keyboard.press('Tab');
      classe = await page.evaluate(() => document.activeElement?.className ?? '');
    }
    for (let i = 0; i < 5; i++) {
      if (i > 0) await page.keyboard.press('Tab');
      const foco = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement;
        const css = getComputedStyle(el);
        return { href: el.getAttribute('href'), visivel: el.matches(':focus-visible'), contorno: css.outlineStyle !== 'none' && parseFloat(css.outlineWidth) > 0 };
      });
      expect(foco.href).toBe(`/conceitos/${SITES[i]}/index.html`);
      expect(foco.visivel && foco.contorno, `foco visível no trabalho ${i + 1}`).toBe(true);
      await expect(page.locator('.pilha-contador')).toHaveText(`(0${i + 1}/05)`);
      await expect(page.locator('a.pilha-alvo:focus .pilha-rotulo')).toBeVisible();
    }
    const [aba] = await Promise.all([context.waitForEvent('page'), page.keyboard.press('Enter')]);
    await aba.waitForLoadState();
    expect(new URL(aba.url()).pathname).toBe(`/conceitos/${SITES[4]}/index.html`);
  });

  test('em 1100 px também é a pilha, sem rolagem lateral', async ({ page }) => {
    await page.setViewportSize({ width: 1100, height: 900 });
    await page.goto('/trabalhos');
    await expect(page.locator('.pilha-trabalhos')).toBeVisible();
    await expect(page.locator('.pilha-contador')).toHaveText('(01/05)');
    const [rolagem, janela] = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
    expect(rolagem).toBeLessThanOrEqual(janela);
  });
});

// Issue #23: a cada quadro desde a navegação (antes do primeiro desenho), anota se havia <main> e se um cartão da lista
// estava visível. rAF roda antes de cada desenho, então cobre todo quadro que chega à tela.
async function vigiarLista(page: Page) {
  await page.addInitScript(() => {
    const quadros: { main: boolean; lista: boolean }[] = [];
    (window as unknown as { quadrosDaLista: typeof quadros }).quadrosDaLista = quadros;
    const olhar = () => {
      const cartao = document.querySelector('main a.cartao');
      quadros.push({ main: !!document.querySelector('main'), lista: !!cartao && cartao.checkVisibility({ visibilityProperty: true, opacityProperty: true }) });
      if (quadros.length < 2000) requestAnimationFrame(olhar);
    };
    requestAnimationFrame(olhar);
  });
}
const quadrosDaLista = (page: Page) => page.evaluate(() => (window as unknown as { quadrosDaLista: { main: boolean; lista: boolean }[] }).quadrosDaLista);

test.describe('tela única: a lista não aparece antes da pilha (issue #23)', () => {
  for (const [caminho] of PAGINAS) {
    test(`${caminho} no desktop com WebGL: nenhum quadro com a lista, desde o primeiro`, async ({ page }) => {
      await vigiarLista(page);
      await page.goto(caminho, { waitUntil: 'commit' });
      await expect(page.locator('.pilha-trabalhos')).toBeVisible();
      const quadros = await quadrosDaLista(page);
      expect(quadros.some((q) => q.main), 'algum quadro com <main>').toBe(true);
      expect(quadros.filter((q) => q.lista).length, 'quadros com a lista visível').toBe(0);
    });
  }

  for (const [largura, reduzido] of [[390, false], [1440, true]] as const) {
    test(`${largura} px${reduzido ? ' com movimento reduzido' : ''}: a lista aparece já no primeiro quadro com <main>`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: reduzido ? 'reduce' : 'no-preference' });
      await page.setViewportSize({ width: largura, height: 844 });
      await vigiarLista(page);
      await page.goto('/trabalhos', { waitUntil: 'commit' });
      await expect(page.locator('main a.cartao').first()).toBeVisible();
      // Coleta até passar a hidratação: 60 quadros com <main> (~1 s a 60 Hz).
      await expect.poll(async () => (await quadrosDaLista(page)).filter((q) => q.main).length).toBeGreaterThanOrEqual(60);
      const quadros = (await quadrosDaLista(page)).filter((q) => q.main);
      expect(quadros.every((q) => q.lista), 'lista visível em todo quadro com <main>').toBe(true);
    });
  }
});

// Revisão do PR #25: se o JS da página não roda (chunk bloqueado, erro de hidratação), a lista não pode ficar escondida
// para sempre no desktop; o CSS a devolve sozinho depois de um tempo.
test('desktop com os scripts da página bloqueados: a lista volta a aparecer sem hidratação', async ({ page }) => {
  await page.route('**/_next/static/chunks/**', (rota) => rota.abort());
  await page.goto('/trabalhos');
  await expect(page.locator('main a.cartao')).toHaveCount(5);
  await expect(page.locator('.pagina-trabalhos-titulo')).toBeVisible({ timeout: 8000 });
  await expect(page.locator('main a.cartao').first()).toBeVisible();
  await expect(page.getByRole('link', { name: /^Ferramenta criativa/ })).toBeVisible();
});

// Revisão do delta c9be30a: com os chunks atrasados além dos 4 s, o CSS revela a lista; quando a hidratação chega, a lista
// fica nessa carga (trocar pela pilha seria a tela dupla da #23 em rede lenta).
test('desktop com os scripts atrasados além de 4 s: a lista revelada não é trocada pela pilha', async ({ page }) => {
  await vigiarLista(page);
  // Segura os chunks até o CSS revelar a lista; só então os libera (sem depender de um atraso fixo).
  let liberar!: () => void;
  const liberados = new Promise<void>((r) => (liberar = r));
  await page.route('**/_next/static/chunks/**', async (rota) => {
    await liberados;
    await rota.continue().catch(() => {});
  });
  await page.goto('/trabalhos', { waitUntil: 'commit' });
  await expect(page.locator('main a.cartao').first()).toBeVisible({ timeout: 10000 });
  liberar();
  // A página hidratou e decidiu o modo com o canvas pronto: o <main> perde esperando-pilha (lista ou pilha).
  await expect(page.locator('main')).not.toHaveClass(/esperando-pilha/, { timeout: 15000 });
  await expect(page.locator('html')).toHaveClass(/modo-desktop/);
  const antes = (await quadrosDaLista(page)).length;
  await expect.poll(async () => (await quadrosDaLista(page)).length - antes).toBeGreaterThanOrEqual(30);
  await expect(page.locator('.pilha-trabalhos')).toHaveCount(0);
  const quadros = await quadrosDaLista(page);
  const revelada = quadros.findIndex((q) => q.lista);
  expect(revelada).toBeGreaterThanOrEqual(0);
  expect(quadros.slice(revelada).every((q) => q.lista), 'a lista some depois de revelada').toBe(true);
});

test.describe('sem a pilha: celular e movimento reduzido ficam com a lista', () => {
  for (const [largura, reduzido] of [[390, false], [1440, true]] as const) {
    test(`${largura} px${reduzido ? ' com movimento reduzido' : ''}: lista de 5 cartões, sem pilha`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: reduzido ? 'reduce' : 'no-preference' });
      await page.setViewportSize({ width: largura, height: 844 });
      await page.goto('/trabalhos');
      await expect(page.locator('main a.cartao')).toHaveCount(5);
      await expect(page.locator('main a.cartao').first()).toBeVisible();
      await page.waitForTimeout(500);
      await expect(page.locator('.pilha-trabalhos')).toHaveCount(0);
    });
  }
});

test.describe('sem WebGL', () => {
  // Navegador sem WebGL: o contexto não é criado (o launchOptions não pode mudar dentro deste arquivo).
  test('no desktop fica a lista de 5 cartões, sem pilha', async ({ page }) => {
    await page.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, tipo: string, ...resto: unknown[]) {
        return /webgl/.test(tipo) ? null : (original as (...a: unknown[]) => unknown).call(this, tipo, ...resto);
      } as typeof original;
    });
    await page.goto('/trabalhos');
    await expect(page.locator('main a.cartao')).toHaveCount(5);
    await page.waitForTimeout(500);
    await expect(page.locator('.pilha-trabalhos')).toHaveCount(0);
  });
});

// Revisão do PR #16: contraste do texto claro (#F7F7F5) com o fundo renderizado logo em volta das letras (capa, hover e
// sombra), num anel de 3 px fora de cada letra; o fundo é o p95 da luminância do anel (o pior caso, sem pixel solto).
const linear = (c: number) => (c / 255 <= 0.04045 ? c / 255 / 12.92 : ((c / 255 + 0.055) / 1.055) ** 2.4);
const luminancia = (d: Buffer, i: number) => 0.2126 * linear(d[i]) + 0.7152 * linear(d[i + 1]) + 0.0722 * linear(d[i + 2]);
const L_CLARO = luminancia(Buffer.from([0xf7, 0xf7, 0xf5]), 0);

async function contrasteDoTexto(page: Page, seletor: string) {
  const el = page.locator(seletor);
  const c = (await el.boundingBox())!;
  const clip = { x: Math.floor(c.x - 6), y: Math.floor(c.y - 6), width: Math.ceil(c.width + 12), height: Math.ceil(c.height + 12) };
  const com = PNG.sync.read(await page.screenshot({ clip }));
  // Só as letras somem (a sombra tem cor própria e fica): o resto é o fundo que o texto realmente tem.
  await el.evaluate((e: HTMLElement) => (e.style.color = 'transparent'));
  const sem = PNG.sync.read(await page.screenshot({ clip }));
  await el.evaluate((e: HTMLElement) => (e.style.color = ''));
  const { width: w, height: h } = com;
  const letra = (x: number, y: number) => luminancia(com.data, (y * w + x) * 4) - luminancia(sem.data, (y * w + x) * 4) > 0.2;
  const mascara = Array.from({ length: w * h }, (_, p) => letra(p % w, Math.floor(p / w)));
  const anel: number[] = [];
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      if (mascara[y * w + x]) continue;
      let perto = false;
      for (let dy = -3; dy <= 3 && !perto; dy++)
        for (let dx = -3; dx <= 3 && !perto; dx++) perto = x + dx >= 0 && x + dx < w && y + dy >= 0 && y + dy < h && mascara[(y + dy) * w + x + dx];
      if (perto) anel.push(luminancia(sem.data, (y * w + x) * 4));
    }
  expect(anel.length, `letras de ${seletor} encontradas`).toBeGreaterThan(50);
  anel.sort((a, b) => a - b);
  return (L_CLARO + 0.05) / (anel[Math.floor(anel.length * 0.95)] + 0.05);
}

test('contraste nas 5 capas, em repouso e no hover: "Ver trabalho" ≥ 4,5:1 e nome ≥ 3:1', async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto('/trabalhos');
  await page.waitForTimeout(3000);
  const medidas: { capa: string; hover: boolean; rotulo: number; nome: number }[] = [];
  for (let i = 0; i < 5; i++) {
    await page.mouse.move(5, 450);
    await page.evaluate((y) => window.scrollTo(0, y), i * 900);
    await expect(page.locator('.pilha-contador')).toHaveText(`(0${i + 1}/05)`);
    await page.waitForTimeout(1500);
    for (const hover of [false, true]) {
      if (hover) {
        await page.mouse.move(720, 250);
        await page.waitForTimeout(700);
      }
      const rotulo = await contrasteDoTexto(page, 'a.pilha-alvo.ativo .pilha-rotulo');
      const nome = await contrasteDoTexto(page, 'a.pilha-alvo.ativo .pilha-nome');
      medidas.push({ capa: SITES[i], hover, rotulo: Math.round(rotulo * 100) / 100, nome: Math.round(nome * 100) / 100 });
    }
  }
  console.log(JSON.stringify(medidas));
  for (const m of medidas) {
    expect.soft(m.rotulo, `"Ver trabalho" em ${m.capa}${m.hover ? ' (hover)' : ''}`).toBeGreaterThanOrEqual(4.5);
    expect.soft(m.nome, `nome em ${m.capa}${m.hover ? ' (hover)' : ''}`).toBeGreaterThanOrEqual(3);
  }
});
