import { PALAVRA } from '@/marca/palavra';

// A palavra FLOWAY desenhada em canvas a partir do path da assinatura, em #121212, escalada para a largura pedida
// e recortada no viewBox da palavra. É a textura do plano com glitch do hero.
export function desenharPalavra(largura: number): HTMLCanvasElement {
  const [x, y, l, a] = PALAVRA.viewBox;
  const escala = largura / l;
  const tela = document.createElement('canvas');
  tela.width = Math.ceil(largura);
  tela.height = Math.ceil(a * escala);
  const ctx = tela.getContext('2d')!;
  ctx.scale(escala, escala);
  ctx.translate(PALAVRA.translacao[0] - x, PALAVRA.translacao[1] - y);
  ctx.fillStyle = '#121212';
  ctx.fill(new Path2D(PALAVRA.d));
  return tela;
}
