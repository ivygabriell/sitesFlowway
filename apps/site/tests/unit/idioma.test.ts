import { describe, expect, it } from 'vitest';
import { idiomaDoCaminho, naOutraLingua, paginaDoCaminho, rota } from '@/lib/idioma';

describe('rotas nas duas línguas', () => {
  it('rota() leva cada página ao endereço da língua', () => {
    expect([rota('inicio', 'pt'), rota('inicio', 'en')]).toEqual(['/', '/en']);
    expect([rota('trabalhos', 'pt'), rota('trabalhos', 'en')]).toEqual(['/trabalhos', '/en/work']);
    expect([rota('contato', 'pt'), rota('contato', 'en')]).toEqual(['/contato', '/en/contact']);
    expect([rota('privacidade', 'pt'), rota('privacidade', 'en')]).toEqual(['/privacidade', '/en/privacy']);
  });

  it('idiomaDoCaminho()', () => {
    expect(idiomaDoCaminho('/')).toBe('pt');
    expect(idiomaDoCaminho('/trabalhos')).toBe('pt');
    expect(idiomaDoCaminho('/en')).toBe('en');
    expect(idiomaDoCaminho('/en/work')).toBe('en');
    expect(idiomaDoCaminho('/entrar')).toBe('pt');
  });

  it('naOutraLingua() leva à mesma página na outra língua, ou ao início dela', () => {
    expect(naOutraLingua('/en/work')).toBe('/trabalhos');
    expect(naOutraLingua('/contato')).toBe('/en/contact');
    expect(naOutraLingua('/en')).toBe('/');
    expect(naOutraLingua('/')).toBe('/en');
    expect(naOutraLingua('/qualquer')).toBe('/en');
    expect(naOutraLingua('/en/qualquer')).toBe('/');
  });

  it('paginaDoCaminho()', () => {
    expect(paginaDoCaminho('/')).toBe('inicio');
    expect(paginaDoCaminho('/en/contact/')).toBe('contato');
    expect(paginaDoCaminho('/qualquer')).toBeNull();
  });
});
