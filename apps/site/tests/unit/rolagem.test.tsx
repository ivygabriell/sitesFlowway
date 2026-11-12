import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const barra = vi.fn();
vi.mock('@14islands/r3f-scroll-rig', () => ({ SmoothScrollbar: (p: { enabled: boolean }) => { barra(p); return null; } }));
vi.mock('next/navigation', () => ({ usePathname: () => '/' }));
vi.mock('@/estado/abertura', () => ({ useAbertura: () => ({ terminou: true }) }));

import { Rolagem } from '@/componentes/canvas/Rolagem';

const tela = (largura: number, reduzido: boolean) => {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: largura });
  window.matchMedia = vi.fn().mockReturnValue({ matches: reduzido, addEventListener() {}, removeEventListener() {} });
};

describe('Rolagem', () => {
  afterEach(() => barra.mockClear());

  // A pessoa escolheu a versão B (2026-11-11): no celular o scroll nativo andava separado dos pins e do canvas e travava.
  it('liga a rolagem suave também no celular', () => {
    tela(390, false);
    render(<Rolagem />);
    expect(barra.mock.lastCall?.[0].enabled).toBe(true);
  });

  it('desliga com movimento reduzido', () => {
    tela(390, true);
    render(<Rolagem />);
    expect(barra.mock.lastCall?.[0].enabled).toBe(false);
  });
});
