'use client';

import { Fragment } from 'react';
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
  detalhes?: boolean; // página Trabalhos (spec 4.4): título em h2 e a linha setor / mês e ano / oferta visível
};

// Junta cada separador ("/" ou "·") às palavras vizinhas: a linha quebra só entre outras palavras, e nenhuma linha
// renderizada começa ou termina num separador (issue #12). Os espaços continuam normais, e o texto não muda.
function grupos(linha: string) {
  return linha.split(' ').reduce<string[]>((acc, palavra, i, palavras) => {
    if (i > 0 && (SEPARADORES.has(palavra) || SEPARADORES.has(palavras[i - 1]))) acc[acc.length - 1] += ` ${palavra}`;
    else acc.push(palavra);
    return acc;
  }, []);
}
const SEPARADORES = new Set(['/', '·']);

// Cartão de um trabalho (spec 4.3). Sem capa: bloco liso em #DCDCD8, sem ASCII e sem ação.
// Com capa: a imagem (que a cena WebGL da seção revela em ASCII e aproxima no hover); com site, o cartão é um link que
// abre o site do conceito numa aba nova (Rafael, 2026-11-09: "deixa a imagem inicial e quando clica abre o site").
export function CartaoTrabalho({ trabalho, idioma, indice, aoPassar, detalhes }: Props) {
  const nome = t(trabalho.nome, idioma);
  const [data, oferta] = linhaDoCartao(trabalho, idioma);
  const linha = `${t(trabalho.setor, idioma)} / ${data} / ${oferta}`;
  const Titulo = detalhes ? 'h2' : 'h3';
  // Na Início, a face do cartão mostra só o nome, embaixo (2026-11-10); data e oferta seguem no nome acessível do link.
  const info = (
    <div className="cartao-info">
      <Titulo className="cartao-titulo">{nome}</Titulo>
      {detalhes && (
        <p className="cartao-detalhes">
          {grupos(linha).map((s, i) => (
            <Fragment key={i}>
              {i > 0 && ' '}
              <span>{s}</span>
            </Fragment>
          ))}
        </p>
      )}
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
      aria-label={`${nome}, ${detalhes ? linha : `${oferta}, ${data}`} ${idioma === 'en' ? '(opens the site in a new tab)' : '(abre o site em nova aba)'}`}
      {...passar}
    >
      {conteudo}
    </a>
  );
}
