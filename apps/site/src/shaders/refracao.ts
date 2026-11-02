import { ruido } from './comum';

// Vidro fosco: amostra a cena desenhada sem o vidro (uFundo) na posição da tela, desviada pela normal,
// com linhas que ondulam no tempo, borrão direcional (que o mouse empurra) e brilho nas bordas.
// uPassoBorrao (px entre as amostras), uVeu (quanto do branco cobre o fundo) e uForca (quanto a normal desloca o
// fundo) dão a intensidade de cada lâmina: a que passa sobre a palavra quase não borra, para ela seguir legível (#15).
export const refracaoVert = /* glsl */ `
varying vec3 vNormal;
varying vec3 vVisao;
void main() {
  vec4 mundo = modelMatrix * vec4(position, 1.0);
  vVisao = normalize(mundo.xyz - cameraPosition);
  vNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * viewMatrix * mundo;
}
`;

export const refracaoFrag = /* glsl */ `
uniform sampler2D uFundo;
uniform vec2 uResolucao;
uniform vec3 uClaro;
uniform float uTempo;
uniform vec2 uBorrao;
uniform float uOpacidade;
uniform float uForca;
uniform float uPassoBorrao;
uniform float uVeu;
uniform float uSerra;
varying vec3 vNormal;
varying vec3 vVisao;
${ruido}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolucao;
  uv += vNormal.xy * 0.04 * uForca;
  uv.x += sin(uv.y * 70.0 + uTempo * 0.8) * 0.006 * (ruido2(vec2(uv.y * 40.0, uTempo * 0.6)) - 0.3);

  // Serra do glitch: faixas finas da tela saem do lugar na horizontal, mudando no tempo.
  uv.x += sin(uv.y * 37.7) * 0.01 * (ruido2(vec2(uv.y * 800.0, uTempo)) - 0.5) * uSerra;

  float onda = ruido2(uv * vec2(5.0, 10.0) + uTempo * 0.3) - 0.5;
  vec2 direcao = uPassoBorrao * vec2(1.0 + uBorrao.x + onda * (2.0 + 1.5 * uSerra), uBorrao.y) / uResolucao;
  vec4 soma = vec4(0.0);
  for (int i = -4; i <= 4; i++) soma += texture2D(uFundo, uv + direcao * float(i));
  soma /= 9.0;
  vec3 base = soma.rgb + uClaro * (1.0 - soma.a); // o fundo transparente do alvo é o claro da página

  float fresnel = pow(1.0 - abs(dot(vVisao, vNormal)), 2.2);
  vec3 luz = normalize(vec3(0.0, 1.0, 1.2));
  float brilho = pow(max(dot(reflect(-luz, vNormal), -vVisao), 0.0), 24.0);

  // O fresnel clareia as bordas e só as escurece de leve (vidro quase branco, sem sombra pesada).
  vec3 vidro = mix(base, vec3(1.0), uVeu + fresnel * 0.15) * (1.0 - fresnel * 0.3) + brilho * 0.5 * uForca;
  gl_FragColor = vec4(vidro, uOpacidade * (0.97 + fresnel * 0.03));
  #include <colorspace_fragment>
}
`;
