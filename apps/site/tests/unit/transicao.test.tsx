import { describe, expect, it } from 'vitest';
import { corDaTransicao, destinoDaTransicao, ehCliqueSimples } from '@/componentes/transicao/cliqueSimples';
import { marcarModo } from '@/lib/webgl';

const clique = (extra: Partial<MouseEvent> = {}) => ({ button: 0, ctrlKey: false, metaKey: false, shiftKey: false, altKey: false, ...extra }) as MouseEvent;

const link = (href: string, attrs: Record<string, string> = {}) => {
  const a = document.createElement('a');
  a.setAttribute('href', href);
  for (const [k, v] of Object.entries(attrs)) a.setAttribute(k, v);
  return a;
};

describe('ehCliqueSimples', () => {
  it('é falso com o botão do meio ou com Ctrl, Cmd, Shift ou Alt', () => {
    expect(ehCliqueSimples(clique({ button: 1 }))).toBe(false);
    expect(ehCliqueSimples(clique({ metaKey: true }))).toBe(false);
    expect(ehCliqueSimples(clique({ ctrlKey: true }))).toBe(false);
    expect(ehCliqueSimples(clique({ shiftKey: true }))).toBe(false);
    expect(ehCliqueSimples(clique({ altKey: true }))).toBe(false);
  });
  it('é verdadeiro com o botão principal sem modificador', () => {
    expect(ehCliqueSimples(clique({ button: 0 }))).toBe(true);
  });
});

describe('destinoDaTransicao', () => {
  it('aceita links internos da mesma língua', () => {
    expect(destinoDaTransicao(link('/contato'), '/')).toBe('/contato');
    expect(destinoDaTransicao(link('/en/work'), '/en')).toBe('/en/work');
    expect(destinoDaTransicao(link('/'), '/trabalhos')).toBe('/');
  });
  it('recusa links externos, de protocolo relativo (//), âncoras e a própria página', () => {
    expect(destinoDaTransicao(link('//exemplo.com'), '/')).toBeNull();
    expect(destinoDaTransicao(link('https://exemplo.com'), '/')).toBeNull();
    expect(destinoDaTransicao(link('javascript:alert(1)'), '/')).toBeNull();
    expect(destinoDaTransicao(link('#topo'), '/')).toBeNull();
    expect(destinoDaTransicao(link('/trabalhos'), '/')).toBe('/trabalhos');
    expect(destinoDaTransicao(link('/'), '/')).toBeNull();
  });
  it('recusa a barra invertida, que o navegador lê como barra e leva a outra origem', () => {
    expect(destinoDaTransicao(link('/' + '\\' + 'example.com'), '/')).toBeNull();
    expect(destinoDaTransicao(link('/' + '\\' + '/example.com'), '/')).toBeNull();
    expect(destinoDaTransicao(link('/contato' + '\\' + 'x'), '/')).toBeNull();
  });
  it('recusa o que resolve para outra origem, mesmo começando com /', () => {
    expect(destinoDaTransicao(link('/\t/example.com'), '/')).toBeNull();
    expect(destinoDaTransicao(link('/\n/example.com'), '/')).toBeNull();
  });
  it('recusa a troca de língua, nova aba, download, data-sem-transicao e o item atual do menu', () => {
    expect(destinoDaTransicao(link('/en'), '/')).toBeNull();
    expect(destinoDaTransicao(link('/contato', { target: '_blank' }), '/')).toBeNull();
    expect(destinoDaTransicao(link('/contato', { download: '' }), '/')).toBeNull();
    expect(destinoDaTransicao(link('/trabalhos', { 'data-sem-transicao': '' }), '/')).toBeNull();
    expect(destinoDaTransicao(link('/contato', { 'aria-current': 'page' }), '/')).toBeNull();
  });
});

describe('corDaTransicao', () => {
  it('é o claro para a Início e o escuro para as outras páginas', () => {
    expect(corDaTransicao('/')).toBe('var(--claro)');
    expect(corDaTransicao('/en')).toBe('var(--claro)');
    expect(corDaTransicao('/contato')).toBe('var(--escuro)');
    expect(corDaTransicao('/en/work')).toBe('var(--escuro)');
  });
});

describe('marcarModo', () => {
  it('põe no <html> uma só classe de modo (sem WebGL no jsdom)', () => {
    document.documentElement.classList.add('modo-desktop');
    expect(marcarModo()).toBe('sem-webgl');
    const modos = [...document.documentElement.classList].filter((c) => c.startsWith('modo-'));
    expect(modos).toEqual(['modo-sem-webgl']);
  });
});
