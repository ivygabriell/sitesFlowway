import { Abertura } from '@/componentes/abertura/Abertura';
import { SeloLateral } from '@/componentes/cabecalho/SeloLateral';
import { Capitulos } from '@/componentes/capitulos/Capitulos';
import { Contato } from '@/componentes/contato/Contato';
import { Decisoes } from '@/componentes/decisoes/Decisoes';
import { Hero } from '@/componentes/hero/Hero';
import { Manifesto } from '@/componentes/manifesto/Manifesto';
import { Passagem } from '@/componentes/passagem/Passagem';
import type { Idioma } from '@/conteudo/textos';

// A Início, igual nas duas línguas; os textos sem tradução aparecem em português.
export function Inicio({ idioma }: { idioma: Idioma }) {
  return (
    <>
      <SeloLateral />
      <main className="conteudo" id="topo">
        <Abertura />
        <Hero />
        <Passagem />
        <Manifesto />
        <Capitulos />
        <Decisoes />
        <Contato />
      </main>
    </>
  );
}
