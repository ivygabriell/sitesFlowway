import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { modoDeExibicao } from '@/movimento/modo';
import { CURVAS, INTERVALOS, TEMPOS, tempo } from '@/movimento/tokens';

// Cópia exata da tabela "Tokens de tempo e de curva" da 02-site.md (identidadeFloway@ec93f7b).
const ESPERADO = {
  TEMPOS: {
    'tempo-piscar': 0.1,
    'tempo-rapido': 0.2,
    'tempo-curto': 0.3,
    'tempo-hover': 0.4,
    'tempo-esmaecer': 0.5,
    'tempo-transicao': 0.6,
    'tempo-digitar-curto': 0.6,
    'tempo-lista': 0.7,
    'tempo-cabecalho': 0.8,
    'tempo-curvar': 0.8,
    'tempo-glitch': 1,
    'tempo-selo': 1,
    'tempo-linha': 1,
    'tempo-cubo-celular': 1,
    'tempo-digitar-frase': 1.2,
    'tempo-vidro': 1.4,
    'tempo-circulo': 1.5,
    'tempo-filme-minimo': 1.6,
    'tempo-ponto-relogio': 1.6,
    'tempo-vidro-principal': 1.8,
    'tempo-planos': 2,
    'tempo-fitas': 2,
    'tempo-palavras-cubo': 12,
    'tempo-faixas': 200,
    'tempo-scrub': 1,
  },
  INTERVALOS: {
    'intervalo-minimo': 0.01,
    'intervalo-curto': 0.1,
    'intervalo-seguir': 0.15,
    'intervalo-lista': 0.2,
    'intervalo-meio': 0.5,
    'intervalo-cabecalho': 1,
    'intervalo-glitch': 1.2,
    'intervalo-intro': 1.5,
    'intervalo-palavras-cubo': 2.4,
  },
  CURVAS: {
    'curva-linear': 'none',
    'curva-padrao': 'power1.out',
    'curva-suave': 'power1.inOut',
    'curva-giro': 'power2.inOut',
    'curva-saida': 'power2.out',
    'curva-entrada': 'power1.in',
    'curva-fitas': 'power3.in',
    'curva-linha': 'power4.inOut',
    'curva-circulo': 'expoScale(3, 1)',
    'curva-cabecalho': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    'curva-hover': 'cubic-bezier(0.25, 0.1, 0.25, 1)',
    'curva-piscar': 'steps(1)',
  },
};

describe('tokens de movimento', () => {
  it('os tokens são os da tabela da 02-site', () => {
    expect({ TEMPOS, INTERVALOS, CURVAS }).toEqual(ESPERADO);
    expect(Object.keys(TEMPOS)).toHaveLength(25);
    expect(Object.keys(INTERVALOS)).toHaveLength(9);
    expect(Object.keys(CURVAS)).toHaveLength(12);
    expect(tempo('tempo-transicao')).toBe(0.6);
  });

  it('o CSS declara cada token com o mesmo valor', () => {
    const css = readFileSync('src/movimento/tokens.css', 'utf8');
    const declarado = (nome: string) => css.match(new RegExp(`--${nome}:\\s*([^;]+);`))?.[1].trim();
    for (const [nome, valor] of Object.entries({ ...ESPERADO.TEMPOS, ...ESPERADO.INTERVALOS })) expect(declarado(nome), nome).toBe(`${valor}s`);
    for (const [nome, valor] of Object.entries(ESPERADO.CURVAS)) expect(declarado(nome), nome).toBe(valor);
  });

  it('o globals.css importa os tokens', () => {
    expect(readFileSync('app/globals.css', 'utf8')).toMatch(/@import ['"][^'"]*movimento\/tokens\.css['"]/);
  });

  it('modoDeExibicao', () => {
    expect(modoDeExibicao(1440, false, true)).toBe('desktop');
    expect(modoDeExibicao(899, false, true)).toBe('celular');
    expect(modoDeExibicao(900, false, true)).toBe('desktop');
    expect(modoDeExibicao(1440, true, true)).toBe('reduzido');
    expect(modoDeExibicao(390, true, false)).toBe('sem-webgl');
    expect(modoDeExibicao(390, true, true)).toBe('reduzido');
  });
});
