import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
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
