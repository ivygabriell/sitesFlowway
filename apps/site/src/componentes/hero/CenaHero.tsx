'use client';

import { useScrollbar } from '@14islands/r3f-scroll-rig';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useAbertura } from '@/estado/abertura';
import { PRIORIDADE, gsap, recalcularGatilhos } from '@/gsap';
import { ehCelular, prefereMenosMovimento } from '@/lib/ambiente';
import { CURVAS, INTERVALOS, TEMPOS } from '@/movimento/tokens';
import { vertUv } from '@/shaders/comum';
import { glitchFrag } from '@/shaders/glitch';
import { refracaoFrag, refracaoVert } from '@/shaders/refracao';
import { desenharPalavra } from '@/texturas/palavra';
import { criarLaminas } from './laminas';

const CLARO = new THREE.Color('#F7F7F5');

// Unidade do hero, como na referência: a cena inteira escala com a largura da tela.
const unidade = () => (window.innerWidth < 1800 ? window.innerWidth / 2.5 : window.innerWidth / 2.8);

// Escalas de repouso (em unidades), medidas no protótipo 02-hero: a principal cobre ~85% da largura e a segunda
// e a terceira ficam abaixo dela, com vão entre as três. Na saída cada peça vai a SAIDA × a escala de repouso.
const ESCALA = { principal: 0.8, laje: 0.75, pequena: 0.8, principalCelular: 1.6 };
const SAIDA = { principal: 0.9, laje: 1.2, pequena: 0.82 };

// Posições de repouso (em unidades), do protótipo 02-hero.
const POSICAO = {
  principal: { x: -0.02, y: 0.3 },
  principalCelular: { y: 0.45 },
  laje: { x: -0.45, y: -0.12 },
  pequena: { x: 0.62, y: -0.5 },
};

// Atalhos para os tokens de movimento usados aqui.
const T = TEMPOS;
const C = CURVAS;

const escalaDeSaida = (e: number, duration: number) => ({ x: e, y: e, z: e, duration });

export function CenaHero() {
  const { gl, scene, camera, size } = useThree();
  const { terminou } = useAbertura();
  const { scroll, enabled: rolagemSuave } = useScrollbar();
  const [celular] = useState(() => ehCelular(window.innerWidth));
  const [reduzido] = useState(() => prefereMenosMovimento());
  const [logo, setLogo] = useState<{ textura: THREE.CanvasTexture; razao: number } | null>(null);

  const refLogo = useRef<THREE.Mesh>(null);
  const refPrincipal = useRef<THREE.Mesh>(null);
  const refLaje = useRef<THREE.Mesh>(null);
  const refPequena = useRef<THREE.Mesh>(null);
  const vidroDom = useRef<HTMLElement | null>(null);

  // Valores animados pelo GSAP e lidos a cada quadro.
  const estado = useRef({ progresso: reduzido ? 1 : 0, opacidade: 1, yPrincipal: 0, yLaje: 0, yPequena: 0, ativo: true });

  const formas = useMemo(() => criarLaminas(), []);
  const alvo = useMemo(() => new THREE.WebGLRenderTarget(1, 1), []);
  const materialVidro = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: refracaoVert,
        fragmentShader: refracaoFrag,
        transparent: true,
        uniforms: {
          uFundo: { value: alvo.texture },
          uResolucao: { value: new THREE.Vector2(1, 1) },
          uClaro: { value: CLARO },
          uTempo: { value: 0 },
          uBorrao: { value: new THREE.Vector2() },
          uOpacidade: { value: 1 },
          uForca: { value: 1 },
        },
      }),
    [alvo],
  );
  const materialLogo = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vertUv,
        fragmentShader: glitchFrag,
        transparent: true,
        uniforms: { uLogo: { value: null }, uProgresso: { value: estado.current.progresso } },
      }),
    [],
  );

  // A palavra vem do path da assinatura (não depende de fonte), desenhada na montagem.
  useEffect(() => {
    let vivo = true;
    Promise.resolve().then(() => {
      if (!vivo) return;
      const largura = window.innerWidth * (celular ? 0.9 : 0.86);
      const tela = desenharPalavra(largura * Math.min(window.devicePixelRatio, 2));
      const textura = new THREE.CanvasTexture(tela);
      textura.colorSpace = THREE.SRGBColorSpace;
      materialLogo.uniforms.uLogo.value = textura;
      setLogo({ textura, razao: tela.height / tela.width });
    });
    return () => {
      vivo = false;
    };
  }, [celular, materialLogo]);

  // Alvo da refração do tamanho da tela (em pixels do dispositivo).
  useEffect(() => {
    const v = gl.getDrawingBufferSize(new THREE.Vector2());
    alvo.setSize(v.x, v.y);
    materialVidro.uniforms.uResolucao.value.copy(v);
    const u = unidade();
    refPrincipal.current?.scale.setScalar((celular ? ESCALA.principalCelular : ESCALA.principal) * u);
    refLaje.current?.scale.setScalar(ESCALA.laje * u);
    refPequena.current?.scale.setScalar(ESCALA.pequena * u);
  }, [gl, size, alvo, materialVidro, celular]);

  // Entrada (quando a abertura termina) e saída ligada à rolagem.
  useEffect(() => {
    if (!terminou || reduzido) return;
    const u = unidade();
    const s = estado.current;
    const principal = refPrincipal.current!;
    const pequena = refPequena.current!;
    vidroDom.current = document.querySelector('.secao-hero .vidro-dom');
    const palavras = document.querySelectorAll('.secao-hero .palavra-intro');

    const entrada = gsap.timeline();
    entrada.set('.secao-hero .intro', { opacity: 1 }, 0);
    if (celular) {
      s.yPrincipal = -3 * u;
      entrada
        .to(s, { progresso: 1, duration: T['tempo-glitch'], ease: C['curva-suave'] }, 1)
        .to('.secao-hero .faixas', { opacity: 1, duration: T['tempo-hover'] }, 1)
        .to(s, { yPrincipal: 0, duration: 1.2, ease: C['curva-suave'] }, 0)
        .from(principal.rotation, { y: 0.1 * Math.PI, duration: 1, ease: C['curva-giro'] }, 0.4)
        .to('.secao-hero .role-para-baixo', { opacity: 1, duration: T['tempo-curto'] }, 1.2);
      palavras.forEach((p) => entrada.from(p, { opacity: 0, duration: T['tempo-piscar'], repeat: 4 }, 1.1 + 0.5 * Math.random()));
    } else {
      s.yPrincipal = -2 * u;
      s.yLaje = -2 * u;
      s.yPequena = -2 * u;
      entrada
        .to(s, { progresso: 1, duration: T['tempo-glitch'], ease: C['curva-suave'] }, INTERVALOS['intervalo-glitch'])
        .to('.secao-hero .faixas', { opacity: 1, duration: T['tempo-esmaecer'] }, INTERVALOS['intervalo-intro'])
        .to(s, { yPrincipal: 0, duration: T['tempo-vidro-principal'], ease: C['curva-suave'] }, 0)
        .to(s, { yLaje: 0, duration: T['tempo-vidro'] }, 0)
        .to(s, { yPequena: 0, duration: T['tempo-vidro'] }, INTERVALOS['intervalo-meio'])
        .from(principal.rotation, { y: 0.15 * Math.PI, duration: T['tempo-planos'], ease: C['curva-giro'] }, 0.4)
        .from(pequena.rotation, { z: -Math.PI / 4, x: pequena.rotation.x + Math.PI / 9, duration: 1.2, ease: C['curva-suave'] }, 0.8)
        .set('.secao-hero .vidro-dom', { opacity: 1 }, INTERVALOS['intervalo-meio'])
        .from('.secao-hero .vidro-dom-recorte', { rotateZ: 45, rotateY: 45, scale: 1.2, duration: 1.2, ease: C['curva-suave'] }, 0.8)
        .to('.secao-hero .role-para-baixo', { opacity: 1, duration: T['tempo-esmaecer'] }, 1);
      palavras.forEach((p) => entrada.from(p, { opacity: 0, duration: T['tempo-piscar'], repeat: 5 }, INTERVALOS['intervalo-intro'] + Math.random()));
    }

    let saida: gsap.core.Timeline | undefined;
    const mostrar = (sim: boolean) => {
      s.ativo = sim;
      [refPrincipal, refLaje, refPequena].forEach((r) => r.current && (r.current.visible = sim && (!celular || r === refPrincipal)));
    };
    const atraso = setTimeout(() => {
      saida = gsap.timeline({
        scrollTrigger: {
          trigger: '.secao-hero',
          start: 'top+=10',
          end: `+=${(celular ? 0.7 : 2) * window.innerHeight}`,
          scrub: T['tempo-scrub'],
          refreshPriority: PRIORIDADE.hero,
          onLeave: () => mostrar(false),
          onEnterBack: () => mostrar(true),
        },
      });
      saida.to(['.secao-hero .role-para-baixo', '.secao-hero .faixas'], { opacity: 0, duration: T['tempo-rapido'] }, 0);
      if (celular) {
        saida.to(s, { opacidade: 0, duration: T['tempo-curto'] }, 0.2).to(principal.rotation, { y: 0.05 * Math.PI, duration: 1 }, 0);
      } else {
        saida
          .to(principal.scale, escalaDeSaida(ESCALA.principal * SAIDA.principal * u, T['tempo-planos']), 0.2)
          .to(s, { opacidade: 0, duration: 0.58, ease: C['curva-entrada'] }, 0.4)
          .to(refLaje.current!.scale, escalaDeSaida(ESCALA.laje * SAIDA.laje * u, T['tempo-planos']), 0.2)
          .to(s, { yLaje: 0.1 * u, duration: 1 }, 0.2)
          .to(pequena.scale, escalaDeSaida(ESCALA.pequena * SAIDA.pequena * u, T['tempo-ponto-relogio']), 0.2)
          .to('.secao-hero .vidro-dom-recorte', { scale: 0, opacity: 0, rotateZ: -9, duration: 1.2 }, 0.2)
          .to(principal.rotation, { y: 0.1 * Math.PI, duration: 1.5 }, 0.1)
          .to(refLaje.current!.rotation, { y: -0.05 * Math.PI, duration: 1.4 }, 0.2)
          .to(pequena.rotation, { z: -0.05 * Math.PI, duration: 1.2 }, 0.2);
      }
      recalcularGatilhos();
    }, 1000);

    return () => {
      clearTimeout(atraso);
      entrada.kill();
      saida?.scrollTrigger?.kill();
      saida?.kill();
    };
  }, [terminou, reduzido, celular]);

  useFrame((estadoR3f) => {
    const s = estado.current;
    const principal = refPrincipal.current;
    if (!principal || !refLogo.current) return;

    const u = unidade();
    const t = reduzido ? 0 : estadoR3f.clock.elapsedTime;
    const m = reduzido ? { x: 0, y: 0 } : estadoR3f.pointer;
    const sy = rolagemSuave ? scroll.y : window.scrollY;

    materialLogo.uniforms.uProgresso.value = s.progresso;
    refLogo.current.position.y = 0.178 * window.innerHeight + (reduzido ? 1 : 1.6) * sy;

    const laje = refLaje.current!;
    const pequena = refPequena.current!;
    if (celular) {
      principal.position.set(POSICAO.principal.x * u + 0.07 * Math.sin(0.9 * t) * u, POSICAO.principalCelular.y * u + 0.03 * Math.sin(0.7 * t) * u + s.yPrincipal + 0.1 * sy, 0);
    } else {
      principal.position.x = POSICAO.principal.x * u + 0.07 * Math.sin(0.9 * t) * u + 0.1 * m.x * u;
      principal.position.y = POSICAO.principal.y * u + 0.03 * Math.sin(0.6 * t) * u + 0.03 * m.y * u + s.yPrincipal + (reduzido ? 1 : 0.1) * sy;
      principal.rotation.z = -0.04 * m.x;
      laje.position.x = POSICAO.laje.x * u - Math.cos(0.8 * t) * u * 0.05 + 0.08 * m.x * u;
      laje.position.y = POSICAO.laje.y * u + s.yLaje + (reduzido ? 1 : 0.9) * sy;
      pequena.position.x = POSICAO.pequena.x * u - 0.04 * Math.sin(0.7 * t) * u + 0.05 * m.x * u;
      pequena.position.y = POSICAO.pequena.y * u - 0.02 * m.y * u + s.yPequena + (reduzido ? 1 : 0.4) * sy;
      if (vidroDom.current) gsap.set(vidroDom.current, { x: pequena.position.x, y: -pequena.position.y });
    }
    materialVidro.uniforms.uTempo.value = t;
    materialVidro.uniforms.uBorrao.value.set(5 * m.x, 3 * m.y);
    materialVidro.uniforms.uOpacidade.value = s.opacidade;

    // Fora do hero (inclusive com movimento reduzido, quando não há gatilho de saída) o passo da refração para.
    if (!s.ativo || s.opacidade < 0.01 || sy > 2 * window.innerHeight) return;
    // Passo da refração: a cena sem o vidro vai para o alvo, e o vidro amostra esse alvo.
    const visiveis = [principal.visible, laje.visible, pequena.visible];
    principal.visible = laje.visible = pequena.visible = false;
    gl.setRenderTarget(alvo);
    gl.clear();
    gl.render(scene, camera);
    gl.setRenderTarget(null);
    [principal.visible, laje.visible, pequena.visible] = visiveis;
  });

  const larguraLogo = typeof window === 'undefined' ? 0 : window.innerWidth * (celular ? 0.9 : 0.86);

  return (
    <group>
      {logo && (
        <mesh ref={refLogo} material={materialLogo} position={[0, 0, -0.2 * unidade()]}>
          <planeGeometry args={[larguraLogo, larguraLogo * logo.razao]} />
        </mesh>
      )}
      <mesh ref={refPrincipal} geometry={formas.principal} material={materialVidro} rotation={[-0.35, 0, 0]} renderOrder={2} />
      <mesh ref={refLaje} geometry={formas.segunda} material={materialVidro} rotation={[-0.3, 0, 0]} visible={!celular} renderOrder={2} />
      <mesh ref={refPequena} geometry={formas.terceira} material={materialVidro} rotation={[-0.25, 0.1, 0]} visible={!celular} renderOrder={2} />
    </group>
  );
}
