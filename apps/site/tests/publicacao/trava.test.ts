import { describe, expect, it } from 'vitest';
import { TEXTOS } from '@/conteudo';
import { pendencias } from '@/conteudo/textos';

// Trava de publicação (C5): só passa quando nenhum texto do índice está pendente e todos têm inglês (que todo
// módulo de conteúdo está no índice, quem confere é tests/unit/indice.test.ts, no CI). Fica fora do CI até C2
// (falhar agora é o esperado); em C5, o build de produção a roda quando VERCEL_ENV=production. Rodar com: npm run test:publicacao -w apps/site
describe('trava de publicação', () => {
  it('não há texto pendente nem texto sem inglês', () => {
    expect(pendencias(TEXTOS)).toEqual([]);
  });
});
