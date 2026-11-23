import { expect, test } from '@playwright/test';

// Sem WebGL, o globo do contato some (como a esfera no resto do site) e o status continua em texto.
test.use({ launchOptions: { args: ['--disable-3d-apis', '--disable-webgl'] } });

test('/contato sem WebGL: a esfera some, o status fica em texto e a conversa anda', async ({ page }) => {
  await page.goto('/contato');
  await expect(page.getByRole('heading', { name: 'Como podemos ajudar?' })).toBeVisible();
  await expect(page.locator('.contato-globo .esfera')).toBeHidden();
  await expect(page.locator('.contato-globo-status')).toBeVisible();
  const campo = page.getByRole('textbox', { name: 'Sua mensagem' });
  await campo.fill('Um site'); await campo.press('Enter');
  await expect(page.getByText(/qual é o seu nome/i)).toBeVisible();
});
