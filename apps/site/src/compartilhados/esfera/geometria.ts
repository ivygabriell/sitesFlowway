import type { AlvoDaEsfera } from '@/marca/amostrar';
import { LETRAS } from './atlas';

// Quantidade de letras (spec, seção Contato): 20 mil no desktop e 8 mil no celular.
export const QUANTIDADE = { desktop: 20000, celular: 8000 } as const;

// Fração das letras da esfera que são azuis (spec: cerca de 4%, nunca acima de 5%).
const FRACAO_AZUL = 0.04;

// Tamanho da letra, medido no protótipo 07-contato-esfera: letras de 14 px para 5.200 pontos numa esfera de raio 230 px.
// Fica proporcional a 1/√n (decisão 005): cortar a quantidade não muda o quanto a esfera fica coberta.
const LETRA_NO_PROTOTIPO = { tamanho: 14, pontos: 5200, raio: 230 };
const K = (LETRA_NO_PROTOTIPO.tamanho * Math.sqrt(LETRA_NO_PROTOTIPO.pontos)) / LETRA_NO_PROTOTIPO.raio;

export const tamanhoDaLetra = (n: number, raio: number) => (K * raio) / Math.sqrt(n);

// A div é o palco da esfera, no contato só a área livre entre a frase e o rodapé: a esfera (cerca de 2,15 raios) enche a
// altura dela sem encostar no texto, e o F (2.3 raios de largura) e o empurrão do cursor cabem na largura.
export const raioNaCaixa = (largura: number, altura: number) => Math.min(largura / 2.8, altura / 2.2);

type Caixa = { left: number; top: number; width: number; height: number };
// O globo desenhado noutro lugar (o canto do chat, o vazio ou o ícone do celular): deslocamento do centro da div até o
// centro do lugar, em pixels com y para cima (a cena), e o raio que cabe no lugar. Lugar escondido conta como nenhum.
export function caixaDaEsfera(div: Caixa, lugar: Caixa | null) {
  if (!lugar || !lugar.width || !lugar.height) return { dx: 0, dy: 0, raio: raioNaCaixa(div.width, div.height) };
  return {
    dx: lugar.left + lugar.width / 2 - (div.left + div.width / 2),
    dy: -(lugar.top + lugar.height / 2 - (div.top + div.height / 2)),
    raio: raioNaCaixa(lugar.width, lugar.height),
  };
}

// n pontos numa esfera de raio 1, pela espiral de Fibonacci (3n valores).
export function pontosEsfera(n: number): Float32Array {
  const p = new Float32Array(3 * n);
  const angulo = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = n === 1 ? 0 : 1 - (2 * i) / (n - 1);
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const t = angulo * i;
    p[3 * i] = Math.cos(t) * r;
    p[3 * i + 1] = y;
    p[3 * i + 2] = Math.sin(t) * r;
  }
  return p;
}

export type AtributosDaEsfera = { aEsfera: Float32Array; aAlvo: Float32Array; aLetra: Float32Array; aAzul: Float32Array };

// Os atributos de cada letra: a posição na esfera, a posição no alvo (pronto, já amostrado), qual das 6 letras
// e o azul como vec2 (na esfera, sorteado; no alvo, o que o alvo diz).
export function atributosDaEsfera(n: number, alvo: AlvoDaEsfera, aleatorio: () => number): AtributosDaEsfera {
  if (alvo.posicoes.length !== 3 * n || alvo.azul.length !== n) {
    throw new Error(`O alvo tem ${alvo.azul.length} pontos; a esfera, ${n}.`);
  }
  const aLetra = new Float32Array(n);
  const aAzul = new Float32Array(2 * n);
  for (let i = 0; i < n; i++) {
    aLetra[i] = Math.floor(aleatorio() * LETRAS.length);
    aAzul[2 * i] = aleatorio() < FRACAO_AZUL ? 1 : 0;
    aAzul[2 * i + 1] = alvo.azul[i];
  }
  return { aEsfera: pontosEsfera(n), aAlvo: alvo.posicoes, aLetra, aAzul };
}
