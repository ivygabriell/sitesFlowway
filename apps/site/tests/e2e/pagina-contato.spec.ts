import { expect, test, type Page } from '@playwright/test';

// Página de contato: só o "voltar ao início" e a conversa em formato de chat. Neste perfil a IA está desligada,
// então a conversa segue o roteiro fixo de perguntas; sem JavaScript, o formulário simples continua valendo.
for (const [caminho, lang, voltar] of [['/contato', 'pt-BR', 'Voltar ao início'], ['/en/contact', 'en', 'Back to home']] as const) {
  test(`${caminho} responde 200 em ${lang}, só com o voltar e a conversa`, async ({ page }) => {
    const resposta = await page.goto(caminho);
    expect(resposta?.status()).toBe(200);
    await expect(page.locator('html')).toHaveAttribute('lang', lang);
    await expect(page.locator('.guiada')).toBeVisible();
    await expect(page.locator('.cabecalho a')).toHaveCount(1);
    await expect(page.locator('.cabecalho .voltar')).toContainText(new RegExp(voltar, 'i'));
    await expect(page.locator('.rodape')).toHaveCount(0);
    await expect(page.locator('.esfera, .circulo-escuro')).toHaveCount(0);
    // A frase fica só para leitores de tela (recortada a 1 px).
    expect((await page.locator('.frase-contato').boundingBox())!.width).toBeLessThanOrEqual(1);
  });
}

test('a política de privacidade continua respondendo nas duas línguas', async ({ page }) => {
  expect((await page.goto('/privacidade'))?.status()).toBe(200);
  expect((await page.goto('/en/privacy'))?.status()).toBe(200);
});

test('o botão "Iniciar um projeto" da Início chega à conversa', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('abertura-tocou', '1'));
  await page.goto('/');
  await page.waitForTimeout(2000);
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.locator('.rodape-cta').click();
  await page.waitForURL('**/contato');
  await expect(page.locator('.guiada')).toBeVisible();
});

const responder = async (page: Page, texto: string) => {
  const campo = page.getByRole('textbox', { name: 'Sua resposta' });
  await campo.fill(texto);
  await campo.press('Enter');
};

// Percorre o roteiro fixo até o resumo, conferindo que dados inválidos não avançam.
async function ateOResumo(page: Page) {
  await expect(page.getByText(/qual é o seu nome/i)).toBeVisible();
  await responder(page, 'Pessoa de teste');
  await expect(page.getByText(/qual é a sua empresa/i)).toBeVisible();
  await responder(page, 'Empresa de teste');
  await page.getByRole('checkbox', { name: 'Site' }).check({ force: true });
  await page.getByRole('button', { name: /Continuar/ }).click();
  await page.getByRole('button', { name: 'Sem pressa' }).click();
  await expect(page.getByText(/WhatsApp, com DDD/)).toBeVisible();
  await responder(page, '123');
  await expect(page.locator('.guiada-erro')).toContainText('WhatsApp com DDD');
  await responder(page, '(11) 98765-4321');
  await expect(page.getByText(/qual é o seu e-mail/i)).toBeVisible();
  await responder(page, 'pessoa@');
  await expect(page.locator('.guiada-erro')).toContainText('e-mail válido');
  await responder(page, 'pessoa@empresa.dev');
  await responder(page, 'Quero um site novo');
  await expect(page.getByRole('region', { name: 'Resumo do pedido' })).toBeVisible();
}

test('roteiro completo: valida dados, resumo editável por etapa e envio indisponível sem destino configurado', async ({ page }) => {
  await page.goto('/contato');
  await ateOResumo(page);
  const resumo = page.getByRole('region', { name: 'Resumo do pedido' });
  await resumo.getByRole('button', { name: 'Editar Empresa' }).click();
  await expect(page.getByRole('textbox', { name: 'Sua resposta' })).toHaveValue('Empresa de teste');
  await responder(page, 'Outra empresa');
  await expect(page.getByRole('region', { name: 'Resumo do pedido' })).toContainText('Outra empresa');
  await expect(page.getByRole('region', { name: 'Resumo do pedido' })).toContainText('Quero um site novo');
  await page.getByRole('button', { name: 'Confirmar e enviar' }).click();
  await expect(page.getByText(/O envio está indisponível/)).toBeVisible();
});

for (const [largura, altura] of [[1440, 900], [1883, 703], [768, 1024], [390, 844], [360, 640]] as const) {
  test(`${largura}×${altura}: sem rolagem lateral, conversa inteira na tela e alvos de toque de 44 px`, async ({ page }) => {
    await page.setViewportSize({ width: largura, height: altura });
    await page.goto('/contato');
    await expect(page.getByText(/qual é o seu nome/i)).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const janela = (await page.locator('.guiada').boundingBox())!;
    expect(janela.x).toBeGreaterThanOrEqual(0);
    expect(janela.x + janela.width).toBeLessThanOrEqual(largura + 0.5);
    await expect(page.getByRole('textbox', { name: 'Sua resposta' })).toBeInViewport();
    await expect(page.getByRole('button', { name: 'Enviar resposta' })).toBeInViewport();
    expect((await page.getByRole('button', { name: 'Enviar resposta' }).boundingBox())!.height).toBeGreaterThanOrEqual(44);
    if (largura < 900) expect((await page.locator('.cabecalho .voltar').boundingBox())!.height).toBeGreaterThanOrEqual(44);
  });
}

test.describe('com movimento reduzido', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });
  test('a conversa aparece e responde sem animação', async ({ page }) => {
    await page.goto('/contato');
    await expect(page.locator('.guiada')).toBeVisible();
    await responder(page, 'Pessoa de teste');
    await expect(page.getByText(/qual é a sua empresa/i)).toBeVisible();
  });
});

test.describe('sem JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('o formulário envia pela rota e volta com a mensagem de falha, sem destino configurado', async ({ page }) => {
    await page.goto('/contato');
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
  await expect(page.getByText(/qual é o seu nome/i)).toBeVisible();
});
