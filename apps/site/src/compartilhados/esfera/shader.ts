import * as THREE from 'three';
import { ruido } from '@/shaders/comum';
import { LETRAS } from './atlas';

// Valores da spec (seção Contato) e do protótipo 07-contato-esfera.
export const ESFERA = {
  // O cursor empurra as letras até 38 px num raio de 110 px.
  empurrao: 38,
  raioDoCursor: 110,
  // Buracos: ruído 3D com corte em 0.32 (ruído levado a -1..1), só enquanto é esfera.
  corteDosBuracos: 0.32,
  frequenciaDosBuracos: 1.8,
  // Teto do gl_PointSize: há Android com limite de 64 px (decisão 005).
  tetoDoPonto: 64,
} as const;

const glsl = (n: number) => (Number.isInteger(n) ? `${n}.0` : `${n}`);

// Um vértice por letra. Morfose, giro, buracos e cursor ficam aqui, por uniformes: nenhum atributo muda por quadro.
export const esferaVert = /* glsl */ `
attribute vec3 aEsfera;
attribute vec3 aAlvo;
attribute float aLetra;
attribute vec2 aAzul;
uniform float uMorf;
uniform float uTempo;
uniform float uGiro;
uniform float uRaio;
uniform float uTamanho;
uniform float uDpr;
uniform vec2 uMouse;
varying float vLetra;
varying float vAzul;
varying float vTom;
${ruido}
void main() {
  float m = uMorf * uMorf * (3.0 - 2.0 * uMorf);
  vec3 p = mix(aEsfera, aAlvo, m);

  // A esfera gira em torno do eixo vertical; com o F formado, o giro é zero.
  float a = uGiro * (1.0 - m);
  float c = cos(a);
  float s = sin(a);
  p = vec3(p.x * c - p.z * s, p.y, p.x * s + p.z * c);
  vec3 q = p * uRaio;

  // O cursor empurra as letras no plano da tela (unidades da cena = pixels).
  vec2 d = q.xy - uMouse;
  float dist = length(d);
  float k = (1.0 - clamp(dist / ${glsl(ESFERA.raioDoCursor)}, 0.0, 1.0)) * ${glsl(ESFERA.empurrao)};
  if (dist > 0.0) q.xy += d / dist * k;

  vec4 mv = modelViewMatrix * vec4(q, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = min(uTamanho * uDpr * cameraPosition.z / -mv.z, ${glsl(ESFERA.tetoDoPonto)});

  // Buracos de ruído, presos à superfície da esfera e animados pelo tempo.
  float n = ruido3(aEsfera * ${glsl(ESFERA.frequenciaDosBuracos)} + vec3(uTempo * 0.3, uTempo * -0.4, uTempo * 0.5)) * 2.0 - 1.0;
  if (m < 0.5 && n > ${glsl(ESFERA.corteDosBuracos)}) {
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    gl_PointSize = 0.0;
  }

  vLetra = aLetra;
  vAzul = m > 0.5 ? aAzul.y : aAzul.x;
  // Na esfera, as letras de trás ficam mais claras (a opacidade do protótipo, sem transparência); no F, todas cheias.
  vTom = mix(clamp(0.75 + p.z * 0.55, 0.12, 1.0), 1.0, m);
}
`;

export const esferaFrag = /* glsl */ `
uniform sampler2D uAtlas;
uniform vec3 uCor;
uniform vec3 uAzul;
uniform vec3 uFundo;
varying float vLetra;
varying float vAzul;
varying float vTom;
void main() {
  vec2 uv = vec2((vLetra + gl_PointCoord.x) / ${glsl(LETRAS.length)}, 1.0 - gl_PointCoord.y);
  if (texture2D(uAtlas, uv).a < 0.5) discard;
  gl_FragColor = vec4(mix(uFundo, mix(uCor, uAzul, vAzul), vTom), 1.0);
  #include <colorspace_fragment>
}
`;

// Cores da esfera no fundo claro: #121212, o azul #002FA7 e o fundo #F7F7F5 (o tom das letras de trás).
export function criarMaterialDaEsfera(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: esferaVert,
    fragmentShader: esferaFrag,
    transparent: false,
    uniforms: {
      uAtlas: { value: null },
      uMorf: { value: 0 },
      uTempo: { value: 0 },
      uGiro: { value: 0 },
      uMouse: { value: new THREE.Vector2(1e5, 1e5) },
      uRaio: { value: 1 },
      uTamanho: { value: 1 },
      uDpr: { value: 1 },
      uCor: { value: new THREE.Color('#121212') },
      uAzul: { value: new THREE.Color('#002FA7') },
      uFundo: { value: new THREE.Color('#F7F7F5') },
    },
  });
}
