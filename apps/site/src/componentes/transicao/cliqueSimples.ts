import { idiomaDoCaminho, rota } from '@/lib/idioma';

type Clique = Pick<MouseEvent, 'button' | 'ctrlKey' | 'metaKey' | 'shiftKey' | 'altKey'>;

// Botão do meio, Ctrl, Cmd, Shift ou Alt: o navegador abre como sempre (nova aba, janela, download), sem círculo.
export const ehCliqueSimples = (e: Clique): boolean => e.button === 0 && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey;

// O endereço para onde a transição leva, ou null quando o clique fica com o navegador:
// externo ou de protocolo relativo (//), âncora, a própria página, outra língua (troca de layout raiz,
// recarga completa), nova aba, download, data-sem-transicao e o item atual do menu.
export function destinoDaTransicao(a: HTMLAnchorElement, caminhoAtual: string): string | null {
  const href = a.getAttribute('href') ?? '';
  if (!href.startsWith('/') || href.startsWith('//')) return null;
  if ((a.getAttribute('target') ?? '_self') !== '_self' || a.hasAttribute('download')) return null;
  if (a.hasAttribute('data-sem-transicao') || a.getAttribute('aria-current') === 'page') return null;
  const caminho = href.split(/[?#]/)[0] || '/';
  if (caminho === caminhoAtual) return null;
  if (idiomaDoCaminho(caminho) !== idiomaDoCaminho(caminhoAtual)) return null;
  return href;
}

// Claro quando o destino é a Início; escuro nos outros casos (02-site, "Transição de página").
export const corDaTransicao = (destino: string): string => {
  const caminho = destino.split(/[?#]/)[0];
  return caminho === rota('inicio', 'pt') || caminho === rota('inicio', 'en') ? 'var(--claro)' : 'var(--escuro)';
};
