import { defineConfig } from '@playwright/test';

// Fora do CI usa o Chrome instalado na máquina; no CI, o Chromium do Playwright.
const canal = process.env.CI ? undefined : 'chrome';
const conversa = process.env.FLOWAY_E2E_PERFIL === 'conversa';

export default defineConfig({
  testDir: 'tests/e2e',
  testMatch: conversa ? '**/contato-b.spec.ts' : undefined,
  testIgnore: conversa ? [] : '**/contato-b.spec.ts',
  timeout: 60_000,
  workers: 1,
  use: { baseURL: 'http://localhost:3100', channel: canal, viewport: { width: 1440, height: 900 } },
  webServer: {
    command: 'NEXT_DIST_DIR=.next-teste npm run start -- -p 3100',
    url: 'http://localhost:3100',
    reuseExistingServer: false,
    timeout: 120_000,
    // Valores reservados, sem herdar credenciais reais; o perfil B intercepta nossas APIs no navegador.
    env: {
      CONTATO_ENVIO_ATIVO: conversa ? 'true' : 'false',
      CONTATO_IA_ATIVA: conversa ? 'true' : 'false',
      CONTATO_IA_CONTROLES_APROVADOS: conversa ? 'true' : 'false',
      CONTATO_ORIGEM: 'https://floway.example',
      CONTATO_CHAVE_HMAC: 'chave-exclusiva-de-e2e-sem-servico-externo-2026',
      CONTATO_CANAL: 'e2e-v1',
      RESEND_API_KEY: 're_e2e_sem_servico_externo',
      CONTATO_REMETENTE: 'Floway <noreply@example.com>',
      CONTATO_DESTINO: 'equipe@example.com',
      GEMINI_API_KEY: 'gemini_e2e_sem_servico_externo',
      GEMINI_MODELO: 'gemini-e2e-sem-servico',
      GEMINI_API_VERSAO: 'v1beta',
    },
  },
});
