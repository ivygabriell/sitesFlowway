'use client';

import { useEffect, useRef, useState } from 'react';
import { abertura } from '@/conteudo/identidade';
import { useAbertura } from '@/estado/abertura';
import { gsap } from '@/gsap';
import { ehCelular, prefereMenosMovimento } from '@/lib/ambiente';
import { desenharFilme } from './filmeAbertura';
import './estilo.css';

const CHAVE = 'abertura-tocou';
const ESPERA_MINIMA = 1.6; // segundos com o filme na tela antes dos dois últimos trechos
// Padrão do GSAP: um quadro acima de 500 ms conta como travada e o relógio avança só 33 ms.
const SUAVIZAR_TRAVADAS = [500, 33] as const;

export const deveTocarAbertura = (largura: number, reduzido: boolean, jaTocou: boolean) =>
  !ehCelular(largura) && !reduzido && !jaTocou;

const jaTocouNaSessao = () => {
  try {
    return sessionStorage.getItem(CHAVE) === '1';
  } catch {
    return false;
  }
};

export function Abertura() {
  const { terminar } = useAbertura();
  const [mostrar, setMostrar] = useState(true);
  const raiz = useRef<HTMLDivElement>(null);
  const tela = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!deveTocarAbertura(window.innerWidth, prefereMenosMovimento(), jaTocouNaSessao())) {
      setMostrar(false);
      terminar();
      return;
    }

    const ctx = tela.current?.getContext('2d');
    let quadro = 0;
    const desenhar = (ms: number) => {
      if (ctx) desenharFilme(ctx, ms / 1000);
      quadro = requestAnimationFrame(desenhar);
    };
    quadro = requestAnimationFrame(desenhar);

    // A abertura segue o relógio de verdade: sem GPU, cada quadro leva meio segundo e, com a suavização
    // de travadas do GSAP, ela se arrastava por mais de 8 s em vez de sumir em até 6 s.
    gsap.ticker.lagSmoothing(0);
    const el = raiz.current!;
    const tl = gsap.timeline({
      onComplete: () => {
        gsap.ticker.lagSmoothing(...SUAVIZAR_TRAVADAS);
        try {
          sessionStorage.setItem(CHAVE, '1');
        } catch {}
        cancelAnimationFrame(quadro);
        setMostrar(false);
        terminar();
      },
    });
    tl.to(el.querySelector('.t1'), { opacity: 1, duration: 0.2 })
      .add(() => {
        tl.pause();
      })
      .to(el.querySelector('.t2'), { opacity: 1, duration: 0.2 })
      .to(el.querySelector('.t3'), { opacity: 1, duration: 0.3, delay: 0.1 }, '<')
      .to(el.querySelector('.filme'), { scaleY: 0, duration: 0.3, delay: 0.5, ease: 'power2.out' })
      .to(el.querySelector('.trechos'), { autoAlpha: 0, duration: 0.3, ease: 'power2.out' }, '<');

    // Como a referência espera o primeiro vídeo carregar, aqui esperamos as fontes e um tempo mínimo de filme.
    Promise.all([document.fonts.ready, new Promise((r) => setTimeout(r, ESPERA_MINIMA * 1000))]).then(() => tl.play());

    return () => {
      gsap.ticker.lagSmoothing(...SUAVIZAR_TRAVADAS);
      tl.kill();
      cancelAnimationFrame(quadro);
    };
  }, [terminar]);

  if (!mostrar) return null;
  return (
    <div className="abertura" ref={raiz} aria-hidden="true">
      <canvas className="filme" ref={tela} width={300} height={158} />
      <p className="trechos">
        {abertura.map((t, i) => (
          <span key={t} className={`trecho t${i + 1}`}>
            {t}
          </span>
        ))}
      </p>
    </div>
  );
}
