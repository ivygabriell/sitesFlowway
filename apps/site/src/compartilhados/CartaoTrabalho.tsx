'use client';

import { type Idioma, t } from '@/conteudo/textos';
import { type Trabalho, linhaDoCartao } from '@/conteudo/trabalhos';
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

// Cartão de um trabalho (spec 4.3). Sem capa: bloco liso em #DCDCD8, sem ASCII e sem ação.
// Com capa: a imagem (que a cena WebGL da seção revela em ASCII e aproxima no hover); com site, o cartão é um link que
// abre o site do conceito numa aba nova (Rafael, 2026-11-09: "deixa a imagem inicial e quando clica abre o site").
export function CartaoTrabalho({ trabalho, idioma, indice, aoPassar }: Props) {
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

  const conteudo = (
    <>
      {info}
      <div className="cartao-img">
        {/* eslint-disable-next-line @next/next/no-img-element -- a capa também é a textura do plano WebGL */}
        <img src={trabalho.capa} alt={nome} width={LARGURA_CAPA} height={ALTURA_CAPA} loading="lazy" decoding="async" />
      </div>
    </>
  );
  const passar = { onMouseEnter: () => aoPassar?.(indice, true), onMouseLeave: () => aoPassar?.(indice, false) };

  if (!trabalho.site)
    return (
      <article className="cartao com-capa" {...passar}>
        {conteudo}
      </article>
    );
  return (
    <a
      className="cartao com-capa"
      href={trabalho.site}
      target="_blank"
      rel="noopener"
      aria-label={idioma === 'en' ? `${nome} (opens the site in a new tab)` : `${nome} (abre o site em nova aba)`}
      {...passar}
    >
      {conteudo}
    </a>
  );
}
