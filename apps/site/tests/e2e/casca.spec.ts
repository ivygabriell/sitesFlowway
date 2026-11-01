import { expect, test } from '@playwright/test';

test('o ponto do relógio fica fora da mistura: azul do claro no topo e azul do escuro sobre o manifesto', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.abertura')).toBeHidden({ timeout: 8000 });
  const ponto = page.locator('.ponto-relogio');
  await expect(ponto).toHaveCSS('background-color', 'rgb(0, 47, 167)');
  await expect(ponto).toHaveCSS('mix-blend-mode', 'normal');
  await page.locator('.secao-manifesto').evaluate((el) => window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY + 10));
  await expect(ponto).toHaveCSS('background-color', 'rgb(91, 123, 255)');
});

test('o selo "Iniciar projeto" é um link para o contato, com foco visível', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.abertura')).toBeHidden({ timeout: 8000 });
  const selo = page.locator('a.selo');
  await expect(selo).toHaveAttribute('href', '/contato');
  await expect(selo).toHaveText(/iniciar projeto/i);
  await expect(selo).toHaveCSS('pointer-events', 'auto');
  await selo.focus();
  await expect(selo).toHaveCSS('outline-style', 'solid');
});

test('em /en, o menu fala inglês e o seletor leva ao português', async ({ page }) => {
  await page.goto('/en');
  await expect(page.locator('.cabecalho nav a').first()).toHaveAttribute('href', '/en/work');
  await expect(page.locator('.cabecalho a.idioma')).toHaveAttribute('href', '/');
});
