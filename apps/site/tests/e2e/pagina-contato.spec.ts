import { expect, test, type Page } from '@playwright/test';

// Página de contato no chat (spec 2026-11-22): abre no estado 02, com o globo no canto. Neste perfil a IA e o envio
// estão desligados: a conversa segue o roteiro fixo e o envio informa a indisponibilidade; sem JavaScript, o formulário simples.
for (const [caminho, lang, titulo, status] of [['/contato', 'pt-BR', 'Como podemos ajudar?', /Floway IA.*online/i], ['/en/contact', 'en', 'How can we help?', /Floway AI.*online/i]] as const) {
  test(`${caminho} responde 200 em ${lang} e abre no estado 02, com o globo no canto inferior direito`, async ({ page }) => {
    const resposta = await page.goto(caminho);
    expect(resposta?.status()).toBe(200);
    await expect(page.locator('html')).toHaveAttribute('lang', lang);
    await expect(page.getByRole('heading', { name: titulo })).toBeVisible();
    await expect(page.locator('.chat-respostas button')).toHaveCount(4);
    await expect(page.locator('.cabecalho a')).toHaveCount(1);
    await expect(page.locator('.rodape, .circulo-escuro')).toHaveCount(0);
    await expect(page.locator('.contato-globo-status')).toContainText(status);
    const globo = (await page.locator('.contato-globo .esfera').boundingBox())!;
    expect(globo.x + globo.width).toBeGreaterThan(1440 - 5);
    expect(globo.y).toBeGreaterThan(900 / 2);
    // A frase fica só para leitores de tela (recortada a 1 px).
    expect((await page.locator('.frase-contato').boundingBox())!.width).toBeLessThanOrEqual(1);
  });
}

test('a política de privacidade continua respondendo nas duas línguas', async ({ page }) => {
  expect((await page.goto('/privacidade'))?.status()).toBe(200);
  expect((await page.goto('/en/privacy'))?.status()).toBe(200);
});

test('o botão "Iniciar um projeto" da Início chega ao chat', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('abertura-tocou', '1'));
  await page.goto('/');
  await page.waitForTimeout(2000);
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.locator('.rodape-cta').click();
  await page.waitForURL('**/contato');
  await expect(page.getByRole('heading', { name: 'Como podemos ajudar?' })).toBeVisible();
});

const responder = async (page: Page, texto: string) => {
  const campo = page.getByRole('textbox', { name: 'Sua mensagem' });
  await expect(campo).toBeEditable();
  await campo.fill(texto);
  await campo.press('Enter');
};

// Percorre o roteiro fixo até o cartão, conferindo que dados inválidos não avançam nem apagam o que foi digitado.
async function ateOCartao(page: Page) {
  await page.getByRole('button', { name: 'Quero um site novo' }).click();
  await expect(page.getByText(/qual é o seu nome/i)).toBeVisible();
  await responder(page, 'Pessoa de teste');
  await expect(page.getByText(/qual é a sua empresa/i)).toBeVisible();
  await responder(page, 'Empresa de teste');
  await page.getByRole('checkbox', { name: 'Site' }).check({ force: true });
  await page.getByRole('button', { name: /Continuar/ }).click();
  await page.getByRole('button', { name: 'Sem pressa' }).click();
  await expect(page.getByText(/WhatsApp, com DDD/)).toBeVisible();
  await responder(page, '123');
  await expect(page.locator('.chat-erro').last()).toContainText('WhatsApp com DDD');
  await expect(page.getByRole('textbox', { name: 'Sua mensagem' })).toHaveValue('123');
  await responder(page, '(11) 98765-4321');
  await expect(page.getByText(/qual é o seu e-mail/i)).toBeVisible();
  await responder(page, 'pessoa@');
  await expect(page.locator('.chat-erro').last()).toContainText('e-mail válido');
  await responder(page, 'pessoa@empresa.dev');
  const cartao = page.getByRole('region', { name: 'Resumo do pedido' });
  await expect(cartao).toBeVisible();
  return cartao;
}

test('roteiro completo: cartão de resumo, "ajustar algo" no próprio cartão e envio indisponível sem destino configurado', async ({ page }) => {
  await page.goto('/contato');
  const cartao = await ateOCartao(page);
  await expect(cartao).toContainText('Quero um site novo');
  await expect(page.locator('.contato-globo')).toHaveAttribute('data-status', 'resumo');
  await cartao.getByRole('button', { name: 'Ajustar algo' }).click();
  await expect(cartao.getByLabel('Nome')).toBeFocused();
  await cartao.getByLabel('Empresa').fill('Outra empresa');
  await cartao.getByRole('button', { name: 'Revisar pedido' }).click();
  await expect(cartao).toContainText('Pessoa de teste · Outra empresa');
  await cartao.getByRole('button', { name: 'Confirmar e enviar' }).click();
  await expect(page.getByText(/O envio está indisponível/)).toBeVisible();
  await expect(page.locator('.contato-globo')).toHaveAttribute('data-status', 'falha');
});

for (const [largura, altura] of [[1440, 900], [1100, 900], [1883, 703], [768, 1024], [390, 844], [360, 640]] as const) {
  test(`${largura}×${altura}: sem rolagem lateral, campo e botão na tela, alvo de 44 px e o chat longe do globo`, async ({ page }) => {
    await page.setViewportSize({ width: largura, height: altura });
    await page.goto('/contato');
    await expect(page.getByRole('heading', { name: 'Como podemos ajudar?' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page.getByRole('textbox', { name: 'Sua mensagem' })).toBeInViewport();
    await expect(page.getByRole('button', { name: 'Enviar mensagem' })).toBeInViewport();
    expect((await page.getByRole('button', { name: 'Enviar mensagem' }).boundingBox())!.height).toBeGreaterThanOrEqual(44);
    if (largura >= 900) {
      // A coluna do chat termina antes de a esfera começar (a esfera visível ocupa o miolo da caixa do globo).
      const chat = (await page.locator('.chat').boundingBox())!;
      const globo = (await page.locator('.contato-globo .esfera').boundingBox())!;
      expect(chat.x + chat.width).toBeLessThan(globo.x + 41);
    } else for (const seletor of ['.cabecalho .idioma', '.cabecalho nav a >> nth=0', '.cabecalho nav a >> nth=1']) expect((await page.locator(seletor).boundingBox())!.height, seletor).toBeGreaterThanOrEqual(44);
  });
}

test.describe('com movimento reduzido', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });
  test('as mensagens aparecem inteiras, sem revelação palavra por palavra', async ({ page }) => {
    await page.goto('/contato');
    let revelou = false;
    await page.exposeFunction('revelou', () => { revelou = true; });
    await page.evaluate(() => new MutationObserver(() => { if (document.querySelector('.chat-revelando')) (window as unknown as { revelou: () => void }).revelou(); }).observe(document.body, { subtree: true, childList: true }));
    await responder(page, 'Um site');
    await expect(page.getByText(/qual é o seu nome/i)).toBeVisible();
    await responder(page, 'Pessoa de teste');
    await expect(page.getByText(/qual é a sua empresa/i)).toBeVisible();
    expect(revelou).toBe(false);
  });
});

test.describe('sem JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('só o formulário simples: envia pela rota e volta com a mensagem de falha, sem destino configurado', async ({ page }) => {
    await page.goto('/contato');
    await expect(page.locator('.chat')).toBeHidden();
    await page.fill('[name=nome]', 'Teste');
    await page.fill('[name=contato]', 'teste');
    await page.fill('[name=mensagem]', 'Teste');
    await page.locator('.formulario-contato button[type=submit]').click();
    await page.waitForURL('**/api/contato');
    await expect(page.locator('.formulario-erros')).toBeVisible();
    await expect(page.locator('[name=mensagem]')).toHaveValue('Teste');
  });
});

test('URL enviada não comprova entrega', async ({ page }) => {
  await page.goto('/contato?estado=enviado');
  await expect(page.getByText(/Envio aceito/)).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Como podemos ajudar?' })).toBeVisible();
});
