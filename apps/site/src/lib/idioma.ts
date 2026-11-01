import type { Idioma } from '@/conteudo/textos';

export type Pagina = 'inicio' | 'trabalhos' | 'contato' | 'privacidade';

// Português sem prefixo e inglês em /en (spec 4.1).
const ROTAS: Record<Pagina, Record<Idioma, string>> = {
  inicio: { pt: '/', en: '/en' },
  trabalhos: { pt: '/trabalhos', en: '/en/work' },
  contato: { pt: '/contato', en: '/en/contact' },
  privacidade: { pt: '/privacidade', en: '/en/privacy' },
};

export const rota = (pagina: Pagina, idioma: Idioma): string => ROTAS[pagina][idioma];

const limpar = (caminho: string) => (caminho.length > 1 ? caminho.replace(/\/+$/, '') : caminho) || '/';

export const idiomaDoCaminho = (caminho: string): Idioma => (/^\/en(\/|$)/.test(caminho) ? 'en' : 'pt');

export function paginaDoCaminho(caminho: string): Pagina | null {
  const c = limpar(caminho);
  for (const pagina of Object.keys(ROTAS) as Pagina[]) if (ROTAS[pagina].pt === c || ROTAS[pagina].en === c) return pagina;
  return null;
}

// A mesma página na outra língua; caminho desconhecido leva ao início da outra língua.
export function naOutraLingua(caminho: string): string {
  const outra: Idioma = idiomaDoCaminho(caminho) === 'pt' ? 'en' : 'pt';
  const pagina = paginaDoCaminho(caminho);
  return rota(pagina ?? 'inicio', outra);
}
