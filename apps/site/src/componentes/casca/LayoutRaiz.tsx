import type { ReactNode } from 'react';
import '@14islands/r3f-scroll-rig/css';
import '../../../app/globals.css';
import type { Idioma } from '@/conteudo/textos';
import { classesDasFontes } from '@/fontes';
import { SCRIPT_RESTAURANDO } from '@/lib/restauracao';
import { Casca } from './Casca';

// A metadata base (fora dos buscadores até C5) vem dos buscadores e sai daqui para os dois layouts.
export { METADADOS_BASE } from '@/seo/paginas';

const SCRIPT_ABERTURA = "try{if(sessionStorage.getItem('abertura-tocou')==='1')document.documentElement.classList.add('sem-abertura')}catch(e){}";

const LANG: Record<Idioma, string> = { pt: 'pt-BR', en: 'en' };

// O <html> comum aos dois layouts raiz, (pt) e (en): a língua, as fontes, as CSS globais, o script da abertura e a casca.
export function LayoutRaiz({ idioma, children }: { idioma: Idioma; children: ReactNode }) {
  return (
    <html lang={LANG[idioma]} className={classesDasFontes} suppressHydrationWarning>
      {/* É o <head> do layout raiz do App Router (a regra só o reconhece dentro de app/). */}
      {/* eslint-disable-next-line @next/next/no-head-element */}
      <head>
        {/* Antes de pintar: se a abertura já tocou nesta sessão, ela não aparece nem por um quadro. */}
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_ABERTURA }} />
        {/* Recarregar ou voltar no meio da página: escondida até a rolagem voltar, para o topo não aparecer antes. */}
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_RESTAURANDO }} />
        <noscript>
          <style>{'.abertura, .secao-contato .circulo-escuro { display: none; } .rodape { display: flex; }'}</style>
        </noscript>
      </head>
      <body>
        <Casca idioma={idioma}>{children}</Casca>
      </body>
    </html>
  );
}
