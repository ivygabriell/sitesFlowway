import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import robots from '../../app/robots';
import sitemap from '../../app/sitemap';
import { INDEXAR, metadadosDaPagina } from '@/seo/paginas';

describe('buscadores e metadados', () => {
  it('toda página fica fora dos buscadores até C5', () => {
    expect(INDEXAR).toBe(false);
    for (const pagina of ['inicio', 'trabalhos', 'contato', 'privacidade'] as const)
      for (const idioma of ['pt', 'en'] as const) expect(metadadosDaPagina(pagina, idioma).robots).toEqual({ index: false, follow: false });
  });

  it('cada página aponta a versão na outra língua, com x-default no português', () => {
    const { alternates } = metadadosDaPagina('inicio', 'en');
    expect(alternates?.languages).toEqual({ 'pt-BR': '/', en: '/en', 'x-default': '/' });
    expect(metadadosDaPagina('contato', 'pt').alternates?.languages).toEqual({ 'pt-BR': '/contato', en: '/en/contact', 'x-default': '/contato' });
  });

  it('o título e a descrição da Início ficam pendentes (C2), em português também em /en', () => {
    const m = metadadosDaPagina('inicio', 'en');
    expect(m.title).toBe('[pendente: título da Início, até 60 caracteres, sem nichos]');
    expect(m.description).toBe('[pendente: descrição da Início, até 155 caracteres]');
  });

  it('robots.txt não bloqueia o rastreamento (o robô precisa ler o noindex) e o sitemap fica vazio', () => {
    const r = robots();
    const regras = Array.isArray(r.rules) ? r.rules : [r.rules];
    expect(regras).toEqual([{ userAgent: '*', allow: '/' }]);
    expect(r.sitemap).toBeUndefined();
    expect(sitemap()).toEqual([]);
  });

  it('o vercel.json manda noindex e os cabeçalhos de segurança em toda resposta', () => {
    const v = JSON.parse(readFileSync('vercel.json', 'utf8'));
    expect(v.framework).toBe('nextjs');
    const cabecalhos = v.headers.flatMap((h: { source: string; headers: { key: string; value: string }[] }) => h.headers.map((c) => ({ ...c, source: h.source })));
    for (const [key, value] of [
      ['X-Robots-Tag', 'noindex, nofollow'],
      ['X-Content-Type-Options', 'nosniff'],
      ['Referrer-Policy', 'strict-origin-when-cross-origin'],
      ['X-Frame-Options', 'DENY'],
    ])
      expect(cabecalhos).toContainEqual({ source: '/(.*)', key, value });
  });

  it('as duas páginas da Início exportam os metadados de metadadosDaPagina', () => {
    for (const [arquivo, idioma] of [['app/(pt)/page.tsx', 'pt'], ['app/(en)/en/page.tsx', 'en']]) {
      expect(readFileSync(arquivo, 'utf8')).toContain(`export const metadata = metadadosDaPagina('inicio', '${idioma}')`);
    }
  });
});
