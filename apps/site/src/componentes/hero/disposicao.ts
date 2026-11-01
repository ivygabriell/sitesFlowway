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

// Escalas de repouso (em unidades), medidas no protótipo 02-hero.
export const ESCALA = { principal: 0.8, laje: 0.75, pequena: 0.8, principalCelular: 1.6 };
// Inclinação (rotação em x, rad) de cada lâmina.
export const INCLINACAO = { principal: -0.35, laje: -0.3, pequena: -0.25 };

// Posição de repouso: x em unidades; o centro vertical em fração da altura da tela, de cima para baixo. A principal
// fica no meio, abaixo da metade de cima da palavra (que segue livre); as duas menores, abaixo dela, com vão.
export const POSICAO = {
  principal: { x: -0.02, centro: 0.54 },
  principalCelular: { centro: 0.46 },
  laje: { x: -0.45, centro: 0.86 },
  pequena: { x: 0.62, centro: 0.92 },
};

type Peca = 'principal' | 'laje' | 'pequena';

// Meia altura da lâmina na tela (px): a face inclinada mais a espessura vista de lado.
function meiaAltura(peca: Peca, escala: number) {
  const { altura } = MEDIDAS[peca];
  const a = altura + 2 * MEDIDAS.chanfro;
  const p = MEDIDAS.profundidade + 2 * MEDIDAS.chanfro;
  const i = Math.abs(INCLINACAO[peca]);
  return 0.5 * (a * Math.cos(i) + p * Math.sin(i)) * escala;
}

// Repouso em px da tela (y de cima para baixo): centro, topo e base de cada lâmina e o centro da palavra.
export function repouso(largura: number, altura: number) {
  const u = unidade(largura);
  const celular = ehCelular(largura);
  const naTela = (peca: Peca, fracao: number, escala: number) => {
    const centro = fracao * altura;
    const meia = meiaAltura(peca, escala * u);
    // y: posição no mundo do canvas (px acima do meio da tela).
    return { y: altura / 2 - centro, centro, topo: centro - meia, base: centro + meia };
  };
  const perspectiva = CAMERA_Z / (CAMERA_Z - PALAVRA.z * u);
  return {
    u,
    celular,
    principal: naTela('principal', celular ? POSICAO.principalCelular.centro : POSICAO.principal.centro, celular ? ESCALA.principalCelular : ESCALA.principal),
    laje: naTela('laje', POSICAO.laje.centro, ESCALA.laje),
    pequena: naTela('pequena', POSICAO.pequena.centro, ESCALA.pequena),
    palavra: { centro: altura / 2 - PALAVRA.acimaDoMeio * altura * perspectiva },
  };
}

// Paralaxe da referência 3.2: quanto cada peça sobe por px de rolagem.
export const PARALAXE = { palavra: 1.6, principal: 0.1, laje: 0.9, pequena: 0.4 };

// Saída ligada à rolagem (referência 3.2).
export const SAIDA = { scrub: TEMPOS['tempo-scrub'], inicio: 'top+=10', alturas: { desktop: 2, celular: 0.7 } };

export type AlvoDeSaida = { peca: Peca; crescimento: number; giro: { x?: number; y?: number; z?: number } };

// O que cada lâmina faz na saída, como na referência: cresce (× a escala de repouso) e gira no lugar (rad, somado à
// rotação de repouso), enchendo a tela enquanto o vidro some; o deslocamento vertical é só o da paralaxe.
// Com movimento reduzido não há saída: as lâminas ficam paradas e somem com a seção.
export function alvosDeSaida(celular: boolean, reduzido: boolean): AlvoDeSaida[] {
  if (reduzido) return [];
  if (celular) return [{ peca: 'principal', crescimento: 1.6, giro: { y: 0.15 } }];
  return [
    { peca: 'principal', crescimento: 1.7, giro: { y: 0.3 } },
    { peca: 'laje', crescimento: 1.8, giro: { y: -0.2 } },
    { peca: 'pequena', crescimento: 1.6, giro: { z: -0.2 } },
  ];
}
