import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SCRIPT_RESTAURANDO, TETO_RESTAURANDO, mostrarPagina, restaurandoNestaCarga } from '@/lib/restauracao';

// Pedido de 2026-11-09: ao recarregar no meio da página, a logo do hero não pode subir no topo antes de a rolagem voltar.
const navegacao = (tipo: string) =>
  vi.spyOn(performance, 'getEntriesByType').mockReturnValue([{ type: tipo }] as unknown as PerformanceEntryList);

const rodarScript = () => new Function(SCRIPT_RESTAURANDO)();
const escondida = () => document.documentElement.classList.contains('restaurando');

beforeEach(() => {
  sessionStorage.clear();
  document.documentElement.className = '';
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('restaurandoNestaCarga', () => {
  // Rafael, 2026-11-09: recarregar a página volta ao topo; só o voltar do navegador devolve ao lugar.
  it('é falso na recarga, mesmo com posição guardada e abertura já vista', () => {
    navegacao('reload');
    sessionStorage.setItem('abertura-tocou', '1');
    sessionStorage.setItem('rolagem:/', '3840');
    expect(restaurandoNestaCarga('/')).toBe(false);
  });

  it.each([
    ['navigate', '1', '3840'],
    ['back_forward', null, '3840'],
    ['back_forward', '1', '0'],
    ['back_forward', '1', null],
  ])('é falso em %s com abertura %s e posição %s', (tipo, abertura, posicao) => {
    navegacao(tipo);
    if (abertura) sessionStorage.setItem('abertura-tocou', abertura);
    if (posicao) sessionStorage.setItem('rolagem:/', posicao);
    expect(restaurandoNestaCarga('/')).toBe(false);
  });

  it('vale para voltar (back_forward) com posição guardada', () => {
    navegacao('back_forward');
    sessionStorage.setItem('abertura-tocou', '1');
    sessionStorage.setItem('rolagem:/en', '500');
    expect(restaurandoNestaCarga('/en')).toBe(true);
  });
});

describe('script do head', () => {
  it('esconde a página quando vai restaurar e mostra sozinho no teto, mesmo sem o React', () => {
    vi.useFakeTimers();
    navegacao('back_forward');
    sessionStorage.setItem('abertura-tocou', '1');
    sessionStorage.setItem('rolagem:' + location.pathname, '3840');
    rodarScript();
    expect(escondida()).toBe(true);
    vi.advanceTimersByTime(TETO_RESTAURANDO);
    expect(escondida()).toBe(false);
  });

  it('não esconde na recarga (ela volta ao topo)', () => {
    navegacao('reload');
    sessionStorage.setItem('abertura-tocou', '1');
    sessionStorage.setItem('rolagem:' + location.pathname, '3840');
    rodarScript();
    expect(escondida()).toBe(false);
  });

  it('não esconde na primeira visita', () => {
    navegacao('navigate');
    sessionStorage.setItem('rolagem:' + location.pathname, '3840');
    rodarScript();
    expect(escondida()).toBe(false);
  });

  it('o teto é curto (até 2,5 s)', () => {
    expect(TETO_RESTAURANDO).toBeLessThanOrEqual(2500);
  });

  it('mostrarPagina tira a classe', () => {
    document.documentElement.classList.add('restaurando');
    mostrarPagina();
    expect(escondida()).toBe(false);
  });
});
