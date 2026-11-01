import type { ReactNode } from 'react';
import '@14islands/r3f-scroll-rig/css';
import '../../../app/globals.css';
import type { Idioma } from '@/conteudo/textos';
import { classesDasFontes } from '@/fontes';
import { Casca } from './Casca';

// A metadata base (fora dos buscadores até C5) vem dos buscadores e sai daqui para os dois layouts.
export { METADADOS_BASE } from '@/seo/paginas';

const SCRIPT_ABERTURA = "try{if(sessionStorage.getItem('abertura-tocou')==='1')document.documentElement.classList.add('sem-abertura')}catch(e){}";

const LANG: Record<Idioma, string> = { pt: 'pt-BR', en: 'en' };

// O <html> comum aos dois layouts raiz, (pt) e (en): a língua, as fontes, as CSS globais, o script da abertura e a casca.
export function LayoutRaiz({ idioma, children }: { idioma: Idioma; children: ReactNode }) {
  return (
    <html lang={LANG[idioma]} className={classesDasFontes} suppressHydrationWarning>
      <head>
        {/* Antes de pintar: se a abertura já tocou nesta sessão, ela não aparece nem por um quadro. */}
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_ABERTURA }} />
        <noscript>
          <style>{'.abertura { display: none; }'}</style>
        </noscript>
      </head>
      <body>
        <Casca idioma={idioma}>{children}</Casca>
      </body>
    </html>
  );
}
