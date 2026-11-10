import { prefereMenosMovimento } from './ambiente';

// Voltar (navegador) para uma página rolada: o documento nasce no topo e o site só devolve a rolagem depois dos pins
// (Rolagem.tsx). Para o topo (com a logo do hero) não aparecer nesse meio-tempo, a página fica escondida até a rolagem
// voltar. Recarregar não restaura: volta ao topo (Rafael, 2026-11-09).

export const CHAVE_ROLAGEM = 'rolagem:';
// Marca deixada antes de recarregar uma página que voltou do bfcache: a carga nova é "reload", mas é um voltar.
const CHAVE_VOLTOU = 'rolagem:voltou';
// Teto do esconderijo, no próprio script do head: a página aparece mesmo se o JavaScript do site não chegar.
export const TETO_RESTAURANDO = 2500;

// Roda antes de pintar (LayoutRaiz), em quatro passos:
// 1. tira a restauração do navegador, que no fim da carga devolvia a rolagem cortada pela altura da página naquele
//    momento (ex. 994 px) e impedia a recarga de começar no topo;
// 2. decide se a carga é um voltar (back_forward, ou reload com a marca do bfcache, consumida aqui) e marca o <html>;
// 3. a abertura toca (cobrindo a tela) sem movimento reduzido, na primeira vez da sessão;
// 4. num voltar com posição guardada e sem abertura, esconde a página até a Rolagem chegar, com teto.
export const SCRIPT_RESTAURANDO = `try{history.scrollRestoration='manual';var h=document.documentElement,s=sessionStorage,n=performance.getEntriesByType('navigation')[0],t=n&&n.type,v=t==='back_forward'||(t==='reload'&&s.getItem('${CHAVE_VOLTOU}')==='1');s.removeItem('${CHAVE_VOLTOU}');if(v){h.dataset.voltou='1';var a=!matchMedia('(prefers-reduced-motion: reduce)').matches&&s.getItem('abertura-tocou')!=='1';if(!a&&Number(s.getItem('${CHAVE_ROLAGEM}'+location.pathname))>0){h.classList.add('restaurando');setTimeout(function(){h.classList.remove('restaurando')},${TETO_RESTAURANDO})}}}catch(e){}`;

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

// Chamado antes de recarregar a página que voltou do bfcache (Rolagem.tsx).
export function marcarVolta() {
  try {
    sessionStorage.setItem(CHAVE_VOLTOU, '1');
  } catch {}
}

// Esta carga do documento é um voltar do navegador (decidido pelo script do head).
export const voltouNestaCarga = () => document.documentElement.dataset.voltou === '1';

// A mesma condição do esconderijo, para o React: voltar, sem abertura tocando, a um ponto abaixo do topo.
export function restaurandoNestaCarga(caminho: string) {
  if (!voltouNestaCarga()) return false;
  let tocou = false;
  try {
    tocou = sessionStorage.getItem('abertura-tocou') === '1';
  } catch {}
  const aberturaToca = !prefereMenosMovimento() && !tocou;
  return !aberturaToca && posicaoGuardada(caminho) > 0;
}

export function mostrarPagina() {
  document.documentElement.classList.remove('restaurando');
}
