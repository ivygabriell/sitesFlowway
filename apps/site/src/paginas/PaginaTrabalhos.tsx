'use client';

import { CartaoTrabalho } from '@/compartilhados/CartaoTrabalho';
import { t } from '@/conteudo/textos';
import { trabalhos, trabalhosVisiveis } from '@/conteudo/trabalhos';
import { useIdioma } from '@/lib/useIdioma';
import './trabalhos.css';

// Página Trabalhos (spec 4.4), etapa 1: a lista de cartões que a spec reserva ao celular, ao movimento reduzido e ao
// sem WebGL. shortcut: sem a pilha de planos presa da spec 4.4, a entregar na etapa 2 (issue própria).
export function PaginaTrabalhos() {
  const idioma = useIdioma();
  return (
    <main className="pagina-trabalhos" data-fundo="escuro" id="topo">
      <h1 className="pagina-trabalhos-titulo">{t(trabalhos.rotulo, idioma)}</h1>
      <div className="pagina-trabalhos-lista">
        {trabalhosVisiveis().map((trabalho, i) => (
          <CartaoTrabalho key={trabalho.slug} trabalho={trabalho} idioma={idioma} indice={i} />
        ))}
      </div>
    </main>
  );
}
