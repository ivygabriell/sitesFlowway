// Build de um site de C:\Users\rafae\Sites para dentro do site oficial, em /conceitos/<slug>/, sem tocar no repositório
// de Sites: reaproveita a config da pasta (se houver), troca a base e a saída e corrige caminhos absolutos no JS.
// Uso: scripts/conceitos/gerar.sh (roda o vite build de dentro de cada pasta com SLUG e SAIDA).
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const slug = process.env.SLUG;
const saida = process.env.SAIDA;
if (!slug || !saida) throw new Error('Defina SLUG e SAIDA.');
const base = `/conceitos/${slug}/`;
const original = resolve('vite.config.js');
const cfg = existsSync(original) ? (await import(pathToFileURL(original).href)).default : {};

export default {
  ...cfg,
  root: process.cwd(),
  base,
  build: { ...(cfg.build ?? {}), outDir: saida, emptyOutDir: true },
  plugins: [
    ...(cfg.plugins ?? []),
    {
      name: 'base-nos-caminhos-do-js',
      enforce: 'pre',
      transform(codigo, id) {
        if (!/\.(m?js|ts)$/.test(id) || id.includes('node_modules')) return null;
        return codigo.replace(/([`"'])\/(imagens|img)\//g, `$1${base}$2/`);
      },
    },
  ],
};
