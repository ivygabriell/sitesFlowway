import { expect, test, type Page } from '@playwright/test';

// Perfil com IA: a conversa pede os dados, o "Gemini" (simulado aqui, sem serviço externo) qualifica o projeto e
// devolve o resumo; o envio segue pelo protocolo de sempre, também simulado na borda.
test.beforeEach(async ({ page }) => {
  await page.route('**/*', route => {
    const u = new URL(route.request().url());
    return u.origin === 'http://localhost:3100' ? route.continue() : route.abort('blockedbyclient');
  });
  await page.route('**/api/contato/conversa', async route => {
    const d = route.request().postDataJSON();
    const primeira = d.historico.length === 0;
    await route.fulfill({ status: 200, json: primeira
      ? { turnoId: d.turnoId, resposta: 'Qual é o objetivo do projeto?', mensagemSugerida: null, opcoes: ['Gerar contatos', 'Vender mais'] }
      : { turnoId: d.turnoId, resposta: 'Montei um resumo para você conferir.', mensagemSugerida: 'Projeto: Site\nObjetivo: Gerar contatos', opcoes: [] } });
  });
  await page.route('**/api/contato', async route => {
    await route.fulfill({ status: 202, json: { ok: false, estado: 'incerto', codigo: 'RESULTADO_INCERTO' }, headers: { 'Retry-After': '60' } });
  });
});

const TEXTOS = {
  '/contato': { campo: 'Sua mensagem', naoSei: 'Ainda não sei, quero conversar', resumo: 'Resumo do pedido', confirmar: 'Confirmar e enviar', pendente: /Não consegui confirmar o envio/, enviado: /Pedido enviado/, recebido: /pedido recebido/i, parar: 'Parar' },
  '/en/contact': { campo: 'Your message', naoSei: 'Not sure yet, let\'s talk', resumo: 'Request summary', confirmar: 'Confirm and send', pendente: /I could not confirm the submission/, enviado: /Request sent/, recebido: /request received/i, parar: 'Stop' },
};

// Estado 02 → IA (opções em pílula) → dados por perguntas fixas → cartão de resumo.
async function ateOEnvio(page: Page, caminho: keyof typeof TEXTOS = '/contato') {
  const r = TEXTOS[caminho];
  await page.goto(caminho);
  await page.getByRole('button', { name: r.naoSei, exact: true }).click();
  await page.getByRole('button', { name: 'Gerar contatos' }).click();
  const campo = page.getByRole('textbox', { name: r.campo });
  for (const valor of ['Pessoa de teste', 'Empresa de teste', '(11) 98765-4321', 'pessoa@empresa.dev']) {
    await expect(campo).toBeEditable();
    await campo.fill(valor); await campo.press('Enter');
  }
  const resumo = page.getByRole('region', { name: r.resumo });
  await expect(resumo).toBeVisible();
  return resumo;
}

for (const caminho of Object.keys(TEXTOS) as (keyof typeof TEXTOS)[]) {
  test(`${caminho}: IA com opções, dados fora da IA, cartão e confirmação pendente com "tentar de novo"`, async ({ page }) => {
    const r = TEXTOS[caminho];
    const conversas: unknown[] = [];
    page.on('request', q => { if (q.url().endsWith('/api/contato/conversa')) conversas.push(q.postDataJSON()); });
    const resumo = await ateOEnvio(page, caminho);
    // Nome, empresa, WhatsApp e e-mail nunca vão para a IA.
    expect(JSON.stringify(conversas)).not.toMatch(/Pessoa de teste|98765|pessoa@empresa/);
    await expect(resumo).toContainText('Gerar contatos');
    await expect(resumo).toContainText('(11) 98765-4321 · pessoa@empresa.dev');
    await page.getByRole('button', { name: r.confirmar }).click();
    await expect(page.getByText(r.pendente)).toBeVisible();
    await expect(resumo).toBeVisible();
    await expect(page.locator('.contato-globo')).toHaveAttribute('data-status', 'falha');
  });
}

async function aceitar(page: Page) {
  await page.route('**/api/contato', async route => {
    const request = route.request();
    const form = await new Response(request.postData() ?? '', { headers: { 'content-type': request.headers()['content-type'] } }).formData();
    const prazo = JSON.parse(Buffer.from(String(form.get('intencao')).split('.')[1], 'base64url').toString()).expiraEm;
    await route.fulfill({ status: 200, json: { ok: true, estado: 'aceito', requestId: '10000000-0000-4000-8000-000000000001', repetirAte: prazo } });
  });
}

for (const [width, height] of [[1440, 900], [1100, 900], [768, 1024], [390, 844], [360, 640]]) {
  test(`${width}x${height}: do vazio ao "pedido enviado" sem rolagem lateral nem erro no console; o F só no aceite`, async ({ page }) => {
    const erros: string[] = []; page.on('pageerror', e => erros.push(e.message)); page.on('console', m => { if (m.type() === 'error') erros.push(m.text()); });
    await page.setViewportSize({ width, height }); await aceitar(page);
    await ateOEnvio(page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page.locator('.contato-globo')).toHaveAttribute('data-status', 'resumo');
    await page.getByRole('button', { name: 'Confirmar e enviar' }).click();
    await expect(page.getByRole('heading', { name: /Pedido enviado/ })).toBeVisible();
    await expect(page.locator('.contato-globo-status')).toContainText(/pedido recebido/i);
    await expect(page.getByRole('link', { name: 'Ver trabalhos' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(erros).toEqual([]);
  });
}

test('a resposta da IA aparece palavra por palavra com cursor e "pensando"; "parar" mostra a mensagem inteira', async ({ page }) => {
  const resposta = 'Entendi: um site novo, encontrável no Google e com orçamento online. Para quando vocês precisam dele no ar?';
  await page.route('**/api/contato/conversa', route => route.fulfill({ status: 200, json: { turnoId: route.request().postDataJSON().turnoId, resposta, mensagemSugerida: null, opcoes: ['Urgente'] } }));
  await page.goto('/contato');
  await page.getByRole('button', { name: 'Quero um site novo' }).click();
  await expect(page.getByText('Quero um site novo').first()).toBeVisible();
  // Estado intermediário confirmado por condição no navegador: parte do texto visível, cursor azul e "pensando".
  await page.waitForFunction(t => { const p = document.querySelector('.chat-revelando p'); return !!p && p.textContent!.length > 5 && p.textContent!.length < t.length && !!p.querySelector('.chat-cursor'); }, resposta, { polling: 'raf' });
  await expect(page.locator('.contato-globo')).toHaveAttribute('data-status', 'pensando');
  await expect(page.getByRole('button', { name: 'Urgente' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Parar' }).click();
  await expect(page.locator('.chat-revelando')).toHaveCount(0);
  await expect(page.getByText(resposta)).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Sua mensagem' })).toBeFocused();
  await expect(page.getByRole('button', { name: 'Urgente' })).toBeVisible();
});

test('"parar" com o pedido no ar aborta a chamada e devolve o texto ao campo', async ({ page }) => {
  let abortou = false;
  page.on('requestfailed', q => { if (q.url().endsWith('/api/contato/conversa')) abortou = true; });
  await page.route('**/api/contato/conversa', async route => { await new Promise(r => setTimeout(r, 6000)); await route.fulfill({ status: 200, json: {} }).catch(() => {}); });
  await page.goto('/contato');
  const campo = page.getByRole('textbox', { name: 'Sua mensagem' });
  await campo.fill('Meu projeto'); await campo.press('Enter');
  await expect(page.locator('.chat-pensando')).toBeVisible();
  await page.getByRole('button', { name: 'Parar' }).click();
  await expect(campo).toHaveValue('Meu projeto');
  await expect(page.locator('.chat-voce')).toHaveCount(0);
  await expect.poll(() => abortou).toBe(true);
});

test('falha da IA vira mensagem em azul e mantém o texto no campo para tentar de novo', async ({ page }) => {
  await page.route('**/api/contato/conversa', route => route.fulfill({ status: 503, json: { erro: { codigo: 'IA_INDISPONIVEL' } } }));
  await page.goto('/contato');
  const campo = page.getByRole('textbox', { name: 'Sua mensagem' });
  await campo.fill('Meu projeto'); await campo.press('Enter');
  await expect(page.locator('.chat-erro')).toContainText('Não consegui responder agora');
  await expect(page.locator('.chat-erro p')).toHaveCSS('color', 'rgb(0, 47, 167)');
  await expect(campo).toHaveValue('Meu projeto');
});

for (const status of [429, 503, 409]) {
  test(`202 seguido de ${status} conserva pendência e corpo; aceito só por prova`, async ({ page }) => {
    let primeira: string | null = null, chamadas = 0, mesmoCorpo = true, aceitou = false;
    await page.route('**/api/contato', async route => {
      const request = route.request();
      const form = await new Response(request.postData() ?? '', { headers: { 'content-type': request.headers()['content-type'] } }).formData();
      const corpo = JSON.stringify([...form.entries()]);
      if (primeira === null) primeira = corpo; else mesmoCorpo &&= primeira === corpo;
      chamadas++;
      const repetirAte = JSON.parse(Buffer.from(String(form.get('intencao')).split('.')[1], 'base64url').toString()).expiraEm;
      if (aceitou) await route.fulfill({ status: 200, json: { ok: true, estado: 'aceito', repetirAte, requestId: '10000000-0000-4000-8000-000000000001' } });
      else await route.fulfill({ status: chamadas === 1 ? 202 : status, json: { ok: false, estado: chamadas === 1 || status === 409 ? 'incerto' : 'falha', codigo: status === 409 ? 'ENVIO_EM_ANDAMENTO' : 'LIMITE_ATINGIDO', repetivel: false }, headers: { 'Retry-After': '1' } });
    });
    await ateOEnvio(page);
    await page.getByRole('button', { name: 'Confirmar e enviar' }).click();
    await expect.poll(() => chamadas).toBeGreaterThanOrEqual(2);
    await expect(page.getByText(/Não consegui confirmar o envio/)).toBeVisible();
    await expect(page.getByRole('heading', { name: /Pedido enviado/ })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Tentar de novo' })).toBeEnabled({ timeout: 15000 });
    aceitou = true; await page.getByRole('button', { name: 'Tentar de novo' }).click();
    await expect(page.getByRole('heading', { name: /Pedido enviado/ })).toBeVisible(); expect(mesmoCorpo).toBe(true);
  });
}

test('expiração da pendência conserva a cópia sem renovar', async ({ page }) => {
  let prazo = '', chamadas = 0;
  await page.clock.install();
  await page.route('**/api/contato', async route => {
    chamadas++; const r = route.request(); const f = await new Response(r.postData() ?? '', { headers: { 'content-type': r.headers()['content-type'] } }).formData();
    prazo = JSON.parse(Buffer.from(String(f.get('intencao')).split('.')[1], 'base64url').toString()).expiraEm;
    await route.fulfill({ status: 202, json: { ok: false, estado: 'incerto', repetirAte: prazo }, headers: { 'Retry-After': '60' } });
  });
  const resumo = await ateOEnvio(page);
  await page.getByRole('button', { name: 'Confirmar e enviar' }).click();
  await expect(page.getByText(/Não consegui confirmar o envio/)).toBeVisible();
  await page.clock.setFixedTime(new Date(prazo)); await page.clock.runFor(300);
  await expect(page.getByText(/Prazo de repetição encerrado/)).toBeVisible(); await expect(page.getByRole('button', { name: 'Tentar de novo' })).toHaveCount(0);
  await expect(resumo).toContainText('Gerar contatos');
  expect(chamadas).toBe(1);
});

for (const idioma of ['pt', 'en'] as const) {
  test(`${idioma}: HTML nativo HTTPS sem JS revisa, confirma e repete com Origin exato`, async ({ browser }) => {
    // SSR carrega o handler real com o mesmo alias server-only dos unitários.
    const { createServer } = await import('vite');
    const runner = await createServer({ configFile: false, server: { middlewareMode: true }, resolve: { alias: { '@': `${process.cwd()}/src`, 'server-only': `${process.cwd()}/tests/unit/somenteServidor.ts` } } });
    const contexto = await browser.newContext({ javaScriptEnabled: false, serviceWorkers: 'block' });
    try {
      const { receberContato } = await runner.ssrLoadModule('/src/lib/contato/servidor.ts') as typeof import('../../src/lib/contato/servidor');
      const { criarIntencao } = await runner.ssrLoadModule('/src/lib/contato/intencao.ts') as typeof import('../../src/lib/contato/intencao');
      const { lerConfiguracao } = await runner.ssrLoadModule('/src/lib/contato/configuracao.ts') as typeof import('../../src/lib/contato/configuracao');
      const { responderContatoHtml } = await runner.ssrLoadModule('/src/lib/contato/html.ts') as typeof import('../../src/lib/contato/html');
      const origem = 'https://floway.example';
      const configuracao = lerConfiguracao({ CONTATO_ORIGEM: origem, CONTATO_CHAVE_HMAC: 'chave-ficticia-exclusiva-do-runner-nativo-2026', CONTATO_CANAL: 'nativo-e2e', CONTATO_ENVIO_ATIVO: 'true', RESEND_API_KEY: 're_ficticia', CONTATO_REMETENTE: 'sender@example.test', CONTATO_DESTINO: 'dest@example.test' });
      const agora = Date.now();
      const intencao = criarIntencao(idioma, configuracao, agora);
      const origens: (string | null)[] = [], corpos: string[] = [], chaves: (string | null)[] = [];
      const deps = { configuracao, agora: () => agora, fetch: (async (url, init) => {
        expect(String(url)).toBe('https://api.resend.com/emails');
        corpos.push(String(init?.body)); chaves.push(new Headers(init?.headers).get('Idempotency-Key'));
        return corpos.length === 1 ? Response.json({}, { status: 500 }) : Response.json({ id: '20000000-0000-4000-8000-000000000001' });
      }) as typeof fetch };
      await contexto.route('**/*', async route => {
        const request = route.request();
        if (new URL(request.url()).origin !== origem) return route.abort('blockedbyclient');
        let resposta: Response;
        if (request.method() === 'GET' && new URL(request.url()).pathname === '/inicio-nativo') {
          resposta = responderContatoHtml({ status: 422, idioma, acao: 'revisar', estado: 'falha', pedido: { nome: '', empresa: '', contato: '', mensagem: '' }, intencao, chave: '', repetirAte: null, agora });
          // A fixture de entrada representa a página inicial Next, antes do primeiro POST.
          resposta.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
        } else if (request.method() === 'POST' && new URL(request.url()).pathname === '/api/contato') {
          // Cabeçalhos/corpo são os gerados pelo navegador; Origin nunca é corrigido pelo runner.
          const req = new Request(request.url(), { method: request.method(), headers: await request.allHeaders(), body: request.postData() });
          origens.push(req.headers.get('origin'));
          resposta = await receberContato(req, deps);
        } else return route.abort('blockedbyclient');
        await route.fulfill({ status: resposta.status, headers: Object.fromEntries(resposta.headers), body: await resposta.text() });
      });
      const page = await contexto.newPage();
      await page.goto(`${origem}/inicio-nativo`);
      for (const [campo, valor] of [['nome', 'Pessoa de teste'], ['contato', 'Contato livre'], ['mensagem', '<b>Texto literal</b>']]) await page.locator(`[name=${campo}]`).fill(valor);
      const revisar = page.waitForResponse(r => r.request().method() === 'POST');
      await page.getByRole('button', { name: idioma === 'pt' ? 'Revisar' : 'Review', exact: true }).click();
      expect((await revisar).status()).toBe(200);
      await expect(page.getByRole('definition').filter({ hasText: '<b>Texto literal</b>' })).toBeVisible();
      const confirmar = page.waitForResponse(r => r.request().method() === 'POST');
      await page.getByRole('button', { name: idioma === 'pt' ? 'Confirmar e enviar' : 'Confirm and send', exact: true }).click();
      expect((await confirmar).status()).toBe(202);
      await expect(page.getByRole('alert')).toContainText(idioma === 'pt' ? 'Resultado pendente' : 'Result pending');
      await page.waitForTimeout(2100);
      const repetir = page.waitForResponse(r => r.request().method() === 'POST');
      await page.getByRole('button', { name: idioma === 'pt' ? 'Repetir o mesmo envio após a espera' : 'Repeat the same submission after waiting', exact: true }).click();
      expect((await repetir).status()).toBe(200);
      await expect(page.getByRole('status')).toContainText(idioma === 'pt' ? 'Envio aceito pelo serviço.' : 'Submission accepted by the delivery service.');
      expect(origens).toEqual([origem, origem, origem]);
      expect(corpos).toHaveLength(2); expect(corpos[1]).toBe(corpos[0]); expect(chaves[1]).toBe(chaves[0]); expect(chaves[0]).toMatch(/^contato\//);
      await expect(page.locator('html')).toHaveAttribute('lang', idioma);
      await expect(page.locator('script,b')).toHaveCount(0);
    } finally { await contexto.close(); await runner.close(); }
  });
}

// Emenda 1 do contrato (registro 008): no fim da Início, a intenção vem da Server Action real, só no clique, e o envio do
// chat usa essa intenção. Ressalvas do Security: resposta no-store e sem Set-Cookie; token fora de storage, cookie e URL.
test('Início: a Server Action emite no clique, sem cache nem cookie, e o token não vai a storage, cookie nem URL', async ({ page }) => {
  test.setTimeout(90_000);
  const respostas: { cabecalhos: Record<string, string>; corpo: string }[] = [];
  await page.route(u => u.pathname === '/', async (route, req) => {
    if (req.method() !== 'POST' || !req.headers()['next-action']) return route.fallback();
    const r = await route.fetch({ headers: { ...req.headers(), origin: 'https://floway.example', 'x-forwarded-host': 'floway.example' } });
    respostas.push({ cabecalhos: r.headers(), corpo: await r.text() });
    await route.fulfill({ response: r });
  });
  const envios: string[] = [];
  await page.route('**/api/contato', async route => {
    envios.push(route.request().postData() ?? '');
    await route.fulfill({ status: 202, json: { ok: false, estado: 'incerto', codigo: 'RESULTADO_INCERTO' }, headers: { 'Retry-After': '60' } });
  });
  await page.addInitScript(() => sessionStorage.setItem('abertura-tocou', '1'));
  await page.goto('/');
  await expect(page.locator('.abertura')).toHaveCount(0, { timeout: 8000 });
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
  await expect(page.locator('.rodape-cta')).toBeVisible({ timeout: 10_000 });
  expect(respostas).toHaveLength(0); // nada é emitido antes do clique
  await page.locator('.rodape-cta').click();
  const campo = page.getByRole('textbox', { name: 'Sua mensagem' });
  await expect(campo).toBeFocused();
  await expect(page.locator('.contato-chat .chat-aviso')).toContainText('Google Gemini');
  expect(respostas).toHaveLength(1);
  const [{ cabecalhos, corpo }] = respostas;
  expect(cabecalhos['cache-control']).toContain('no-store');
  expect(cabecalhos['set-cookie']).toBeUndefined();
  const intencao = /v1\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/.exec(corpo)?.[0];
  const chave = /contato\/[0-9a-f-]{36}/.exec(corpo)?.[0];
  expect(intencao).toBeTruthy();
  expect(chave).toBeTruthy();
  const vestigios = await page.evaluate(() => JSON.stringify({ local: { ...localStorage }, sessao: { ...sessionStorage }, cookie: document.cookie, url: location.href }));
  expect(vestigios).not.toContain(intencao);
  expect(vestigios).not.toContain(chave);
  // Fechar e reabrir não emite de novo.
  await page.getByRole('button', { name: /Fechar/ }).click();
  await page.locator('.rodape-cta').click();
  await expect(campo).toBeFocused();
  expect(respostas).toHaveLength(1);
  // A conversa segue até o cartão; o envio leva a intenção emitida pela action.
  await page.getByRole('button', { name: 'Ainda não sei, quero conversar' }).click();
  await page.getByRole('button', { name: 'Gerar contatos' }).click();
  for (const resposta of ['Ana', 'Estúdio Norte', '(11) 98765-4321', 'ana@example.com']) {
    await expect(campo).toBeEditable();
    await campo.fill(resposta); await campo.press('Enter');
  }
  await page.getByRole('button', { name: 'Confirmar e enviar' }).click();
  await expect.poll(() => envios.length).toBe(1);
  expect(new URLSearchParams(envios[0]).get('intencao') ?? envios[0]).toContain(intencao!);
  const depois = await page.evaluate(() => JSON.stringify({ local: { ...localStorage }, sessao: { ...sessionStorage }, cookie: document.cookie, url: location.href }));
  expect(depois).not.toContain(intencao);
});
