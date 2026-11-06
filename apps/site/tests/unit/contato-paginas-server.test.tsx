import { expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import PaginaPt, * as pt from '../../app/(pt)/contato/page';
import PaginaEn, * as en from '../../app/(en)/en/contact/page';
const obter = vi.hoisted(() => vi.fn(idioma => ({ versao: 'contato-b.1', intencao: null, chave: null, repetirAte: null, conversaDisponivel: false, envioDisponivel: false, idioma })));
vi.mock('@/lib/contato/servidor', () => ({ obterContatoServidor: obter }));
it.each([['pt', PaginaPt, pt], ['en', PaginaEn, en]] as const)('página %s emite DTO por requisição sem importar runtime no cliente', async (idioma, Pagina, modulo) => {
  const resultado = await Pagina({ searchParams: Promise.resolve({}) });
  expect(obter).toHaveBeenCalledWith(idioma);
  expect(resultado.props.servidor).toEqual(obter(idioma));
  expect((modulo as Record<string, unknown>).dynamic).toBe('force-dynamic');
  expect((modulo as Record<string, unknown>).revalidate).toBe(0);
  const cliente = readFileSync('src/paginas/PaginaContato.tsx', 'utf8');
  expect(cliente).toContain("import type { ContatoServidorDTO }");
  expect(cliente).not.toContain('obterContatoServidor');
});
