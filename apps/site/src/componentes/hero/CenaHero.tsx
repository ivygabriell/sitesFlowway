'use client';

import { useScrollbar } from '@14islands/r3f-scroll-rig';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useAbertura } from '@/estado/abertura';
import { PRIORIDADE, gsap, recalcularGatilhos } from '@/gsap';
import { ehCelular, prefereMenosMovimento } from '@/lib/ambiente';
import { restaurandoNestaCarga } from '@/lib/restauracao';
import { CURVAS, INTERVALOS, TEMPOS } from '@/movimento/tokens';
import { vertUv } from '@/shaders/comum';
import { glitchFrag } from '@/shaders/glitch';
import { refracaoFrag, refracaoVert } from '@/shaders/refracao';
import { desenharPalavra } from '@/texturas/palavra';
import { ESCALA, INCLINACAO, PALAVRA, PARALAXE, POSICAO, SAIDA, alvoDeSaida, repouso, unidade } from './disposicao';
import { criarLogoDeVidro } from './laminas';

const CLARO = new THREE.Color('#F7F7F5');

const u = () => unidade(window.innerWidth);

// Rotação de repouso da logo (rad); a saída soma a ela o giro de alvosDeSaida.
const ROTACAO = [INCLINACAO, 0, 0] as const;

// Intensidade do vidro: sobre a palavra, a logo arrasta as bordas das letras na horizontal sem apagá-las. passoBorrao é
// a distância (px) entre as 9 amostras do borrão; veu, quanto do branco cobre o fundo; forca, quanto a normal desloca o
// fundo; serra, quanto cada faixa sai do lugar. Vidro limpo (Rafael, 2026-11-09): com serra e borrão de 2 px, a palavra
// sob o F saía rasgada em estrias e parecia bug; fica só a refração das bordas e um borrão leve.
// tinta: quanto o vidro escurece o que está atrás (Rafael, 2026-11-09: sem corpo, o F quase sumia no fundo claro).
const INTENSIDADE = { passoBorrao: 0.5, veu: 0.005, forca: 0.3, serra: 0, tinta: 0.07 };

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

  // Valores animados pelo GSAP e lidos a cada quadro.
  const estado = useRef({ progresso: reduzido ? 1 : 0, opacidade: 1, yPrincipal: 0, ativo: true });

  const forma = useMemo(() => criarLogoDeVidro(), []);
  // Repouso da logo para o tamanho atual da tela (recalculado quando ela muda).
  const lugar = useMemo(() => repouso(size.width, size.height), [size]);
  const alvo = useMemo(() => new THREE.WebGLRenderTarget(1, 1), []);
  const vidro = useMemo(() => {
    const { passoBorrao, veu, forca, serra, tinta } = INTENSIDADE;
    return new THREE.ShaderMaterial({
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
        uSerra: { value: serra },
        uTinta: { value: tinta },
      },
    });
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
    vidro.uniforms.uResolucao.value.copy(v);
    refPrincipal.current?.scale.setScalar((celular ? ESCALA.principalCelular : ESCALA.principal) * u());
  }, [gl, size, alvo, vidro, celular]);

  // Entrada (quando a abertura termina) e saída ligada à rolagem.
  useEffect(() => {
    if (!terminou || reduzido) return;
    const un = u();
    const s = estado.current;
    const principal = refPrincipal.current!;
    const palavras = document.querySelectorAll('.secao-hero .palavra-intro');

    const entrada = gsap.timeline({ paused: true });
    entrada.set('.secao-hero .intro', { opacity: 1 }, 0);
    // Rafael, 2026-11-09: subindo de baixo e girando, o F entrava como uma placa; agora aparece no lugar, e o glitch
    // da palavra é curto (meio segundo) e logo no começo.
    entrada
      .fromTo(s, { opacidade: 0 }, { opacidade: 1, duration: T['tempo-esmaecer'], ease: C['curva-suave'] }, 0)
      .to(s, { progresso: 1, duration: 0.5, ease: C['curva-suave'] }, 0.2)
      .to('.secao-hero .faixas', { opacity: 1, duration: T['tempo-esmaecer'] }, celular ? 0.6 : INTERVALOS['intervalo-intro'])
      .to('.secao-hero .role-para-baixo', { opacity: 1, duration: T['tempo-esmaecer'] }, 1);
    palavras.forEach((p) => entrada.from(p, { opacity: 0, duration: T['tempo-piscar'], repeat: celular ? 4 : 5 }, (celular ? 0.6 : INTERVALOS['intervalo-intro']) + 0.5 * Math.random()));

    // A entrada segue o tempo real mesmo com quadros acima de 500 ms. Controla só esta timeline,
    // sem alterar o lagSmoothing global e disputar sua restauração com a transição de página.
    const inicio = performance.now();
    const avancarEntrada = () => {
      entrada.totalTime((performance.now() - inicio) / 1000);
    };
    // Voltar (navegador) para a página rolada: a entrada já vem pronta (a página aparece no lugar guardado).
    if (restaurandoNestaCarga(window.location.pathname)) entrada.progress(1);
    else {
      entrada.eventCallback('onComplete', () => gsap.ticker.remove(avancarEntrada));
      gsap.ticker.add(avancarEntrada);
    }

    let saida: gsap.core.Timeline | undefined;
    const mostrar = (sim: boolean) => {
      s.ativo = sim;
      principal.visible = sim;
    };
    // Saída: a logo cresce pouco enquanto o vidro some, logo no começo da rolagem; a altura segue só a paralaxe.
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
      const { crescimento, giro } = alvoDeSaida();
      const escala = (celular ? ESCALA.principalCelular : ESCALA.principal) * crescimento * un;
      const [rx, ry, rz] = ROTACAO;
      saida
        .to(principal.scale, { x: escala, y: escala, z: escala, duration: T['tempo-planos'], ease: C['curva-saida'] }, INTERVALOS['intervalo-curto'])
        .to(principal.rotation, { x: rx + (giro.x ?? 0), y: ry + (giro.y ?? 0), z: rz + (giro.z ?? 0), duration: T['tempo-planos'], ease: C['curva-saida'] }, INTERVALOS['intervalo-curto']);
      // O vidro some cedo (até 0,6 de 2,1 da saída: pouco mais de meia tela de rolagem no desktop).
      // No celular o vidro não some no meio da tela: sai com a rolagem, e o onLeave o esconde já fora dela.
      if (!celular) saida.to(s, { opacidade: 0, duration: 0.5, ease: C['curva-entrada'] }, 0.1);
      recalcularGatilhos();
    }, 1000);

    return () => {
      clearTimeout(atraso);
      gsap.ticker.remove(avancarEntrada);
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
    const sy = rolagemSuave ? scroll.y : window.scrollY;
    // Com movimento reduzido, e no celular, tudo anda com a página (×1) e sai da tela junto com o conteúdo.
    const px = (fator: number) => (reduzido || celular ? 1 : fator) * sy;

    materialLogo.uniforms.uProgresso.value = s.progresso;
    refLogo.current.position.y = 0.178 * window.innerHeight + px(PARALAXE.palavra);

    // Só a flutuação lenta move o F: o mouse não mexe nele (Rafael, 2026-11-09).
    const r = lugar;
    principal.position.set(POSICAO.x * un + 0.07 * Math.sin(0.9 * t) * un, r.principal.y + 0.03 * Math.sin(celular ? 0.7 * t : 0.6 * t) * un + s.yPrincipal + px(PARALAXE.principal), 0);
    const { uniforms } = vidro;
    uniforms.uTempo.value = t;
    // No celular o escuro da passagem sobe já a 0,15 tela de rolagem: o vidro claro sobre ele virava uma placa cinza
    // cortada na borda da tela; ele esmaece entre 0,1 e 0,35 tela, antes de o escuro chegar ao F.
    const opacidade = celular ? s.opacidade * THREE.MathUtils.clamp((0.35 * window.innerHeight - sy) / (0.25 * window.innerHeight), 0, 1) : s.opacidade;
    uniforms.uOpacidade.value = opacidade;

    // Fora do hero (inclusive com movimento reduzido, quando não há gatilho de saída) o passo da refração para.
    if (!s.ativo || opacidade < 0.01 || sy > 2 * window.innerHeight) return;
    // Passo da refração: a cena sem o vidro vai para o alvo, e o vidro amostra esse alvo.
    principal.visible = false;
    gl.setRenderTarget(alvo);
    gl.clear();
    gl.render(scene, camera);
    gl.setRenderTarget(null);
    principal.visible = true;
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
      <mesh ref={refPrincipal} geometry={forma} material={vidro} rotation={[...ROTACAO]} renderOrder={2} />
    </group>
  );
}
