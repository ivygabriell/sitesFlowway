'use client';

import { useScrollbar } from '@14islands/r3f-scroll-rig';
import { useEffect, useRef, useState, type KeyboardEvent, type MouseEvent } from 'react';
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
import { ehCliqueSimples } from '@/componentes/transicao/cliqueSimples';
import type { ContatoServidorDTO } from '@/lib/contato/servidor';
import { GloboDoChat, type StatusDoGlobo } from './ChatContato';
import { ConversaGuiada } from './ConversaGuiada';
import { ConversaIA } from './ConversaIA';
import { Rodape } from './Rodape';
import './estilo.css';

type Modo = 'desktop' | 'celular' | 'reduzido';

// O círculo escuro encolhe e devolve o claro; atrás dele, a esfera de letras FLOWAY que forma o F do símbolo.
// A esfera recebe alvoDoSimbolo, a fábrica do módulo (com cache): uma arrow aqui recriaria os 20 mil atributos
// a cada render (R1 da Arquitetura). O fundo da seção é o claro #F7F7F5, o mesmo que a esfera supõe.
// No desktop a tela e a esfera ficam presas por position: sticky (não pelo pin do GSAP, que a cena da esfera não acompanha).
// Issue #29: "Iniciar um projeto" abre o chat na própria cena (estado 02): a cena fica presa, frase e rodapé saem, o globo vai
// ao canto (lugar) e o chat entra de baixo. "Fechar" desfaz, sem desmontar a conversa da sessão.
export function Contato({ servidor }: { servidor?: ContatoServidorDTO } = {}) {
  const idioma = useIdioma();
  const c = contato.chat;
  const [modo, setModo] = useState<Modo | null>(null);
  const [aberto, setAberto] = useState(false);
  const [montado, setMontado] = useState(false);
  const [status, setStatus] = useState<StatusDoGlobo>('online');
  const [canto, setCanto] = useState<HTMLDivElement | null>(null);
  const [grande, setGrande] = useState<HTMLDivElement | null>(null);
  const secaoRef = useRef<HTMLElement>(null);
  const { __lenis: lenis } = useScrollbar();
  const Conversa = servidor?.conversaDisponivel ? ConversaIA : ConversaGuiada;

  function iniciar(e: MouseEvent<HTMLAnchorElement>) {
    if (!ehCliqueSimples(e)) return;
    e.preventDefault();
    setMontado(true);
    setAberto(true);
  }
  function fechar() {
    setAberto(false);
  }
  const teclar = (e: KeyboardEvent) => { if (e.key === 'Escape') fechar(); };

  // Aberto: a cena fica presa no fim da seção (sem rolar a página) e o foco vai ao campo; fechado, volta ao CTA.
  const abriu = useRef(false);
  useEffect(() => {
    const html = document.documentElement;
    const secao = secaoRef.current!;
    if (!aberto) {
      if (abriu.current) secao.querySelector<HTMLElement>('.rodape-cta')?.focus();
      return;
    }
    abriu.current = true;
    const fim = Math.min(secao.offsetTop + secao.offsetHeight - innerHeight, html.scrollHeight - innerHeight);
    if (Math.abs(scrollY - fim) > 1) {
      if (lenis) lenis.scrollTo(fim, { force: true, immediate: prefereMenosMovimento(), duration: TEMPOS['tempo-cabecalho'] });
      else window.scrollTo(0, fim);
    }
    lenis?.stop();
    html.classList.add('contato-aberto');
    secao.querySelector<HTMLTextAreaElement>('.contato-chat textarea')?.focus({ preventScroll: true });
    return () => {
      html.classList.remove('contato-aberto');
      lenis?.start();
    };
  }, [aberto, lenis]);
  // No celular, o globo grande fica no vazio (M02) até a conversa começar; depois, vira o ícone da barra.
  const lugar = !aberto ? null : grande?.getClientRects().length ? grande : canto;

  useEffect(() => {
    // O celular usa o mesmo caminho do desktop (sticky + scrub); a classe modo-celular só ajusta o CSS.
    setModo(prefereMenosMovimento() ? 'reduzido' : ehCelular(window.innerWidth) ? 'celular' : 'desktop');
  }, []);

  useEfeitoDeLayout(() => {
    if (!modo) return;
    const secao = document.querySelector<HTMLElement>('.secao-contato')!;
    const rodape = secao.querySelector<HTMLElement>('.rodape')!;
    // Celular: a esfera fica só na área livre abaixo da frase (a altura da frase muda com a língua).
    if (modo === 'celular') {
      const frase = secao.querySelector<HTMLElement>('.frase-contato')!;
      secao.style.setProperty('--topo', `${frase.offsetTop + frase.offsetHeight + 12}px`);
    }
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
    <section ref={secaoRef} data-fundo="claro" className={`secao-contato modo-${modo ?? 'desktop'}${aberto ? ' com-chat' : ''}`} id="contato">
      <div className="contato-tela">
        <p className="frase-contato">{t(contato.frase, idioma)}</p>
        <div className="circulo-escuro" aria-hidden="true" />
        <Rodape aoIniciar={iniciar} />
        {montado && (
          <div className="contato-chat" hidden={!aberto} onKeyDown={teclar}>
            <div className="chat-topo">
              <p className="chat-iniciar">{t(c.iniciar, idioma)}</p>
              <button type="button" className="chat-fechar" onClick={fechar}><span className="chat-fechar-texto">{t(c.fechar, idioma)}</span><span aria-hidden="true">✕</span></button>
            </div>
            <Conversa servidor={servidor} aoStatus={setStatus} lugarDoGlobo={setGrande} />
            <GloboDoChat status={status}><div className="contato-globo-lugar" ref={setCanto} /></GloboDoChat>
          </div>
        )}
      </div>
      {/* Aberto, o globo segue o estado do chat (o F só no sucesso real); fechado, volta à alternância da Início. */}
      <EsferaDeLetras alvo={alvoDoSimbolo} fixa lugar={lugar} respondendo={aberto && status === 'pensando'} formarAlvo={aberto ? status === 'enviado' : undefined} />
    </section>
  );
}
