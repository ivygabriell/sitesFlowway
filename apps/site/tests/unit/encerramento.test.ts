import { afterEach, describe, expect, it, vi } from 'vitest';
import { ScrollTrigger } from '@/gsap';
import { encerrarAnimacoes } from './util/encerrar';

afterEach(() => vi.restoreAllMocks());

// O ScrollTrigger deixa um setInterval de 250 ms que pede requestAnimationFrame. Se ele sobreviver ao
// fim do arquivo, dispara depois que o jsdom saiu e derruba a suíte com "requestAnimationFrame is not defined".
describe('encerramento das animações', () => {
  it('depois de encerrar, o ScrollTrigger e o GSAP não pedem mais quadros', async () => {
    ScrollTrigger.refresh();
    encerrarAnimacoes();
    const pedido = vi.spyOn(globalThis, 'requestAnimationFrame');
    await new Promise((r) => setTimeout(r, 600));
    expect(pedido).not.toHaveBeenCalled();
  });
});
