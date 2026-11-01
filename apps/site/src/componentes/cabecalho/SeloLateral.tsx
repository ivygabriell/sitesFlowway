'use client';

import { casca } from '@/conteudo/casca';
import { t } from '@/conteudo/textos';
import { useAbertura } from '@/estado/abertura';
import { rota } from '@/lib/idioma';
import { useIdioma } from '@/lib/useIdioma';

// Atalho fixo "Iniciar projeto" na borda direita, só na Início (spec 4.2), no lugar do selo de prêmio da referência.
export function SeloLateral() {
  const { terminou } = useAbertura();
  const idioma = useIdioma();
  return (
    <a className={`selo${terminou ? ' visivel' : ''}`} href={rota('contato', idioma)} inert={!terminou}>
      <span>{t(casca.selo, idioma)}</span>
    </a>
  );
}
