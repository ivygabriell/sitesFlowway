import { expect, test, type Page } from '@playwright/test';
import { PNG } from 'pngjs';

// Issue #29, passo 4: no fim da Início, "Iniciar um projeto" abre o chat na própria cena (estado 02), com o globo indo ao
// canto, e "Fechar" volta ao estado 01. Telas em processo/telas/contato-chat-ia/ (01, 02, M02, M03).

const semAbertura = () => sessionStorage.setItem('abertura-tocou', '1');
type Caixa = { x: number; y: number; width: number; height: number };

// Pixels que não são o claro do fundo (as letras do globo).
const marcado = (d: Buffer, i: number) => Math.abs(d[i] - 0xf7) + Math.abs(d[i + 1] - 0xf7) + Math.abs(d[i + 2] - 0xf5) > 60;
async function tinta(page: Page, caixa: Caixa) {
  const png = PNG.sync.read(await page.screenshot({ clip: caixa }));
  let n = 0;
  for (let i = 0; i < png.data.length; i += 4) if (marcado(png.data, i)) n++;
  return n / (caixa.width * caixa.height);
}
// Largura do globo: colunas com letras dentro da caixa.
async function largura(page: Page, caixa: Caixa) {
  const png = PNG.sync.read(await page.screenshot({ clip: caixa }));
  const colunas: number[] = [];
  for (let x = 0; x < png.width; x++) {
    let n = 0;
    for (let y = 0; y < png.height; y += 2) if (marcado(png.data, (y * png.width + x) * 4)) n++;
    if (n > 4) colunas.push(x);
  }
  return colunas.length ? colunas[colunas.length - 1] - colunas[0] : 0;
}

// Emenda 1 do contrato: a Server Action confere o Origin contra a origem configurada (no teste, https://floway.example).
// O navegador do teste está em localhost; a emissão vai com o Origin e o host da configuração, como no site publicado.
async function origemDaConfiguracao(page: Page) {
  await page.route(u => u.pathname === '/' || u.pathname === '/en', async (route, req) => {
    if (req.method() !== 'POST' || !req.headers()['next-action']) return route.fallback();
    await route.continue({ headers: { ...req.headers(), origin: 'https://floway.example', 'x-forwarded-host': 'floway.example' } });
  });
}

async function noFimDaInicio(page: Page, comOrigem = true) {
  if (comOrigem) await origemDaConfiguracao(page);
  await page.addInitScript(semAbertura);
  await page.goto('/');
  await expect(page.locator('.abertura')).toHaveCount(0, { timeout: 8000 });
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
  await expect(page.locator('.rodape-cta')).toBeVisible({ timeout: 10_000 });
  await page.waitForTimeout(2500);
}

test.describe('desktop 1440×900', () => {
  // Só o globo nas medidas: o texto do chat também é escuro.
  const soOGlobo = '.contato-chat > :not(.contato-globo), .contato-globo-status, .cabecalho, .selo { visibility: hidden !important; }';
  const CANTO = { x: 1150, y: 560, width: 220, height: 200 };
  const DIREITA = { x: 400, y: 150, width: 1040, height: 700 };

  test('"Iniciar um projeto" não troca de página: o globo encolhe e vai ao canto passando pelo meio, e o estado 02 aparece', async ({ page }) => {
    test.setTimeout(90_000);
    await noFimDaInicio(page);
    const y = await page.evaluate(() => scrollY);
    const estilo = await page.addStyleTag({ content: soOGlobo });
    await expect.poll(() => largura(page, DIREITA), { timeout: 20_000 }).toBeGreaterThan(450);
    expect(await tinta(page, CANTO)).toBeLessThan(0.01);
    await page.locator('.rodape-cta').click();
    // Quadro a quadro até chegar: alguma medida no meio do caminho (nem o globo grande, nem o do canto).
    const medidas: number[] = [];
    await expect.poll(async () => { medidas.push(await largura(page, DIREITA)); return medidas[medidas.length - 1]; }, { timeout: 10_000, intervals: [0] }).toBeLessThan(300);
    expect(medidas.some(m => m > 320 && m < 450), `medidas: ${medidas.join(', ')}`).toBe(true);
    await expect.poll(() => tinta(page, CANTO), { timeout: 10_000 }).toBeGreaterThan(0.05);
    // O globo continua girando no canto: dois quadros seguidos não são iguais.
    const a = await page.screenshot({ clip: CANTO });
    await page.waitForTimeout(500);
    expect((await page.screenshot({ clip: CANTO })).equals(a)).toBe(false);
    await estilo.evaluate(e => (e as Element).remove());
    expect(new URL(page.url()).pathname).toBe('/');
    expect(Math.abs((await page.evaluate(() => scrollY)) - y)).toBeLessThan(2);
    // O foco no campo é conferido no teste seguinte (aqui o estilo da medida o escondeu).
    await expect(page.getByRole('heading', { name: 'Como podemos ajudar?' })).toBeVisible();
    await expect(page.locator('.frase-contato')).toBeHidden();
    await expect(page.locator('.secao-contato .rodape')).toBeHidden();
  });

  test('com o chat aberto a página não rola; "Fechar" volta ao estado 01 sem perder a conversa e devolve o foco ao CTA', async ({ page }) => {
    await noFimDaInicio(page);
    await page.locator('.rodape-cta').click();
    const campo = page.getByRole('textbox', { name: 'Sua mensagem' });
    await expect(campo).toBeFocused();
    const y = await page.evaluate(() => scrollY);
    await page.mouse.move(300, 300);
    await page.mouse.wheel(0, -1500);
    await page.keyboard.press('PageUp');
    await page.waitForTimeout(800);
    expect(Math.abs((await page.evaluate(() => scrollY)) - y)).toBeLessThan(2);
    await campo.fill('Quero um site para o estúdio');
    await campo.press('Enter');
    await expect(page.getByText(/qual é o seu nome/i)).toBeVisible();
    await page.getByRole('button', { name: /Fechar/ }).click();
    await expect(page.locator('.frase-contato')).toBeVisible();
    await expect(page.locator('.rodape-cta')).toBeFocused();
    await expect(page.locator('.contato-chat')).toBeHidden();
    expect(Math.abs((await page.evaluate(() => scrollY)) - y)).toBeLessThan(2);
    await page.locator('.rodape-cta').click();
    await expect(page.getByText('Quero um site para o estúdio')).toBeVisible();
  });

  test('falha da emissão (Origin de outro lugar): padrão da tela 07, "Tentar de novo" e o link para /contato, sem campo para enviar', async ({ page }) => {
    await noFimDaInicio(page, false);
    await page.locator('.rodape-cta').click();
    await expect(page.getByText(/Não consegui iniciar a conversa/)).toBeVisible();
    await expect(page.locator('.contato-chat .contato-globo-status')).toContainText(/não foi desta vez/i);
    await expect(page.getByRole('button', { name: 'Tentar de novo' })).toBeFocused();
    await expect(page.getByRole('textbox', { name: 'Sua mensagem' })).toHaveCount(0);
    await page.getByRole('link', { name: 'Abrir a página de contato' }).click();
    await page.waitForURL('**/contato');
  });

  test('o menu "Contato" continua indo ao /contato', async ({ page }) => {
    await noFimDaInicio(page);
    await page.locator('.cabecalho nav a[href="/contato"]').click();
    await page.waitForURL('**/contato');
    await expect(page.getByRole('heading', { name: 'Como podemos ajudar?' })).toBeVisible();
  });
});

test.describe('1100 px', () => {
  test.use({ viewport: { width: 1100, height: 900 } });
  test('o chat não passa por baixo do globo do canto, sem rolagem lateral', async ({ page }) => {
    await noFimDaInicio(page);
    await page.locator('.rodape-cta').click();
    await expect(page.getByRole('heading', { name: 'Como podemos ajudar?' })).toBeVisible();
    const chat = (await page.locator('.contato-chat .chat').boundingBox())!;
    const lugar = (await page.locator('.contato-globo-lugar').boundingBox())!;
    expect(chat.x + chat.width).toBeLessThan(lugar.x + 41);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
});

test.describe('com movimento reduzido', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });
  test('a troca de estado é instantânea: sem animação no chat, na frase nem no rodapé', async ({ page }) => {
    await noFimDaInicio(page);
    await page.locator('.rodape-cta').click();
    await expect(page.getByRole('heading', { name: 'Como podemos ajudar?' })).toBeVisible();
    const animando = await page.evaluate(() => document.getAnimations().filter(a => {
      const alvo = (a.effect as KeyframeEffect | null)?.target as Element | null;
      return alvo?.closest('.secao-contato');
    }).length);
    expect(animando).toBe(0);
    await expect(page.locator('.frase-contato')).toBeHidden();
  });
});

test.describe('sem JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('o CTA da Início leva ao formulário simples do /contato', async ({ page }) => {
    await page.goto('/');
    await page.locator('.rodape-cta').click();
    await page.waitForURL('**/contato');
    await expect(page.locator('.contato-sem-js form')).toBeVisible();
  });
});

for (const [larguraTela, alturaTela] of [[390, 844], [360, 640]] as const) {
  test.describe(`celular ${larguraTela}×${alturaTela}`, () => {
    test.use({ viewport: { width: larguraTela, height: alturaTela }, isMobile: true, hasTouch: true });
    test('o chat abre na própria cena: globo grande no vazio (M02), que vira o ícone de 40 px com a conversa (M03)', async ({ page }) => {
      test.setTimeout(90_000);
      await origemDaConfiguracao(page);
      await page.goto('/');
      await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
      await expect(page.locator('.rodape-cta')).toBeVisible({ timeout: 10_000 });
      await page.waitForTimeout(2000);
      await page.locator('.rodape-cta').tap();
      await expect(page.getByRole('heading', { name: 'Como podemos ajudar?' })).toBeVisible();
      expect(new URL(page.url()).pathname).toBe('/');
      const grande = (await page.locator('.chat-globo-lugar').boundingBox())!;
      expect(grande.height).toBeGreaterThan(60);
      await expect.poll(() => tinta(page, grande), { timeout: 15_000 }).toBeGreaterThan(0.05);
      const icone = (await page.locator('.contato-chat .contato-globo-lugar').boundingBox())!;
      expect(Math.round(icone.height)).toBe(40);
      await expect(page.locator('.contato-chat .chat-aviso')).toHaveText(/^Você revisa antes de enviar · Privacidade$/i, { useInnerText: true });
      await expect(page.getByRole('textbox', { name: 'Sua mensagem' })).toBeInViewport();
      await expect(page.locator('.contato-chat .chat-aviso')).toBeInViewport();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.getByRole('button', { name: 'Quero um site novo' }).tap();
      await expect(page.getByText(/qual é o seu nome/i)).toBeVisible();
      await expect(page.locator('.chat-globo-lugar')).toHaveCount(0);
      await expect.poll(() => tinta(page, icone), { timeout: 15_000 }).toBeGreaterThan(0.05);
      // Com o teclado aberto, o chat sobe pela parte coberta (--teclado, medido pelo visualViewport) e o campo fica à vista.
      await page.evaluate(() => document.documentElement.style.setProperty('--teclado', '300px'));
      const composer = (await page.locator('.contato-chat .chat-composer').boundingBox())!;
      expect(composer.y + composer.height).toBeLessThanOrEqual(alturaTela - 300);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    });
  });
}

// Ressalva (a) do Security: a Início e /en continuam estáticas, e nenhum token (intenção v1.<payload>.<assinatura> ou chave
// contato/<uuid>) vai ao HTML, ao RSC do build ou ao __next_f embutido.
test('/ e /en estáticas no build, sem intenção nem chave no HTML e no RSC', async ({ request }) => {
  const { readFileSync, existsSync } = await import('node:fs');
  const { join } = await import('node:path');
  const dist = join(process.cwd(), process.env.NEXT_DIST_DIR || '.next-teste');
  const rotas = JSON.parse(readFileSync(join(dist, 'prerender-manifest.json'), 'utf8')).routes;
  expect(rotas['/']).toBeTruthy();
  expect(rotas['/en']).toBeTruthy();
  const TOKEN = /v1\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}|contato\/[0-9a-f]{8}-[0-9a-f]{4}-/;
  const arquivos = ['index.html', 'index.rsc', 'en.html', 'en.rsc'].map(a => join(dist, 'server/app', a));
  for (const a of arquivos) {
    expect(existsSync(a), a).toBe(true);
    expect(readFileSync(a, 'utf8'), a).not.toMatch(TOKEN);
  }
  for (const caminho of ['/', '/en']) {
    const html = await (await request.get(caminho)).text();
    expect(html).toContain('self.__next_f');
    expect(html).not.toMatch(TOKEN);
  }
});
