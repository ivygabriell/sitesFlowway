import * as THREE from 'three';

// As três lâminas de vidro do hero (spec 4.3): lajes em paralelogramo, com os lados inclinados a 45° e cantos
// arredondados, geradas por código. Medidas em "unidades do hero" (a cena multiplica por u = largura da tela / 2,5).

type Ponto = readonly [number, number];

// Polígono com cada canto trocado por uma curva que começa e termina a `raio` do vértice, ao longo das arestas.
function poligonoArredondado(vertices: readonly Ponto[], raio: number): THREE.Shape {
  const forma = new THREE.Shape();
  const n = vertices.length;
  const rumo = (de: Ponto, para: Ponto, d: number): Ponto => {
    const [dx, dy] = [para[0] - de[0], para[1] - de[1]];
    const c = Math.hypot(dx, dy);
    return [de[0] + (dx / c) * d, de[1] + (dy / c) * d];
  };
  vertices.forEach((v, i) => {
    const antes = rumo(v, vertices[(i - 1 + n) % n], raio);
    const depois = rumo(v, vertices[(i + 1) % n], raio);
    if (i === 0) forma.moveTo(...antes);
    else forma.lineTo(...antes);
    forma.quadraticCurveTo(v[0], v[1], ...depois);
  });
  forma.closePath();
  return forma;
}

// Paralelogramo centrado: base e topo de largura `largura`, lados que sobem a 45° (deslocamento horizontal = altura).
export function contornoLamina(largura: number, altura: number, raio: number): THREE.Shape {
  const [l, a] = [largura / 2, altura / 2];
  return poligonoArredondado(
    [
      [-l - a, -a],
      [l - a, -a],
      [l + a, a],
      [-l + a, a],
    ],
    raio,
  );
}

// Medidas das lâminas, em unidades do hero (a disposição usa as mesmas para saber onde cada uma fica na tela).
export const MEDIDAS = {
  principal: { largura: 1.9, altura: 0.42 },
  laje: { largura: 1.4, altura: 0.42 },
  pequena: { largura: 1.1, altura: 0.36 },
  profundidade: 0.14,
  chanfro: 0.06,
} as const;
const PROFUNDIDADE = MEDIDAS.profundidade;
const CHANFRO = MEDIDAS.chanfro;
const RAIO = 0.05;

function extrudar(forma: THREE.Shape) {
  const g = new THREE.ExtrudeGeometry(forma, {
    depth: PROFUNDIDADE,
    bevelEnabled: true,
    bevelThickness: CHANFRO,
    bevelSize: CHANFRO,
    bevelSegments: 8,
    curveSegments: 16,
  });
  g.center();
  g.computeVertexNormals();
  return g;
}

export function criarLaminas() {
  return {
    principal: extrudar(contornoLamina(MEDIDAS.principal.largura, MEDIDAS.principal.altura, RAIO)),
    segunda: extrudar(contornoLamina(MEDIDAS.laje.largura, MEDIDAS.laje.altura, RAIO)),
    terceira: extrudar(contornoLamina(MEDIDAS.pequena.largura, MEDIDAS.pequena.altura, RAIO)),
  };
}
