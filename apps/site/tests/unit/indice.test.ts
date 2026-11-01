/// <reference types="vite/client" />
import { describe, expect, it } from 'vitest';
import { TEXTOS } from '@/conteudo';

// Todo módulo de src/conteudo/ entra no índice (TEXTOS), com o ramo do mesmo nome do arquivo. Roda no CI,
// para um módulo novo não ficar de fora da trava de publicação (que confere pendencias(TEXTOS)).
// "identidade" é o conteúdo da página de identidade, que sai do site na tarefa 14: até lá, fica fora do índice.
const modulos = import.meta.glob<Record<string, unknown>>('../../src/conteudo/*.ts', { eager: true });
const FORA_DO_INDICE = ['index', 'textos', 'identidade'];

describe('índice do conteúdo', () => {
  it('todo módulo de src/conteudo/ está no índice', () => {
    const nomes = Object.keys(modulos).map((caminho) => caminho.split('/').pop()!.replace(/\.ts$/, ''));
    expect(nomes.length).toBeGreaterThan(FORA_DO_INDICE.length);
    for (const [caminho, modulo] of Object.entries(modulos)) {
      const nome = caminho.split('/').pop()!.replace(/\.ts$/, '');
      if (FORA_DO_INDICE.includes(nome)) continue;
      expect(modulo[nome], `${nome}.ts exporta "${nome}"`).toBeDefined();
      expect(TEXTOS[nome as keyof typeof TEXTOS], `${nome}.ts no índice`).toBe(modulo[nome]);
    }
  });
});
