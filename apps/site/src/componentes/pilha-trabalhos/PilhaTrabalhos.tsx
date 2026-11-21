'use client';

import { UseCanvas, useScrollRig } from '@14islands/r3f-scroll-rig';
import { useEffect, useRef, useState } from 'react';
import { t } from '@/conteudo/textos';
import { linhaDoCartao, trabalhos, trabalhosVisiveis } from '@/conteudo/trabalhos';
import { ScrollTrigger, gsap, recalcularGatilhos } from '@/gsap';
import { useEfeitoDeLayout } from '@/lib/useEfeitoDeLayout';
import { useIdioma } from '@/lib/useIdioma';
import { CURVAS, INTERVALOS, tempo } from '@/movimento/tokens';
import { CenaPilha, type EstadoPilha } from './CenaPilha';
import { contador } from './pose';
import './estilo.css';

const PASSO_MOLDURA = 30; // a moldura anda 30 px por trabalho, como as miniaturas

// Página Trabalhos no desktop com WebGL (spec 4.4, protótipo 10): uma tela escura presa por (n − 1) telas, com um plano
// por trabalho; cada tela de rolagem troca o trabalho em destaque e gira a pilha meia volta. No centro, "Ver trabalho"
// e o nome (o link que abre o site do conceito numa aba nova); à esquerda, as informações digitadas; à direita, o
// contador; no pé, as miniaturas com a moldura. Celular, movimento reduzido e sem WebGL ficam com a lista.
export function PilhaTrabalhos() {
  const idioma = useIdioma();
  const { isCanvasAvailable } = useScrollRig();
  const lista = trabalhosVisiveis();
  const n = lista.length;
  const [ativo, setAtivo] = useState(0);
  const secao = useRef<HTMLElement>(null);
  const gatilho = useRef<ScrollTrigger | null>(null);
  const contexto = useRef<gsap.Context | null>(null);
  const estado = useRef<EstadoPilha>({ atual: 0, entrada: 0, empurrao: 0, hover: 0 });
  const sobreMiniatura = useRef(false);
  const primeiraInfo = useRef(true);

  const linha = (i: number) => {
    const tr = lista[i];
    const [data, oferta] = linhaDoCartao(tr, idioma);
    return [t(tr.setor, idioma), data, oferta];
  };

  useEfeitoDeLayout(() => {
    const el = secao.current!;
    const moldura = el.querySelector<HTMLElement>('.pilha-moldura')!;
    let parar: ReturnType<typeof setTimeout> | undefined;
    const ctx = gsap.context(() => {
      gatilho.current = ScrollTrigger.create({
        trigger: el,
        start: 'top top',
        end: () => `+=${(n - 1) * window.innerHeight}`,
        pin: true,
        // Assenta no trabalho mais próximo quando a rolagem quase para.
        snap: { snapTo: 1 / (n - 1), delay: INTERVALOS['intervalo-curto'], duration: { min: tempo('tempo-rapido'), max: tempo('tempo-cabecalho') }, ease: CURVAS['curva-suave'] },
        onUpdate: ({ progress }) => {
          const atual = progress * (n - 1);
          estado.current.atual = atual;
          setAtivo(Math.round(atual));
          if (!sobreMiniatura.current) gsap.set(moldura, { x: atual * PASSO_MOLDURA });
          // "Ver trabalho" só aparece com a rolagem parada e some na hora ao rolar (CSS .rolando).
          el.classList.add('rolando');
          clearTimeout(parar);
          parar = setTimeout(() => el.classList.remove('rolando'), 150);
        },
      });
      // Entrada: os planos descem girando em 2 s e chegam curvados (0,8 s); depois nome, informações, contador e miniaturas.
      gsap
        .timeline()
        .to(estado.current, { entrada: 1, duration: tempo('tempo-planos'), ease: CURVAS['curva-padrao'] }, 0.5)
        .fromTo(estado.current, { empurrao: 10 }, { empurrao: 0, duration: tempo('tempo-curvar'), ease: CURVAS['curva-linear'] }, 1.7)
        .from('.pilha-alvos', { opacity: 0, duration: tempo('tempo-curto') }, 2)
        .from('.pilha-info, .pilha-contador', { opacity: 0, duration: tempo('tempo-curto') }, 2.2)
        .from('.pilha-miniaturas', { y: 100, duration: tempo('tempo-hover'), ease: CURVAS['curva-saida'] }, 2.2);
      recalcularGatilhos();
    }, el);
    contexto.current = ctx;
    return () => {
      clearTimeout(parar);
      ctx.revert();
      contexto.current = null;
      gatilho.current = null;
    };
  }, [n]);

  // As informações se digitam a cada troca de trabalho (0,6 s, 0,1 s depois); na entrada, junto com o contador.
  useEffect(() => {
    const spans = secao.current?.querySelectorAll<HTMLElement>('.pilha-info span');
    if (!spans) return;
    const valores = linha(ativo);
    const atraso = primeiraInfo.current ? 2.2 : INTERVALOS['intervalo-curto'];
    primeiraInfo.current = false;
    const tweens = [...spans].map((s, k) => gsap.fromTo(s, { text: '' }, { text: valores[k], duration: tempo('tempo-digitar-curto'), delay: atraso, ease: CURVAS['curva-linear'] }));
    return () => tweens.forEach((tw) => tw.kill());
    // eslint-disable-next-line react-hooks/exhaustive-deps -- linha() muda só com o ativo e o idioma
  }, [ativo, idioma]);

  // Leva a rolagem até o trabalho i (teclado e clique na miniatura).
  const irPara = (i: number) => {
    const st = gatilho.current;
    if (st) window.scrollTo(0, st.start + i * window.innerHeight);
  };
  // Os tweens dos eventos entram no contexto da seção, que os desfaz ao desmontar. 'auto' só corta o tween da mesma
  // propriedade: com `true`, o hover cortava também a entrada e a curva, que animam o mesmo objeto (revisão do PR #16).
  const animar = (alvo: gsap.TweenTarget, vars: gsap.TweenVars) =>
    contexto.current?.add(() => gsap.to(alvo, { ease: CURVAS['curva-padrao'], overwrite: 'auto', ...vars }));
  const moverMoldura = (x: number) => animar(secao.current?.querySelector('.pilha-moldura') ?? [], { x, duration: tempo('tempo-curto') });
  const passar = (dentro: boolean) => animar(estado.current, { hover: dentro ? 1 : 0, duration: tempo('tempo-hover') });

  return (
    <section ref={secao} className="pilha-trabalhos" data-fundo="escuro">
      <div className="pilha-alvos">
        {lista.map((tr, i) => {
          const nome = t(tr.nome, idioma);
          return (
            <a
              key={tr.slug}
              className={`pilha-alvo${i === ativo ? ' ativo' : ''}`}
              href={tr.site}
              target="_blank"
              rel="noopener"
              aria-label={`${t(trabalhos.ver, idioma)}: ${nome}, ${linha(i).join(' / ')} ${idioma === 'en' ? '(opens the site in a new tab)' : '(abre o site em nova aba)'}`}
              onFocus={() => irPara(i)}
              onMouseEnter={() => passar(true)}
              onMouseLeave={() => passar(false)}
            >
              <span className="pilha-rotulo">{t(trabalhos.ver, idioma)}</span>
              <span className="pilha-nome">{nome}</span>
            </a>
          );
        })}
      </div>
      <p className="pilha-info" aria-hidden="true">
        <span />
        <span />
        <span />
      </p>
      <p className="pilha-contador" aria-hidden="true">
        {contador(ativo, n)}
      </p>
      <div
        className="pilha-miniaturas"
        aria-hidden="true"
        onMouseLeave={() => {
          sobreMiniatura.current = false;
          moverMoldura(estado.current.atual * PASSO_MOLDURA);
        }}
      >
        {lista.map((tr, i) => (
          // eslint-disable-next-line @next/next/no-img-element -- a miniatura também é a textura do plano WebGL
          <img
            key={tr.slug}
            src={tr.capa}
            alt=""
            width={30}
            height={44}
            className={i === ativo ? 'ativa' : undefined}
            onMouseEnter={() => {
              sobreMiniatura.current = true;
              moverMoldura(i * PASSO_MOLDURA);
            }}
            onClick={() => irPara(i)}
          />
        ))}
        <span className="pilha-moldura" />
      </div>
      {isCanvasAvailable && (
        <UseCanvas>
          <CenaPilha total={n} estado={estado} secao={secao} />
        </UseCanvas>
      )}
    </section>
  );
}
