import { afterEach, expect, it, vi } from 'vitest';

afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); });

async function lerConfiguracao(perfil: 'alternativa' | 'conversa') {
  vi.stubEnv('FLOWAY_E2E_PERFIL', perfil);
  vi.stubEnv('RESEND_API_KEY', 'nao-pode-herdar-a-chave-do-ambiente');
  vi.stubEnv('GEMINI_API_KEY', 'nao-pode-herdar-a-chave-do-ambiente');
  vi.stubEnv('CONTATO_IA_ATIVA', 'true');
  vi.stubEnv('CONTATO_ENVIO_ATIVO', 'true');
  vi.stubEnv('CONTATO_IA_CONTROLES_APROVADOS', 'true');
  vi.stubEnv('GEMINI_API_VERSAO', 'nao-pode-herdar');
  vi.resetModules();
  const config = (await import('../../playwright.config')).default;
  const servidor = config.webServer;
  if (!servidor || Array.isArray(servidor)) throw new Error('O teste usa um servidor exclusivo por perfil.');
  return { config, servidor };
}

it('a alternativa desliga servicos e substitui credenciais herdadas do ambiente', async () => {
  const { config, servidor } = await lerConfiguracao('alternativa');
  expect(servidor.env).toMatchObject({ CONTATO_IA_ATIVA: 'false', CONTATO_ENVIO_ATIVO: 'false', CONTATO_IA_CONTROLES_APROVADOS: 'false', GEMINI_API_VERSAO: 'v1beta', RESEND_API_KEY: 're_e2e_sem_servico_externo', GEMINI_API_KEY: 'gemini_e2e_sem_servico_externo' });
  expect(servidor.reuseExistingServer).toBe(false);
  expect(config.testIgnore).toBe('**/contato-b.spec.ts');
});

it('a conversa usa configuracao exclusiva de teste e executa os cenarios B', async () => {
  const { config, servidor } = await lerConfiguracao('conversa');
  expect(servidor.env).toMatchObject({ CONTATO_IA_ATIVA: 'true', CONTATO_ENVIO_ATIVO: 'true', CONTATO_IA_CONTROLES_APROVADOS: 'true', GEMINI_API_VERSAO: 'v1beta', RESEND_API_KEY: 're_e2e_sem_servico_externo', GEMINI_API_KEY: 'gemini_e2e_sem_servico_externo', GEMINI_MODELO: 'gemini-e2e-sem-servico', CONTATO_DESTINO: 'equipe@example.com' });
  expect(servidor.reuseExistingServer).toBe(false);
  expect(config.testMatch).toBe('**/contato-b.spec.ts');
  expect(config.testIgnore).toEqual([]);
});
