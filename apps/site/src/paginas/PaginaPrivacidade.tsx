'use client';

import { contato } from '@/conteudo/contato';
import { t } from '@/conteudo/textos';
import { useIdioma } from '@/lib/useIdioma';
import '@/componentes/contato/estilo.css';

// Tela clara de texto (spec 4.1); o texto fica em C2.
export function PaginaPrivacidade() {
  const idioma = useIdioma();
  return (
    <main className="pagina-privacidade" data-fundo="claro" id="topo">
      <h1>{t(contato.formulario.aviso.link, idioma)}</h1>
      <p>{t(contato.privacidade, idioma)}</p>
    </main>
  );
}
