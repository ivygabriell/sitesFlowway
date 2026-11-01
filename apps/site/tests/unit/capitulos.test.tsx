import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { CartaoTrabalho } from '@/compartilhados/CartaoTrabalho';
import { BarraProgresso } from '@/componentes/capitulos/BarraProgresso';
import { Capitulos } from '@/componentes/capitulos/Capitulos';
import { t } from '@/conteudo/textos';
import { type Trabalho, linhaDoCartao, marcadoresDeConstrucao } from '@/conteudo/trabalhos';
import { ProvedorIdioma } from '@/lib/useIdioma';

afterEach(cleanup);

const comCapa: Trabalho = {
  slug: 'teste',
  nome: { pt: 'Trabalho de teste' },
  setor: { pt: 'Setor' },
  mesAno: { pt: 'Mês' },
  oferta: 'landing-page',
  conceito: false,
  capa: '/capa-teste.webp',
  previa: '/previa-teste.mp4',
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

  it('renderiza os 4 marcadores como cartões sem capa, sem link, sem imagem e sem prévia', () => {
    const { container } = render(<Capitulos />);
    expect(container.querySelectorAll('.cartao')).toHaveLength(4);
    expect(container.querySelectorAll('.cartao.sem-capa')).toHaveLength(4);
    expect(container.querySelectorAll('a[href^="/trabalhos/"]')).toHaveLength(0);
    expect(container.querySelectorAll('.cartoes a')).toHaveLength(0);
    expect(container.querySelectorAll('.cartao img')).toHaveLength(0);
    expect(container.querySelectorAll('.cartao-previa')).toHaveLength(0);
  });

  it('cada cartão mostra o nome e a linha de informações', () => {
    const { container } = render(<Capitulos />);
    const cartoes = [...container.querySelectorAll('.cartao')];
    cartoes.forEach((c, i) => {
      const m = marcadoresDeConstrucao[i];
      expect(c.querySelector('.cartao-titulo')?.textContent).toBe(t(m.nome, 'pt'));
      const [data, oferta] = linhaDoCartao(m, 'pt');
      expect(c.querySelector('.cartao-subtitulo')?.textContent).toBe(data + oferta);
    });
  });
});

describe('CartaoTrabalho', () => {
  it('com capa, mostra a imagem e a prévia, e não é sem-capa', () => {
    const { container } = render(<CartaoTrabalho trabalho={comCapa} idioma="pt" indice={0} />);
    const cartao = container.querySelector('.cartao')!;
    expect(cartao.classList.contains('sem-capa')).toBe(false);
    expect(container.querySelector('.cartao-previa')).toBeTruthy();
    const img = container.querySelector('.cartao-img img')!;
    expect(img.getAttribute('src')).toBe('/capa-teste.webp');
    expect(img.getAttribute('alt')).toBe('Trabalho de teste');
  });

  it('sem capa, é um bloco liso sem imagem nem prévia', () => {
    const { container } = render(<CartaoTrabalho trabalho={marcadoresDeConstrucao[2]} idioma="pt" indice={2} />);
    expect(container.querySelector('.cartao.sem-capa')).toBeTruthy();
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('.cartao-previa')).toBeNull();
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
