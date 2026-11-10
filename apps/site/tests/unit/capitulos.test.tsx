import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CartaoTrabalho } from '@/compartilhados/CartaoTrabalho';
import { PopupTrabalho } from '@/compartilhados/PopupTrabalho';
import { BarraProgresso } from '@/componentes/capitulos/BarraProgresso';
import { Capitulos } from '@/componentes/capitulos/Capitulos';
import { t } from '@/conteudo/textos';
import { type Trabalho, linhaDoCartao, listaDeTrabalhos, marcadoresDeConstrucao } from '@/conteudo/trabalhos';
import { ProvedorIdioma } from '@/lib/useIdioma';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

const comCapa: Trabalho = {
  slug: 'teste',
  nome: { pt: 'Trabalho de teste' },
  setor: { pt: 'Setor' },
  mesAno: { pt: 'Mês' },
  oferta: 'landing-page',
  conceito: false,
  capa: '/capa-teste.webp',
  previa: ['/previa-teste.mp4'],
};

// Mouse fino (hover: hover e pointer: fine) e movimento reduzido, como o navegador responderia.
const ambiente = ({ mouseFino, reduzido }: { mouseFino: boolean; reduzido: boolean }) =>
  vi.spyOn(window, 'matchMedia').mockImplementation(
    (q: string) =>
      ({ matches: q.includes('pointer: fine') ? mouseFino : q.includes('reduce') ? reduzido : false, media: q, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} }) as unknown as MediaQueryList,
  );

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

  it('renderiza os 5 trabalhos com capa, cada um abrindo o pop-up (sem link)', () => {
    const { container } = render(<Capitulos />);
    expect(container.querySelectorAll('.cartao')).toHaveLength(5);
    expect(container.querySelectorAll('.cartao.com-capa')).toHaveLength(5);
    expect(container.querySelectorAll('a')).toHaveLength(0);
    expect(container.querySelectorAll('.cartao[role="button"][tabindex="0"][aria-haspopup="dialog"]')).toHaveLength(5);
    // A cena WebGL casa os planos pela ordem de .cartao-img img: uma imagem por cartão, na ordem da lista.
    expect([...container.querySelectorAll('.cartao-img img')].map((i) => i.getAttribute('src'))).toEqual(listaDeTrabalhos.map((tr) => tr.capa));
    expect(container.querySelectorAll('.cartao video')).toHaveLength(0);
  });

  // Pedido de Rafael (2026-11-09): passar o mouse ou clicar abre um pop-up com a página inteira do trabalho.
  it('clicar num cartão abre o pop-up daquele trabalho, e fechar tira o pop-up', () => {
    render(<Capitulos />);
    fireEvent.click(document.querySelectorAll('.cartao')[3]);
    const dialogo = screen.getByRole('dialog');
    expect(dialogo.getAttribute('aria-label')).toBe(t(listaDeTrabalhos[3].nome, 'pt'));
    expect(dialogo.querySelector('video source')?.getAttribute('src')).toBe(listaDeTrabalhos[3].previa![0]);
    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }));
    expect(screen.queryByRole('dialog')).toBeNull();
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
  it('com capa, mostra a imagem, sem vídeo dentro, e é acionável por mouse e teclado', () => {
    const { container } = render(<CartaoTrabalho trabalho={comCapa} idioma="pt" indice={0} />);
    const cartao = container.querySelector('.cartao')!;
    expect(cartao.classList.contains('sem-capa')).toBe(false);
    expect(cartao.getAttribute('role')).toBe('button');
    expect(cartao.getAttribute('tabindex')).toBe('0');
    expect(cartao.getAttribute('aria-haspopup')).toBe('dialog');
    expect(container.querySelector('video')).toBeNull();
    const img = container.querySelector('.cartao-img img')!;
    expect(img.getAttribute('src')).toBe('/capa-teste.webp');
    expect(img.getAttribute('alt')).toBe('Trabalho de teste');
    expect(container.querySelectorAll('.cartao-img img')).toHaveLength(1);
  });

  it('clique, Enter e espaço abrem o pop-up', () => {
    const aoAbrir = vi.fn();
    const { container } = render(<CartaoTrabalho trabalho={comCapa} idioma="pt" indice={2} aoAbrir={aoAbrir} />);
    const cartao = container.querySelector('.cartao')!;
    fireEvent.click(cartao);
    fireEvent.keyDown(cartao, { key: 'Enter' });
    fireEvent.keyDown(cartao, { key: ' ' });
    expect(aoAbrir.mock.calls).toEqual([[2], [2], [2]]);
  });

  it('com mouse fino, parar sobre o cartão abre o pop-up depois de um instante; passar direto não abre', () => {
    vi.useFakeTimers();
    ambiente({ mouseFino: true, reduzido: false });
    const aoAbrir = vi.fn();
    const aoPassar = vi.fn();
    const { container } = render(<CartaoTrabalho trabalho={comCapa} idioma="pt" indice={1} aoAbrir={aoAbrir} aoPassar={aoPassar} />);
    const cartao = container.querySelector('.cartao')!;
    fireEvent.mouseEnter(cartao);
    expect(aoPassar).toHaveBeenLastCalledWith(1, true);
    act(() => vi.advanceTimersByTime(100));
    fireEvent.mouseLeave(cartao);
    act(() => vi.advanceTimersByTime(500));
    expect(aoAbrir).not.toHaveBeenCalled();
    fireEvent.mouseEnter(cartao);
    act(() => vi.advanceTimersByTime(300));
    expect(aoAbrir).toHaveBeenCalledWith(1);
  });

  it('no toque (sem mouse fino), entrar com o dedo não abre sozinho: só o toque (clique) abre', () => {
    vi.useFakeTimers();
    ambiente({ mouseFino: false, reduzido: false });
    const aoAbrir = vi.fn();
    const { container } = render(<CartaoTrabalho trabalho={comCapa} idioma="pt" indice={0} aoAbrir={aoAbrir} />);
    fireEvent.mouseEnter(container.querySelector('.cartao')!);
    act(() => vi.advanceTimersByTime(1000));
    expect(aoAbrir).not.toHaveBeenCalled();
  });

  it('sem capa, é um bloco liso sem imagem nem prévia', () => {
    const { container } = render(<CartaoTrabalho trabalho={marcadoresDeConstrucao[2]} idioma="pt" indice={2} />);
    expect(container.querySelector('.cartao.sem-capa')).toBeTruthy();
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('video')).toBeNull();
    expect(container.querySelector('a')).toBeNull();
    expect(container.querySelector('.cartao')?.getAttribute('role')).toBeNull();
  });
});

describe('PopupTrabalho', () => {
  const abrir = (aoFechar = vi.fn(), reduzido = false) => {
    ambiente({ mouseFino: true, reduzido });
    render(<PopupTrabalho trabalho={comCapa} idioma="pt" aoFechar={aoFechar} />);
    return aoFechar;
  };

  it('é um diálogo com o nome e o vídeo da página inteira (a capa enquanto carrega)', () => {
    abrir();
    const dialogo = screen.getByRole('dialog');
    expect(dialogo.getAttribute('aria-modal')).toBe('true');
    expect(dialogo.getAttribute('aria-label')).toBe('Trabalho de teste');
    expect(dialogo.textContent).toContain('Trabalho de teste');
    const video = dialogo.querySelector('video')!;
    expect(video.getAttribute('poster')).toBe('/capa-teste.webp');
    expect(video.muted).toBe(true);
    expect(video.loop).toBe(true);
    expect(video.autoplay).toBe(true);
    expect(video.hasAttribute('playsinline')).toBe(true);
    expect(video.querySelector('source')?.getAttribute('src')).toBe('/previa-teste.mp4');
    // Fica no body: a seção tem pin com transform, que prenderia um fixed lá dentro.
    expect(dialogo.closest('.popup-trabalho-fundo')?.parentElement).toBe(document.body);
  });

  it('com movimento reduzido, o vídeo não toca sozinho e mostra os controles', () => {
    abrir(vi.fn(), true);
    const video = screen.getByRole('dialog').querySelector('video')!;
    expect(video.autoplay).toBe(false);
    expect(video.controls).toBe(true);
  });

  it('o foco vai para Fechar; Fechar, Esc e clicar fora fecham; clicar dentro não', () => {
    const aoFechar = abrir();
    const fechar = screen.getByRole('button', { name: 'Fechar' });
    expect(document.activeElement).toBe(fechar);
    fireEvent.click(screen.getByRole('dialog'));
    expect(aoFechar).not.toHaveBeenCalled();
    fireEvent.click(fechar);
    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.click(document.querySelector('.popup-trabalho-fundo')!);
    expect(aoFechar).toHaveBeenCalledTimes(3);
  });

  it('com mouse fino, tirar o mouse do pop-up fecha', () => {
    const aoFechar = abrir();
    fireEvent.mouseLeave(screen.getByRole('dialog'));
    expect(aoFechar).toHaveBeenCalledTimes(1);
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
