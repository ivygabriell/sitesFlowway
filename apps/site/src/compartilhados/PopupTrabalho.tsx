'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { type Idioma, t } from '@/conteudo/textos';
import { type Trabalho, linhaDoCartao } from '@/conteudo/trabalhos';
import { prefereMenosMovimento } from '@/lib/ambiente';
import { mouseFino } from './CartaoTrabalho';

type Props = { trabalho: Trabalho; idioma: Idioma; aoFechar: () => void; centroX?: number };

// Pop-up de um trabalho (Rafael, 2026-11-09): a página inteira do site, em vídeo da rolagem, por cima da Início.
// Abre ao parar o mouse no cartão ou ao clicar/tocar; fecha ao tirar o mouse, em Fechar, com Esc ou clicando fora.
// Vai para o body: a seção tem pin com transform, que prenderia um fixed lá dentro.
export function PopupTrabalho({ trabalho, idioma, aoFechar, centroX }: Props) {
  const fechar = useRef<HTMLButtonElement>(null);
  const dialogo = useRef<HTMLDivElement>(null);

  // Sobre o cartão (centroX), sem sair da tela: quem abriu pelo mouse já está dentro e, ao sair, fecha.
  useLayoutEffect(() => {
    const el = dialogo.current;
    if (!el || centroX === undefined) return;
    const folga = Math.max(0, (window.innerWidth - el.offsetWidth) / 2);
    const desvio = Math.min(folga, Math.max(-folga, centroX - window.innerWidth / 2));
    el.style.transform = `translateX(${desvio}px)`;
  }, [centroX]);
  const nome = t(trabalho.nome, idioma);
  const [data, oferta] = linhaDoCartao(trabalho, idioma);
  const reduzido = prefereMenosMovimento();

  useEffect(() => {
    fechar.current?.focus({ preventScroll: true });
    const aoTeclar = (e: KeyboardEvent) => e.key === 'Escape' && aoFechar();
    document.addEventListener('keydown', aoTeclar);
    return () => document.removeEventListener('keydown', aoTeclar);
  }, [aoFechar]);

  return createPortal(
    <div className="popup-trabalho-fundo" onClick={aoFechar}>
      <div
        ref={dialogo}
        className="popup-trabalho"
        role="dialog"
        aria-modal="true"
        aria-label={nome}
        onClick={(e) => e.stopPropagation()}
        onMouseLeave={() => mouseFino() && aoFechar()}
      >
        <div className="popup-cabeca">
          <p>
            {nome} · {data} · {oferta}
          </p>
          <button ref={fechar} type="button" className="popup-fechar" aria-label={idioma === 'en' ? 'Close' : 'Fechar'} onClick={aoFechar}>
            ×
          </button>
        </div>
        <video poster={trabalho.capa} muted loop playsInline autoPlay={!reduzido} controls={reduzido} preload="auto">
          {trabalho.previa?.map((src) => (
            <source key={src} src={src} type={`video/${src.split('.').pop()}`} />
          ))}
        </video>
      </div>
    </div>,
    document.body,
  );
}
