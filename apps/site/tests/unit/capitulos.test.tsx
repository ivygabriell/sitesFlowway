import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CartaoTrabalho } from '@/compartilhados/CartaoTrabalho';
import { BarraProgresso } from '@/componentes/capitulos/BarraProgresso';
import { Capitulos } from '@/componentes/capitulos/Capitulos';
import { t } from '@/conteudo/textos';
import { type Trabalho, linhaDoCartao, listaDeTrabalhos, marcadoresDeConstrucao } from '@/conteudo/trabalhos';
import { ProvedorIdioma } from '@/lib/useIdioma';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const comCapa: Trabalho = {
  slug: 'teste',
  nome: { pt: 'Trabalho de teste' },
  setor: { pt: 'Setor' },
  mesAno: { pt: 'Mês' },
  oferta: 'landing-page',
  conceito: false,
  capa: '/capa-teste.webp',
  site: '/conceitos/teste/index.html',
};

describe('Capitulos (trabalhos em destaque)', () => {
  it('tem o rótulo (Trabalhos) antes dos cartões', () => {
    const { container } = render(<Capitulos />);
    expect(container.querySelector('.secao-capitulos')?.id).toBe('capitulos');
    expect(container.querySelector('h2.rotulo-capitulos')?.textContent).toBe('(Trabalhos)');
  });

  it('em inglês, o rótulo é (Work)', () => {
    const { container } = render(
      <ProvedorIdioma idioma="en">
        <Capitulos />
      </ProvedorIdioma>,
    );
    expect(container.querySelector('h2.rotulo-capitulos')?.textContent).toBe('(Work)');
  });

  // Rafael, 2026-11-09: a capa fica no hover e o clique abre o site do conceito (numa aba nova).
  it('renderiza os 5 trabalhos com capa, cada um como link para o site do conceito', () => {
    const { container } = render(<Capitulos />);
    expect(container.querySelectorAll('.cartao')).toHaveLength(5);
    expect(container.querySelectorAll('.cartao.com-capa')).toHaveLength(5);
    const links = [...container.querySelectorAll<HTMLAnchorElement>('a.cartao')];
    expect(links.map((a) => a.getAttribute('href'))).toEqual(listaDeTrabalhos.map((tr) => tr.site));
    links.forEach((a) => {
      expect(a.target).toBe('_blank');
      expect(a.rel).toBe('noopener');
    });
    // A cena WebGL casa os planos pela ordem de .cartao-img img: uma imagem por cartão, na ordem da lista.
    expect([...container.querySelectorAll('.cartao-img img')].map((i) => i.getAttribute('src'))).toEqual(listaDeTrabalhos.map((tr) => tr.capa));
    expect(container.querySelectorAll('video, [role="dialog"]')).toHaveLength(0);
  });

  it('cada cartão mostra o nome e a linha de informações', () => {
    const { container } = render(<Capitulos />);
    const cartoes = [...container.querySelectorAll('.cartao')];
    cartoes.forEach((c, i) => {
      const tr = listaDeTrabalhos[i];
      expect(c.querySelector('.cartao-titulo')?.textContent).toBe(t(tr.nome, 'pt'));
      const [data, oferta] = linhaDoCartao(tr, 'pt');
      expect(c.querySelector('.cartao-subtitulo')?.textContent).toBe(data + oferta);
      expect(oferta.endsWith('· Conceito')).toBe(true);
    });
  });
});

describe('CartaoTrabalho', () => {
  it('com capa e site, é um link para o site numa aba nova, com a capa e sem vídeo', () => {
    const { container } = render(<CartaoTrabalho trabalho={comCapa} idioma="pt" indice={0} />);
    const cartao = container.querySelector('a.cartao')!;
    expect(cartao.classList.contains('com-capa')).toBe(true);
    expect(cartao.getAttribute('href')).toBe('/conceitos/teste/index.html');
    expect(cartao.getAttribute('target')).toBe('_blank');
    expect(cartao.getAttribute('rel')).toBe('noopener');
    expect(cartao.getAttribute('aria-label')).toBe('Trabalho de teste (abre o site em nova aba)');
    expect(container.querySelector('video')).toBeNull();
    const img = container.querySelector('.cartao-img img')!;
    expect(img.getAttribute('src')).toBe('/capa-teste.webp');
    expect(container.querySelectorAll('.cartao-img img')).toHaveLength(1);
  });

  it('com capa, entrar e sair com o mouse só avisa a cena (zoom da capa no shader)', () => {
    const aoPassar = vi.fn();
    const { container } = render(<CartaoTrabalho trabalho={comCapa} idioma="pt" indice={3} aoPassar={aoPassar} />);
    fireEvent.mouseEnter(container.querySelector('.cartao')!);
    fireEvent.mouseLeave(container.querySelector('.cartao')!);
    expect(aoPassar.mock.calls).toEqual([
      [3, true],
      [3, false],
    ]);
  });

  it('com capa e sem site, a capa fica sem link', () => {
    const { container } = render(<CartaoTrabalho trabalho={{ ...comCapa, site: undefined }} idioma="pt" indice={0} />);
    expect(container.querySelector('a')).toBeNull();
    expect(container.querySelector('article.cartao.com-capa .cartao-img img')).toBeTruthy();
  });

  it('sem capa, é um bloco liso sem imagem nem prévia', () => {
    const { container } = render(<CartaoTrabalho trabalho={marcadoresDeConstrucao[2]} idioma="pt" indice={2} />);
    expect(container.querySelector('.cartao.sem-capa')).toBeTruthy();
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('video')).toBeNull();
    expect(container.querySelector('a')).toBeNull();
  });
});

describe('BarraProgresso', () => {
  it('tem 29 tracinhos a cada 9px e a barra ativa', () => {
    const { container } = render(<BarraProgresso />);
    const tracinhos = [...container.querySelectorAll<HTMLElement>('.tracinho')];
    expect(tracinhos).toHaveLength(29);
    tracinhos.forEach((t, i) => expect(t.style.left).toBe(`${9 * i}px`));
    expect(container.querySelector('.barra-ativa')).toBeTruthy();
  });
});
