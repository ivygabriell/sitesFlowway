// Textos em duas línguas. Cada texto é { pt, en? }: sem inglês, a página em /en mostra o português no lugar.
// O que a spec ainda não fixa é pendente(...). A trava de publicação (tests/publicacao) exige pendencias() vazio.

export type Idioma = 'pt' | 'en';
export type Texto = { pt: string; en?: string; pendente?: true };
export type ArvoreDeTextos = Texto | readonly ArvoreDeTextos[] | { readonly [chave: string]: ArvoreDeTextos };

export const t = (texto: Texto, idioma: Idioma): string => (idioma === 'en' ? (texto.en ?? texto.pt) : texto.pt);

export const pendente = (descricao: string): Texto => ({ pt: `[pendente: ${descricao}]`, pendente: true });

const ehTexto = (no: ArvoreDeTextos): no is Texto => typeof (no as Texto).pt === 'string';

const registro = new Map<string, ArvoreDeTextos>();

// Cada módulo de src/conteudo/ registra os próprios textos; registrar de novo o mesmo módulo substitui.
export function registrar<T extends Record<string, ArvoreDeTextos>>(modulo: string, textos: T): T {
  registro.set(modulo, textos);
  return textos;
}

function coletar(caminho: string, no: ArvoreDeTextos, saida: string[]) {
  if (ehTexto(no)) {
    if (no.pendente) saida.push(`${caminho} (pt)`);
    else if (no.en === undefined) saida.push(`${caminho} (en)`);
    return;
  }
  const filhos = Array.isArray(no) ? no.map((f, i) => [String(i), f] as const) : Object.entries(no);
  for (const [chave, filho] of filhos) coletar(`${caminho}.${chave}`, filho as ArvoreDeTextos, saida);
}

// Cada texto pendente vira "<módulo>.<chave> (pt)"; cada texto sem inglês, "<módulo>.<chave> (en)".
export function pendencias(): string[] {
  const saida: string[] = [];
  for (const [modulo, textos] of registro) coletar(modulo, textos, saida);
  return saida;
}
