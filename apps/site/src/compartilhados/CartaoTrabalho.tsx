'use client';

import { useEffect, useRef } from 'react';
import { type Idioma, t } from '@/conteudo/textos';
import { type Trabalho, linhaDoCartao } from '@/conteudo/trabalhos';
import './estilo.css';

// Medidas da capa (a imagem do DOM, que o plano WebGL cobre com o ASCII).
export const LARGURA_CAPA = 730;
export const ALTURA_CAPA = 1080;

// Quanto o mouse precisa parar sobre o cartão para abrir o pop-up: cruzar a fileira não abre nada sem querer.
const ESPERA_ABRIR = 250;

type Props = {
  trabalho: Trabalho;
  idioma: Idioma;
  indice: number;
  aoPassar?: (indice: number, dentro: boolean) => void;
  aoAbrir?: (indice: number) => void;
};

// Mouse de verdade (o toque também dispara mouseenter): só ele abre o pop-up ao parar sobre o cartão.
export const mouseFino = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;

// Cartão de um trabalho (spec 4.3). Sem capa: bloco liso em #DCDCD8, sem ASCII e sem ação.
// Com capa: a imagem (que a cena WebGL da seção revela em ASCII); parar o mouse, clicar, tocar, Enter ou espaço abrem
// o pop-up com a página inteira (Rafael, 2026-11-09). Sem link: os trabalhos ainda não têm página de case.
export function CartaoTrabalho({ trabalho, idioma, indice, aoPassar, aoAbrir }: Props) {
  const espera = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(espera.current), []);
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
    clearTimeout(espera.current);
    if (dentro && mouseFino()) espera.current = setTimeout(() => aoAbrir?.(indice), ESPERA_ABRIR);
  };

  return (
    <article
      className="cartao com-capa"
      role="button"
      tabIndex={0}
      aria-haspopup="dialog"
      onMouseEnter={() => passar(true)}
      onMouseLeave={() => passar(false)}
      onClick={() => {
        clearTimeout(espera.current);
        aoAbrir?.(indice);
      }}
      onKeyDown={(e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        aoAbrir?.(indice);
      }}
    >
      {info}
      <div className="cartao-img">
        {/* eslint-disable-next-line @next/next/no-img-element -- a capa também é a textura do plano WebGL */}
        <img src={trabalho.capa} alt={nome} width={LARGURA_CAPA} height={ALTURA_CAPA} loading="lazy" decoding="async" />
      </div>
    </article>
  );
}
