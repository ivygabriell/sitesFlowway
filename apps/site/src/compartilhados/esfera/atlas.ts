import { familiasDaPagina } from '@/texturas/familias';

// As 6 letras da esfera, numa fileira de células de 64 px (6×1), brancas: a cor vem do shader.
export const LETRAS = ['F', 'L', 'O', 'W', 'A', 'Y'];
export const CELULA = 64;

// Altura do glifo dentro da célula, com folga para o W não encostar na vizinha.
const CORPO = 0.8;

// Desenha o atlas só com a Inter Tight 800 carregada: com o next/font, o peso 800 só baixa quando algo o usa,
// então document.fonts.ready sozinho não basta (decisão 005). Antes disso, a esfera não aparece.
export async function desenharAtlas(): Promise<HTMLCanvasElement> {
  const { sans } = familiasDaPagina();
  await document.fonts.load(`800 ${CELULA}px ${sans}`);
  await document.fonts.ready;
  const tela = document.createElement('canvas');
  tela.width = CELULA * LETRAS.length;
  tela.height = CELULA;
  const ctx = tela.getContext('2d');
  if (!ctx) return tela;
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `800 ${Math.round(CORPO * CELULA)}px ${sans}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  LETRAS.forEach((l, i) => ctx.fillText(l, (i + 0.5) * CELULA, CELULA / 2));
  return tela;
}
