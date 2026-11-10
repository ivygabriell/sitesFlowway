// Voltar (navegador) para uma página rolada: o documento nasce no topo e o site só devolve a rolagem depois dos pins
// (Rolagem.tsx). Para a logo do hero não aparecer no topo nesse meio-tempo, a página fica escondida até a rolagem voltar.
// Recarregar não restaura: volta ao topo (Rafael, 2026-11-09).

export const CHAVE_ROLAGEM = 'rolagem:';
// Teto do esconderijo, no próprio script do head: a página aparece mesmo se o JavaScript do site não chegar.
export const TETO_RESTAURANDO = 2500;

// Roda antes de pintar (LayoutRaiz). Primeiro tira a restauração do navegador, que no fim da carga devolvia a rolagem
// (cortada pela altura da página naquele momento, ex. 994 px) e impedia a recarga de começar no topo. Depois só esconde
// quando vai restaurar: voltar, abertura já vista, posição > 0.
export const SCRIPT_RESTAURANDO = `try{history.scrollRestoration='manual';var n=performance.getEntriesByType('navigation')[0];if(n&&n.type==='back_forward'&&sessionStorage.getItem('abertura-tocou')==='1'&&Number(sessionStorage.getItem('${CHAVE_ROLAGEM}'+location.pathname))>0){var h=document.documentElement;h.classList.add('restaurando');setTimeout(function(){h.classList.remove('restaurando')},${TETO_RESTAURANDO})}}catch(e){}`;

export function guardarRolagem(caminho: string) {
  try {
    sessionStorage.setItem(CHAVE_ROLAGEM + caminho, String(window.scrollY));
  } catch {}
}

export function posicaoGuardada(caminho: string) {
  try {
    return Number(sessionStorage.getItem(CHAVE_ROLAGEM + caminho)) || 0;
  } catch {
    return 0;
  }
}

// A mesma condição do script, para o React: a rolagem vai voltar a um ponto abaixo do topo nesta carga.
export function restaurandoNestaCarga(caminho: string) {
  const [nav] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
  if (nav?.type !== 'back_forward') return false;
  try {
    if (sessionStorage.getItem('abertura-tocou') !== '1') return false;
  } catch {
    return false;
  }
  return posicaoGuardada(caminho) > 0;
}

export function mostrarPagina() {
  document.documentElement.classList.remove('restaurando');
}
