import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Cabecalho } from '@/componentes/cabecalho/Cabecalho';
import { SeloLateral } from '@/componentes/cabecalho/SeloLateral';
import { casca } from '@/conteudo/casca';
import { ProvedorIdioma } from '@/lib/useIdioma';

describe('Cabecalho', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 20, 13, 7, 5));
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('na Início mostra o relógio REC e o atualiza a cada segundo', () => {
    render(<Cabecalho visivel idioma="pt" pagina="inicio" />);
    expect(screen.getByText('REC ter13:07:05')).toBeTruthy();
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByText('REC ter13:07:06')).toBeTruthy();
    expect(document.querySelector('.ponto-relogio')).toBeTruthy();
  });

  it('tem "©FLOWAY" e o descritor que recolhe', () => {
    const { container } = render(<Cabecalho visivel idioma="pt" pagina="inicio" />);
    expect(container.querySelector('.nome')?.textContent).toContain('©FLOWAY');
    expect(container.querySelector('.nome .recolhe')?.textContent).toBe(casca.descritor.pt);
  });

  it('em inglês, o menu leva às páginas em /en e o seletor leva ao português', () => {
    const { container } = render(<Cabecalho visivel idioma="en" pagina="inicio" />);
    const menu = [...container.querySelectorAll('nav a')];
    expect(menu.map((a) => a.getAttribute('href'))).toEqual(['/en/work', '/en/contact']);
    expect(menu.map((a) => a.querySelector('.menu-texto')?.textContent)).toEqual(['Work', 'Contact']);
    expect(container.querySelector('a.idioma')?.getAttribute('href')).toBe('/');
    expect(container.querySelector('a.idioma .menu-texto')?.textContent).toBe('EN');
  });

  it('em português, o menu leva às páginas e o seletor ao inglês da mesma página', () => {
    const { container } = render(<Cabecalho visivel idioma="pt" pagina="contato" />);
    expect([...container.querySelectorAll('nav a')].map((a) => a.getAttribute('href'))).toEqual(['/trabalhos', '/contato']);
    expect(container.querySelector('a.idioma')?.getAttribute('href')).toBe('/en/contact');
  });

  it('o item da página atual tem aria-current e o clique nele não navega', () => {
    const { container } = render(<Cabecalho visivel idioma="pt" pagina="contato" />);
    const [trabalhos, contato] = [...container.querySelectorAll('nav a')];
    expect(contato.getAttribute('aria-current')).toBe('page');
    expect(trabalhos.hasAttribute('aria-current')).toBe(false);
    expect(fireEvent.click(contato)).toBe(false); // preventDefault
    expect(fireEvent.click(trabalhos)).toBe(true);
  });

  it('fora da Início, o relógio vira "Voltar ao início"', () => {
    const { container } = render(<Cabecalho visivel idioma="pt" pagina="trabalhos" />);
    expect(screen.queryByText(/^REC /)).toBeNull();
    expect(document.querySelector('.ponto-relogio')).toBeNull();
    const voltar = container.querySelector('a.voltar');
    expect(voltar?.getAttribute('href')).toBe('/');
    expect(voltar?.querySelector('.menu-texto')?.textContent).toBe('Voltar ao início');
  });

  it('na 404 (página fora do mapa) também mostra "Voltar ao início", na língua certa', () => {
    const { container } = render(<Cabecalho visivel idioma="en" pagina={null} />);
    expect(container.querySelector('a.voltar')?.getAttribute('href')).toBe('/en');
    expect(container.querySelector('a.voltar .menu-texto')?.textContent).toBe('Back to home');
  });

  it('fica escondido até a abertura terminar', () => {
    const { container } = render(<Cabecalho visivel={false} idioma="pt" pagina="inicio" />);
    expect(container.querySelector('.cabecalho')?.classList.contains('visivel')).toBe(false);
  });
});

describe('SeloLateral', () => {
  afterEach(cleanup);
  it('é o atalho "Iniciar projeto" para o contato', () => {
    const { container } = render(<SeloLateral />);
    const selo = container.querySelector('a.selo');
    expect(selo?.getAttribute('href')).toBe('/contato');
    expect(selo?.textContent).toBe('Iniciar projeto');
  });
  it('em inglês leva a /en/contact', () => {
    const { container } = render(
      <ProvedorIdioma idioma="en">
        <SeloLateral />
      </ProvedorIdioma>,
    );
    expect(container.querySelector('a.selo')?.getAttribute('href')).toBe('/en/contact');
    expect(container.querySelector('a.selo')?.textContent).toBe('Start a project');
  });
});
