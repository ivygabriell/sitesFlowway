import { describe, expect, it } from 'vitest';
import { casca } from '@/conteudo/casca';
import { TEXTOS } from '@/conteudo';
import { pendencias, pendente, t } from '@/conteudo/textos';

describe('textos em duas línguas', () => {
  it('t() devolve o inglês quando existe e o português no lugar quando não', () => {
    expect(t({ pt: 'a' }, 'en')).toBe('a');
    expect(t({ pt: 'a', en: 'b' }, 'en')).toBe('b');
    expect(t({ pt: 'a', en: 'b' }, 'pt')).toBe('a');
  });

  it('pendente() marca o texto que a spec não fixa', () => {
    expect(pendente('x')).toEqual({ pt: '[pendente: x]', pendente: true });
  });

  it('pendencias(arvore) devolve o caminho de cada texto pendente ou sem inglês', () => {
    const arvore = { teste: { so: { pt: 'só português' }, menu: { a: { pt: 'a', en: 'a' } }, lista: [{ pt: 'a', en: 'a' }, pendente('b')] } };
    expect(pendencias(arvore)).toEqual(['teste.so (en)', 'teste.lista.1 (pt)']);
  });

  it('o índice junta os módulos de conteúdo, e a casca tem pendências conhecidas', () => {
    expect(TEXTOS.casca).toBe(casca);
    expect(pendencias(TEXTOS)).toContain('casca.descritor (pt)');
    expect(pendencias(TEXTOS)).not.toContain('casca.selo (en)');
  });

  it('a casca tem os textos da spec', () => {
    expect(casca.nome).toEqual({ pt: '©FLOWAY', en: '©FLOWAY' });
    expect(casca.menu.trabalhos).toEqual({ pt: 'Trabalhos', en: 'Work' });
    expect(casca.menu.contato).toEqual({ pt: 'Contato', en: 'Contact' });
    expect(casca.voltar).toEqual({ pt: 'Voltar ao início', en: 'Back to home' });
    expect(casca.selo).toEqual({ pt: 'Iniciar projeto', en: 'Start a project' });
    expect(casca.descritor.pendente).toBe(true);
  });
});
