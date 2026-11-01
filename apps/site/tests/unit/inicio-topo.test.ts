import { describe, expect, it } from 'vitest';
import { TEXTOS } from '@/conteudo';
import { 'inicio-topo' as inicioTopo } from '@/conteudo/inicio-topo';
import { pendencias } from '@/conteudo/textos';

describe('textos da abertura e do hero', () => {
  it('as faixas são as da spec (4.3), com o índice na posição da spec', () => {
    expect(inicioTopo.faixas.map((f) => f.map((x) => x.pt))).toEqual([
      ['Landing pages', 'Sites institucionais', 'Automações', 'Integrações', 'Interface', 'Desenvolvimento web', 'Tecnologia B2B', '(01)', 'Feito para o seu negócio'],
      ['Branding', 'Autoridade', 'Posicionamento', 'Credibilidade', 'Presença digital', 'Percepção de valor', 'Diferenciação', '(02)', 'Experiência premium', 'Confiança'],
    ]);
  });

  it('o que a spec não fixa fica pendente: os 3 trechos da abertura e a intro', () => {
    const p = pendencias({ inicioTopo });
    expect(p).toEqual(expect.arrayContaining(['inicioTopo.trechos.0 (pt)', 'inicioTopo.trechos.1 (pt)', 'inicioTopo.trechos.2 (pt)', 'inicioTopo.intro (pt)']));
    expect(inicioTopo.rolar).toEqual({ pt: 'Role para baixo', en: 'Scroll down' });
  });

  it('está no índice do conteúdo', () => {
    expect(TEXTOS['inicio-topo']).toBe(inicioTopo);
  });
});
