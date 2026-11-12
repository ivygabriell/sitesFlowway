import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Os testes do build usam outra pasta, para não brigar com um `next dev` aberto na mesma máquina.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  reactStrictMode: false, // as timelines do GSAP e o canvas global não suportam montagem dupla no desenvolvimento
  transpilePackages: ['three'],
  // Raiz do monorepo: o npm workspaces instala as dependências (inclusive o next) no node_modules de lá. Com a raiz em
  // apps/site, as funções da Vercel subiam sem elas e toda rota dinâmica respondia 500.
  outputFileTracingRoot: join(dirname(fileURLToPath(import.meta.url)), '../..'),
};

export default nextConfig;
