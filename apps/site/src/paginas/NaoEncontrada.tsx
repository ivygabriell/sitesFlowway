'use client';

import { casca } from '@/conteudo/casca';
import { t } from '@/conteudo/textos';
import { rota } from '@/lib/idioma';
import { useIdioma } from '@/lib/useIdioma';
import '@/componentes/contato/estilo.css';

// 404 nas duas línguas (spec 4.7). A esfera formando o número entra quando houver o alvo "404".
export function NaoEncontrada() {
  const idioma = useIdioma();
  return (
    <main className="pagina-404" data-fundo="claro" id="topo">
      <p className="pagina-404-codigo">(404)</p>
      <h1>{t(casca.naoEncontrada, idioma)}</h1>
      <p className="pagina-404-links">
        <a href={rota('inicio', idioma)}>{t(casca.voltar, idioma)}</a>
        <a href={rota('contato', idioma)}>{t(casca.selo, idioma)}</a>
      </p>
    </main>
  );
}
