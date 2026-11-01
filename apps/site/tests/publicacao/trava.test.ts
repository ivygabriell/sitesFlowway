/// <reference types="vite/client" />
import { describe, expect, it } from 'vitest';
import { pendencias } from '@/conteudo/textos';

// Trava de publicação (C5): só passa quando nenhum texto está pendente e todos têm inglês.
// Fica fora do CI até C2; falhar agora é o esperado. Rodar com: npm run test:publicacao -w apps/site
import.meta.glob('../../src/conteudo/*.ts', { eager: true });

describe('trava de publicação', () => {
  it('não há texto pendente nem texto sem inglês', () => {
    expect(pendencias()).toEqual([]);
  });
});
