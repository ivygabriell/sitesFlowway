import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PaginaTrabalhos } from '@/paginas/PaginaTrabalhos';

// Desktop com WebGL e canvas pronto; a pilha real precisa de WebGL, aqui só a marca de que ela entrou.
vi.mock('@14islands/r3f-scroll-rig', () => ({ useScrollRig: () => ({ isCanvasAvailable: true }) }));
vi.mock('@/lib/webgl', () => ({ temWebgl: () => true }));
vi.mock('@/componentes/pilha-trabalhos/PilhaTrabalhos', () => ({ PilhaTrabalhos: () => <div className="pilha-trabalhos" /> }));

afterEach(() => {
  cleanup();
  document.head.querySelector('#estilo-teste')?.remove();
});

// Issue #23 (revisão do PR #25): a decisão não pode depender de checkVisibility, que o Safari 17.0–17.3 não tem.
describe('PaginaTrabalhos no desktop, quando o canvas fica pronto', () => {
  it('sem checkVisibility, a lista que o CSS já revelou fica, sem a pilha', () => {
    expect('checkVisibility' in Element.prototype).toBe(false);
    const { container } = render(<PaginaTrabalhos />);
    expect(container.querySelector('.pilha-trabalhos')).toBeNull();
    expect(container.querySelectorAll('a.cartao')).toHaveLength(5);
  });

  it('com a lista ainda escondida pelo CSS, entra a pilha', () => {
    const estilo = document.createElement('style');
    estilo.id = 'estilo-teste';
    estilo.textContent = '.esperando-pilha > * { visibility: hidden; }';
    document.head.append(estilo);
    const { container } = render(<PaginaTrabalhos />);
    expect(container.querySelector('.pilha-trabalhos')).not.toBeNull();
    expect(container.querySelector('a.cartao')).toBeNull();
  });
});
