import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { listaDeTrabalhos } from '@/conteudo/trabalhos';

// Spec 2026-10-31 :212: um case só entra na lista com todas as peças. Para a Início, as peças são a capa (que
// liga o ASCII) e o site do conceito, que o clique abre (Rafael, 2026-11-09); todo trabalho da lista é conceito.
const PUBLICO = join(__dirname, '../../public');
const arquivo = (url: string) => join(PUBLICO, url);

describe('peças de cada trabalho da lista', () => {
  it('a lista não está vazia', () => {
    expect(listaDeTrabalhos.length).toBeGreaterThan(0);
  });

  it.each(listaDeTrabalhos.map((tr) => [tr.slug, tr] as const))('%s tem capa, o site do conceito e o rótulo Conceito', (_, tr) => {
    expect(tr.conceito).toBe(true);
    expect(tr.capa).toMatch(/^\/trabalhos\/.+\.(webp|jpg)$/);
    expect(tr.site).toBe(`/conceitos/${tr.slug}/index.html`);
  });

  it.each(listaDeTrabalhos.map((tr) => [tr.slug, tr] as const))('os arquivos de %s existem em public/ e cabem no orçamento', (_, tr) => {
    expect(existsSync(arquivo(tr.capa!)), tr.capa).toBe(true);
    expect(statSync(arquivo(tr.capa!)).size, tr.capa).toBeLessThanOrEqual(150 * 1024);
    expect(existsSync(arquivo(tr.site!)), tr.site).toBe(true);
  });
});
