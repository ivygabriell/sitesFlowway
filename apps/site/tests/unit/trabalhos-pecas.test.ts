import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { listaDeTrabalhos } from '@/conteudo/trabalhos';

// Spec 2026-10-31 :212: um case só entra na lista com todas as peças. Para a Início, as peças são a capa (que
// liga o ASCII) e a prévia em vídeo do hover; todo trabalho da lista é conceito, por ora.
const PUBLICO = join(__dirname, '../../public');
const arquivo = (url: string) => join(PUBLICO, url);

describe('peças de cada trabalho da lista', () => {
  it('a lista não está vazia', () => {
    expect(listaDeTrabalhos.length).toBeGreaterThan(0);
  });

  it.each(listaDeTrabalhos.map((tr) => [tr.slug, tr] as const))('%s tem capa, prévia e o rótulo Conceito', (_, tr) => {
    expect(tr.conceito).toBe(true);
    expect(tr.capa).toMatch(/^\/trabalhos\/.+\.(webp|jpg)$/);
    expect(tr.previa?.length).toBeGreaterThan(0);
    tr.previa!.forEach((v) => expect(v).toMatch(/^\/trabalhos\/.+\.(webm|mp4)$/));
  });

  it.each(listaDeTrabalhos.map((tr) => [tr.slug, tr] as const))('os arquivos de %s existem em public/ e cabem no orçamento', (_, tr) => {
    expect(existsSync(arquivo(tr.capa!)), tr.capa).toBe(true);
    expect(statSync(arquivo(tr.capa!)).size, tr.capa).toBeLessThanOrEqual(150 * 1024);
    for (const v of tr.previa!) {
      expect(existsSync(arquivo(v)), v).toBe(true);
      expect(statSync(arquivo(v)).size, v).toBeLessThanOrEqual(1.5 * 1024 * 1024);
    }
  });
});
