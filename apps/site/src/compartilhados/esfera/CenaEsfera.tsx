'use client';

import { ScrollScene, type ScrollSceneChildProps } from '@14islands/r3f-scroll-rig';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import * as THREE from 'three';
import { gsap } from '@/gsap';
import type { ModoDeExibicao } from '@/movimento/modo';
import { CURVAS, TEMPOS } from '@/movimento/tokens';
import { desenharAtlas } from './atlas';
import { tamanhoDaLetra, type AtributosDaEsfera } from './geometria';
import { criarMaterialDaEsfera } from './shader';

// A esfera gira 0.18 rad/s (spec), multiplicado por (1 - uMorf) no shader.
const GIRO_POR_SEGUNDO = 0.18;

// A morfose alterna a cada 7 s (spec, seção Contato). Ainda sem token próprio em src/movimento/tokens.ts;
// a transição usa os tokens tempo-planos e curva-suave.
const INTERVALO_MORFOSE = 7;

// A div é o palco da esfera (a seção inteira, no protótipo 07): raio de 230 px numa tela de 900 px de altura,
// e no máximo o que deixa o F (2.3 raios de largura) e o empurrão do cursor caberem na largura.
const raioNaCaixa = (largura: number, altura: number) => Math.min(largura / 2.8, (altura * 230) / 900);

// Quanto o cursor guardado anda até o real, por quadro a 60 qps (o atraso do protótipo).
const SEGUIR_CURSOR = 0.15;
const LONGE = 1e5;

type Props = { track: MutableRefObject<HTMLElement>; atributos: AtributosDaEsfera; modo: ModoDeExibicao };

export function CenaEsfera({ track, atributos, modo }: Props) {
  return (
    <ScrollScene track={track} hideOffscreen>
      {(p: ScrollSceneChildProps) => <Pontos {...p} atributos={atributos} modo={modo} />}
    </ScrollScene>
  );
}

function Pontos({ track, scale, inViewport, atributos, modo }: ScrollSceneChildProps & Omit<Props, 'track'>) {
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

  // Tamanho e raio acompanham a div; o dpr vem do renderizador.
  useEffect(() => {
    const raio = raioNaCaixa(scale[0], scale[1]);
    material.uniforms.uRaio.value = raio;
    material.uniforms.uTamanho.value = tamanhoDaLetra(n, raio);
    material.uniforms.uDpr.value = gl.getPixelRatio();
  }, [scale, n, gl, material]);

  // Morfose automática só no desktop: esfera e alvo se alternam a cada INTERVALO_MORFOSE.
  const morfose = useRef<gsap.core.Timeline | null>(null);
  useEffect(() => {
    if (modo !== 'desktop') return;
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
      s.morf = 0;
    };
  }, [modo]);
  useEffect(() => void morfose.current?.paused(!inViewport), [modo, inViewport]);

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
    if (!inViewport || parado) return;
    const u = material.uniforms;
    const s = estado.current;
    u.uTempo.value += delta;
    u.uGiro.value += delta * GIRO_POR_SEGUNDO;
    u.uMorf.value = s.morf;
    const mouse = u.uMouse.value as THREE.Vector2;
    if (s.mouse.x === LONGE || mouse.x === LONGE) mouse.copy(s.mouse);
    else mouse.lerp(s.mouse, 1 - Math.pow(1 - SEGUIR_CURSOR, delta * 60));
  });

  return <points ref={pontos} geometry={geometria} material={material} frustumCulled={false} />;
}
