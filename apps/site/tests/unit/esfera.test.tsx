import { ScrollScene, useCanvasStore } from '@14islands/r3f-scroll-rig';
import { StickyScrollScene } from '@14islands/r3f-scroll-rig/powerups';
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { EsferaDeLetras } from '@/compartilhados/esfera/EsferaDeLetras';
import { CenaEsfera } from '@/compartilhados/esfera/CenaEsfera';
import { desenharAtlas, LETRAS } from '@/compartilhados/esfera/atlas';
import { atributosDaEsfera, pontosEsfera, QUANTIDADE, tamanhoDaLetra } from '@/compartilhados/esfera/geometria';
import { criarMaterialDaEsfera } from '@/compartilhados/esfera/shader';
import { pontosSimbolo, semente } from '@/marca/amostrar';

// O setup instala um document.fonts simples (o jsdom não tem); cada teste troca load e ready e devolve no fim.
type Fontes = { load?: unknown; ready: Promise<unknown> };
const fontes = document.fonts as unknown as Fontes;
const original = { ...fontes };
const trocarFontes = (f: Fontes) => Object.assign(fontes, f);

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  Object.assign(fontes, original);
  document.documentElement.style.removeProperty('--sans');
});

describe('geometria da esfera', () => {
  it('QUANTIDADE: 20 mil letras no desktop e 8 mil no celular', () => {
    expect(QUANTIDADE).toEqual({ desktop: 20000, celular: 8000 });
  });

  it('pontosEsfera(1000) distribui 1000 pontos com raio 1 ± 1e-6', () => {
    const p = pontosEsfera(1000);
    expect(p).toHaveLength(3000);
    for (let i = 0; i < 1000; i++) expect(Math.abs(Math.hypot(p[3 * i], p[3 * i + 1], p[3 * i + 2]) - 1)).toBeLessThan(1e-6);
  });

  it('atributosDaEsfera: aAlvo é o alvo pronto, aLetra é uma das 6 letras e aAzul é vec2 (esfera ~4%, alvo do braço)', () => {
    const n = 20000;
    const alvo = pontosSimbolo(n, semente(5));
    const a = atributosDaEsfera(n, alvo, semente(9));
    expect(a.aEsfera).toEqual(pontosEsfera(n));
    expect(a.aAlvo).toBe(alvo.posicoes);
    expect(a.aLetra).toHaveLength(n);
    for (const l of a.aLetra) expect([0, 1, 2, 3, 4, 5]).toContain(l);
    expect(a.aAzul).toHaveLength(2 * n);
    let naEsfera = 0;
    for (let i = 0; i < n; i++) {
      naEsfera += a.aAzul[2 * i];
      expect(a.aAzul[2 * i + 1]).toBe(alvo.azul[i]);
    }
    expect(naEsfera / n).toBeGreaterThan(0.03);
    expect(naEsfera / n).toBeLessThanOrEqual(0.05);
  });

  it('atributosDaEsfera recusa um alvo com outra quantidade de pontos', () => {
    expect(() => atributosDaEsfera(100, pontosSimbolo(50, semente(1)), semente(2))).toThrow();
  });

  it('o tamanho da letra é proporcional a 1/√n e ao raio', () => {
    expect(tamanhoDaLetra(8000, 200)).toBeCloseTo(2 * tamanhoDaLetra(32000, 200), 6);
    expect(tamanhoDaLetra(8000, 400)).toBeCloseTo(2 * tamanhoDaLetra(8000, 200), 6);
  });
});

describe('desenharAtlas', () => {
  it('só resolve depois de carregar a Inter Tight 800, a primeira família da variável --sans', async () => {
    document.documentElement.style.setProperty('--sans', "'Inter Tight', 'Inter Tight Fallback'");
    let liberar!: () => void;
    const load = vi.fn(() => new Promise<FontFace[]>((r) => (liberar = () => r([]))));
    trocarFontes({ load, ready: Promise.resolve() });

    let pronto = false;
    const promessa = desenharAtlas().then((tela) => ((pronto = true), tela));
    await new Promise((r) => setTimeout(r, 0));
    // Só a primeira família: a de fallback do next/font é local("Arial"), que falha onde não há Arial (Linux, Android).
    expect(load).toHaveBeenCalledWith("800 64px 'Inter Tight'");
    expect(pronto).toBe(false);

    liberar();
    const tela = await promessa;
    expect(pronto).toBe(true);
    expect([tela.width, tela.height]).toEqual([64 * LETRAS.length, 64]);
    expect(LETRAS).toEqual(['F', 'L', 'O', 'W', 'A', 'Y']);
  });

  it('se fonts.load rejeita, desenha o atlas mesmo assim, depois de document.fonts.ready', async () => {
    document.documentElement.style.setProperty('--sans', "'Inter Tight', 'Inter Tight Fallback'");
    let liberar!: () => void;
    const ready = new Promise<void>((r) => (liberar = r));
    trocarFontes({ load: () => Promise.reject(new DOMException('A network error occurred.', 'NetworkError')), ready });
    let pronto = false;
    const promessa = desenharAtlas().then((tela) => ((pronto = true), tela));
    await new Promise((r) => setTimeout(r, 0));
    expect(pronto).toBe(false);
    liberar();
    const tela = await promessa;
    expect([tela.width, tela.height]).toEqual([64 * LETRAS.length, 64]);
  });

  it('espera também document.fonts.ready', async () => {
    let liberar!: () => void;
    const ready = new Promise<void>((r) => (liberar = r));
    trocarFontes({ load: () => Promise.resolve([]), ready });
    let pronto = false;
    const promessa = desenharAtlas().then(() => (pronto = true));
    await new Promise((r) => setTimeout(r, 0));
    expect(pronto).toBe(false);
    liberar();
    await promessa;
    expect(pronto).toBe(true);
  });
});

describe('material da esfera', () => {
  it('tem os uniformes da morfose, sem transparência ordenada, com discard e o teto de 64 px', () => {
    const m = criarMaterialDaEsfera();
    expect(Object.keys(m.uniforms)).toEqual(expect.arrayContaining(['uMorf', 'uTempo', 'uMouse', 'uGiro', 'uAtlas', 'uTamanho']));
    expect(m.transparent).toBe(false);
    expect(m.fragmentShader).toContain('discard');
    expect(m.vertexShader).toMatch(/attribute vec2 aAzul/);
    expect(m.vertexShader).toMatch(/min\([^;]*64\.0\)/);
    m.dispose();
  });
});

describe('EsferaDeLetras', () => {
  it('sem canvas disponível, mostra só a div.esfera: sem canvas, sem erro e sem amostrar o alvo', () => {
    const alvo = vi.fn(() => pontosSimbolo(10, semente(1)));
    const { container } = render(<EsferaDeLetras alvo={alvo} />);
    expect(container.querySelector('div.esfera')).toBeTruthy();
    expect(container.querySelector('canvas')).toBeNull();
    expect(alvo).not.toHaveBeenCalled();
  });

  it('com canvas, só chama a fábrica do alvo quando a esfera se aproxima da tela, com 20 mil pontos no desktop', () => {
    let avisar!: (e: Partial<IntersectionObserverEntry>[]) => void;
    const opcoes: IntersectionObserverInit[] = [];
    class Observador {
      constructor(cb: (e: Partial<IntersectionObserverEntry>[]) => void, o: IntersectionObserverInit) {
        avisar = cb;
        opcoes.push(o);
      }
      observe() {}
      disconnect() {}
    }
    vi.stubGlobal('IntersectionObserver', Observador);
    useCanvasStore.setState({ isCanvasAvailable: true });
    try {
      const alvo = vi.fn((n: number) => pontosSimbolo(n, semente(1)));
      const { container } = render(<EsferaDeLetras alvo={alvo} />);
      expect(container.querySelector('div.esfera')).toBeTruthy();
      expect(alvo).not.toHaveBeenCalled();
      expect(opcoes[0].rootMargin).toBeTruthy();

      act(() => avisar([{ isIntersecting: false }]));
      expect(alvo).not.toHaveBeenCalled();

      act(() => avisar([{ isIntersecting: true }]));
      expect(alvo).toHaveBeenCalledTimes(1);
      expect(alvo).toHaveBeenCalledWith(QUANTIDADE.desktop);
    } finally {
      useCanvasStore.setState({ isCanvasAvailable: false });
      vi.unstubAllGlobals();
    }
  });
});

describe('CenaEsfera fixa', () => {
  // Selecionar StickyScrollScene incondicionalmente quebra sem CSS ou gera coordenadas NaN com top:auto.
  it.each([
    ['relative', '0px', ScrollScene],
    ['static', '0px', ScrollScene],
    ['sticky', 'auto', ScrollScene],
    ['sticky', '25%', ScrollScene],
    ['sticky', 'NaNpx', ScrollScene],
    ['sticky', 'Infinitypx', ScrollScene],
    ['sticky', '0px', StickyScrollScene],
    ['sticky', '-12.5px', StickyScrollScene],
  ])('com position:%s e top:%s escolhe uma cena com coordenadas válidas', (position, top, cena) => {
    const el = document.createElement('div');
    // Valores inválidos também cobrem o limite da integração, antes do parseFloat do powerup.
    const estilo = getComputedStyle(el);
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({ ...estilo, position, top });
    const atributos = atributosDaEsfera(10, pontosSimbolo(10, semente(1)), semente(2));
    const resultado = CenaEsfera({ track: { current: el }, atributos, modo: 'desktop', fixa: true });
    expect(resultado.type).toBe(cena);
  });
});
