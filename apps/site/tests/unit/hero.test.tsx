import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { alvoDeSaida, PARALAXE, repouso, SAIDA } from '@/componentes/hero/disposicao';
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

// Pedido de 2026-11-01: uma logo só, grande, com a barra de cima sobre a parte de baixo da palavra, e saída que cresce e gira no lugar.
describe('disposição da logo de vidro do hero', () => {
  it.each([
    [1440, 900, 0.86],
    [390, 844, 0.9],
  ])('em %i×%i, a logo começa dentro da palavra, deixando o topo dela livre, e passa do pé dela', (largura, altura, fracao) => {
    const r = repouso(largura, altura);
    const meiaPalavra = (0.5 * fracao * largura * 292) / 1360;
    expect(r.principal.topo).toBeGreaterThan(r.palavra.centro - meiaPalavra);
    expect(r.principal.topo).toBeLessThan(r.palavra.centro + meiaPalavra);
    expect(r.principal.base).toBeGreaterThan(r.palavra.centro + meiaPalavra);
  });

  it('a paralaxe é a da referência: palavra ×1,6 e logo ×0,1 da rolagem', () => {
    expect(PARALAXE).toEqual({ palavra: 1.6, principal: 0.1 });
  });

  it('a saída usa scrub 1, do topo do hero + 10 px até 2 alturas de tela (0,7 no celular)', () => {
    expect(SAIDA.scrub).toBe(1);
    expect(SAIDA.inicio).toBe('top+=10');
    expect(SAIDA.alturas).toEqual({ desktop: 2, celular: 0.7 });
  });

  it.each([false, true])('na saída (celular: %s) a logo cresce pelo menos 1,6× e gira até ~0,3 rad', (celular) => {
    const { crescimento, giro } = alvoDeSaida(celular);
    expect(crescimento).toBeGreaterThanOrEqual(1.6);
    Object.values(giro).forEach((g) => expect(Math.abs(g)).toBeLessThanOrEqual(0.32));
  });
});
