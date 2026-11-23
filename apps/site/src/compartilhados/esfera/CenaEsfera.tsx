'use client';

import { ScrollScene, type ScrollSceneChildProps } from '@14islands/r3f-scroll-rig';
import { StickyScrollScene } from '@14islands/r3f-scroll-rig/powerups';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import * as THREE from 'three';
import { gsap } from '@/gsap';
import type { ModoDeExibicao } from '@/movimento/modo';
import { CURVAS, TEMPOS } from '@/movimento/tokens';
import { desenharAtlas } from './atlas';
import { caixaDaEsfera, raioNaCaixa, tamanhoDaLetra, type AtributosDaEsfera } from './geometria';
import { criarMaterialDaEsfera } from './shader';

// A esfera gira 0.18 rad/s (spec), multiplicado por (1 - uMorf) no shader.
const GIRO_POR_SEGUNDO = 0.18;

// A morfose alterna a cada 7 s (spec, seção Contato). Ainda sem token próprio em src/movimento/tokens.ts;
// a transição usa os tokens tempo-planos e curva-suave.
const INTERVALO_MORFOSE = 7;

// Quanto o cursor guardado anda até o real, por quadro a 60 qps (o atraso do protótipo).
const SEGUIR_CURSOR = 0.15;
const suave = gsap.parseEase(CURVAS['curva-suave']);
type Caixa = ReturnType<typeof caixaDaEsfera>;
const LONGE = 1e5;

// lugar: outro elemento onde o globo deve ser desenhado (o canto do chat); sem ele, a própria div.
type Props = { track: MutableRefObject<HTMLElement>; atributos: AtributosDaEsfera; modo: ModoDeExibicao; formarAlvo?: boolean; respondendo?: boolean; lugar?: HTMLElement | null };

// fixa: a div.esfera é position: sticky dentro de uma seção mais alta (o contato preso). O ScrollScene posiciona a
// cena pela posição da div no documento e a faria rolar com a página; o StickyScrollScene acompanha a parte presa.
// O cursor continua medido pela própria div (o StickyScrollScene passa adiante a seção, não a div).
export function CenaEsfera({ track, atributos, modo, fixa = false, formarAlvo, respondendo = false, lugar = null }: Props & { fixa?: boolean }) {
  const estilo = fixa && track.current ? getComputedStyle(track.current) : null;
  // O powerup exige sticky e converte top com parseFloat: auto/NaN faria a cena desaparecer.
  // Sem esse contrato no CSS, a esfera continua acompanhando a própria div com ScrollScene.
  if (estilo?.position === 'sticky' && /^-?(?:\d+\.?\d*|\.\d+)px$/.test(estilo.top) && Number.isFinite(parseFloat(estilo.top))) {
    return (
      <StickyScrollScene track={track} hideOffscreen>
        {(p: ScrollSceneChildProps) => <Pontos {...p} track={track} atributos={atributos} modo={modo} formarAlvo={formarAlvo} respondendo={respondendo} lugar={lugar} />}
      </StickyScrollScene>
    );
  }
  return (
    <ScrollScene track={track} hideOffscreen>
      {(p: ScrollSceneChildProps) => <Pontos {...p} atributos={atributos} modo={modo} formarAlvo={formarAlvo} respondendo={respondendo} lugar={lugar} />}
    </ScrollScene>
  );
}

function Pontos({ track, scale, inViewport, atributos, modo, formarAlvo, respondendo, lugar }: ScrollSceneChildProps & Omit<Props, 'track'>) {
  const { gl, camera, scene } = useThree();
  const pontos = useRef<THREE.Points>(null);
  const [atlas, setAtlas] = useState<THREE.Texture | null>(null);
  const [compilado, setCompilado] = useState(false);
  const material = useMemo(() => criarMaterialDaEsfera(), []);
  const estado = useRef({ morf: 0, mouse: new THREE.Vector2(LONGE, LONGE) });
  const parado = modo === 'reduzido';
  const n = atributos.aLetra.length;

  const geometria = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const esfera = new THREE.BufferAttribute(atributos.aEsfera, 3);
    g.setAttribute('position', esfera);
    g.setAttribute('aEsfera', esfera);
    g.setAttribute('aAlvo', new THREE.BufferAttribute(atributos.aAlvo, 3));
    g.setAttribute('aLetra', new THREE.BufferAttribute(atributos.aLetra, 1));
    g.setAttribute('aAzul', new THREE.BufferAttribute(atributos.aAzul, 2));
    // Nada aparece antes do atlas e do shader prontos.
    g.setDrawRange(0, 0);
    return g;
  }, [atributos]);

  useEffect(() => () => geometria.dispose(), [geometria]);
  useEffect(() => () => material.dispose(), [material]);

  // O atlas só é desenhado com a fonte carregada.
  useEffect(() => {
    let vivo = true;
    let textura: THREE.CanvasTexture | null = null;
    desenharAtlas().then((tela) => {
      if (!vivo) return;
      textura = new THREE.CanvasTexture(tela);
      textura.generateMipmaps = false;
      textura.minFilter = THREE.LinearFilter;
      material.uniforms.uAtlas.value = textura;
      setAtlas(textura);
    });
    return () => {
      vivo = false;
      textura?.dispose();
    };
  }, [material]);

  // Compila o shader na montagem, antes de a esfera entrar na tela (sem engasgo quando o contato aparece).
  useEffect(() => {
    const p = pontos.current;
    if (!p) return;
    let vivo = true;
    gl.compileAsync(p, camera, scene)
      .catch(() => undefined)
      .then(() => vivo && setCompilado(true));
    return () => {
      vivo = false;
    };
  }, [gl, camera, scene]);

  useEffect(() => {
    if (atlas && compilado) geometria.setDrawRange(0, Infinity);
  }, [atlas, compilado, geometria]);

  // Tamanho e raio acompanham a div (ou o lugar, no useFrame); o dpr vem do renderizador.
  useEffect(() => {
    const raio = raioNaCaixa(scale[0], scale[1]);
    material.uniforms.uRaio.value = raio;
    material.uniforms.uTamanho.value = tamanhoDaLetra(n, raio);
    material.uniforms.uDpr.value = gl.getPixelRatio();
  }, [scale, n, gl, material]);

  // Troca de lugar (issue #29): de onde estava até o lugar novo em tempo-cabecalho, com a curva-suave. O destino é medido a
  // cada quadro, então acompanha o layout; o giro e o cursor seguem durante a viagem.
  const viagem = useRef<{ de: Caixa | null; agora: Caixa | null; p: number }>({ de: null, agora: null, p: 1 });
  useEffect(() => {
    const v = viagem.current;
    v.de = v.agora;
    v.p = 0;
  }, [lugar]);
  const [deslocamento, cursor] = useMemo(() => [new THREE.Vector2(), new THREE.Vector2()], []);

  // Morfose automática no desktop e no celular (não no reduzido): esfera e alvo se alternam a cada INTERVALO_MORFOSE.
  const morfose = useRef<gsap.core.Timeline | null>(null);
  useEffect(() => {
    if (modo === 'reduzido' || formarAlvo !== undefined) return;
    const s = estado.current;
    const dur = TEMPOS['tempo-planos'];
    const tl = gsap
      .timeline({ repeat: -1, paused: true })
      .to(s, { morf: 1, duration: dur, ease: CURVAS['curva-suave'] }, INTERVALO_MORFOSE - dur)
      .to(s, { morf: 0, duration: dur, ease: CURVAS['curva-suave'] }, 2 * INTERVALO_MORFOSE - dur);
    morfose.current = tl;
    return () => {
      tl.kill();
      morfose.current = null;
      // Sem zerar o morf: quando o chat passa a controlar o F, ele volta à esfera pelo useFrame, sem pular.
    };
  }, [modo, formarAlvo]);
  useEffect(() => void morfose.current?.paused(!inViewport), [modo, inViewport, formarAlvo]);

  // O cursor (ou o toque, no celular) empurra as letras; com movimento reduzido, nada se mexe.
  useEffect(() => {
    if (parado) return;
    const alvo = estado.current.mouse;
    const mover = (e: PointerEvent) => {
      const r = track.current?.getBoundingClientRect();
      if (!r) return;
      alvo.set(e.clientX - (r.left + r.width / 2), -(e.clientY - (r.top + r.height / 2)));
    };
    const soltar = (e: PointerEvent) => {
      if (e.type === 'pointerleave' || e.pointerType !== 'mouse') alvo.set(LONGE, LONGE);
    };
    window.addEventListener('pointermove', mover, { passive: true });
    window.addEventListener('pointerdown', mover, { passive: true });
    window.addEventListener('pointerup', soltar, { passive: true });
    window.addEventListener('pointercancel', soltar, { passive: true });
    document.documentElement.addEventListener('pointerleave', soltar);
    return () => {
      window.removeEventListener('pointermove', mover);
      window.removeEventListener('pointerdown', mover);
      window.removeEventListener('pointerup', soltar);
      window.removeEventListener('pointercancel', soltar);
      document.documentElement.removeEventListener('pointerleave', soltar);
    };
  }, [parado, track]);

  // Fora da tela, nenhum uniforme é atualizado (a cena some com hideOffscreen).
  useFrame((_, delta) => {
    if (!inViewport) return;
    const u = material.uniforms;
    const s = estado.current;
    // Sem prop, a Início mantém a alternância; na página só a confirmação permite o F.
    if (formarAlvo !== undefined) {
      const alvo = formarAlvo ? 1 : 0;
      const passo = delta / TEMPOS['tempo-planos'];
      s.morf = parado ? alvo : alvo > s.morf ? Math.min(alvo, s.morf + passo) : Math.max(alvo, s.morf - passo);
      u.uMorf.value = s.morf;
    }
    const v = viagem.current;
    const div = (lugar || v.p < 1) && track.current?.getBoundingClientRect();
    if (div) {
      const alvo = caixaDaEsfera(div, lugar?.getBoundingClientRect() ?? null);
      const de = v.de ?? caixaDaEsfera(div, null);
      v.p = parado ? 1 : Math.min(1, v.p + delta / TEMPOS['tempo-cabecalho']);
      const e = suave(v.p);
      const c = { dx: de.dx + (alvo.dx - de.dx) * e, dy: de.dy + (alvo.dy - de.dy) * e, raio: de.raio + (alvo.raio - de.raio) * e };
      v.agora = lugar || v.p < 1 ? c : null;
      u.uRaio.value = c.raio;
      u.uTamanho.value = tamanhoDaLetra(n, c.raio);
      pontos.current?.position?.set(c.dx, c.dy, 0);
      deslocamento.set(c.dx, c.dy);
    }
    if (parado) return;
    u.uTempo.value += delta;
    u.uGiro.value += delta * GIRO_POR_SEGUNDO * (respondendo ? 4 : 1);
    u.uMorf.value = s.morf;
    // O cursor é medido em volta da div; com o globo noutro lugar, em volta do lugar.
    const mouse = u.uMouse.value as THREE.Vector2;
    cursor.copy(s.mouse);
    if (s.mouse.x !== LONGE) cursor.sub(deslocamento);
    if (s.mouse.x === LONGE || mouse.x === LONGE) mouse.copy(cursor);
    else mouse.lerp(cursor, 1 - Math.pow(1 - SEGUIR_CURSOR, delta * 60));
  });

  return <points ref={pontos} geometry={geometria} material={material} frustumCulled={false} />;
}
