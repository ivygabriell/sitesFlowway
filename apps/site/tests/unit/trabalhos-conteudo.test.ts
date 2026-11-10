import { describe, expect, it } from 'vitest';
import { TEXTOS } from '@/conteudo';
import { pendencias } from '@/conteudo/textos';
import {
  NOMES_OFERTA,
  type Trabalho,
  linhaDoCartao,
  listaDeTrabalhos,
  marcadoresDeConstrucao,
  trabalhos,
  trabalhosVisiveis,
} from '@/conteudo/trabalhos';

const conceitoDeAutomacao: Trabalho = {
  slug: 'teste-automacao',
  nome: { pt: 'Teste' },
  setor: { pt: 'Setor' },
  mesAno: { pt: 'Mês' },
  oferta: 'automacao',
  conceito: true,
};

describe('conteúdo dos trabalhos', () => {
  it('a lista real tem as 5 peças conceito, na ordem landing / site / landing / site / landing', () => {
    expect(listaDeTrabalhos.map((tr) => tr.slug)).toEqual(['ferramenta-criativa', 'companhia-aerea', 'banco-digital', 'estudio-de-marca', 'plataforma-de-deploy']);
    expect(listaDeTrabalhos.map((tr) => tr.oferta)).toEqual(['landing-page', 'site-institucional', 'landing-page', 'site-institucional', 'landing-page']);
    expect(listaDeTrabalhos.map((tr) => tr.nome.pt)).toEqual(['Ferramenta criativa', 'Companhia aérea', 'Banco digital', 'Estúdio de marca', 'Plataforma de deploy']);
    expect(trabalhosVisiveis()).toBe(listaDeTrabalhos);
  });

  it('nenhum título, setor ou endereço traz a marca fictícia da peça (spec 5)', () => {
    const marcas = /tramo|al[ií]sio|prumo|taipa|lastro/i;
    listaDeTrabalhos.forEach((tr) => {
      [tr.slug, tr.nome.pt, tr.setor.pt, tr.capa ?? '', tr.site ?? ''].forEach((v) => expect(v).not.toMatch(marcas));
    });
  });

  it('os textos de cada peça estão na árvore, para a trava apontar o inglês que falta', () => {
    expect(pendencias({ trabalhos })).toContain('trabalhos.lista.0.nome (en)');
    expect(pendencias({ trabalhos })).toContain('trabalhos.lista.4.mesAno (en)');
  });

  it('com a lista vazia, os visíveis são os 4 marcadores de construção', () => {
    expect(trabalhosVisiveis([])).toBe(marcadoresDeConstrucao);
    expect(marcadoresDeConstrucao).toHaveLength(4);
    marcadoresDeConstrucao.forEach((m) => {
      expect(m.nome.pt.startsWith('Conceito · ')).toBe(true);
      expect(m.conceito).toBe(true);
      expect(m.capa).toBeUndefined();
    });
    expect(new Set(marcadoresDeConstrucao.map((m) => m.slug)).size).toBe(4);
  });

  it('os marcadores usam as ofertas do protótipo 05, na ordem', () => {
    expect(marcadoresDeConstrucao.map((m) => m.oferta)).toEqual(['site-institucional', 'landing-page', 'automacao', 'site-institucional']);
  });

  it('o que a spec não fixa nos marcadores (mês e ano, setor) fica pendente', () => {
    marcadoresDeConstrucao.forEach((m) => {
      expect(m.mesAno.pendente).toBe(true);
      expect(m.setor.pendente).toBe(true);
    });
  });

  it('com trabalhos reais, os visíveis são eles', () => {
    expect(trabalhosVisiveis([conceitoDeAutomacao])).toEqual([conceitoDeAutomacao]);
  });

  it('os nomes das ofertas', () => {
    expect(NOMES_OFERTA['landing-page'].pt).toBe('Landing page');
    expect(NOMES_OFERTA['site-institucional'].pt).toBe('Site institucional');
    expect(NOMES_OFERTA.automacao.pt).toBe('Automação');
  });

  it('a linha do cartão é mês e ano / oferta · Conceito', () => {
    expect(linhaDoCartao(conceitoDeAutomacao, 'pt')).toEqual(['Mês', 'Automação · Conceito']);
    expect(linhaDoCartao({ ...conceitoDeAutomacao, conceito: false }, 'pt')).toEqual(['Mês', 'Automação']);
  });

  it('a árvore de textos está no índice, com o rótulo nas duas línguas', () => {
    expect(TEXTOS.trabalhos).toBe(trabalhos);
    expect(trabalhos.rotulo).toEqual({ pt: '(Trabalhos)', en: '(Work)' });
    expect(pendencias({ trabalhos }).every((p) => p.endsWith('(en)'))).toBe(true);
  });
});
