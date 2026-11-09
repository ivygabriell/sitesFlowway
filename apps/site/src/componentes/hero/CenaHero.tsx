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
import { INCLINACAO, PALAVRA, PARALAXE, POSICAO, SAIDA, alvoDeSaida, repouso, unidade } from './disposicao';
import { criarLogoDeVidro } from './laminas';

const CLARO = new THREE.Color('#F7F7F5');

const u = () => unidade(window.innerWidth);

// Rotação de repouso da logo (rad); a saída soma a ela o giro de alvosDeSaida.
const ROTACAO = [INCLINACAO, 0, 0] as const;

// Intensidade do vidro: sobre a palavra, a logo arrasta as bordas das letras na horizontal sem apagá-las. passoBorrao é
// a distância (px) entre as 9 amostras do borrão; veu, quanto do branco cobre o fundo; forca, quanto a normal desloca o
// fundo; serra, quanto cada faixa sai do lugar.
const INTENSIDADE = { passoBorrao: 2, veu: 0.005, forca: 0.3, serra: 1 };

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
    // Com movimento reduzido, sem serra nem arrasto; no celular, mais suave.
    const { passoBorrao, veu, forca, serra } = reduzido ? { ...INTENSIDADE, passoBorrao: 0.5, serra: 0 } : celular ? { ...INTENSIDADE, passoBorrao: 1, serra: 0.5 } : INTENSIDADE;
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
      },
    });
  }, [alvo, reduzido, celular]);
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

  // Alvo da refração do tamanho da tela (em pixels do dispositivo), a escala do F e as faixas logo abaixo dele.
  useEffect(() => {
    const v = gl.getDrawingBufferSize(new THREE.Vector2());
    alvo.setSize(v.x, v.y);
    vidro.uniforms.uResolucao.value.copy(v);
    refPrincipal.current?.scale.setScalar(lugar.principal.escala);
    document.querySelector<HTMLElement>('.secao-hero')?.style.setProperty('--faixas-y', `${lugar.faixas}px`);
  }, [gl, alvo, vidro, lugar]);

  // Entrada (quando a abertura termina) e saída ligada à rolagem.
  useEffect(() => {
    if (!terminou || reduzido) return;
    const un = u();
    const s = estado.current;
    const principal = refPrincipal.current!;
    const palavras = document.querySelectorAll('.secao-hero .palavra-intro');

    const entrada = gsap.timeline({ paused: true });
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
      entrada
        .to(s, { progresso: 1, duration: T['tempo-glitch'], ease: C['curva-suave'] }, INTERVALOS['intervalo-glitch'])
        .to('.secao-hero .faixas', { opacity: 1, duration: T['tempo-esmaecer'] }, INTERVALOS['intervalo-intro'])
        .to(s, { yPrincipal: 0, duration: T['tempo-vidro-principal'], ease: C['curva-suave'] }, 0)
        .from(principal.rotation, { y: 0.15 * Math.PI, duration: T['tempo-planos'], ease: C['curva-giro'] }, 0.4)
        .to('.secao-hero .role-para-baixo', { opacity: 1, duration: T['tempo-esmaecer'] }, 1);
      palavras.forEach((p) => entrada.from(p, { opacity: 0, duration: T['tempo-piscar'], repeat: 5 }, INTERVALOS['intervalo-intro'] + Math.random()));
    }

    // A entrada segue o tempo real mesmo com quadros acima de 500 ms. Controla só esta timeline,
    // sem alterar o lagSmoothing global e disputar sua restauração com a transição de página.
    const inicio = performance.now();
    const avancarEntrada = () => {
      entrada.totalTime((performance.now() - inicio) / 1000);
    };
    // Recarga no meio da página: a entrada já vem pronta, sem a logo subir (a página aparece no lugar guardado).
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
    // Saída (referência 3.2): a logo cresce e gira no lugar enquanto o vidro some; a altura segue só a paralaxe.
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
      const { crescimento, giro } = alvoDeSaida(celular);
      const escala = repouso(window.innerWidth, window.innerHeight).principal.escala * crescimento;
      const [rx, ry, rz] = ROTACAO;
      saida
        .to(principal.scale, { x: escala, y: escala, z: escala, duration: T['tempo-planos'], ease: C['curva-saida'] }, INTERVALOS['intervalo-curto'])
        .to(principal.rotation, { x: rx + (giro.x ?? 0), y: ry + (giro.y ?? 0), z: rz + (giro.z ?? 0), duration: T['tempo-planos'], ease: C['curva-saida'] }, INTERVALOS['intervalo-curto']);
      // O vidro some até o escuro subir (0,9 de 2,1 da saída: cerca de uma altura de tela de rolagem no desktop), já com as lâminas bem maiores.
      saida.to(s, { opacidade: 0, duration: T['tempo-lista'], ease: C['curva-entrada'] }, INTERVALOS['intervalo-lista']);
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
    const m = reduzido ? { x: 0, y: 0 } : estadoR3f.pointer;
    const sy = rolagemSuave ? scroll.y : window.scrollY;
    // Com movimento reduzido tudo anda com a página (×1) e some com a seção.
    const px = (fator: number) => (reduzido ? 1 : fator) * sy;

    materialLogo.uniforms.uProgresso.value = s.progresso;
    refLogo.current.position.y = 0.178 * window.innerHeight + px(PARALAXE.palavra);

    const r = lugar;
    if (celular) {
      principal.position.set(POSICAO.x * un + 0.07 * Math.sin(0.9 * t) * un, r.principal.y + 0.03 * Math.sin(0.7 * t) * un + s.yPrincipal + px(PARALAXE.principal), 0);
    } else {
      principal.position.x = POSICAO.x * un + 0.07 * Math.sin(0.9 * t) * un + 0.1 * m.x * un;
      principal.position.y = r.principal.y + 0.03 * Math.sin(0.6 * t) * un + 0.03 * m.y * un + s.yPrincipal + px(PARALAXE.principal);
      principal.rotation.z = -0.04 * m.x;
    }
    // O mouse empurra o borrão em proporção ao passo de cada lâmina (no passo 7, até 5 px na horizontal e 3 na vertical).
    const { uniforms } = vidro;
    uniforms.uTempo.value = t;
    uniforms.uBorrao.value.set((5 / 7) * m.x, (3 / 7) * m.y);
    uniforms.uOpacidade.value = s.opacidade;

    // Fora do hero (inclusive com movimento reduzido, quando não há gatilho de saída) o passo da refração para.
    if (!s.ativo || s.opacidade < 0.01 || sy > 2 * window.innerHeight) return;
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
