import type { MetadataRoute } from 'next';

// Fechado até a publicação (C5): nenhum robô entra, e não há sitemap para apontar.
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: '*', disallow: '/' } };
}
