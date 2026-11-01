/// <reference types="vite/client" />
import { describe, expect, it } from 'vitest';
import { TEXTOS } from '@/conteudo';
import { pendencias } from '@/conteudo/textos';

// Trava de publicação (C5): só passa quando todo módulo de conteúdo está no índice, nenhum texto está pendente
// e todos têm inglês. Fica fora do CI até C2 (falhar agora é o esperado); em C5, o build de produção a roda
// quando VERCEL_ENV=production. Rodar com: npm run test:publicacao -w apps/site
const modulos = import.meta.glob<Record<string, unknown>>('../../src/conteudo/*.ts', { eager: true });
const FORA_DO_INDICE = ['index', 'textos'];

describe('trava de publicação', () => {
  it('todo módulo de src/conteudo/ está no índice', () => {
    for (const [caminho, modulo] of Object.entries(modulos)) {
      const nome = caminho.split('/').pop()!.replace(/\.ts$/, '');
      if (FORA_DO_INDICE.includes(nome)) continue;
      expect(modulo[nome], `${nome}.ts exporta "${nome}"`).toBeDefined();
      expect(TEXTOS[nome as keyof typeof TEXTOS], `${nome}.ts no índice`).toBe(modulo[nome]);
    }
  });

  it('não há texto pendente nem texto sem inglês', () => {
    expect(pendencias(TEXTOS)).toEqual([]);
  });
});
