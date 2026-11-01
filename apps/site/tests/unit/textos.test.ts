import { describe, expect, it } from 'vitest';
import '@/conteudo/casca';
import { pendencias, pendente, registrar, t } from '@/conteudo/textos';

describe('textos em duas línguas', () => {
  it('t() devolve o inglês quando existe e o português no lugar quando não', () => {
    expect(t({ pt: 'a' }, 'en')).toBe('a');
    expect(t({ pt: 'a', en: 'b' }, 'en')).toBe('b');
    expect(t({ pt: 'a', en: 'b' }, 'pt')).toBe('a');
  });

  it('pendente() marca o texto que a spec não fixa', () => {
    expect(pendente('x')).toEqual({ pt: '[pendente: x]', pendente: true });
  });

  it('pendencias() lista os textos pendentes e os sem inglês', () => {
    expect(pendencias()).toContain('casca.descritor (pt)');
    expect(pendencias()).not.toContain('casca.selo (en)');
    registrar('teste', { so: { pt: 'só português' }, lista: [{ pt: 'a', en: 'a' }, pendente('b')] });
    expect(pendencias()).toEqual(expect.arrayContaining(['teste.so (en)', 'teste.lista.1 (pt)']));
    expect(pendencias()).not.toContain('teste.lista.0 (en)');
  });

  it('a casca tem os textos da spec', async () => {
    const { casca } = await import('@/conteudo/casca');
    expect(casca.nome).toEqual({ pt: '©FLOWAY', en: '©FLOWAY' });
    expect(casca.menu.trabalhos).toEqual({ pt: 'Trabalhos', en: 'Work' });
    expect(casca.menu.contato).toEqual({ pt: 'Contato', en: 'Contact' });
    expect(casca.voltar).toEqual({ pt: 'Voltar ao início', en: 'Back to home' });
    expect(casca.selo).toEqual({ pt: 'Iniciar projeto', en: 'Start a project' });
    expect(casca.descritor.pendente).toBe(true);
  });
});
