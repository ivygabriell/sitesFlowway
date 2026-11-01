import { prefereMenosMovimento } from '@/lib/ambiente';
import { modoDeExibicao, type ModoDeExibicao } from '@/movimento/modo';

// Testa se o navegador cria um contexto WebGL antes de montar o canvas global: sem essa checagem,
// a falha ao criar o contexto escapa da proteção do scroll-rig e derruba a página inteira.
export function temWebgl(): boolean {
  try {
    const tela = document.createElement('canvas');
    const opcoes = { failIfMajorPerformanceCaveat: false };
    return !!(tela.getContext('webgl2', opcoes) || tela.getContext('webgl', opcoes));
  } catch {
    return false;
  }
}

const MODOS = ['desktop', 'celular', 'reduzido', 'sem-webgl'] as const;

// Classe de estado no <html> (modo-desktop, modo-celular, modo-reduzido ou modo-sem-webgl), lida na montagem.
export function marcarModo(): ModoDeExibicao {
  const modo = modoDeExibicao(window.innerWidth, prefereMenosMovimento(), temWebgl());
  const html = document.documentElement;
  for (const m of MODOS) html.classList.toggle(`modo-${m}`, m === modo);
  return modo;
}
