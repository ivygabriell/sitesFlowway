#!/usr/bin/env bash
# Gera os sites dos conceitos (repositório CreateHubAI/sitesOfertas, em SITES) dentro do site oficial, em
# apps/site/public/conceitos/<slug>/, com a base /conceitos/<slug>/. Não altera o repositório de Sites.
# Uso: scripts/conceitos/gerar.sh   (SITES=<pasta dos sites>, padrão C:/Users/rafae/Sites)
set -euo pipefail
raiz="$(cd "$(dirname "$0")/../.." && pwd)"
sites="${SITES:-C:/Users/rafae/Sites}"
cfg="$raiz/scripts/conceitos/vite.conceito.mjs"
for par in "LandPage:ferramenta-criativa" "Site Avião:companhia-aerea" "Landpage1:banco-digital" "portfolio:estudio-de-marca" "Landpage2:plataforma-de-deploy"; do
  pasta="${par%%:*}"; slug="${par##*:}"
  (cd "$sites/$pasta" && SLUG="$slug" SAIDA="$raiz/apps/site/public/conceitos/$slug" npx vite build --config "$cfg" --logLevel warn)
  echo "$pasta -> /conceitos/$slug/"
done
