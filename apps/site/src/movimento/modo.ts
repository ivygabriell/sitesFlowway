import { ehCelular } from '@/lib/ambiente';

export type ModoDeExibicao = 'desktop' | 'celular' | 'reduzido' | 'sem-webgl';

// Um modo só por página, com prioridade: sem WebGL, depois movimento reduzido, depois celular (abaixo de 900 px).
export function modoDeExibicao(largura: number, reduzido: boolean, webgl: boolean): ModoDeExibicao {
  if (!webgl) return 'sem-webgl';
  if (reduzido) return 'reduzido';
  if (ehCelular(largura)) return 'celular';
  return 'desktop';
}
