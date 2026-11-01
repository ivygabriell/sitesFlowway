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

// Posição de repouso: x em unidades; y em unidades acima do meio da tela.
export const POSICAO = {
  principal: { x: -0.02, y: 0.3 },
  principalCelular: { y: 0.45 },
  laje: { x: -0.45, y: -0.12 },
  pequena: { x: 0.62, y: -0.5 },
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
  const naTela = (peca: Peca, yUnidades: number, escala: number) => {
    const centro = altura / 2 - yUnidades * u;
    const meia = meiaAltura(peca, escala * u);
    return { y: yUnidades * u, centro, topo: centro - meia, base: centro + meia };
  };
  const perspectiva = CAMERA_Z / (CAMERA_Z - PALAVRA.z * u);
  return {
    u,
    celular,
    principal: naTela('principal', celular ? POSICAO.principalCelular.y : POSICAO.principal.y, celular ? ESCALA.principalCelular : ESCALA.principal),
    laje: naTela('laje', POSICAO.laje.y, ESCALA.laje),
    pequena: naTela('pequena', POSICAO.pequena.y, ESCALA.pequena),
    palavra: { centro: altura / 2 - PALAVRA.acimaDoMeio * altura * perspectiva },
  };
}

// Paralaxe da referência 3.2: quanto cada peça sobe por px de rolagem.
export const PARALAXE = { palavra: 1.6, principal: 0.1, laje: 0.9, pequena: 0.4 };

// Saída ligada à rolagem (referência 3.2).
export const SAIDA = { scrub: TEMPOS['tempo-scrub'], inicio: 'top+=10', alturas: { desktop: 2, celular: 0.7 } };

export type AlvoDeSaida = { peca: Peca; crescimento: number; giro: { x?: number; y?: number; z?: number } };

// O que cada lâmina faz na saída: cresce (× a escala de repouso) e gira (rad), sem deslocamento vertical.
export function alvosDeSaida(celular: boolean, reduzido: boolean): AlvoDeSaida[] {
  if (reduzido) return [];
  if (celular) return [{ peca: 'principal', crescimento: 1, giro: { y: 0.05 * Math.PI } }];
  return [
    { peca: 'principal', crescimento: 0.9, giro: { y: 0.1 * Math.PI } },
    { peca: 'laje', crescimento: 1.2, giro: { y: -0.05 * Math.PI } },
    { peca: 'pequena', crescimento: 0.82, giro: { z: -0.05 * Math.PI } },
  ];
}
