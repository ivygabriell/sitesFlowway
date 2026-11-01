// As famílias de fonte da página (as variáveis --sans, --mono e --serif do next/font), para desenhar em canvas.
export type Familias = { sans: string; mono: string; serif: string };

export const familiasDaPagina = (): Familias => {
  const css = getComputedStyle(document.documentElement);
  return {
    sans: css.getPropertyValue('--sans') || 'sans-serif',
    mono: css.getPropertyValue('--mono') || 'monospace',
    serif: css.getPropertyValue('--serif') || 'serif',
  };
};
