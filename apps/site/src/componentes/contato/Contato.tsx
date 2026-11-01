'use client';

import { useEffect, useState } from 'react';
import { EsferaDeLetras } from '@/compartilhados/esfera/EsferaDeLetras';
import { contato } from '@/conteudo/contato';
import { t } from '@/conteudo/textos';
import { cena } from '@/estado/cena';
import { PRIORIDADE, gsap, recalcularGatilhos } from '@/gsap';
import { ehCelular, prefereMenosMovimento } from '@/lib/ambiente';
import { useEfeitoDeLayout } from '@/lib/useEfeitoDeLayout';
import { useIdioma } from '@/lib/useIdioma';
import { alvoDoSimbolo } from '@/marca/amostrar';
import { CURVAS, TEMPOS } from '@/movimento/tokens';
import { Rodape } from './Rodape';
import './estilo.css';

type Modo = 'desktop' | 'celular' | 'reduzido';

// O círculo escuro encolhe e devolve o claro; atrás dele, a esfera de letras FLOWAY que forma o F do símbolo.
// A esfera recebe alvoDoSimbolo, a fábrica do módulo (com cache): uma arrow aqui recriaria os 20 mil atributos
// a cada render (R1 da Arquitetura). O fundo da seção é o claro #F7F7F5, o mesmo que a esfera supõe.
// No desktop a tela e a esfera ficam presas por position: sticky (não pelo pin do GSAP, que a cena da esfera não acompanha).
export function Contato() {
  const idioma = useIdioma();
  const [modo, setModo] = useState<Modo | null>(null);

  useEffect(() => {
    setModo(prefereMenosMovimento() ? 'reduzido' : ehCelular(window.innerWidth) ? 'celular' : 'desktop');
  }, []);

  useEfeitoDeLayout(() => {
    if (!modo) return;
    const secao = document.querySelector<HTMLElement>('.secao-contato')!;
    const rodape = secao.querySelector<HTMLElement>('.rodape')!;
    const ativar = (sim: boolean) => {
      cena.contatoAtivo = sim;
      rodape.classList.toggle('visivel', sim);
      secao.classList.toggle('ativo', sim);
    };

    if (modo === 'reduzido') {
      // Sem círculo e sem nada ligado à rolagem: o rodapé aparece quando a seção entra na tela.
      const io = new IntersectionObserver(([e]) => ativar(e.isIntersecting), { threshold: 0.3 });
      io.observe(secao);
      return () => {
        io.disconnect();
        cena.contatoAtivo = false;
      };
    }

    const ctx = gsap.context(() => {
      const circulo = secao.querySelector<HTMLElement>('.circulo-escuro')!;
      const encolher = { scale: 0, duration: TEMPOS['tempo-circulo'], ease: CURVAS['curva-circulo'] };
      if (modo === 'celular') {
        gsap
          .timeline({
            scrollTrigger: {
              trigger: secao,
              start: 'top top+=35%',
              refreshPriority: PRIORIDADE.contato,
              onEnter: () => ativar(true),
              onLeaveBack: () => ativar(false),
            },
          })
          .to(circulo, encolher);
        return;
      }
      // A tela fica presa por CSS (position: sticky) enquanto a seção, 1,8 altura da tela, passa: o círculo encolhe nesse trecho.
      gsap
        .timeline({
          scrollTrigger: {
            trigger: secao,
            start: 'top top',
            end: 'bottom bottom',
            scrub: 1,
            refreshPriority: PRIORIDADE.contato,
            onUpdate: ({ progress }) => {
              if (progress > 0.001 && !secao.classList.contains('ativo')) ativar(true);
              if (progress <= 0.001 && secao.classList.contains('ativo')) ativar(false);
            },
          },
        })
        .to(circulo, encolher);
      recalcularGatilhos();
    }, secao);
    return () => {
      ctx.revert();
      cena.contatoAtivo = false;
    };
  }, [modo]);

  return (
    <section data-fundo="claro" className={`secao-contato modo-${modo ?? 'desktop'}`} id="contato">
      <div className="contato-tela">
        <p className="frase-contato">{t(contato.frase, idioma)}</p>
        <div className="circulo-escuro" aria-hidden="true" />
        <Rodape />
      </div>
      <EsferaDeLetras alvo={alvoDoSimbolo} fixa />
    </section>
  );
}
