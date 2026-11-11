import { readFileSync } from 'node:fs';
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Decisoes } from '@/componentes/decisoes/Decisoes';
import { gsap } from '@/gsap';
import { ProvedorIdioma } from '@/lib/useIdioma';

// Textos exatos da seção 4.3 da spec (2026-10-31-estrutura-site-design.md), lençol "(O que entregamos)".
const ITENS = [
  'Estratégia digital',
  'Design de interfaces',
  'Desenvolvimento web',
  'Inteligência artificial',
  'Automações e integrações',
  'Experiências digitais',
  'Manutenção e evolução',
];
const FRASES = ['Do primeiro esboço à automação rodando, cuidamos de cada etapa.', 'Cada entrega nasce para resolver um problema real do seu negócio.'];

const larguraOriginal = window.innerWidth;
const matchMediaOriginal = window.matchMedia;
const getContextOriginal = HTMLCanvasElement.prototype.getContext;

function definirLargura(largura: number) {
  Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: largura });
}

function reduzirMovimento() {
  window.matchMedia = ((query: string) => ({ ...matchMediaOriginal(query), matches: query.includes('reduce') })) as typeof window.matchMedia;
}

// Um navegador com WebGL e canvas 2D: o contexto 2D grava os textos que a folha escreve.
function comCanvas(textos: string[]) {
  const ctx2d = new Proxy(
    { fillText: (s: string) => textos.push(s), measureText: () => ({ width: 10 }) },
    { get: (alvo, chave) => (chave in alvo ? alvo[chave as keyof typeof alvo] : () => {}), set: () => true },
  );
  HTMLCanvasElement.prototype.getContext = ((tipo: string) => (tipo === '2d' ? ctx2d : {})) as typeof HTMLCanvasElement.prototype.getContext;
}

// Os gatilhos de rolagem que a seção pede ao GSAP (vars de cada timeline com scrollTrigger).
// Olhar as vars, e não ScrollTrigger.getAll(), evita depender de quando o gatilho "once" dispara no jsdom.
type VarsDoGatilho = { trigger?: Element; pin?: boolean; once?: boolean };
function espiarGatilhos() {
  const espiao = vi.spyOn(gsap, 'timeline');
  return () =>
    espiao.mock.calls
      .map(([vars]) => (vars as { scrollTrigger?: VarsDoGatilho } | undefined)?.scrollTrigger)
      .filter((g): g is VarsDoGatilho => !!g && !!g.trigger?.classList.contains('secao-decisoes'));
}

async function montar(ui = <Decisoes />) {
  const r = render(ui);
  await act(async () => {});
  return r;
}

beforeEach(() => definirLargura(1440));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  definirLargura(larguraOriginal);
  window.matchMedia = matchMediaOriginal;
  HTMLCanvasElement.prototype.getContext = getContextOriginal;
});

describe('Lençol "(O que entregamos)"', () => {
  it('tem o título "(O que" ——— "entregamos)" dividido por uma linha que vai crescer', async () => {
    const { container } = await montar();
    const titulo = container.querySelector('.titulo-decisoes')!;
    expect([...titulo.children].map((e) => e.className)).toEqual(['titulo-parte', 'linha', 'titulo-parte']);
    expect([...titulo.querySelectorAll('.titulo-parte')].map((e) => e.textContent)).toEqual(['(O que', 'entregamos)']);
  });

  it('tem as duas frases da spec (com movimento reduzido, já completas)', async () => {
    reduzirMovimento();
    const { container } = await montar();
    expect([...container.querySelectorAll('.frase')].map((f) => f.textContent)).toEqual(FRASES);
  });

  it('tem a lista dos 7 itens da spec, na ordem, numerados de (1) a (7)', async () => {
    const { container } = await montar();
    const itens = [...container.querySelectorAll('.lista-decisoes li')];
    expect(itens).toHaveLength(7);
    itens.forEach((li, i) => {
      expect(li.querySelector('sup')?.textContent).toBe(`(${i + 1})`);
      expect(li.textContent).toBe(`${ITENS[i]}(${i + 1})`);
    });
  });

  it('em inglês usa "(What we" e "deliver)" e os itens em inglês', async () => {
    const { container } = await montar(
      <ProvedorIdioma idioma="en">
        <Decisoes />
      </ProvedorIdioma>,
    );
    expect([...container.querySelectorAll('.titulo-parte')].map((e) => e.textContent)).toEqual(['(What we', 'deliver)']);
    expect(container.querySelector('.lista-decisoes li')?.textContent).toBe('Digital strategy(1)');
  });

  it('não lê mais o conteúdo da página de identidade', () => {
    for (const arquivo of ['src/componentes/decisoes/Decisoes.tsx', 'src/texturas/folhaDecisoes.ts']) {
      expect(readFileSync(arquivo, 'utf8'), arquivo).not.toContain('conteudo/identidade');
    }
  });

  it('no desktop com WebGL, a folha do lençol escreve os mesmos 7 itens', async () => {
    const escritos: string[] = [];
    comCanvas(escritos);
    await montar();
    expect(escritos.filter((s) => !/^\(\d+\)$/.test(s))).toEqual(ITENS.map((i) => i.toUpperCase()));
    expect(escritos.filter((s) => /^\(\d+\)$/.test(s))).toEqual(ITENS.map((_, i) => `(${i + 1})`));
  });

  it('no celular, a lista fica no DOM e a linha e as frases animam uma vez ao entrar, sem prender a seção', async () => {
    definirLargura(390);
    comCanvas([]);
    const gatilhosDaSecao = espiarGatilhos();
    const { container } = await montar();
    expect(container.querySelector('.secao-decisoes')?.classList.contains('com-lencol')).toBe(false);
    expect(container.querySelectorAll('.lista-decisoes li')).toHaveLength(7);
    const gatilhos = gatilhosDaSecao();
    expect(gatilhos).toHaveLength(1);
    expect(gatilhos[0].pin).toBeFalsy();
    expect(gatilhos[0].once).toBe(true);
  });

  it('sem WebGL no desktop, faz como no celular: sem lençol e sem prender', async () => {
    const gatilhosDaSecao = espiarGatilhos();
    const { container } = await montar();
    expect(container.querySelector('.secao-decisoes')?.classList.contains('com-lencol')).toBe(false);
    const gatilhos = gatilhosDaSecao();
    expect(gatilhos).toHaveLength(1);
    expect(gatilhos[0].pin).toBeFalsy();
    expect(gatilhos[0].once).toBe(true);
  });

  it.each([
    ['com WebGL', true],
    ['sem WebGL', false],
  ])('com movimento reduzido (%s), nada anima: sem gatilho, frases completas, linha cheia e lista à vista', async (_, webgl) => {
    reduzirMovimento();
    if (webgl) comCanvas([]);
    const gatilhosDaSecao = espiarGatilhos();
    const { container } = await montar();
    expect(gatilhosDaSecao()).toHaveLength(0);
    expect(container.querySelector('.secao-decisoes')?.classList.contains('com-lencol')).toBe(false);
    expect([...container.querySelectorAll('.frase')].map((f) => f.textContent)).toEqual(FRASES);
    expect(container.querySelector<HTMLElement>('.titulo-decisoes .linha')?.style.width).toBe('');
    expect(container.querySelectorAll('.lista-decisoes li')).toHaveLength(7);
  });
});
