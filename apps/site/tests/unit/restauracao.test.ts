import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SCRIPT_RESTAURANDO, TETO_RESTAURANDO, marcarVolta, mostrarPagina, restaurandoNestaCarga, voltouNestaCarga } from '@/lib/restauracao';

// Rafael, 2026-11-09: recarregar vai ao topo; o voltar do navegador devolve ao lugar, sem mostrar o topo antes.
const navegacao = (tipo: string) =>
  vi.spyOn(performance, 'getEntriesByType').mockReturnValue([{ type: tipo }] as unknown as PerformanceEntryList);
const largura = (px: number) => Object.defineProperty(window, 'innerWidth', { value: px, configurable: true });

// O script do head roda antes do React; ele decide se a carga é um voltar e marca o <html>.
const rodarScript = () => new Function(SCRIPT_RESTAURANDO)();
const escondida = () => document.documentElement.classList.contains('restaurando');

beforeEach(() => {
  sessionStorage.clear();
  document.documentElement.className = '';
  delete document.documentElement.dataset.voltou;
  largura(1440);
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('voltar do navegador', () => {
  it('back_forward com posição guardada: marca a volta, esconde a página e vai restaurar', () => {
    navegacao('back_forward');
    sessionStorage.setItem('abertura-tocou', '1');
    sessionStorage.setItem('rolagem:/', '3840');
    rodarScript();
    expect(voltouNestaCarga()).toBe(true);
    expect(escondida()).toBe(true);
    expect(restaurandoNestaCarga('/')).toBe(true);
  });

  // Revisão de 2026-11-09: do bfcache o site recarrega (a página voltaria com a transição cobrindo a tela), e a carga
  // nova é do tipo reload; a marca deixada antes do reload faz ela contar como voltar.
  it('recarga vinda do bfcache (marcarVolta antes do reload) conta como voltar, uma vez só', () => {
    marcarVolta();
    navegacao('reload');
    sessionStorage.setItem('abertura-tocou', '1');
    sessionStorage.setItem('rolagem:/', '3840');
    rodarScript();
    expect(voltouNestaCarga()).toBe(true);
    expect(escondida()).toBe(true);
    expect(restaurandoNestaCarga('/')).toBe(true);
    // A marca é consumida: a recarga seguinte (F5) vai ao topo.
    document.documentElement.className = '';
    delete document.documentElement.dataset.voltou;
    rodarScript();
    expect(voltouNestaCarga()).toBe(false);
  });

  it('com movimento reduzido, onde a abertura nunca toca, esconde e restaura mesmo sem a chave da abertura', () => {
    vi.spyOn(window, 'matchMedia').mockImplementation((q: string) => ({ matches: q.includes('reduce') }) as MediaQueryList);
    navegacao('back_forward');
    sessionStorage.setItem('rolagem:/', '3840');
    rodarScript();
    expect(escondida()).toBe(true);
    expect(restaurandoNestaCarga('/')).toBe(true);
  });

  it.each([1440, 390])('em %ipx com a abertura ainda por tocar, não esconde (a abertura cobre a tela)', (px) => {
    largura(px);
    navegacao('back_forward');
    sessionStorage.setItem('rolagem:/', '3840');
    rodarScript();
    expect(escondida()).toBe(false);
    expect(restaurandoNestaCarga('/')).toBe(false);
  });

  it('sem posição guardada, marca a volta mas não esconde', () => {
    navegacao('back_forward');
    sessionStorage.setItem('abertura-tocou', '1');
    rodarScript();
    expect(voltouNestaCarga()).toBe(true);
    expect(escondida()).toBe(false);
    expect(restaurandoNestaCarga('/')).toBe(false);
  });
});

describe('recarga e primeira visita vão ao topo', () => {
  it.each(['reload', 'navigate'])('%s não é voltar e não esconde', (tipo) => {
    navegacao(tipo);
    sessionStorage.setItem('abertura-tocou', '1');
    sessionStorage.setItem('rolagem:/', '3840');
    rodarScript();
    expect(voltouNestaCarga()).toBe(false);
    expect(escondida()).toBe(false);
    expect(restaurandoNestaCarga('/')).toBe(false);
  });

  it('o script tira a restauração do navegador (que devolvia a rolagem cortada, ex. 994 px)', () => {
    history.scrollRestoration = 'auto';
    navegacao('reload');
    rodarScript();
    expect(history.scrollRestoration).toBe('manual');
  });
});

describe('teto e saída do esconderijo', () => {
  it('mostra sozinho no teto, mesmo sem o React', () => {
    vi.useFakeTimers();
    navegacao('back_forward');
    sessionStorage.setItem('abertura-tocou', '1');
    sessionStorage.setItem('rolagem:/', '3840');
    rodarScript();
    expect(escondida()).toBe(true);
    vi.advanceTimersByTime(TETO_RESTAURANDO);
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
