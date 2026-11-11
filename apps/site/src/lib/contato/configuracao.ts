import 'server-only';

export function lerConfiguracao(env: Record<string, string | undefined> = process.env) {
  return {
    origem: env.CONTATO_ORIGEM ?? '', segredo: env.CONTATO_CHAVE_HMAC ?? '', canal: env.CONTATO_CANAL ?? '',
    envioAtivo: env.CONTATO_ENVIO_ATIVO === 'true', iaAtiva: env.CONTATO_IA_ATIVA === 'true', controlesIA: env.CONTATO_IA_CONTROLES_APROVADOS === 'true',
    resendKey: env.RESEND_API_KEY ?? '', remetente: env.CONTATO_REMETENTE ?? '', destino: env.CONTATO_DESTINO ?? '',
    geminiKey: env.GEMINI_API_KEY ?? '', modelo: env.GEMINI_MODELO ?? '', apiVersao: env.GEMINI_API_VERSAO ?? '',
  };
}
export type Configuracao = ReturnType<typeof lerConfiguracao>;
export function origemSegura(origem: string): boolean {
  try {
    const url = new URL(origem);
    // Fora de produção, http://localhost também vale, para testar a conversa no computador.
    const local = process.env.NODE_ENV !== 'production' && url.protocol === 'http:' && url.hostname === 'localhost';
    return (url.protocol === 'https:' || local) && url.origin === origem;
  } catch { return false; }
}
export function assinaturaConfigurada(c: Configuracao): boolean {
  return origemSegura(c.origem) && Buffer.byteLength(c.segredo, 'utf8') >= 32 && /^[a-zA-Z0-9_-]{1,128}$/.test(c.canal);
}
export function envioConfigurado(c: Configuracao): boolean {
  const email = /^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/;
  return assinaturaConfigurada(c) && !!c.resendKey.trim() && email.test(c.remetente) && email.test(c.destino);
}
export function iaConfigurada(c: Configuracao): boolean {
  return origemSegura(c.origem) && c.iaAtiva && c.controlesIA && !!c.geminiKey.trim() && /^[a-zA-Z0-9._-]{1,128}$/.test(c.modelo) && c.apiVersao === 'v1beta';
}
