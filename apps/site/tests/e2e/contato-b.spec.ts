import { expect, test } from '@playwright/test';
import { PNG } from 'pngjs';

// Provedores são substituídos somente nas APIs da borda, antes da navegação.
test.beforeEach(async ({ page }) => {
  await page.route('**/*', route => {
    const u = new URL(route.request().url());
    return u.origin === 'http://localhost:3100' ? route.continue() : route.abort('blockedbyclient');
  });
  await page.route('**/api/contato/conversa', async route => {
    const d = route.request().postDataJSON();
    await route.fulfill({ status: 200, json: { turnoId: d.turnoId, resposta: 'Qual é o objetivo do projeto?', mensagemSugerida: 'Descrição para conferir.' } });
  });
  await page.route('**/api/contato', async route => {
    await route.fulfill({ status: 202, json: { ok: false, estado: 'incerto', codigo: 'RESULTADO_INCERTO' }, headers: { 'Retry-After': '60' } });
  });
});
for (const caminho of ['/contato', '/en/contact']) {
  test(`${caminho}: B vazio, conversa, edição e confirmação pendente`, async ({ page }) => {
    await page.goto(caminho);
    await expect(page.locator('.contato-b-vazio')).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Nome', exact: true })).toHaveCount(0);
    await page.getByRole('button', { name: 'Ainda não sei', exact: true }).click();
    await expect(page.locator('.contato-b-aberta')).toBeVisible();
    await expect(page.locator('.assistente .resposta-visual')).toHaveText('Qual é o objetivo do projeto?');
    await page.getByRole('button', { name: 'Usar formulário simples' }).click();
    for (const [name, valor] of [['Nome', 'Pessoa de teste'], ['Empresa', 'Empresa de teste'], ['Contato', 'Contato livre'], ['Mensagem', 'Minha descrição editada']]) await page.getByRole('textbox', { name, exact: true }).fill(valor);
    await page.getByRole('button', { name: 'Revisar pedido' }).click();
    await expect(page.getByRole('heading', { name: 'Confira o resumo' })).toBeFocused();
    await page.getByRole('button', { name: 'Confirmar e enviar' }).click();
    await expect(page.getByText(/Resultado pendente/)).toBeFocused();
    await expect(page.getByRole('button', { name: 'Ajustar' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Voltar à conversa' })).toHaveCount(0);
    await expect(page.getByRole('definition').filter({ hasText: 'Minha descrição editada' })).toBeVisible();
  });
}

async function aceitar(page: import('@playwright/test').Page) {
  await page.route('**/api/contato', async route => {
    const request = route.request();
    const form = await new Response(request.postData() ?? '', { headers: { 'content-type': request.headers()['content-type'] } }).formData();
    // Token só em memória, sem anexos/log/captura ou persistência.
    const prazo = JSON.parse(Buffer.from(String(form.get('intencao')).split('.')[1], 'base64url').toString()).expiraEm;
    await route.fulfill({ status: 200, json: { ok: true, estado: 'aceito', requestId: '10000000-0000-4000-8000-000000000001', repetirAte: prazo } });
  });
}
async function conferirGeometria(page: import('@playwright/test').Page) {
  const medidas = await page.evaluate(() => {
    const ret = (s: string) => { const el = document.querySelector(s)!; const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, right: r.right, bottom: r.bottom }; };
    const painel = [...document.querySelectorAll('.contato-painel')].find(e => !(e as HTMLElement).hidden)!;
    const p = painel.getBoundingClientRect();
    return { lateral: document.documentElement.scrollWidth > innerWidth, painel: { x: p.x, y: p.y, right: p.right, bottom: p.bottom }, frase: ret('.frase-contato'), esfera: ret('.pagina-contato .esfera'), rodape: ret('.rodape') };
  });
  expect(medidas.lateral).toBe(false);
  expect(medidas.painel.y).toBeGreaterThanOrEqual(medidas.frase.bottom);
  expect(medidas.rodape.y).toBeGreaterThanOrEqual(medidas.painel.bottom);
  const a = medidas.painel, b = medidas.esfera;
  const esferaVisivel = await page.locator('.pagina-contato .esfera').isVisible();
  if (esferaVisivel) expect(a.right <= b.x || b.right <= a.x || a.bottom <= b.y || b.bottom <= a.y).toBe(true);
}
for (const [width, height] of [[1440, 900], [1883, 703], [768, 1024], [390, 844], [360, 640]]) {
  test(`${width}x${height}: fontes reais, vazio/aberta/resumo/aceito sem sobreposição`, async ({ page }) => {
    const erros: string[] = []; page.on('pageerror', e => erros.push(e.message)); page.on('console', m => { if (m.type() === 'error') erros.push(m.text()); });
    await page.setViewportSize({ width, height }); await aceitar(page); await page.goto('/contato');
    await page.evaluate(() => document.fonts.ready); await expect(page.locator('.contato-b-vazio')).toBeVisible();
    await page.waitForTimeout(1600); await conferirGeometria(page);
    await page.screenshot({ path: `/tmp/floway-front41-${width}-vazio.png`, fullPage: true });
    await page.getByRole('button', { name: 'Quero uma landing page', exact: true }).click();
    await expect(page.locator('.assistente .resposta-visual')).toHaveText('Qual é o objetivo do projeto?'); await conferirGeometria(page);
    await page.screenshot({ path: `/tmp/floway-front41-${width}-aberta.png`, fullPage: true });
    await page.getByRole('button', { name: 'Usar formulário simples' }).click();
    for (const [name, value] of [['Nome', 'Pessoa de teste'], ['Contato', 'Contato livre'], ['Mensagem', '<b>Descrição literal</b>\nSegunda linha']]) await page.getByRole('textbox', { name, exact: true }).fill(value);
    await page.getByRole('button', { name: 'Revisar pedido' }).click(); await conferirGeometria(page);
    await page.screenshot({ path: `/tmp/floway-front41-${width}-resumo.png`, fullPage: true });
    await page.getByRole('button', { name: 'Confirmar e enviar' }).click();
    await expect(page.getByText('Envio aceito pelo serviço.', { exact: true })).toBeFocused(); await page.waitForTimeout(2200); await conferirGeometria(page);
    await page.screenshot({ path: `/tmp/floway-front41-${width}-aceito.png`, fullPage: true }); expect(erros).toEqual([]);
  });
}

test('teclado, Enter multiline e apagamento ao alternar', async ({ page }) => {
  await page.goto('/contato'); const entrada = page.getByRole('textbox', { name: 'Conte o que você quer construir…' });
  await entrada.focus(); await page.keyboard.type('Meu projeto'); await page.keyboard.press('Enter'); await page.keyboard.type('Outra linha');
  await expect(entrada).toHaveValue('Meu projeto\nOutra linha'); await expect(page.locator('.conversa-mensagem')).toHaveCount(0);
  await page.keyboard.press('Tab'); await page.keyboard.press('Enter'); await expect(page.locator('.assistente')).toBeVisible();
  await page.getByRole('button', { name: 'Usar formulário simples' }).click(); await expect(page.getByRole('textbox', { name: 'Nome', exact: true })).toBeFocused();
  await page.getByRole('textbox', { name: 'Mensagem', exact: true }).fill('');
  await page.getByRole('button', { name: 'Voltar à conversa' }).click(); await expect(entrada).toBeFocused();
  await entrada.fill('Mais detalhes'); await page.getByRole('button', { name: 'Enviar →' }).click(); await expect(page.locator('.assistente')).toHaveCount(2);
  await page.getByRole('button', { name: 'Usar formulário simples' }).click(); await expect(page.getByRole('textbox', { name: 'Mensagem', exact: true })).toHaveValue('');
});

test('reduzido não digita e sem WebGL mantém conversa e sucesso textual', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => { const real = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function(this: HTMLCanvasElement, tipo: string, ...args: unknown[]) { return /webgl/i.test(tipo) ? null : Reflect.apply(real, this, [tipo, ...args]); } as typeof real; });
  await aceitar(page); await page.goto('/contato'); await expect(page.locator('.circulo-escuro')).toBeHidden();
  await page.getByRole('button', { name: 'Ainda não sei', exact: true }).click(); await expect(page.locator('.assistente .resposta-visual')).toHaveText('Qual é o objetivo do projeto?');
  await page.getByRole('button', { name: 'Usar formulário simples' }).click();
  for (const name of ['Nome', 'Contato', 'Mensagem']) await page.getByRole('textbox', { name, exact: true }).fill('Texto de teste');
  await page.getByRole('button', { name: 'Revisar pedido' }).click(); await page.getByRole('button', { name: 'Confirmar e enviar' }).click();
  await expect(page.getByText('Envio aceito pelo serviço.', { exact: true })).toBeVisible();
  await page.screenshot({ path: '/tmp/floway-front41-reduzido-sem-webgl.png', fullPage: true });
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
    await page.goto('/contato'); await page.getByRole('button', { name: 'Usar formulário simples' }).click();
    for (const name of ['Nome', 'Contato', 'Mensagem']) await page.getByRole('textbox', { name, exact: true }).fill('Texto confirmado');
    await page.getByRole('button', { name: 'Revisar pedido' }).click(); await page.getByRole('button', { name: 'Confirmar e enviar' }).click();
    await expect.poll(() => chamadas).toBeGreaterThanOrEqual(2);
    await expect(page.getByText(/Resultado pendente/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Ajustar' })).toHaveCount(0); await expect(page.getByRole('textbox', { name: 'Mensagem', exact: true })).toHaveCount(0);
    await expect(page.getByText('Envio aceito pelo serviço.', { exact: true })).toHaveCount(0);
    await page.screenshot({ path: `/tmp/floway-front41-pendencia-${status}.png`, fullPage: true });
    await expect(page.getByRole('button', { name: 'Repetir o mesmo envio' })).toBeEnabled({ timeout: 15000 });
    aceitou = true; await page.getByRole('button', { name: 'Repetir o mesmo envio' }).click();
    await expect(page.getByText('Envio aceito pelo serviço.', { exact: true })).toBeFocused(); expect(mesmoCorpo).toBe(true);
  });
}
test('expiração da pendência conserva cópia sem renovar nem oferecer outro formulário', async ({ page }) => {
  let prazo = '', chamadas = 0;
  await page.clock.install();
  await page.route('**/api/contato', async route => {
    chamadas++; const r = route.request(); const f = await new Response(r.postData() ?? '', { headers: { 'content-type': r.headers()['content-type'] } }).formData();
    prazo = JSON.parse(Buffer.from(String(f.get('intencao')).split('.')[1], 'base64url').toString()).expiraEm;
    await route.fulfill({ status: 202, json: { ok: false, estado: 'incerto', repetirAte: prazo }, headers: { 'Retry-After': '60' } });
  });
  await page.goto('/contato'); await page.getByRole('button', { name: 'Usar formulário simples' }).click();
  for (const name of ['Nome', 'Contato', 'Mensagem']) await page.getByRole('textbox', { name, exact: true }).fill('Cópia que permanece');
  await page.getByRole('button', { name: 'Revisar pedido' }).click(); await page.getByRole('button', { name: 'Confirmar e enviar' }).click();
  await expect(page.getByText(/Resultado pendente/)).toBeVisible();
  await page.clock.setFixedTime(new Date(prazo)); await page.clock.runFor(300);
  await expect(page.getByText(/Prazo de repetição encerrado/)).toBeVisible(); await expect(page.getByRole('button', { name: 'Repetir o mesmo envio' })).toHaveCount(0);
  await expect(page.getByRole('definition').filter({ hasText: 'Cópia que permanece' })).toHaveCount(3);
  expect(chamadas).toBe(1); await page.screenshot({ path: '/tmp/floway-front41-expirado.png', fullPage: true });
});
test('histórico longo: Tab alcança região e PageUp/PageDown rolam sem prender entrada', async ({ page }) => {
  await page.route('**/api/contato/conversa', async route => { const d = route.request().postDataJSON(); await route.fulfill({ status: 200, json: { turnoId: d.turnoId, resposta: 'Descrição longa para conferir.\n'.repeat(45), mensagemSugerida: null } }); });
  await page.goto('/contato'); await page.getByRole('button', { name: 'Ainda não sei', exact: true }).click();
  const historico = page.getByRole('log', { name: 'Histórico da conversa' });
  await expect(historico).toBeVisible(); await expect(page.locator('.assistente .resposta-visual')).toHaveText('Descrição longa para conferir.\n'.repeat(45).trim(), { timeout: 20000 });
  await page.getByRole('textbox', { name: 'Conte o que você quer construir…' }).focus(); await page.keyboard.press('Shift+Tab'); await expect(historico).toBeFocused();
  await historico.evaluate(e => { e.scrollTop = e.scrollHeight; }); const antes = await historico.evaluate(e => e.scrollTop);
  await page.keyboard.press('PageUp'); await expect.poll(() => historico.evaluate(e => e.scrollTop)).toBeLessThan(antes);
  await page.keyboard.press('PageDown'); await page.keyboard.press('Tab'); await expect(page.getByRole('textbox', { name: 'Conte o que você quer construir…' })).toBeFocused();
});
for (const [width, height] of [[1440, 900], [1883, 703]]) {
  test(`${width}x${height}: vazio desktop mantém convite em uma linha com atalhos e rodapé na tela`, async ({ page }) => {
    await page.setViewportSize({ width, height }); await page.goto('/contato'); await expect(page.locator('.contato-b-vazio')).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThanOrEqual(height);
    await expect(page.getByRole('button', { name: 'Revisar pedido' })).toHaveCount(0);
  });
}

test('pixels WebGL acompanham a caixa da esfera ao abrir B, sem sobrepor entrada', async ({ page }) => {
  await page.goto('/contato'); await page.getByRole('button', { name: 'Ainda não sei', exact: true }).click();
  await expect(page.locator('.assistente .resposta-visual')).toHaveText('Qual é o objetivo do projeto?'); await page.waitForTimeout(1600);
  const caixa = (await page.locator('.pagina-contato .esfera').boundingBox())!;
  const png = PNG.sync.read(await page.screenshot({ clip: caixa }));
  let escuros = 0;
  for (let i = 0; i < png.data.length; i += 4) if (png.data[i] < 120 && png.data[i + 1] < 120 && png.data[i + 2] < 120) escuros++;
  expect(escuros).toBeGreaterThan(1000);
});
