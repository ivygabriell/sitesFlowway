import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Contato } from '@/componentes/contato/Contato';
import { ProvedorIdioma } from '@/lib/useIdioma';
import { alvoDoSimbolo } from '@/marca/amostrar';

// Cada alvo que a esfera recebe fica registrado; a esfera de verdade continua desenhando a div.esfera.
const alvosRecebidos = vi.hoisted(() => [] as unknown[]);
const propsDaEsfera = vi.hoisted(() => [] as Record<string, unknown>[]);
vi.mock('@/compartilhados/esfera/EsferaDeLetras', async (original) => {
  const real = await original<typeof import('@/compartilhados/esfera/EsferaDeLetras')>();
  return {
    ...real,
    EsferaDeLetras: (props: ComponentProps<typeof real.EsferaDeLetras>) => {
      alvosRecebidos.push(props.alvo);
      propsDaEsfera.push(props);
      return <real.EsferaDeLetras {...props} />;
    },
  };
});

// Textos exatos da spec (seção 4.3, linhas Contato e Rodapé).
const FRASE =
  'Na Floway, estratégia e desenvolvimento caminham juntos. Unimos visão criativa, engenharia de software e inteligência artificial para transformar desafios em soluções inteligentes.';
const ESPECIALIDADES = 'Estratégia digital, desenvolvimento web, inteligência artificial, automações e experiências digitais';

beforeEach(() => void (alvosRecebidos.length = 0, propsDaEsfera.length = 0));
afterEach(cleanup);

describe('Contato', () => {
  it('a .frase-contato tem a frase exata da spec (22 palavras)', () => {
    const { container } = render(<Contato />);
    const frase = container.querySelector('.secao-contato .frase-contato')?.textContent;
    expect(frase).toBe(FRASE);
    expect(frase!.split(/\s+/)).toHaveLength(22);
  });

  it('o CTA "Iniciar um projeto →" leva a /contato (sem JavaScript, o link continua)', () => {
    const { getByRole } = render(<Contato />);
    expect(getByRole('link', { name: 'Iniciar um projeto →' }).getAttribute('href')).toBe('/contato');
  });

  it('em inglês o CTA é "Start a project →" e leva a /en/contact', () => {
    const { getByRole } = render(
      <ProvedorIdioma idioma="en">
        <Contato />
      </ProvedorIdioma>,
    );
    expect(getByRole('link', { name: 'Start a project →' }).getAttribute('href')).toBe('/en/contact');
  });

  it('o rodapé tem especialidades, localização, instagram e direitos, com os rótulos em itálico', () => {
    const { container } = render(<Contato />);
    const rodape = container.querySelector('footer.rodape')!;
    const rotulos = [...rodape.querySelectorAll('i')].map((i) => i.textContent);
    expect(rotulos).toEqual(['especialidades', 'localização', 'instagram']);
    expect(rodape.textContent).toContain(ESPECIALIDADES);
    expect(rodape.textContent).toContain('Brasil');
    expect(rodape.textContent).toContain('@floway');
    expect(rodape.textContent).toContain('© 2026 Floway. Todos os direitos reservados.');
  });

  it('a esfera de letras está na seção, no lugar do cubo com física', () => {
    const { container } = render(<Contato />);
    expect(container.querySelector('.secao-contato div.esfera')).toBeTruthy();
    expect(container.querySelector('.circulo-escuro')).toBeTruthy();
  });

  it('nenhum @ além do Instagram (sem e-mail)', () => {
    const { container } = render(<Contato />);
    expect(container.textContent!.match(/@/g)).toEqual(['@']);
    expect(container.textContent).toContain('@floway');
  });

  // R1 da Arquitetura: uma arrow inline recriaria os 20 mil atributos a cada render do pai.
  it('passa à esfera a fábrica estável alvoDoSimbolo, a mesma em todo render', () => {
    const { rerender } = render(<Contato />);
    rerender(<Contato />);
    expect(alvosRecebidos.length).toBeGreaterThanOrEqual(2);
    for (const alvo of alvosRecebidos) expect(alvo).toBe(alvoDoSimbolo);
  });
});

// Issue #29, passo 4: no fim da Início, "Iniciar um projeto" abre o chat na própria cena (estado 02) e "Fechar" volta ao 01.
describe('Contato: chat na cena', () => {
  const esfera = () => propsDaEsfera[propsDaEsfera.length - 1];
  const abrir = () => {
    const cta = screen.getByRole('link', { name: 'Iniciar um projeto →' });
    let navegou = true;
    act(() => { navegou = fireEvent.click(cta); });
    return navegou;
  };

  it('clicar em "Iniciar um projeto" não navega: abre o chat com o foco no campo e leva o globo ao canto', () => {
    const { container } = render(<Contato />);
    expect(container.querySelector('.contato-chat')).toBeNull();
    expect(esfera().lugar ?? null).toBeNull();
    expect(abrir()).toBe(false);
    expect(container.querySelector('.secao-contato')!.classList.contains('com-chat')).toBe(true);
    screen.getByRole('heading', { name: 'Como podemos ajudar?' });
    expect(document.activeElement).toBe(screen.getByRole('textbox', { name: 'Sua mensagem' }));
    const canto = container.querySelector('.contato-chat .contato-globo-lugar');
    expect(canto).not.toBeNull();
    expect(esfera().lugar).toBe(canto);
    expect(esfera().formarAlvo).toBe(false);
    screen.getByText('online');
  });

  it('"Fechar" volta ao estado 01 sem perder a conversa, com o foco de volta no CTA', () => {
    const { container } = render(<Contato />);
    abrir();
    fireEvent.change(screen.getByRole('textbox', { name: 'Sua mensagem' }), { target: { value: 'Quero um site para o estúdio' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar mensagem' }));
    screen.getByText('Quero um site para o estúdio');
    act(() => { fireEvent.click(screen.getByRole('button', { name: /Fechar/ })); });
    const secao = container.querySelector('.secao-contato')!;
    expect(secao.classList.contains('com-chat')).toBe(false);
    expect((container.querySelector('.contato-chat') as HTMLElement).hidden).toBe(true);
    expect(esfera().lugar ?? null).toBeNull();
    expect(esfera().formarAlvo).toBeUndefined(); // de volta à alternância da Início
    expect(document.activeElement).toBe(screen.getByRole('link', { name: 'Iniciar um projeto →' }));
    abrir();
    screen.getByText('Quero um site para o estúdio');
  });

  it('Esc também fecha', () => {
    const { container } = render(<Contato />);
    abrir();
    act(() => { fireEvent.keyDown(screen.getByRole('textbox', { name: 'Sua mensagem' }), { key: 'Escape' }); });
    expect(container.querySelector('.secao-contato')!.classList.contains('com-chat')).toBe(false);
  });

  it('com Ctrl/Cmd o CTA continua abrindo o /contato noutra aba', () => {
    render(<Contato />);
    const cta = screen.getByRole('link', { name: 'Iniciar um projeto →' });
    // Quem chega ao documento vê se o componente impediu; depois impede, porque o jsdom não navega.
    const prevenidos: boolean[] = [];
    const ouvir = (e: Event) => { prevenidos.push(e.defaultPrevented); e.preventDefault(); };
    document.addEventListener('click', ouvir);
    fireEvent.click(cta, { metaKey: true });
    fireEvent.click(cta, { ctrlKey: true });
    document.removeEventListener('click', ouvir);
    expect(prevenidos).toEqual([false, false]);
    expect(document.querySelector('.contato-chat')).toBeNull();
  });

  it('enquanto o chat está aberto, a página não rola (a cena fica presa) e o selo sai', () => {
    render(<Contato />);
    abrir();
    expect(document.documentElement.classList.contains('contato-aberto')).toBe(true);
    act(() => { fireEvent.click(screen.getByRole('button', { name: /Fechar/ })); });
    expect(document.documentElement.classList.contains('contato-aberto')).toBe(false);
  });
});
