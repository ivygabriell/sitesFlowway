import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { PilhaTrabalhos } from '@/componentes/pilha-trabalhos/PilhaTrabalhos';
import { contador, curvaDaVelocidade, posePlano } from '@/componentes/pilha-trabalhos/pose';
import { t } from '@/conteudo/textos';
import { linhaDoCartao, listaDeTrabalhos, trabalhos } from '@/conteudo/trabalhos';
import { ProvedorIdioma } from '@/lib/useIdioma';
import { PaginaTrabalhos } from '@/paginas/PaginaTrabalhos';

afterEach(cleanup);

// Issue #11: página Trabalhos, etapa 2 (spec 4.4): a pilha de planos do desktop com WebGL.
describe('pose dos planos da pilha', () => {
  it('o contador tem dois dígitos: (01/05) a (05/05)', () => {
    expect(contador(0, 5)).toBe('(01/05)');
    expect(contador(4, 5)).toBe('(05/05)');
  });

  it('assentado, o trabalho atual fica de frente no centro, e o seguinte meia volta adiante, abaixo e ao fundo', () => {
    const atual = posePlano(0, 1, 900);
    expect(atual.y).toBeCloseTo(0);
    expect(atual.z).toBeCloseTo(0);
    expect(atual.giro).toBeCloseTo(0);
    const seguinte = posePlano(1, 1, 900);
    expect(seguinte.y).toBeCloseTo(-117); // 13vh abaixo
    expect(seguinte.z).toBeCloseTo(-800);
    expect(seguinte.giro).toBeCloseTo(Math.PI);
    expect(posePlano(-1, 1, 900).z).toBeCloseTo(-800);
  });

  it('na entrada, o plano começa 8 telas acima, com 7,2π de giro a mais', () => {
    const inicio = posePlano(0, 0, 900);
    expect(inicio.y).toBeCloseTo(7200);
    expect(inicio.giro).toBeCloseTo(7.2 * Math.PI);
  });

  it('a curva cresce com a velocidade de 0 a 25 e para em 1', () => {
    expect(curvaDaVelocidade(0)).toBe(0);
    expect(curvaDaVelocidade(-12.5)).toBeCloseTo(0.5);
    expect(curvaDaVelocidade(25)).toBe(1);
    expect(curvaDaVelocidade(80)).toBe(1);
  });
});

describe('PilhaTrabalhos', () => {
  it('mostra o contador (01/05) e um "Ver trabalho" por trabalho, que abre o site do conceito em outra aba', () => {
    const { container } = render(<PilhaTrabalhos />);
    expect(container.querySelector('.pilha-contador')?.textContent).toBe('(01/05)');
    const links = [...container.querySelectorAll<HTMLAnchorElement>('a.pilha-alvo')];
    expect(links.map((a) => a.getAttribute('href'))).toEqual(listaDeTrabalhos.map((tr) => tr.site));
    links.forEach((a, i) => {
      const tr = listaDeTrabalhos[i];
      const [data, oferta] = linhaDoCartao(tr, 'pt');
      expect(a.target).toBe('_blank');
      expect(a.rel).toBe('noopener');
      expect(a.querySelector('.pilha-rotulo')?.textContent).toBe('Ver trabalho');
      expect(a.querySelector('.pilha-nome')?.textContent).toBe(t(tr.nome, 'pt'));
      expect(a.getAttribute('aria-label')).toBe(`${t(tr.nome, 'pt')}, ${t(tr.setor, 'pt')} / ${data} / ${oferta} (abre o site em nova aba)`);
    });
    // Nenhum link para uma página de case (spec 4.5): só os sites dos conceitos.
    expect(container.querySelectorAll('a[href^="/trabalhos/"]')).toHaveLength(0);
  });

  it('as miniaturas (uma capa por trabalho) e as informações digitadas ficam fora da leitura e do Tab', () => {
    const { container } = render(<PilhaTrabalhos />);
    const mins = container.querySelector('.pilha-miniaturas')!;
    expect(mins.getAttribute('aria-hidden')).toBe('true');
    expect([...mins.querySelectorAll('img')].map((i) => i.getAttribute('src'))).toEqual(listaDeTrabalhos.map((tr) => tr.capa));
    expect(mins.querySelectorAll('a, button, [tabindex]')).toHaveLength(0);
    expect(container.querySelector('.pilha-info')?.getAttribute('aria-hidden')).toBe('true');
    expect(container.querySelector('.pilha-contador')?.getAttribute('aria-hidden')).toBe('true');
    expect(container.querySelectorAll('video')).toHaveLength(0);
  });

  it('em inglês, o rótulo é "View work"', () => {
    const { container } = render(
      <ProvedorIdioma idioma="en">
        <PilhaTrabalhos />
      </ProvedorIdioma>,
    );
    expect(container.querySelector('.pilha-rotulo')?.textContent).toBe('View work');
    expect(t(trabalhos.ver, 'en')).toBe('View work');
    expect(container.querySelector('a.pilha-alvo')?.getAttribute('aria-label')).toMatch(/\(opens the site in a new tab\)$/);
  });
});

describe('PaginaTrabalhos', () => {
  it('sem WebGL (jsdom) fica com a lista de cartões, sem a pilha', () => {
    const { container } = render(<PaginaTrabalhos />);
    expect(container.querySelectorAll('a.cartao')).toHaveLength(5);
    expect(container.querySelector('.pilha-trabalhos')).toBeNull();
  });
});
