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
  previa: ['/previa-teste.webm', '/previa-teste.mp4'],
};

// Mouse fino (hover: hover e pointer: fine) e movimento reduzido, como o navegador responderia.
const ambiente = ({ mouseFino, reduzido }: { mouseFino: boolean; reduzido: boolean }) =>
  vi.spyOn(window, 'matchMedia').mockImplementation(
    (q: string) =>
      ({ matches: q.includes('pointer: fine') ? mouseFino : q.includes('reduce') ? reduzido : false, media: q, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} }) as unknown as MediaQueryList,
  );
const midia = () => ({
  tocar: vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined),
  pausar: vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {}),
});

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

  it('renderiza os 5 trabalhos com capa e prévia, sem link nem parada de teclado', () => {
    const { container } = render(<Capitulos />);
    expect(container.querySelectorAll('.cartao')).toHaveLength(5);
    expect(container.querySelectorAll('.cartao.com-capa')).toHaveLength(5);
    expect(container.querySelectorAll('a')).toHaveLength(0);
    expect(container.querySelectorAll('[tabindex]')).toHaveLength(0);
    // A cena WebGL casa os planos pela ordem de .cartao-img img: uma imagem por cartão, na ordem da lista.
    expect([...container.querySelectorAll('.cartao-img img')].map((i) => i.getAttribute('src'))).toEqual(listaDeTrabalhos.map((tr) => tr.capa));
    expect(container.querySelectorAll('.cartao-previa video')).toHaveLength(5);
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
  it('com capa, mostra a imagem e a prévia, e não é sem-capa', () => {
    const { container } = render(<CartaoTrabalho trabalho={comCapa} idioma="pt" indice={0} />);
    const cartao = container.querySelector('.cartao')!;
    expect(cartao.classList.contains('sem-capa')).toBe(false);
    expect(container.querySelector('.cartao-previa')).toBeTruthy();
    const img = container.querySelector('.cartao-img img')!;
    expect(img.getAttribute('src')).toBe('/capa-teste.webp');
    expect(img.getAttribute('alt')).toBe('Trabalho de teste');
  });

  it('a prévia é um vídeo mudo, em loop, sem pré-carga e sem foco, com uma fonte por formato', () => {
    const { container } = render(<CartaoTrabalho trabalho={comCapa} idioma="pt" indice={0} />);
    const video = container.querySelector<HTMLVideoElement>('.cartao-previa video')!;
    expect(video.muted).toBe(true);
    expect(video.loop).toBe(true);
    expect(video.hasAttribute('playsinline')).toBe(true);
    expect(video.getAttribute('preload')).toBe('none');
    expect([...video.querySelectorAll('source')].map((s) => [s.getAttribute('src'), s.getAttribute('type')])).toEqual([
      ['/previa-teste.webm', 'video/webm'],
      ['/previa-teste.mp4', 'video/mp4'],
    ]);
    expect(container.querySelectorAll('[tabindex], a')).toHaveLength(0);
    expect(container.querySelectorAll('.cartao-img img')).toHaveLength(1);
  });

  it('com capa e sem prévia, não há bloco de prévia (nada de quadro preto vazio)', () => {
    const { container } = render(<CartaoTrabalho trabalho={{ ...comCapa, previa: undefined }} idioma="pt" indice={0} />);
    expect(container.querySelector('.cartao-img img')).toBeTruthy();
    expect(container.querySelector('.cartao-previa')).toBeNull();
  });

  it('com mouse fino, entrar toca a prévia e sair pausa e volta ao começo', () => {
    ambiente({ mouseFino: true, reduzido: false });
    const { tocar, pausar } = midia();
    const aoPassar = vi.fn();
    const { container } = render(<CartaoTrabalho trabalho={comCapa} idioma="pt" indice={3} aoPassar={aoPassar} />);
    const cartao = container.querySelector('.cartao')!;
    const video = container.querySelector('video')!;
    fireEvent.mouseEnter(cartao);
    expect(tocar).toHaveBeenCalledTimes(1);
    expect(aoPassar).toHaveBeenLastCalledWith(3, true);
    video.currentTime = 2;
    fireEvent.mouseLeave(cartao);
    expect(pausar).toHaveBeenCalledTimes(1);
    expect(video.currentTime).toBe(0);
    expect(aoPassar).toHaveBeenLastCalledWith(3, false);
  });

  it.each([
    ['no toque (sem mouse fino)', { mouseFino: false, reduzido: false }],
    ['com movimento reduzido', { mouseFino: true, reduzido: true }],
  ])('%s, a prévia não toca sozinha', (_, cenario) => {
    ambiente(cenario);
    const { tocar } = midia();
    const { container } = render(<CartaoTrabalho trabalho={comCapa} idioma="pt" indice={0} />);
    fireEvent.mouseEnter(container.querySelector('.cartao')!);
    expect(tocar).not.toHaveBeenCalled();
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
