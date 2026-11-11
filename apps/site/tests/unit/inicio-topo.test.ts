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

  // Rafael, 2026-11-10: os trechos da abertura e a intro do hero em português; o inglês segue pendente para a trava.
  it('os 3 trechos da abertura e a intro têm o texto escolhido e o inglês', () => {
    expect(inicioTopo.trechos.map((x) => x.pt)).toEqual(['Estratégia.', 'Design.', 'Tecnologia.']);
    expect(inicioTopo.intro.pt).toBe('Sites, landing pages e automações para empresas que querem crescer com tecnologia.');
    expect(inicioTopo.intro.pt.split(/\s+/).length).toBeLessThanOrEqual(30);
    const p = pendencias({ inicioTopo });
    expect(p).not.toEqual(expect.arrayContaining(['inicioTopo.intro (pt)']));
    expect(p).toEqual([]);
    expect(inicioTopo.rolar).toEqual({ pt: 'Role para baixo', en: 'Scroll down' });
  });

  it('está no índice do conteúdo', () => {
    expect(TEXTOS['inicio-topo']).toBe(inicioTopo);
  });
});
