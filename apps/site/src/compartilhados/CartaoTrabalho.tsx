'use client';

import { useEffect, useRef } from 'react';
import { type Idioma, t } from '@/conteudo/textos';
import { type Trabalho, linhaDoCartao } from '@/conteudo/trabalhos';
import { prefereMenosMovimento } from '@/lib/ambiente';
import './estilo.css';

// Medidas da capa (a imagem do DOM, que o plano WebGL cobre com o ASCII).
export const LARGURA_CAPA = 730;
export const ALTURA_CAPA = 1080;

type Props = {
  trabalho: Trabalho;
  idioma: Idioma;
  indice: number;
  aoPassar?: (indice: number, dentro: boolean) => void;
};

// Só com mouse fino (o toque também dispara mouseenter) e sem movimento reduzido; o CSS esconde a prévia no resto.
const podeTocar = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches && !prefereMenosMovimento();

// Cartão de um trabalho (spec 4.3). Sem capa: bloco liso em #DCDCD8, sem ASCII, sem prévia e sem link.
// Com capa: a imagem (que a cena WebGL da seção revela em ASCII) e, no hover, a prévia em vídeo da rolagem da
// página inteira cobrindo o cartão (spec 2026-11-09, Q2). Sem link nem foco: o cartão não tem ação.
export function CartaoTrabalho({ trabalho, idioma, indice, aoPassar }: Props) {
  const video = useRef<HTMLVideoElement>(null);
  // Perto da tela (com mouse), a prévia já carrega: no hover ela toca na hora, sem esperar o download (0,1 a 1,2 s).
  useEffect(() => {
    const v = video.current;
    const cartao = v?.closest('.cartao');
    if (!v || !cartao || !podeTocar()) return;
    const observador = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        v.preload = 'auto';
        v.load();
        observador.disconnect();
      },
      { rootMargin: '50% 100%' },
    );
    observador.observe(cartao);
    return () => observador.disconnect();
  }, []);
  const nome = t(trabalho.nome, idioma);
  const [data, oferta] = linhaDoCartao(trabalho, idioma);
  const info = (
    <div className="cartao-info">
      <p className="cartao-subtitulo">
        {data}
        <br />
        {oferta}
      </p>
      <h3 className="cartao-titulo">{nome}</h3>
    </div>
  );

  if (!trabalho.capa) return <article className="cartao sem-capa">{info}</article>;

  const passar = (dentro: boolean) => {
    aoPassar?.(indice, dentro);
    const v = video.current;
    if (!v) return;
    if (dentro) {
      if (podeTocar()) void v.play().catch(() => {});
    } else {
      v.pause();
      v.currentTime = 0;
    }
  };

  return (
    <article className="cartao com-capa" onMouseEnter={() => passar(true)} onMouseLeave={() => passar(false)}>
      {info}
      {trabalho.previa && (
        <div className="cartao-previa" aria-hidden="true">
          <video ref={video} muted loop playsInline preload="none">
            {trabalho.previa.map((src) => (
              <source key={src} src={src} type={`video/${src.split('.').pop()}`} />
            ))}
          </video>
        </div>
      )}
      <div className="cartao-img">
        {/* eslint-disable-next-line @next/next/no-img-element -- a capa também é a textura do plano WebGL */}
        <img src={trabalho.capa} alt={nome} width={LARGURA_CAPA} height={ALTURA_CAPA} loading="lazy" decoding="async" />
      </div>
    </article>
  );
}
