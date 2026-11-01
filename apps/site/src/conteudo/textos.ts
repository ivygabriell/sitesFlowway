// Textos em duas línguas. Cada texto é { pt, en? }: sem inglês, a página em /en mostra o português no lugar.
// O que a spec ainda não fixa é pendente(...). A trava de publicação (tests/publicacao) exige pendencias(TEXTOS) vazio.

export type Idioma = 'pt' | 'en';
export type Texto = { pt: string; en?: string; pendente?: true };
export type ArvoreDeTextos = Texto | readonly ArvoreDeTextos[] | { readonly [chave: string]: ArvoreDeTextos };

export const t = (texto: Texto, idioma: Idioma): string => (idioma === 'en' ? (texto.en ?? texto.pt) : texto.pt);

export const pendente = (descricao: string): Texto => ({ pt: `[pendente: ${descricao}]`, pendente: true });

// Cada módulo de src/conteudo/ exporta um objeto puro com esse formato (aninhamento permitido).
export type Textos = { readonly [chave: string]: ArvoreDeTextos };

const ehTexto = (no: ArvoreDeTextos): no is Texto => typeof (no as Texto).pt === 'string';

function coletar(caminho: string, no: ArvoreDeTextos, saida: string[]) {
  if (ehTexto(no)) {
    if (no.pendente) saida.push(`${caminho} (pt)`);
    else if (no.en === undefined) saida.push(`${caminho} (en)`);
    return;
  }
  const filhos = Array.isArray(no) ? no.map((f, i) => [String(i), f] as const) : Object.entries(no);
  for (const [chave, filho] of filhos) coletar(caminho ? `${caminho}.${chave}` : chave, filho as ArvoreDeTextos, saida);
}

// Percorre a árvore: cada texto pendente vira "<caminho> (pt)" e cada texto sem inglês, "<caminho> (en)".
export function pendencias(arvore: Textos): string[] {
  const saida: string[] = [];
  coletar('', arvore, saida);
  return saida;
}
