import { SIMBOLO } from './simbolo';

// Amostragem do símbolo para o alvo da esfera de letras (decisão 004 de docs/arquitetura.md):
// os paths viram polígonos, cada linha horizontal vira faixas dentro do desenho, e cada ponto sorteia
// uma faixa (com peso pelo comprimento) e um x dentro dela. dentro() fica como oráculo dos testes.

export type Ponto = [number, number];
export type Poligonos = Ponto[][];

// O alvo de uma morfose: 3 valores por ponto (x, y, z) e 1 quando o ponto é azul.
export type AlvoDaEsfera = { posicoes: Float32Array; azul: Uint8Array };

const NUMERO = /-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gi;
const COMANDO = /([MLHVCZ])([^MLHVCZ]*)/gi;

// Comandos absolutos M, L, H, V, C e Z; cada curva cúbica vira `passos` segmentos. Cada M abre um polígono.
export function achatar(d: string, passos = 8): Poligonos {
  const poligonos: Poligonos = [];
  let atual: Ponto[] = [];
  let x = 0;
  let y = 0;
  const fechar = () => {
    if (atual.length) poligonos.push(atual);
    atual = [];
  };
  for (const [, letra, resto] of d.matchAll(COMANDO)) {
    const n = (resto.match(NUMERO) ?? []).map(Number);
    switch (letra.toUpperCase()) {
      case 'M':
        fechar();
        for (let i = 0; i + 1 < n.length; i += 2) atual.push([(x = n[i]), (y = n[i + 1])]);
        break;
      case 'L':
        for (let i = 0; i + 1 < n.length; i += 2) atual.push([(x = n[i]), (y = n[i + 1])]);
        break;
      case 'H':
        for (const v of n) atual.push([(x = v), y]);
        break;
      case 'V':
        for (const v of n) atual.push([x, (y = v)]);
        break;
      case 'C':
        for (let i = 0; i + 5 < n.length; i += 6) {
          const [x1, y1, x2, y2, x3, y3] = n.slice(i, i + 6);
          for (let k = 1; k <= passos; k++) {
            const t = k / passos;
            const s = 1 - t;
            const a = s * s * s;
            const b = 3 * s * s * t;
            const c = 3 * s * t * t;
            const e = t * t * t;
            atual.push([a * x + b * x1 + c * x2 + e * x3, a * y + b * y1 + c * y2 + e * y3]);
          }
          x = x3;
          y = y3;
        }
        break;
      case 'Z':
        if (atual.length) {
          [x, y] = atual[0];
          atual.push([x, y]);
        }
        fechar();
        break;
    }
  }
  fechar();
  return poligonos;
}

// Cruzamentos da linha horizontal y com as arestas, ordenados (regra par-ímpar: entre o 1º e o 2º está dentro, e assim por diante).
function cruzamentos(poligonos: Poligonos, y: number): number[] {
  const xs: number[] = [];
  for (const p of poligonos) {
    for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
      const [xi, yi] = p[i];
      const [xj, yj] = p[j];
      if (yi > y !== yj > y) xs.push(xi + ((y - yi) * (xj - xi)) / (yj - yi));
    }
  }
  return xs.sort((a, b) => a - b);
}

// Regra par-ímpar: um raio para a direita cruza um número ímpar de arestas.
export function dentro(poligonos: Poligonos, x: number, y: number): boolean {
  let n = 0;
  for (const c of cruzamentos(poligonos, y)) if (c > x) n++;
  return n % 2 === 1;
}

// Gerador com semente (mulberry32): a mesma semente dá os mesmos pontos.
export function semente(s: number): () => number {
  let a = s >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const LINHAS = 1024;
const ESCALA = 1.15;
const PROFUNDIDADE = 0.03;

type Faixas = { x0: Float64Array; x1: Float64Array; y: Float64Array; azul: Uint8Array; acumulado: Float64Array };

// As faixas dentro do símbolo, linha por linha. Cada path é lido com a própria regra par-ímpar; um ponto de outro path
// que cai também no braço conta como azul, para bater com o desenho.
function faixasDoSimbolo(): Faixas {
  const lamina = achatar(SIMBOLO.lamina);
  const braco = achatar(SIMBOLO.braco);
  const haste = achatar(SIMBOLO.haste);
  const lista: { x0: number; x1: number; y: number; azul: number }[] = [];
  const noBraco = (faixas: number[], x: number) => {
    for (let i = 0; i + 1 < faixas.length; i += 2) if (x >= faixas[i] && x < faixas[i + 1]) return true;
    return false;
  };
  for (let r = 0; r < LINHAS; r++) {
    const y = ((r + 0.5) * SIMBOLO.altura) / LINHAS;
    const doBraco = cruzamentos(braco, y);
    for (const [poligonos, azul] of [[lamina, false], [braco, true], [haste, false]] as const) {
      const xs = poligonos === braco ? doBraco : cruzamentos(poligonos, y);
      for (let i = 0; i + 1 < xs.length; i += 2) {
        if (xs[i + 1] <= xs[i]) continue;
        // Uma faixa de outro path que passa pelo braço é cortada nas bordas dele.
        if (!azul && doBraco.length) {
          const cortes = [xs[i], ...doBraco.filter((x) => x > xs[i] && x < xs[i + 1]), xs[i + 1]];
          for (let k = 0; k + 1 < cortes.length; k++) {
            const meio = (cortes[k] + cortes[k + 1]) / 2;
            lista.push({ x0: cortes[k], x1: cortes[k + 1], y, azul: noBraco(doBraco, meio) ? 1 : 0 });
          }
        } else lista.push({ x0: xs[i], x1: xs[i + 1], y, azul: azul ? 1 : 0 });
      }
    }
  }
  const f: Faixas = {
    x0: new Float64Array(lista.length),
    x1: new Float64Array(lista.length),
    y: new Float64Array(lista.length),
    azul: new Uint8Array(lista.length),
    acumulado: new Float64Array(lista.length),
  };
  let soma = 0;
  lista.forEach((l, i) => {
    f.x0[i] = l.x0;
    f.x1[i] = l.x1;
    f.y[i] = l.y;
    f.azul[i] = l.azul;
    f.acumulado[i] = soma += l.x1 - l.x0;
  });
  return f;
}

let faixas: Faixas | null = null;

// n pontos dentro do símbolo, nas coordenadas da esfera: x e y vão a (px - 365)/365 × 1.15 e -(py - 256)/365 × 1.15,
// com z aleatório em ±0.03. azul[i] = 1 quando o ponto cai no braço.
export function pontosSimbolo(n: number, aleatorio: () => number): AlvoDaEsfera {
  faixas ??= faixasDoSimbolo();
  const { x0, x1, y, azul: faixaAzul, acumulado } = faixas;
  const total = acumulado[acumulado.length - 1];
  const meiaLargura = SIMBOLO.largura / 2;
  const meiaAltura = SIMBOLO.altura / 2;
  const posicoes = new Float32Array(3 * n);
  const azul = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    const alvo = aleatorio() * total;
    let a = 0;
    let b = acumulado.length - 1;
    while (a < b) {
      const m = (a + b) >> 1;
      if (acumulado[m] <= alvo) a = m + 1;
      else b = m;
    }
    const px = x0[a] + aleatorio() * (x1[a] - x0[a]);
    posicoes[3 * i] = ((px - meiaLargura) / meiaLargura) * ESCALA;
    posicoes[3 * i + 1] = (-(y[a] - meiaAltura) / meiaLargura) * ESCALA;
    posicoes[3 * i + 2] = (aleatorio() * 2 - 1) * PROFUNDIDADE;
    azul[i] = faixaAzul[a];
  }
  return { posicoes, azul };
}

const cache = new Map<number, AlvoDaEsfera>();

// O F de n pontos, calculado uma vez por sessão para cada quantidade, com semente fixa.
export function alvoDoSimbolo(n: number): AlvoDaEsfera {
  let alvo = cache.get(n);
  if (!alvo) cache.set(n, (alvo = pontosSimbolo(n, semente(SIMBOLO.largura))));
  return alvo;
}
