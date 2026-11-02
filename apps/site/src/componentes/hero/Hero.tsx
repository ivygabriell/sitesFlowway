'use client';

import { UseCanvas } from '@14islands/r3f-scroll-rig';
import { 'inicio-topo' as inicioTopo } from '@/conteudo/inicio-topo';
import { t } from '@/conteudo/textos';
import { useIdioma } from '@/lib/useIdioma';
import { PALAVRA } from '@/marca/palavra';
import { CenaHero } from './CenaHero';
import './estilo.css';

const REPETICOES = 4;

// Hero: a palavra e as lâminas de vidro vivem no canvas; aqui ficam a palavra em SVG (que aparece sem WebGL),
// as faixas, a intro e o convite a rolar.
export function Hero() {
  const idioma = useIdioma();
  return (
    <section data-fundo="claro" className="secao-hero">
      <h1 className="titulo-hero ScrollRig-transparentColor">
        <svg viewBox={PALAVRA.viewBox.join(' ')} role="img" aria-label="FLOWAY">
          <title>FLOWAY</title>
          <path transform={`translate(${PALAVRA.translacao.join(' ')})`} d={PALAVRA.d} fill="currentColor" />
        </svg>
      </h1>
      <div className="faixas" aria-hidden="true">
        {inicioTopo.faixas.map((itens, i) => (
          <div key={i} className={`faixa faixa-${i + 1}`}>
            {Array.from({ length: REPETICOES }, () => itens)
              .flat()
              .map((item, j) => (
                <span key={j} className="faixa-item">
                  {t(item, idioma)}
                </span>
              ))}
          </div>
        ))}
      </div>
      <p className="intro">
        {t(inicioTopo.intro, idioma)
          .split(' ')
          .map((p, i) => (
            <span key={i} className="palavra-intro">
              {p}{' '}
            </span>
          ))}
      </p>
      <p className="role-para-baixo">{t(inicioTopo.rolar, idioma)}</p>
      <UseCanvas>
        <CenaHero />
      </UseCanvas>
    </section>
  );
}
