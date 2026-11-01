import type { MetadataRoute } from 'next';

// O rastreamento fica liberado de propósito: bloquear impediria o robô de ler o noindex da página
// e o X-Robots-Tag do vercel.json, que são o que mantém o site fora dos buscadores até C5. Sem sitemap até lá.
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: '*', allow: '/' } };
}
