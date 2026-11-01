'use client';

import { Fragment } from 'react';
import { 'inicio-manifesto' as textos } from '@/conteudo/inicio-manifesto';
import { t } from '@/conteudo/textos';
import { PRIORIDADE, gsap, recalcularGatilhos } from '@/gsap';
import { ehCelular, prefereMenosMovimento } from '@/lib/ambiente';
import { useEfeitoDeLayout } from '@/lib/useEfeitoDeLayout';
import { useIdioma } from '@/lib/useIdioma';
import { CURVAS, INTERVALOS, tempo } from '@/movimento/tokens';
import { CuboMarca } from './CuboMarca';
import './estilo.css';

const LINEAR = CURVAS['curva-linear'];

// Trechos da timeline do giro, presa por 0,8 tela com scrub: são frações da rolagem, não tempos.
const GIRO = {
  inicio: 0.1,
  giro: 1,
  bordaEm: 1.2,
  borda: 0.1,
  caixasEm: 1.1,
  caixas: 0.3,
  escalaEm: 1.4,
  escala: 0.2,
  seguirAcima: 0.87,
} as const;

export function Manifesto() {
  const idioma = useIdioma();

  useEfeitoDeLayout(() => {
    const secao = document.querySelector<HTMLElement>('.secao-manifesto')!;
    const ajustarEscala = () => secao.style.setProperty('--escala-cubo', String(Math.min(1, (window.innerWidth - 60) / 1000)));
    ajustarEscala();
    window.addEventListener('resize', ajustarEscala);
    if (prefereMenosMovimento()) {
      secao.classList.add('cubo-girado');
      return () => window.removeEventListener('resize', ajustarEscala);
    }

    const ctx = gsap.context(() => {
      if (ehCelular(window.innerWidth)) {
        gsap.timeline({ scrollTrigger: { trigger: '.cubo-palco', start: 'top 80%' } }).to('.cubo', { rotateY: '-90deg', duration: tempo('tempo-cubo-celular'), ease: LINEAR });
        return;
      }

      // Os vãos do manifesto abrem enquanto o texto entra.
      gsap.to('.manifesto-texto .vao', {
        width: 0.03 * window.innerWidth,
        ease: LINEAR,
        scrollTrigger: { trigger: secao, start: 'top top-=50', end: '+=200', scrub: tempo('tempo-scrub'), refreshPriority: PRIORIDADE.manifesto },
      });

      // O cubo gira com a seção fixada; os retângulos encolhem e depois seguem o mouse.
      const palavras = secao.querySelectorAll<HTMLElement>('.palavra-contorno');
      const caixas = secao.querySelectorAll<HTMLElement>('.caixa');
      const cuboEl = secao.querySelector<HTMLElement>('.cubo')!;
      const seguidores: gsap.core.Tween[] = [];
      const seguir = (e: MouseEvent) => {
        const r = cuboEl.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;
        caixas.forEach((c, i) => seguidores.push(gsap.to(c, { left: `${100 * x}%`, top: `${100 * y}%`, duration: INTERVALOS['intervalo-seguir'] * i })));
      };
      let seguindo = false;
      const topoCubo = cuboEl.getBoundingClientRect().top - secao.getBoundingClientRect().top;
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: secao,
          start: `top+=${topoCubo - 0.5 * window.innerHeight + 300}`,
          end: `+=${0.8 * window.innerHeight}`,
          scrub: tempo('tempo-scrub'),
          pin: true,
          refreshPriority: PRIORIDADE.manifesto,
          onUpdate: ({ progress }) => {
            if (progress > GIRO.seguirAcima && !seguindo) {
              palavras.forEach((p) => (p.style.animationPlayState = 'paused'));
              cuboEl.addEventListener('mousemove', seguir);
              seguindo = true;
            } else if (progress <= GIRO.seguirAcima && seguindo) {
              palavras.forEach((p) => (p.style.animationPlayState = 'running'));
              cuboEl.removeEventListener('mousemove', seguir);
              seguidores.splice(0).forEach((t) => t.kill());
              gsap.set(caixas, { left: '50%', top: '50%' });
              seguindo = false;
            }
          },
        },
      });
      tl.to('.cubo', { rotateY: '-90.01deg', duration: GIRO.giro, ease: LINEAR }, GIRO.inicio)
        .to('.cubo-lado', { borderWidth: 1, duration: GIRO.borda, ease: LINEAR }, GIRO.bordaEm)
        .from('.caixa', { width: 1200, height: 800, duration: GIRO.caixas, stagger: INTERVALOS['intervalo-minimo'], ease: LINEAR }, GIRO.caixasEm)
        .to('.cubo', { scale: 1, duration: GIRO.escala, ease: LINEAR }, GIRO.escalaEm);
      recalcularGatilhos();
      return () => cuboEl.removeEventListener('mousemove', seguir);
    }, secao);

    return () => {
      window.removeEventListener('resize', ajustarEscala);
      ctx.revert();
    };
  }, []);

  return (
    <section data-fundo="escuro" className="secao-manifesto trecho-escuro" id="manifesto">
      <div className="manifesto-texto">
        <h2 className="rotulo-manifesto">{t(textos.rotulo, idioma)}</h2>
        {textos.partes.map((parte, i) => (
          <Fragment key={i}>
            {i > 0 && <span className="vao" aria-hidden="true" />}
            {t(parte, idioma)}{' '}
          </Fragment>
        ))}
      </div>
      <p className="manifesto-apoio">{t(textos.apoio, idioma)}</p>
      <div className="manifesto-conteudo">
        <CuboMarca />
        <div className="unico">
          <span className="rotulo-unico">{t(textos.unico.rotulo, idioma)}</span>
          {textos.unico.paragrafos.map((p, i) => (
            <p key={i}>{t(p, idioma)}</p>
          ))}
        </div>
      </div>
    </section>
  );
}

