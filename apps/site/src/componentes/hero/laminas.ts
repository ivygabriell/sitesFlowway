import * as THREE from 'three';
import { achatar } from '@/marca/amostrar';
import { SIMBOLO } from '@/marca/simbolo';

// O vidro do hero é o símbolo da Floway extrudado, com altura 1 unidade do hero (a cena multiplica por u = largura da tela / 2,5).
export const MEDIDAS = { largura: SIMBOLO.largura / SIMBOLO.altura, altura: 1, profundidade: 0.2, chanfro: 0.06 } as const;

export function criarLogoDeVidro() {
  const formas = [SIMBOLO.lamina, SIMBOLO.braco, SIMBOLO.haste].flatMap((d) =>
    achatar(d, 4).map((p) => new THREE.Shape(p.map(([x, y]) => new THREE.Vector2(x / SIMBOLO.altura, -y / SIMBOLO.altura)))),
  );
  // Chanfro lateral fino, para não fechar os vãos do F.
  const g = new THREE.ExtrudeGeometry(formas, { depth: MEDIDAS.profundidade, bevelEnabled: true, bevelThickness: MEDIDAS.chanfro, bevelSize: 0.012, bevelSegments: 4, curveSegments: 4 });
  g.center();
  g.computeVertexNormals();
  return g;
}
