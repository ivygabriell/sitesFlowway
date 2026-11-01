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
import { ESCALA, INCLINACAO, PALAVRA, PARALAXE, POSICAO, SAIDA, alvosDeSaida, repouso, unidade } from './disposicao';
import { criarLaminas } from './laminas';

const CLARO = new THREE.Color('#F7F7F5');

const u = () => unidade(window.innerWidth);

// Rotação de repouso de cada lâmina (rad); a saída soma a ela o giro de alvosDeSaida.
const ROTACAO = {
  principal: [INCLINACAO.principal, 0, 0],
  laje: [INCLINACAO.laje, 0, 0],
  pequena: [INCLINACAO.pequena, 0.1, 0],
} as const;

// Intensidade do vidro (issue #15): a lâmina principal passa sobre a palavra e quase não borra nem clareia, para
// FLOWAY seguir escura e nítida sob ela, como na referência; as menores mantêm o borrão forte. passoBorrao é a
// distância (px) entre as 9 amostras do borrão; veu, quanto do branco cobre o fundo; forca, quanto a normal desloca o
// fundo (na principal, menos, para o chanfro de baixo ainda mostrar o pé das letras).
const INTENSIDADE = { principal: { passoBorrao: 0.5, veu: 0.015, forca: 0.3 }, demais: { passoBorrao: 7, veu: 0.1, forca: 1 } };

// Atalhos para os tokens de movimento usados aqui.
const T = TEMPOS;
const C = CURVAS;


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
  // Repouso das lâminas para o tamanho atual da tela (recalculado quando ela muda).
  const lugar = useMemo(() => repouso(size.width, size.height), [size]);
  const alvo = useMemo(() => new THREE.WebGLRenderTarget(1, 1), []);
  // Um material por lâmina, com o mesmo alvo: só a intensidade (borrão e véu) muda entre elas.
  const vidros = useMemo(() => {
    const criar = ({ passoBorrao, veu, forca }: { passoBorrao: number; veu: number; forca: number }) =>
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
          uForca: { value: forca },
          uPassoBorrao: { value: passoBorrao },
          uVeu: { value: veu },
        },
      });
    return { principal: criar(INTENSIDADE.principal), laje: criar(INTENSIDADE.demais), pequena: criar(INTENSIDADE.demais) };
  }, [alvo]);
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
    Object.values(vidros).forEach((m) => m.uniforms.uResolucao.value.copy(v));
    const un = u();
    refPrincipal.current?.scale.setScalar((celular ? ESCALA.principalCelular : ESCALA.principal) * un);
    refLaje.current?.scale.setScalar(ESCALA.laje * un);
    refPequena.current?.scale.setScalar(ESCALA.pequena * un);
  }, [gl, size, alvo, vidros, celular]);

  // Entrada (quando a abertura termina) e saída ligada à rolagem.
  useEffect(() => {
    if (!terminou || reduzido) return;
    const un = u();
    const s = estado.current;
    const principal = refPrincipal.current!;
    const pequena = refPequena.current!;
    vidroDom.current = document.querySelector('.secao-hero .vidro-dom');
    const palavras = document.querySelectorAll('.secao-hero .palavra-intro');

    const entrada = gsap.timeline();
    entrada.set('.secao-hero .intro', { opacity: 1 }, 0);
    if (celular) {
      s.yPrincipal = -3 * un;
      entrada
        .to(s, { progresso: 1, duration: T['tempo-glitch'], ease: C['curva-suave'] }, 1)
        .to('.secao-hero .faixas', { opacity: 1, duration: T['tempo-hover'] }, 1)
        .to(s, { yPrincipal: 0, duration: 1.2, ease: C['curva-suave'] }, 0)
        .from(principal.rotation, { y: 0.1 * Math.PI, duration: 1, ease: C['curva-giro'] }, 0.4)
        .to('.secao-hero .role-para-baixo', { opacity: 1, duration: T['tempo-curto'] }, 1.2);
      palavras.forEach((p) => entrada.from(p, { opacity: 0, duration: T['tempo-piscar'], repeat: 4 }, 1.1 + 0.5 * Math.random()));
    } else {
      s.yPrincipal = -2 * un;
      s.yLaje = -2 * un;
      s.yPequena = -2 * un;
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
    // Saída (referência 3.2): as lâminas crescem e giram no lugar enquanto o vidro some; a altura segue só a paralaxe.
    const malhas = { principal: principal, laje: refLaje.current!, pequena: pequena };
    const atraso = setTimeout(() => {
      saida = gsap.timeline({
        scrollTrigger: {
          trigger: '.secao-hero',
          start: SAIDA.inicio,
          end: `+=${(celular ? SAIDA.alturas.celular : SAIDA.alturas.desktop) * window.innerHeight}`,
          scrub: SAIDA.scrub,
          refreshPriority: PRIORIDADE.hero,
          onLeave: () => mostrar(false),
          onEnterBack: () => mostrar(true),
        },
      });
      saida.to(['.secao-hero .role-para-baixo', '.secao-hero .faixas'], { opacity: 0, duration: T['tempo-rapido'] }, 0);
      for (const { peca, crescimento, giro } of alvosDeSaida(celular, false)) {
        const escala = (peca === 'principal' && celular ? ESCALA.principalCelular : ESCALA[peca]) * crescimento * un;
        const [rx, ry, rz] = ROTACAO[peca];
        saida
          .to(malhas[peca].scale, { x: escala, y: escala, z: escala, duration: T['tempo-planos'], ease: C['curva-saida'] }, INTERVALOS['intervalo-curto'])
          .to(malhas[peca].rotation, { x: rx + (giro.x ?? 0), y: ry + (giro.y ?? 0), z: rz + (giro.z ?? 0), duration: T['tempo-planos'], ease: C['curva-saida'] }, INTERVALOS['intervalo-curto']);
      }
      // O vidro some até o escuro subir (0,9 de 2,1 da saída: cerca de uma altura de tela de rolagem no desktop), já com as lâminas bem maiores.
      saida.to(s, { opacidade: 0, duration: T['tempo-lista'], ease: C['curva-entrada'] }, INTERVALOS['intervalo-lista']);
      if (!celular) saida.to('.secao-hero .vidro-dom-recorte', { scale: 0, opacity: 0, rotateZ: -9, duration: 1.2 }, 0.2);
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

    const un = u();
    const t = reduzido ? 0 : estadoR3f.clock.elapsedTime;
    const m = reduzido ? { x: 0, y: 0 } : estadoR3f.pointer;
    const sy = rolagemSuave ? scroll.y : window.scrollY;
    // Com movimento reduzido tudo anda com a página (×1) e some com a seção.
    const px = (fator: number) => (reduzido ? 1 : fator) * sy;

    materialLogo.uniforms.uProgresso.value = s.progresso;
    refLogo.current.position.y = 0.178 * window.innerHeight + px(PARALAXE.palavra);

    const laje = refLaje.current!;
    const pequena = refPequena.current!;
    const r = lugar;
    if (celular) {
      principal.position.set(POSICAO.principal.x * un + 0.07 * Math.sin(0.9 * t) * un, r.principal.y + 0.03 * Math.sin(0.7 * t) * un + s.yPrincipal + px(PARALAXE.principal), 0);
    } else {
      principal.position.x = POSICAO.principal.x * un + 0.07 * Math.sin(0.9 * t) * un + 0.1 * m.x * un;
      principal.position.y = r.principal.y + 0.03 * Math.sin(0.6 * t) * un + 0.03 * m.y * un + s.yPrincipal + px(PARALAXE.principal);
      principal.rotation.z = -0.04 * m.x;
      laje.position.x = POSICAO.laje.x * un - Math.cos(0.8 * t) * un * 0.05 + 0.08 * m.x * un;
      laje.position.y = r.laje.y + s.yLaje + px(PARALAXE.laje);
      pequena.position.x = POSICAO.pequena.x * un - 0.04 * Math.sin(0.7 * t) * un + 0.05 * m.x * un;
      pequena.position.y = r.pequena.y - 0.02 * m.y * un + s.yPequena + px(PARALAXE.pequena);
      if (vidroDom.current) gsap.set(vidroDom.current, { x: pequena.position.x, y: -pequena.position.y });
    }
    // O mouse empurra o borrão em proporção ao passo de cada lâmina (no passo 7, até 5 px na horizontal e 3 na vertical).
    Object.values(vidros).forEach(({ uniforms }) => {
      uniforms.uTempo.value = t;
      uniforms.uBorrao.value.set((5 / 7) * m.x, (3 / 7) * m.y);
      uniforms.uOpacidade.value = s.opacidade;
    });

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
  const zLogo = typeof window === 'undefined' ? 0 : PALAVRA.z * u();

  return (
    <group>
      {logo && (
        <mesh ref={refLogo} material={materialLogo} position={[0, 0, zLogo]}>
          <planeGeometry args={[larguraLogo, larguraLogo * logo.razao]} />
        </mesh>
      )}
      <mesh ref={refPrincipal} geometry={formas.principal} material={vidros.principal} rotation={[...ROTACAO.principal]} renderOrder={2} />
      <mesh ref={refLaje} geometry={formas.segunda} material={vidros.laje} rotation={[...ROTACAO.laje]} visible={!celular} renderOrder={2} />
      <mesh ref={refPequena} geometry={formas.terceira} material={vidros.pequena} rotation={[...ROTACAO.pequena]} visible={!celular} renderOrder={2} />
    </group>
  );
}
