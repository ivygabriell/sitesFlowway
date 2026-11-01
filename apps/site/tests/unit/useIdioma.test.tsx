import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ProvedorIdioma, useIdioma } from '@/lib/useIdioma';

function Mostra() {
  return <span>{useIdioma()}</span>;
}

describe('useIdioma', () => {
  afterEach(cleanup);
  it('é português fora de um provedor', () => {
    expect(render(<Mostra />).container.textContent).toBe('pt');
  });
  it('lê a língua do provedor da casca', () => {
    expect(
      render(
        <ProvedorIdioma idioma="en">
          <Mostra />
        </ProvedorIdioma>,
      ).container.textContent,
    ).toBe('en');
  });
});
