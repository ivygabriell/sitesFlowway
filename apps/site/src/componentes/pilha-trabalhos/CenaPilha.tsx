'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { CURVA_MAXIMA, VELOCIDADE_CHEIA, curvaDaVelocidade, posePlano } from './pose';

// `atual`: posição contínua na pilha (0 a n − 1); `entrada` 0→1; `empurrao`: velocidade extra da entrada (10→0);
// `hover`: 0→1 com o mouse sobre o plano atual.
export type EstadoPilha = { atual: number; entrada: number; empurrao: number; hover: number };

// O plano se curva como um pedaço de cilindro: as bordas recuam até `uCurva` unidades.
const vert = /* glsl */ `
uniform float uCurva;
varying vec2 vUv;
void main() {
  vUv = uv;
  vec3 p = position;
  p.z -= uCurva * 4.0 * p.x * p.x;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}
`;

// A capa; no verso, espelhada de volta e escurecida a 50%; o hover aproxima 15% dentro do plano.
const frag = /* glsl */ `
uniform sampler2D uImagem;
uniform float uHover;
varying vec2 vUv;
void main() {
  vec2 uv = vUv;
  if (!gl_FrontFacing) uv.x = 1.0 - uv.x;
  uv = (uv - 0.5) / (1.0 + 0.15 * uHover) + 0.5;
  vec4 cor = texture2D(uImagem, uv);
  gl_FragColor = vec4(cor.rgb * (gl_FrontFacing ? 1.0 : 0.5), 1.0);
  #include <colorspace_fragment>
}
`;

// Um plano por trabalho (50vh × 74vh), empilhados no centro da seção presa. A textura é o próprio <img> da miniatura
// (a mesma capa), que carrega uma vez só.
export function CenaPilha({ total, estado, secao }: { total: number; estado: { current: EstadoPilha }; secao: { current: HTMLElement | null } }) {
  const { size } = useThree();
  const planos = useRef<(THREE.Mesh | null)[]>([]);
  const ultimoY = useRef<number | null>(null);
  const curva = useRef(0);
  const geometria = useMemo(() => new THREE.PlaneGeometry(1, 1, 40, 40), []);
  const materiais = useMemo(() => {
    const imagens = document.querySelectorAll<HTMLImageElement>('.pilha-miniaturas img');
    return Array.from({ length: total }, (_, k) => {
      const img = imagens[k];
      const textura = new THREE.Texture(img);
      textura.colorSpace = THREE.SRGBColorSpace;
      if (img?.complete && img.naturalWidth) textura.needsUpdate = true;
      else img?.addEventListener('load', () => void (textura.needsUpdate = true), { once: true });
      return new THREE.ShaderMaterial({
        vertexShader: vert,
        fragmentShader: frag,
        side: THREE.DoubleSide,
        uniforms: { uImagem: { value: textura }, uCurva: { value: 0 }, uHover: { value: 0 } },
      });
    });
  }, [total]);

  useEffect(
    () => () => {
      geometria.dispose();
      materiais.forEach((m) => {
        (m.uniforms.uImagem.value as THREE.Texture).dispose();
        m.dispose();
      });
    },
    [geometria, materiais],
  );

  useFrame(() => {
    const el = secao.current;
    if (!el) return;
    const H = size.height;
    const topo = el.getBoundingClientRect().top;
    const visivel = topo < H && topo > -H;
    // Velocidade em px por quadro, suavizada; a curva soma o empurrão da entrada.
    const y = window.scrollY;
    const v = ultimoY.current === null ? 0 : y - ultimoY.current;
    ultimoY.current = y;
    curva.current += (Math.min(VELOCIDADE_CHEIA, Math.abs(v) + estado.current.empurrao) - curva.current) * 0.2;
    const { atual, entrada, hover } = estado.current;
    planos.current.forEach((plano, k) => {
      if (!plano) return;
      plano.visible = visivel;
      if (!visivel) return;
      const d = k - atual;
      const pose = posePlano(d, entrada, H);
      plano.position.set(0, pose.y - topo, pose.z);
      plano.rotation.y = pose.giro;
      plano.scale.set(H * 0.5, H * 0.74, 1);
      const u = materiais[k].uniforms;
      u.uCurva.value = CURVA_MAXIMA * curvaDaVelocidade(curva.current);
      u.uHover.value = Math.abs(d) < 0.5 ? hover : 0;
    });
  });

  return (
    <group>
      {materiais.map((m, k) => (
        <mesh key={k} ref={(el) => void (planos.current[k] = el)} geometry={geometria} material={m} visible={false} />
      ))}
    </group>
  );
}
