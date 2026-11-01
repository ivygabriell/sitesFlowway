import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { alvosDeSaida, PARALAXE, repouso, SAIDA } from '@/componentes/hero/disposicao';
import { Hero } from '@/componentes/hero/Hero';
import { 'inicio-topo' as inicioTopo } from '@/conteudo/inicio-topo';
import { t } from '@/conteudo/textos';
import { ProvedorIdioma } from '@/lib/useIdioma';
import { PALAVRA } from '@/marca/palavra';

afterEach(cleanup);

describe('Hero', () => {
  it('as faixas leem a lista do conteúdo, repetida pelo menos 3 vezes', () => {
    const { container } = render(<Hero />);
    const linhas = [...container.querySelectorAll('.faixa')];
    expect(linhas).toHaveLength(2);
    linhas.forEach((linha, i) => {
      const esperados = inicioTopo.faixas[i].map((x) => t(x, 'pt'));
      const textos = [...linha.querySelectorAll('.faixa-item')].map((e) => e.textContent);
      expect(textos.length).toBeGreaterThanOrEqual(3 * esperados.length);
      expect(textos.slice(0, esperados.length)).toEqual(esperados);
    });
    expect(container.textContent).toContain('Feito para o seu negócio');
    expect(container.textContent).toContain('Experiência premium');
  });

  it('divide a intro em palavras que piscam', () => {
    const { container } = render(<Hero />);
    expect(container.querySelectorAll('.intro .palavra-intro').length).toBeGreaterThan(0);
  });

  it('sem canvas, o título é a palavra FLOWAY em SVG, desenhada do arquivo da assinatura', () => {
    const { container } = render(<Hero />);
    const titulo = container.querySelector('h1.titulo-hero')!;
    const path = titulo.querySelector('svg path');
    expect(path?.getAttribute('d')).toBe(PALAVRA.d);
    expect(titulo.querySelector('svg')?.getAttribute('viewBox')).toBe(PALAVRA.viewBox.join(' '));
    expect(titulo.getAttribute('aria-label') ?? titulo.textContent).toContain('FLOWAY');
    expect(container.textContent).not.toContain('IDENTIDADE');
  });

  it('convida a rolar na língua da página', () => {
    const pt = render(<Hero />).container;
    expect(pt.querySelector('.role-para-baixo')?.textContent).toBe('Role para baixo');
    cleanup();
    const en = render(
      <ProvedorIdioma idioma="en">
        <Hero />
      </ProvedorIdioma>,
    ).container;
    expect(en.querySelector('.role-para-baixo')?.textContent).toBe('Scroll down');
  });
});

// Issue #15, pedido de 2026-11-01: lâminas no meio da tela, abraçando a palavra, e saída que cresce e gira no lugar.
describe('disposição das lâminas do hero', () => {
  it.each([
    [1440, 900],
    [390, 844],
  ])('em %i×%i, o centro da lâmina principal fica entre 45%% e 60%% da altura e a metade de cima da palavra fica livre', (largura, altura) => {
    const r = repouso(largura, altura);
    expect(r.principal.centro / altura).toBeGreaterThanOrEqual(0.45);
    expect(r.principal.centro / altura).toBeLessThanOrEqual(0.6);
    expect(r.principal.topo).toBeGreaterThanOrEqual(r.palavra.centro);
  });

  it('no desktop, as duas lâminas menores ficam abaixo da principal, com vão', () => {
    const r = repouso(1440, 900);
    expect(r.laje.topo).toBeGreaterThan(r.principal.base);
    expect(r.pequena.topo).toBeGreaterThan(r.principal.base);
  });

  it('a paralaxe é a da referência: palavra ×1,6 e lâminas ×0,1, ×0,9 e ×0,4 da rolagem', () => {
    expect(PARALAXE).toEqual({ palavra: 1.6, principal: 0.1, laje: 0.9, pequena: 0.4 });
  });

  it('a saída usa scrub 1, do topo do hero + 10 px até 2 alturas de tela (0,7 no celular)', () => {
    expect(SAIDA.scrub).toBe(1);
    expect(SAIDA.inicio).toBe('top+=10');
    expect(SAIDA.alturas).toEqual({ desktop: 2, celular: 0.7 });
  });

  it.each([false, true])('na saída (celular: %s) as lâminas crescem pelo menos 1,6× e giram até ~0,3 rad, sem subir', (celular) => {
    const alvos = alvosDeSaida(celular, false);
    expect(alvos.map((a) => a.peca)).toEqual(celular ? ['principal'] : ['principal', 'laje', 'pequena']);
    for (const a of alvos) {
      expect(a.crescimento).toBeGreaterThanOrEqual(1.6);
      const giros = Object.values(a.giro);
      expect(giros.length).toBeGreaterThan(0);
      giros.forEach((g) => expect(Math.abs(g)).toBeLessThanOrEqual(0.32));
      expect(a).not.toHaveProperty('y');
    }
  });

  it('com movimento reduzido não há saída animada', () => {
    expect(alvosDeSaida(false, true)).toEqual([]);
    expect(alvosDeSaida(true, true)).toEqual([]);
  });
});
