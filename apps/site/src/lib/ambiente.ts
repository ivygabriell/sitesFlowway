// Mesmo corte da referência: abaixo de 900px a página troca para a versão de celular.
export const LIMITE_CELULAR = 900;

export const ehCelular = (largura: number) => largura < LIMITE_CELULAR;

export const prefereMenosMovimento = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Densidade máxima do canvas WebGL: no celular o canvas cobre a tela toda a cada quadro, e a 2× o preenchimento
// derrubava a rolagem para ~30 quadros/s (medido em 2026-11-11); a 1,5× volta a ~60 sem perder a nitidez visível.
export const dprMaximo = (largura: number) => (ehCelular(largura) ? 1.5 : 2);
