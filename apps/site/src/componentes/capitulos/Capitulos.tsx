'use client';

import { UseCanvas, useScrollRig } from '@14islands/r3f-scroll-rig';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CartaoTrabalho } from '@/compartilhados/CartaoTrabalho';
import { t } from '@/conteudo/textos';
import { trabalhos, trabalhosVisiveis } from '@/conteudo/trabalhos';
import { PRIORIDADE, gsap, recalcularGatilhos } from '@/gsap';
import { ehCelular, prefereMenosMovimento } from '@/lib/ambiente';
import { suave } from '@/lib/suave';
import { useEfeitoDeLayout } from '@/lib/useEfeitoDeLayout';
import { useIdioma } from '@/lib/useIdioma';
import { CURVAS, tempo } from '@/movimento/tokens';
import { BarraProgresso } from './BarraProgresso';
import { CenaCartoes, type EstadoCartoes } from './CenaCartoes';
import './estilo.css';

type Modo = 'galeria' | 'estatica' | 'grade' | 'lista';
const LINEAR = CURVAS['curva-linear'];
const HOVER = CURVAS['curva-padrao'];

// Trechos da timeline presa, com scrub: são frações da rolagem, não tempos.
const TRECHOS = { revelar: 0.5, andarEm: 0.6, andar: 2, barra: 2.5, sairEm: 2.6, sair: 0.3 } as const;

// Trabalhos em destaque (spec 4.3, protótipo 05): a seção fica presa e a fileira anda na horizontal.
// Os cartões sem capa são blocos em cor estática; a cena WebGL (ASCII, varredura, hover) só existe para os com capa.
export function Capitulos() {
  const idioma = useIdioma();
  const { isCanvasAvailable } = useScrollRig();
  const [modo, setModo] = useState<Modo>('galeria');
  const lista = trabalhosVisiveis();
  const comCapa = useMemo(() => lista.flatMap((tr, i) => (tr.capa ? [{ capa: tr.capa, indice: i }] : [])), [lista]);
  const capas = useMemo(() => comCapa.map((c) => c.capa), [comCapa]);
  const indices = useMemo(() => comCapa.map((c) => c.indice), [comCapa]);
  const estado = useRef<EstadoCartoes>({ progresso: 0, hover: lista.map(() => 0) });

  useEffect(() => {
    setModo((atual) => (prefereMenosMovimento() ? 'grade' : ehCelular(window.innerWidth) ? 'lista' : atual));
  }, []);

  const comWebgl = (modo === 'galeria' || modo === 'estatica') && isCanvasAvailable && capas.length > 0;

  useEfeitoDeLayout(() => {
    if (modo !== 'galeria') return;
    const secao = document.querySelector<HTMLElement>('.secao-capitulos')!;
    const ctx = gsap.context(() => {
      const fileira = secao.querySelector<HTMLElement>('.cartoes')!;
      const cartoes = secao.querySelectorAll<HTMLElement>('.cartao');
      const tracinhos = secao.querySelectorAll<HTMLElement>('.tracinho');
      // Só anda quando a fileira passa da tela; com poucos quadros ela fica centrada, parada.
      const extra = Math.max(0, fileira.scrollWidth - window.innerWidth);
      if (extra === 0) {
        estado.current.progresso = 1;
        setModo('estatica');
        return;
      }
      const tl = gsap.timeline({
        defaults: { ease: LINEAR },
        scrollTrigger: {
          trigger: secao,
          start: 'top top',
          end: `+=${Math.max(extra - 500, window.innerHeight)}`,
          scrub: tempo('tempo-scrub'),
          pin: true,
          refreshPriority: PRIORIDADE.capitulos,
          onUpdate: ({ progress }) => {
            const p = Math.max(0, 1.2 * progress - 0.04);
            tracinhos.forEach((tr, i) => (tr.style.opacity = String(suave(0.02, 0.1, (i + 1) / 28 - p))));
            cartoes.forEach((c) => (c.style.pointerEvents = progress >= 0.15 ? 'auto' : 'none'));
          },
        },
      });
      tl.to(estado.current, { progresso: 1, duration: TRECHOS.revelar }, 0)
        .to(fileira, { x: -extra, duration: TRECHOS.andar }, TRECHOS.andarEm)
        .to('.barra-ativa', { width: '100%', duration: TRECHOS.barra }, 0)
        .to('.barra-progresso', { rotateZ: 6, opacity: 0, duration: TRECHOS.sair }, TRECHOS.sairEm);
      recalcularGatilhos();
    }, secao);
    return () => ctx.revert();
  }, [modo]);

  // Hover dos cartões com capa: aproxima e escurece no shader (0,4 s para entrar, 0,3 s para sair).
  const passar = (i: number, dentro: boolean) => {
    gsap.to(estado.current.hover, { [i]: dentro ? 1 : 0, duration: tempo(dentro ? 'tempo-hover' : 'tempo-curto'), ease: HOVER });
  };

  return (
    <section data-fundo="escuro" className={`secao-capitulos trecho-escuro modo-${modo}${comWebgl ? ' com-webgl' : ''}`} id="capitulos">
      <div className="capitulos-palco">
        <h2 className="rotulo-capitulos">{t(trabalhos.rotulo, idioma)}</h2>
        <div className="cartoes">
          {lista.map((tr, i) => (
            <CartaoTrabalho key={tr.slug} trabalho={tr} idioma={idioma} indice={i} aoPassar={passar} />
          ))}
        </div>
      </div>
      {modo === 'galeria' && <BarraProgresso />}
      {comWebgl && (
        <UseCanvas>
          <CenaCartoes capas={capas} indices={indices} estado={estado} />
        </UseCanvas>
      )}
    </section>
  );
}
