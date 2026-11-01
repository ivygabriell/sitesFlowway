import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PASTAS = ['abertura', 'cabecalho', 'hero', 'passagem', 'manifesto', 'capitulos', 'decisoes', 'contato'];
const SELETORES = ['.cabecalho', '.selo', '.abertura', '.secao-', '.cubo', '.cartao', '.lista-decisoes', '.frase-contato', '.rodape'];

describe('estilos por seção', () => {
  it('globals.css só tem tokens, reset e base', () => {
    const globais = readFileSync('app/globals.css', 'utf8');
    for (const s of SELETORES) expect(globais, s).not.toContain(s);
  });

  it('cada pasta de seção importa o próprio estilo.css', () => {
    for (const pasta of PASTAS) {
      const dir = join('src/componentes', pasta);
      expect(existsSync(join(dir, 'estilo.css')), `${pasta}/estilo.css`).toBe(true);
      const importa = readdirSync(dir)
        .filter((n) => n.endsWith('.tsx'))
        .some((n) => readFileSync(join(dir, n), 'utf8').includes("import './estilo.css'"));
      expect(importa, `${pasta} importa ./estilo.css`).toBe(true);
    }
  });
});
