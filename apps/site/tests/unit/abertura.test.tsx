import { describe, expect, it } from 'vitest';
import { deveTocarAbertura } from '@/componentes/abertura/Abertura';
import { desenharFilme } from '@/componentes/abertura/filmeAbertura';

describe('deveTocarAbertura', () => {
  it('toca só no desktop, sem movimento reduzido e uma vez por sessão', () => {
    expect(deveTocarAbertura(1440, false, false)).toBe(true);
    expect(deveTocarAbertura(390, false, false)).toBe(false);
    expect(deveTocarAbertura(1440, true, false)).toBe(false);
    expect(deveTocarAbertura(1440, false, true)).toBe(false);
  });
});

describe('desenharFilme', () => {
  it('desenha a palavra FLOWAY cortada em linhas', () => {
    const textos: string[] = [];
    const ctx = new Proxy(
      { canvas: { width: 300, height: 158 }, fillText: (texto: string) => textos.push(texto) },
      { get: (alvo, chave) => (chave in alvo ? alvo[chave as keyof typeof alvo] : () => {}), set: () => true },
    ) as unknown as CanvasRenderingContext2D;
    desenharFilme(ctx, 1);
    expect(textos.length).toBeGreaterThan(1);
    expect(new Set(textos)).toEqual(new Set(['FLOWAY']));
  });
});
