import { expect, test, type Page } from '@playwright/test';
import { INTERVALOS, TEMPOS } from '../../src/movimento/tokens';

// Issue #17: rolar durante a entrada do hero (logo depois de recarregar ou de abrir a outra língua) e voltar ao topo
// deixava as faixas e o convite a rolar apagados: a saída gravava a opacidade do meio da entrada como ponto de partida.
declare global {
  interface Window { inicioEntrada?: number }
}

// Repetições com o estado parcial medido, e o teto de tentativas para chegar a elas.
const REPETICOES = 3;
const TENTATIVAS = 6;
// CenaHero cria a saída 1 s depois de a entrada começar; antes disso rolar não toca nas faixas.
const SAIDA_CRIADA_MS = 1000 + 100;
const opacidades = (page: Page) =>
  page.evaluate(() => ['.faixas', '.role-para-baixo'].map((s) => getComputedStyle(document.querySelector(`.secao-hero ${s}`)!).opacity));
// Espera, no relógio da página, que a entrada tenha corrido `ms` desde que a intro apareceu (instante 0 dela).
const entradaCorreu = (page: Page, ms: number) =>
  page.waitForFunction((ms) => window.inicioEntrada !== undefined && performance.now() - window.inicioEntrada >= ms, ms, { polling: 'raf' });
// Espera a entrada no meio (faixas ou convite com 0 < opacidade < 1, já com a saída criada) e rola no mesmo quadro,
// sem ida e volta ao Playwright: sob carga, os 400 ms que sobram no celular não bastariam. Devolve as opacidades
// medidas, ou null se a entrada terminou sem o estado parcial ser visto.
const rolarNoMeioDaEntrada = (page: Page, fimMs: number) =>
  page
    .waitForFunction(
      ([desde, ate]) => {
        if (window.inicioEntrada === undefined) return false;
        const decorrido = performance.now() - window.inicioEntrada;
        if (decorrido < desde) return false;
        const ops = ['.faixas', '.role-para-baixo'].map((s) => getComputedStyle(document.querySelector(`.secao-hero ${s}`)!).opacity);
        if (ops.some((o) => Number(o) > 0 && Number(o) < 1)) {
          window.scrollTo(0, 300);
          return ops;
        }
        return decorrido >= ate ? 'perdido' : false;
      },
      [SAIDA_CRIADA_MS, fimMs],
      { polling: 'raf' },
    )
    .then(async (h) => {
      const v = (await h.jsonValue()) as string[] | 'perdido';
      return v === 'perdido' ? null : v;
    });

for (const [nome, viewport] of [['desktop', { width: 1440, height: 900 }], ['celular', { width: 390, height: 844 }]] as const) {
  test.describe(nome, () => {
    test.use({ viewport });
    const celular = nome === 'celular';
    // Fim da entrada das faixas e do convite (CenaHero): faixas em 0,6 s no celular e 1,5 s no desktop, convite em 1 s.
    const fimEntradaMs = (Math.max(celular ? 0.6 : INTERVALOS['intervalo-intro'], 1) + TEMPOS['tempo-esmaecer']) * 1000 + 100;
    for (const caminho of ['/', '/en']) {
      test(`${caminho}: rolar no meio da entrada e voltar ao topo mostra as faixas e o convite a rolar`, async ({ page }) => {
        test.setTimeout(120_000);
        await page.addInitScript(() => {
          sessionStorage.setItem('abertura-tocou', '1');
          const vigiar = () => {
            const intro = document.querySelector('.secao-hero .intro');
            if (intro && getComputedStyle(intro).opacity === '1') window.inicioEntrada = performance.now();
            else requestAnimationFrame(vigiar);
          };
          requestAnimationFrame(vigiar);
        });
        await page.goto(caminho);
        await page.mouse.move(viewport.width / 2, viewport.height / 3);
        const medidas: string[][] = [];
        let puladas = 0;
        for (let i = 0; i < TENTATIVAS && medidas.length < REPETICOES; i++) {
          await page.reload();
          const antes = await rolarNoMeioDaEntrada(page, fimEntradaMs);
          if (!antes) {
            // Sem o estado parcial (página lenta demais), esta repetição não prova nada: pula, com o motivo.
            puladas++;
            const motivo = `tentativa ${i + 1}: a entrada terminou sem faixas nem convite em 0 < opacidade < 1`;
            test.info().annotations.push({ type: 'repeticao-pulada', description: motivo });
            console.log(`hero-faixas ${nome} ${caminho} pulada: ${motivo}`);
            continue;
          }
          await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(10);
          // Volta só depois do fim da entrada: voltando antes, o último valor dela (1) encobre o bug.
          await entradaCorreu(page, fimEntradaMs);
          await page.mouse.wheel(0, -600);
          await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
          // Com o bug, a saída devolve o valor gravado no meio da entrada e fica nele: a espera estoura.
          await expect.poll(() => opacidades(page), { timeout: 5000 }).toEqual(['1', '1']);
          medidas.push(antes);
        }
        console.log(`hero-faixas ${nome} ${caminho} (faixas, convite) ao rolar:`, JSON.stringify(medidas), `puladas: ${puladas}`);
        // Sem nenhuma repetição medida no meio da entrada, o teste passaria vazio.
        expect(medidas.length, 'nenhuma repetição viu a entrada no meio').toBeGreaterThan(0);
      });
    }
  });
}
