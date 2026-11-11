'use client';

import { UseCanvas, useScrollRig } from '@14islands/r3f-scroll-rig';
import { useEffect, useMemo, useRef, useState } from 'react';
import { 'inicio-lencol' as textos } from '@/conteudo/inicio-lencol';
import { t } from '@/conteudo/textos';
import { PRIORIDADE, gsap, recalcularGatilhos } from '@/gsap';
import { ehCelular, prefereMenosMovimento } from '@/lib/ambiente';
import { useEfeitoDeLayout } from '@/lib/useEfeitoDeLayout';
import { useIdioma } from '@/lib/useIdioma';
import { temWebgl } from '@/lib/webgl';
import { modoDeExibicao, type ModoDeExibicao } from '@/movimento/modo';
import { CURVAS, INTERVALOS, tempo } from '@/movimento/tokens';
import { desenharFolha } from '@/texturas/folhaDecisoes';
import { CenaLencol, larguraDaFolha, type EstadoLencol } from './CenaLencol';
import './estilo.css';

const LINEAR = CURVAS['curva-linear'];

// Trechos da timeline do lençol, presa com scrub: são frações da rolagem, não tempos (referência 3.7).
const TRECHOS = {
  linhaEm: 0.5,
  fraseEm: 1.4,
  descidaEm: 1.5,
  descida: 6,
  presaPorAltura: 1.2, // a seção fica presa por 1,2 altura da folha
} as const;

// Medidas da referência: folha de 60vw; a linha vai até 60vw + 200 px e abre 20 px de cada lado.
const VAO_TITULO = 20;

// O lençol "(O que entregamos)" (spec 4.3, protótipo 06). Três jeitos, um por modo:
// - desktop e celular com WebGL (no celular a folha é mais larga, para ler em retrato): seção presa, linha que cresce, frases digitadas e a folha em WebGL que desce e ondula;
// - sem WebGL: lista em DOM sobre a folha branca; a linha cresce e as frases se digitam uma vez, ao entrar, sem prender;
// - movimento reduzido: tudo parado e à vista, com a linha cheia e as frases completas.
// Troca de língua no lugar: a seção remonta, porque a folha (canvas) e a digitação das frases guardam o texto da montagem.
export function Decisoes() {
  return <SecaoDecisoes key={useIdioma()} />;
}

function SecaoDecisoes() {
  const idioma = useIdioma();
  const { isCanvasAvailable } = useScrollRig();
  const [modo, setModo] = useState<ModoDeExibicao | null>(null);
  const [reduzido, setReduzido] = useState(false);
  const [folha, setFolha] = useState<HTMLCanvasElement | null>(null);
  const estado = useRef<EstadoLencol>({ descida: 0, visivel: false });
  const itens = useMemo(() => textos.itens.map((item) => t(item, idioma)), [idioma]);

  useEffect(() => {
    const menosMovimento = prefereMenosMovimento();
    const atual = modoDeExibicao(window.innerWidth, menosMovimento, temWebgl());
    setModo(atual);
    setReduzido(menosMovimento);
    if (atual === 'desktop' || atual === 'celular') document.fonts.ready.then(() => setFolha(desenharFolha(itens, larguraDaFolha(window.innerWidth) * Math.min(window.devicePixelRatio, 2))));
  }, [itens]);

  const comLencol = (modo === 'desktop' || modo === 'celular') && isCanvasAvailable && folha !== null;
  // Sem WebGL tem prioridade sobre o movimento reduzido no modo da página; aqui, o reduzido sempre para tudo.
  const leve = (modo === 'sem-webgl' || (modo === 'celular' && !isCanvasAvailable)) && !reduzido;

  // Com WebGL (desktop e celular): a seção fica presa enquanto a folha desce por trás da linha.
  useEfeitoDeLayout(() => {
    if (!comLencol || !folha) return;
    const secao = document.querySelector<HTMLElement>('.secao-decisoes')!;
    const altura = (larguraDaFolha(window.innerWidth) * folha.height) / folha.width;
    secao.style.setProperty('--altura-folha', `${altura}px`);
    // O celular segue o desktop: um só gatilho, que prende e anda a timeline; só a linha é mais curta, para caber em retrato.
    const cel = ehCelular(window.innerWidth);
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: LINEAR },
        scrollTrigger: {
          trigger: secao,
          start: 'top top',
          end: `+=${TRECHOS.presaPorAltura * altura}`,
          scrub: tempo('tempo-scrub'),
          pin: true,
          refreshPriority: PRIORIDADE.decisoes,
          onUpdate: ({ progress }) => (estado.current.visivel = progress > 0),
          onLeaveBack: () => (estado.current.visivel = false),
          // Remontada pela troca de língua no meio da seção, a folha aparece sem esperar a próxima rolagem.
          onRefresh: ({ progress }) => (estado.current.visivel = progress > 0),
        },
      });
      tl.to('.titulo-decisoes .linha', { width: cel ? '22vw' : 'calc(60vw + 200px)', duration: tempo('tempo-linha') }, TRECHOS.linhaEm)
        .to('.titulo-decisoes', { gap: VAO_TITULO, duration: tempo('tempo-rapido') }, TRECHOS.linhaEm)
        .from('.frase', { text: '', duration: tempo('tempo-digitar-frase'), stagger: INTERVALOS['intervalo-meio'] }, TRECHOS.fraseEm)
        .to(estado.current, { descida: 1, duration: TRECHOS.descida }, TRECHOS.descidaEm);
      recalcularGatilhos();
    }, secao);
    return () => ctx.revert();
  }, [comLencol, folha]);

  // Sem WebGL (ou celular sem canvas): a linha cresce e as frases se digitam uma vez, quando a seção entra, sem prender.
  useEfeitoDeLayout(() => {
    if (!leve) return;
    const secao = document.querySelector<HTMLElement>('.secao-decisoes')!;
    const ctx = gsap.context(() => {
      gsap
        .timeline({ scrollTrigger: { trigger: secao, start: 'top 80%', once: true, refreshPriority: PRIORIDADE.decisoes } })
        .from('.titulo-decisoes .linha', { width: 0, duration: tempo('tempo-linha'), ease: CURVAS['curva-linha'] }, 0)
        .from('.frase', { text: '', duration: tempo('tempo-digitar-frase'), stagger: INTERVALOS['intervalo-meio'], ease: LINEAR }, 0);
      recalcularGatilhos();
    }, secao);
    return () => ctx.revert();
  }, [leve]);

  return (
    <section data-fundo="escuro" className={`secao-decisoes trecho-escuro${comLencol ? ' com-lencol' : ''}`} id="decisoes">
      <div className="frases">
        {textos.frases.map((f) => (
          <p key={f.pt} className="frase">
            {t(f, idioma)}
          </p>
        ))}
      </div>
      <h2 className="titulo-decisoes">
        <span className="titulo-parte">{t(textos.titulo[0], idioma)}</span>
        <span className="linha" aria-hidden="true" />
        <span className="titulo-parte">{t(textos.titulo[1], idioma)}</span>
      </h2>
      <div className="mascara-decisoes" aria-hidden="true" />
      <ol className="lista-decisoes">
        {itens.map((item, i) => (
          <li key={item}>
            {item}
            <sup>({i + 1})</sup>
          </li>
        ))}
      </ol>
      {comLencol && folha && (
        <UseCanvas>
          <CenaLencol folha={folha} estado={estado} />
        </UseCanvas>
      )}
    </section>
  );
}
