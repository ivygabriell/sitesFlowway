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

// Escala de repouso (em unidades): a logo grande, quase da largura da tela, como a forma de vidro da referência.
export const ESCALA = { principal: 1.57, principalCelular: 2 };
// Inclinação (rotação em x, rad) da logo: zero, de frente. Inclinada (−0,12), a perspectiva achatava o F e ele parecia uma laje.
export const INCLINACAO = 0;

// Posição de repouso: x em unidades; o centro vertical em fração da altura da tela, de cima para baixo. A barra de cima
// do F pega só a parte de baixo da palavra; o topo dela fica livre.
export const POSICAO = { x: -0.02, centro: 0.88, centroCelular: 0.55 };

// Meia altura da logo na tela (px): a face inclinada mais a espessura vista de lado.
function meiaAltura(escala: number) {
  const a = MEDIDAS.altura + 2 * MEDIDAS.chanfro;
  const p = MEDIDAS.profundidade + 2 * MEDIDAS.chanfro;
  const i = Math.abs(INCLINACAO);
  return 0.5 * (a * Math.cos(i) + p * Math.sin(i)) * escala;
}

// Repouso em px da tela (y de cima para baixo): centro, topo e base da logo e o centro da palavra.
export function repouso(largura: number, altura: number) {
  const u = unidade(largura);
  const celular = ehCelular(largura);
  const centro = (celular ? POSICAO.centroCelular : POSICAO.centro) * altura;
  const meia = meiaAltura((celular ? ESCALA.principalCelular : ESCALA.principal) * u);
  const perspectiva = CAMERA_Z / (CAMERA_Z - PALAVRA.z * u);
  return {
    u,
    celular,
    // y: posição no mundo do canvas (px acima do meio da tela).
    principal: { y: altura / 2 - centro, centro, topo: centro - meia, base: centro + meia },
    palavra: { centro: altura / 2 - PALAVRA.acimaDoMeio * altura * perspectiva },
  };
}

// Paralaxe da referência 3.2: quanto cada peça sobe por px de rolagem.
export const PARALAXE = { palavra: 1.6, principal: 0.1 };

// Saída ligada à rolagem (referência 3.2).
export const SAIDA = { scrub: TEMPOS['tempo-scrub'], inicio: 'top+=10', alturas: { desktop: 2, celular: 0.7 } };

// O que a logo faz na saída: cresce pouco (× a escala de repouso) enquanto o vidro some, sem girar (rad, somado à
// rotação de repouso). Rafael, 2026-11-09: crescendo 1,7× e girando, virava placas gigantes por cima do texto.
export function alvoDeSaida(): { crescimento: number; giro: { x?: number; y?: number; z?: number } } {
  return { crescimento: 1.15, giro: {} };
}
