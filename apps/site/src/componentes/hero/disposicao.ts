import { ehCelular } from '@/lib/ambiente';
import { TEMPOS } from '@/movimento/tokens';
import { MEDIDAS } from './laminas';

// Onde as lâminas do hero repousam e como saem na rolagem, em funções puras (testadas em tests/unit/hero.test.tsx).

// Unidade do hero, como na referência: a cena inteira escala com a largura da tela.
export const unidade = (largura: number) => (largura < 1800 ? largura / 2.5 : largura / 2.8);

// Câmera do canvas global (CanvasGlobal.tsx): em z = 600, com o fov ajustado para 1 unidade = 1 px em z = 0.
const CAMERA_Z = 600;
// A palavra fica atrás do vidro, em z = −0,2 unidade, com o centro 17,8% da altura acima do meio da tela.
export const PALAVRA = { z: -0.2, acimaDoMeio: 0.178 };

// F de vidro da opção A (spec 2026-11-02, escolhida por Rafael em 2026-11-09): de frente, no centro, inteiro.
// Inclinação (rotação em x, rad) e x de repouso (unidades) zerados: inclinar achata a haste.
export const INCLINACAO = 0;
export const POSICAO = { x: 0 };
// Tamanho da face: 40% da altura da tela no desktop (até metade da largura, para janelas estreitas); 2/3 da largura no
// celular. O topo entra 30% na altura da palavra; as faixas ficam a 37 px da base do F.
export const F = { alturaDesktop: 0.4, larguraMaxDesktop: 0.5, larguraCelular: 2 / 3, topoNaPalavra: 0.3, vaoFaixas: 37 };
// A palavra no canvas: 86% da largura (90% no celular), na proporção do viewBox 1360×292.
const PROPORCAO_PALAVRA = 292 / 1360;

// Repouso em px da tela (y de cima para baixo): a caixa da face do F, a escala do mesh, a palavra e o topo das faixas.
export function repouso(largura: number, altura: number) {
  const u = unidade(largura);
  const celular = ehCelular(largura);
  // A palavra fica atrás (z < 0) e a câmera a mostra menor: a mesma perspectiva para o centro e a altura.
  const perspectiva = CAMERA_Z / (CAMERA_Z - PALAVRA.z * u);
  const centroPalavra = altura / 2 - PALAVRA.acimaDoMeio * altura * perspectiva;
  const alturaPalavra = (celular ? 0.9 : 0.86) * largura * PROPORCAO_PALAVRA * perspectiva;

  const alturaF = celular ? (F.larguraCelular * largura) / MEDIDAS.largura : Math.min(F.alturaDesktop * altura, (F.larguraMaxDesktop * largura) / MEDIDAS.largura);
  const topo = centroPalavra - alturaPalavra / 2 + F.topoNaPalavra * alturaPalavra;
  const centro = topo + alturaF / 2;
  // A face da frente está meia profundidade à frente de z = 0 e aparece maior: a escala compensa.
  const frente = (MEDIDAS.profundidade / 2 + MEDIDAS.chanfro) / MEDIDAS.altura;
  const escala = (CAMERA_Z * alturaF) / (CAMERA_Z + frente * alturaF);
  return {
    u,
    celular,
    // y: posição no mundo do canvas (px acima do meio da tela); escala: do mesh (a geometria tem altura 1).
    principal: { y: altura / 2 - centro, centro, topo, base: topo + alturaF, altura: alturaF, escala },
    palavra: { centro: centroPalavra },
    faixas: topo + alturaF + F.vaoFaixas,
  };
}

// Paralaxe da referência 3.2: quanto cada peça sobe por px de rolagem.
export const PARALAXE = { palavra: 1.6, principal: 0.1 };

// Saída ligada à rolagem (referência 3.2).
export const SAIDA = { scrub: TEMPOS['tempo-scrub'], inicio: 'top+=10', alturas: { desktop: 2, celular: 0.7 } };

// O que a logo faz na saída, como na referência: cresce (× a escala de repouso) e gira no lugar (rad, somado à rotação
// de repouso), enchendo a tela enquanto o vidro some; o deslocamento vertical é só o da paralaxe.
export function alvoDeSaida(celular: boolean): { crescimento: number; giro: { x?: number; y?: number; z?: number } } {
  return celular ? { crescimento: 1.6, giro: { y: 0.15 } } : { crescimento: 1.7, giro: { y: 0.3 } };
}
