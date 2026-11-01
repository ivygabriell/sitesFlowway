import { casca } from './casca';
import { 'inicio-lencol' as inicioLencol } from './inicio-lencol';
import { 'inicio-manifesto' as inicioManifesto } from './inicio-manifesto';
import { 'inicio-topo' as inicioTopo } from './inicio-topo';
import { seo } from './seo';
import type { Textos } from './textos';

// Todos os textos do site, um ramo por módulo de src/conteudo/ (o nome do ramo é o nome do arquivo).
// A trava de publicação confere que todo módulo está aqui e que pendencias(TEXTOS) está vazio.
export const TEXTOS = { casca, 'inicio-lencol': inicioLencol, 'inicio-manifesto': inicioManifesto, 'inicio-topo': inicioTopo, seo } as const satisfies Record<string, Textos>;
