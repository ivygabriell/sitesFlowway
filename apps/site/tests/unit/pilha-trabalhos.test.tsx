import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { PilhaTrabalhos } from '@/componentes/pilha-trabalhos/PilhaTrabalhos';
import { contador, curvaDaVelocidade, posePlano } from '@/componentes/pilha-trabalhos/pose';
import { t } from '@/conteudo/textos';
import { gsap } from '@/gsap';
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

  it('assentado, o trabalho atual fica de frente no centro, e o seguinte meia volta adiante, 87vh abaixo e ao fundo da órbita', () => {
    const atual = posePlano(0, 1, 900);
    expect(atual.x).toBeCloseTo(0);
    expect(atual.y).toBeCloseTo(0);
    expect(atual.z).toBeCloseTo(0);
    expect(atual.giro).toBeCloseTo(0);
    const seguinte = posePlano(1, 1, 900);
    expect(seguinte.x).toBeCloseTo(0);
    expect(seguinte.y).toBeCloseTo(-783); // 74vh do plano + 13vh de vão
    expect(seguinte.z).toBeCloseTo(-1600); // do outro lado da órbita de raio 800
    expect(Math.cos(seguinte.giro)).toBeCloseTo(-1); // de costas
    expect(posePlano(-1, 1, 900).z).toBeCloseTo(-1600);
  });

  // Issue #24: a pilha orbita em volta de um eixo 800 unidades atrás do plano assentado; não gira cada plano no lugar.
  it('no meio da troca, o plano que sai vai para a direita e para cima, e o que entra vem da esquerda, mais baixo', () => {
    const sai = posePlano(-0.5, 1, 900);
    expect(sai.x).toBeCloseTo(800);
    expect(sai.y).toBeCloseTo(391.5);
    expect(sai.z).toBeCloseTo(-800);
    const entra = posePlano(0.5, 1, 900);
    expect(entra.x).toBeCloseTo(-800);
    expect(entra.y).toBeCloseTo(-391.5);
    expect(entra.z).toBeCloseTo(-800);
  });

  it('na entrada, o plano começa 8 telas acima, com 7,2π de giro a mais (π por 1000 px de queda), no sentido da rolagem', () => {
    const inicio = posePlano(0, 0, 900);
    expect(inicio.y).toBeCloseTo(7200);
    expect(inicio.giro).toBeCloseTo(-7.2 * Math.PI);
  });

  it('na entrada, os planos descem espalhados pela largura: vizinhos em lados opostos, longe do centro', () => {
    const [a, b] = [posePlano(0, 0.5, 900), posePlano(1, 0.5, 900)];
    expect(Math.sign(a.x)).toBe(-Math.sign(b.x));
    expect(Math.abs(a.x)).toBeGreaterThan(400);
    expect(Math.abs(b.x)).toBeGreaterThan(400);
  });

  it('a curva cresce suave com a velocidade (smoothstep de 0 a 25) e para em 1', () => {
    expect(curvaDaVelocidade(0)).toBe(0);
    expect(curvaDaVelocidade(5)).toBeCloseTo(0.104);
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
      // O nome acessível começa pelo CTA visível (comando de voz), seguido do nome e dos detalhes (revisão do PR #16).
      expect(a.getAttribute('aria-label')).toBe(`Ver trabalho: ${t(tr.nome, 'pt')}, ${t(tr.setor, 'pt')} / ${data} / ${oferta} (abre o site em nova aba)`);
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
    expect(container.querySelector('a.pilha-alvo')?.getAttribute('aria-label')).toMatch(/^View work: Creative tool, .*\(opens the site in a new tab\)$/);
  });
});

// Revisão do PR #16: interações durante a entrada e limpeza ao desmontar.
const timelineDaEntrada = () => {
  const tween = gsap.globalTimeline.getChildren(true, true, false).find((tw) => tw.vars.entrada === 1)!;
  return { tween, timeline: tween.parent!, estado: tween.targets()[0] as { entrada: number; empurrao: number; hover: number } };
};

describe('PilhaTrabalhos: interações', () => {
  // Issue #24: a timeline inteira espera 0,5 s; o nome aparece quando os planos assentam.
  it('na entrada, o empurrão começa a cair em 2,2 s, o nome aparece em 2,5 s (quando os planos assentam) e as informações em 2,7 s', () => {
    const { container } = render(<PilhaTrabalhos />);
    const { tween, timeline } = timelineDaEntrada();
    expect(tween.startTime()).toBe(0.5);
    expect(tween.endTime()).toBe(2.5);
    const inicio = (achar: (tw: gsap.core.Animation) => boolean) => timeline.getChildren(false, true, false).find(achar)!.startTime();
    expect(inicio((tw) => (tw as gsap.core.Tween).vars.empurrao === 0)).toBe(2.2);
    expect(inicio((tw) => (tw as gsap.core.Tween).targets()[0] === container.querySelector('.pilha-alvos'))).toBe(2.5);
    expect(inicio((tw) => (tw as gsap.core.Tween).targets()[0] === container.querySelector('.pilha-info'))).toBe(2.7);
    expect(inicio((tw) => (tw as gsap.core.Tween).targets()[0] === container.querySelector('.pilha-miniaturas'))).toBe(2.7);
    const digitar = gsap.getTweensOf(container.querySelector('.pilha-info span'));
    expect(digitar[0].vars.delay).toBe(2.7);
  });

  // Revisão do PR #26: a referência curva os planos durante toda a descida (flecha das bordas de 5 a 9 px, mediana, de
  // 0 a 1,7 s; 0 px depois que o empurrão acaba). O empurrão vale 10 desde o início e só cai de 2,2 s a 3 s.
  it('na descida, antes de 2,2 s, o empurrão já está em 10, e cai a 0 de 2,2 s a 3 s', () => {
    render(<PilhaTrabalhos />);
    const { timeline, estado } = timelineDaEntrada();
    timeline.pause();
    for (const t of [0, 0.6, 1.5, 2.19]) {
      timeline.time(t);
      expect(estado.empurrao, `empurrão em ${t} s`).toBe(10);
    }
    timeline.time(2.6);
    expect(estado.empurrao).toBeCloseTo(5);
    timeline.time(3);
    expect(estado.empurrao).toBe(0);
  });

  // Revisão do PR #26: enquanto o nome não aparece (até 2,5 s), o alvo invisível não recebe clique nem foco.
  it('durante a entrada, os alvos ficam inertes até o nome aparecer, em 2,5 s', () => {
    const { container } = render(<PilhaTrabalhos />);
    const { timeline } = timelineDaEntrada();
    const alvos = container.querySelector('.pilha-alvos')!;
    timeline.pause();
    act(() => void timeline.time(1));
    expect(alvos.hasAttribute('inert')).toBe(true);
    act(() => void timeline.time(2.49));
    expect(alvos.hasAttribute('inert')).toBe(true);
    act(() => void timeline.time(2.5));
    expect(alvos.hasAttribute('inert')).toBe(false);
  });

  it('o hover antes do fim da entrada não cancela a descida nem a curva dos planos', () => {
    const { container } = render(<PilhaTrabalhos />);
    const { timeline, estado } = timelineDaEntrada();
    timeline.pause().time(2.1);
    fireEvent.mouseEnter(container.querySelector('a.pilha-alvo')!);
    timeline.time(timeline.duration());
    expect(estado.entrada).toBe(1);
    expect(estado.empurrao).toBe(0);
  });

  it('nenhum tween de hover, moldura ou digitação sobrevive à desmontagem', () => {
    const { container, unmount } = render(<PilhaTrabalhos />);
    const { timeline, estado } = timelineDaEntrada();
    timeline.pause().time(timeline.duration());
    fireEvent.mouseEnter(container.querySelector('a.pilha-alvo')!);
    fireEvent.mouseEnter(container.querySelector('.pilha-miniaturas img')!);
    const moldura = container.querySelector('.pilha-moldura')!;
    const info = [...container.querySelectorAll('.pilha-info span')];
    unmount();
    expect(gsap.getTweensOf(estado)).toHaveLength(0);
    expect(gsap.getTweensOf(moldura)).toHaveLength(0);
    expect(gsap.getTweensOf(info)).toHaveLength(0);
  });
});

describe('PaginaTrabalhos', () => {
  it('sem WebGL (jsdom) fica com a lista de cartões, sem a pilha', () => {
    const { container } = render(<PaginaTrabalhos />);
    expect(container.querySelectorAll('a.cartao')).toHaveLength(5);
    expect(container.querySelector('.pilha-trabalhos')).toBeNull();
  });
});
