import { expect, test } from '@playwright/test';

// O cubo é CSS 3D: com movimento reduzido ele já aparece girado, com a foto na lateral e a legenda legível.
test.use({ contextOptions: { reducedMotion: 'reduce' } });

test('com movimento reduzido a lateral do cubo mostra a foto em cinza e a legenda', async ({ page }) => {
  const foto = page.waitForResponse((r) => r.url().endsWith('/inicio/cubo-lateral.webp'));
  await page.goto('/');
  expect((await foto).status()).toBe(200);
  const lado = page.locator('.cubo-lado');
  await lado.scrollIntoViewIfNeeded();
  await expect(page.locator('.secao-manifesto')).toHaveClass(/cubo-girado/);
  await expect(lado).toHaveCSS('background-image', /cubo-lateral\.webp/);
  await expect(lado).toHaveCSS('filter', 'grayscale(1)');
  await expect(page.locator('.cubo-legenda')).toHaveText('Experiências digitais que transformam a forma de conectar');
  await expect(page.locator('.cubo-legenda')).toBeVisible();
  await expect(page.locator('.palavra-contorno').first()).toHaveCSS('animation-name', 'none');
});
