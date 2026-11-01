'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState, type MouseEvent } from 'react';
import { casca } from '@/conteudo/casca';
import { t, type Idioma } from '@/conteudo/textos';
import { useAbertura } from '@/estado/abertura';
import { paginaDoCaminho, rota, type Pagina } from '@/lib/idioma';
import { relogio } from '@/lib/relogio';
import { useIdioma } from '@/lib/useIdioma';
import { useFundoSobCabecalho } from './useFundoSobCabecalho';
import './estilo.css';

const SIGLA: Record<Idioma, string> = { pt: 'PT', en: 'EN' };

// Texto que gira no hover: a cópia entra de baixo (Hover do menu, 02-site).
function Giro({ texto }: { texto: string }) {
  return (
    <>
      <span className="menu-texto">{texto}</span>
      <span className="menu-texto2" aria-hidden="true">
        {texto}
      </span>
    </>
  );
}

function Relogio() {
  const [agora, setAgora] = useState(() => relogio(new Date()));
  useEffect(() => {
    const id = setInterval(() => setAgora(relogio(new Date())), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="relogio">
      <span suppressHydrationWarning>{agora}</span>
    </span>
  );
}

// O ponto do relógio fica fora do <header>: dentro dele, o mix-blend-mode do cabeçalho inverteria a cor.
function PontoDoRelogio({ visivel }: { visivel: boolean }) {
  const fundo = useFundoSobCabecalho();
  return <i className={`ponto-relogio${visivel ? ' visivel' : ''}`} data-sobre={fundo} aria-hidden="true" />;
}

const naoNavegar = (e: MouseEvent) => e.preventDefault();

// Relógio REC (só na Início) ou "Voltar ao início", nome com descritor que recolhe, seletor PT/EN e menu.
// Inverte sozinho com mix-blend-mode. `pagina` nula é um endereço fora do mapa (404).
export function Cabecalho({ visivel, idioma, pagina }: { visivel: boolean; idioma: Idioma; pagina: Pagina | null }) {
  const naInicio = pagina === 'inicio';
  const outra: Idioma = idioma === 'pt' ? 'en' : 'pt';

  return (
    <>
      <header className={`cabecalho${visivel ? ' visivel' : ''}`} inert={!visivel}>
        {naInicio ? (
          <Relogio />
        ) : (
          <a className="voltar" href={rota('inicio', idioma)}>
            <Giro texto={t(casca.voltar, idioma)} />
          </a>
        )}
        <a className="nome" href={naInicio ? '#topo' : rota('inicio', idioma)}>
          <span>{t(casca.nome, idioma)}</span>
          <span className="recolhe">{t(casca.descritor, idioma)}</span>
        </a>
        <div className="cabecalho-direita">
          {/* Cruza os dois layouts raiz: recarga completa, sem a transição de página. */}
          <a className="idioma" href={rota(pagina ?? 'inicio', outra)} hrefLang={outra === 'pt' ? 'pt-BR' : 'en'} data-sem-transicao="">
            <span className="menu-texto">{SIGLA[idioma]}</span>
            <span className="menu-texto2" aria-hidden="true">
              {SIGLA[outra]}
            </span>
            <span className="seta" aria-hidden="true" />
            <span className="leitor">{outra === 'pt' ? 'Ver em português' : 'View in English'}</span>
          </a>
          <nav aria-label={idioma === 'pt' ? 'Páginas' : 'Pages'}>
            {(['trabalhos', 'contato'] as const).map((p) => {
              const atual = pagina === p;
              return (
                <a key={p} href={rota(p, idioma)} aria-current={atual ? 'page' : undefined} onClick={atual ? naoNavegar : undefined}>
                  <Giro texto={t(casca.menu[p], idioma)} />
                </a>
              );
            })}
          </nav>
        </div>
      </header>
      {naInicio && <PontoDoRelogio visivel={visivel} />}
    </>
  );
}

// Na Início o cabeçalho desce quando a abertura termina; nas outras páginas já começa visível.
export function CabecalhoDaPagina() {
  const { terminou } = useAbertura();
  const idioma = useIdioma();
  const pagina = paginaDoCaminho(usePathname() ?? '/');
  return <Cabecalho visivel={terminou || pagina !== 'inicio'} idioma={idioma} pagina={pagina} />;
}
