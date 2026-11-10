'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { asciiFrag } from '@/shaders/ascii';
import { vertUv } from '@/shaders/comum';
import { gsap } from '@/gsap';

export type EstadoCartoes = { progresso: number; hover: number[] };

// Um plano por cartão com capa, posicionado a cada quadro sobre a imagem do DOM (que anda com o pin e com a
// galeria). A capa chega em ASCII e uma varredura a revela; o hover aproxima 10% e escurece 30% (no shader).
// `capas[k]` é a capa do k-ésimo cartão com capa, e `indices[k]` o índice dele na fileira (para o hover).
export function CenaCartoes({ capas, indices, estado }: { capas: string[]; indices: number[]; estado: { current: EstadoCartoes } }) {
  const { gl } = useThree();
  const planos = useRef<(THREE.Mesh | null)[]>([]);
  const materiais = useMemo(() => {
    // A textura é o próprio <img> da capa (mesma ordem): carrega com ele, pelo loading=lazy perto da seção, e uma vez
    // só. Antes um TextureLoader baixava as capas na montagem e o <img> baixava de novo (revisão de 2026-11-09).
    const imagens = document.querySelectorAll<HTMLImageElement>('.secao-capitulos .cartao-img img');
    return capas.map((_, k) => {
      const img = imagens[k];
      const textura = new THREE.Texture(img);
      textura.colorSpace = THREE.SRGBColorSpace;
      if (img?.complete && img.naturalWidth) textura.needsUpdate = true;
      else img?.addEventListener('load', () => void (textura.needsUpdate = true), { once: true });
      return new THREE.ShaderMaterial({
        glslVersion: THREE.GLSL3,
        vertexShader: vertUv,
        fragmentShader: asciiFrag,
        uniforms: {
          uImagem: { value: textura },
          uProgresso: { value: 0 },
          uHover: { value: 0 },
          uTempo: { value: 0 },
          uPixelRatio: { value: gl.getPixelRatio() },
          uFundo: { value: new THREE.Color('#121212') },
        },
      });
    });
  }, [capas, gl]);

  // Texturas e materiais saem da GPU quando a cena desmonta.
  useEffect(
    () => () =>
      materiais.forEach((m) => {
        (m.uniforms.uImagem.value as THREE.Texture).dispose();
        m.dispose();
      }),
    [materiais],
  );

  useFrame(({ clock }) => {
    // O GSAP (que anda a fileira) pode rodar depois deste quadro do canvas, quando acorda do repouso: sem isto, o plano
    // usa a posição do quadro anterior e a capa fica até 70 px atrás do texto do cartão enquanto a fileira anda.
    gsap.ticker.tick();
    const imagens = document.querySelectorAll<HTMLImageElement>('.secao-capitulos .cartao-img img');
    const W = window.innerWidth;
    const H = window.innerHeight;
    imagens.forEach((img, k) => {
      const plano = planos.current[k];
      if (!plano) return;
      const r = img.getBoundingClientRect();
      plano.visible = r.bottom > 0 && r.top < H && r.right > 0 && r.left < W;
      if (!plano.visible) return;
      plano.position.set(r.left + r.width / 2 - W / 2, H / 2 - (r.top + r.height / 2), 0);
      plano.scale.set(r.width, r.height, 1);
      const u = materiais[k].uniforms;
      u.uTempo.value = clock.elapsedTime;
      u.uProgresso.value = estado.current.progresso;
      u.uHover.value = estado.current.hover[indices[k]] ?? 0;
    });
  });

  return (
    <group>
      {materiais.map((m, k) => (
        <mesh key={k} ref={(el) => void (planos.current[k] = el)} material={m} visible={false}>
          <planeGeometry args={[1, 1]} />
        </mesh>
      ))}
    </group>
  );
}
