'use client';

import { 'inicio-manifesto' as textos } from '@/conteudo/inicio-manifesto';
import { t } from '@/conteudo/textos';
import { useIdioma } from '@/lib/useIdioma';

// Cópias por linha: duas paradas (0° e 180°) e cinco girando com atrasos escalonados.
const COPIAS = ['parada', 'parada-invertida', 'g1', 'g2', 'g3', 'g4', 'g5'];
const LINHAS = ['linha-1', 'linha-2', 'linha-3'];
export const TAMANHOS_CAIXAS: [number, number][] = [
  [43, 66], [74, 110], [110, 170], [160, 250], [230, 370], [330, 530], [454, 803], [620, 1076], [780, 1240], [980, 1430],
];
// Foto da lateral (spec 4.3, "Silhueta Abstrata em Movimento"), já desfocada no arquivo; o cinza vem do CSS.
export const FOTO_LATERAL = '/inicio/cubo-lateral.webp';

// Bloco 3D de 1000×600: na frente, a palavra em contorno girando; na lateral, retângulos sobre a foto.
export function CuboMarca() {
  const idioma = useIdioma();
  const palavra = t(textos.palavraCubo, idioma);

  return (
    <div className="cubo-palco">
      <div className="cubo-escala">
        <div className="cubo">
          <div className="cubo-frente" aria-hidden="true">
            {LINHAS.map((linha) =>
              COPIAS.map((copia) => (
                <span key={`${linha}-${copia}`} className={`palavra-contorno ${linha} ${copia}`}>
                  {palavra}
                </span>
              )),
            )}
          </div>
          <div className="cubo-lado" style={{ backgroundImage: `url(${FOTO_LATERAL})` }}>
            {TAMANHOS_CAIXAS.map(([l, a], i) => (
              <span key={i} className="caixa" style={{ width: l, height: a }} />
            ))}
            <p className="cubo-legenda">{t(textos.legenda, idioma)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
