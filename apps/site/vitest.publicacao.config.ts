import { defineConfig } from 'vitest/config';

// Só a trava de publicação (tests/publicacao). Não entra no CI até C2.
export default defineConfig({
  resolve: { alias: { '@': new URL('./src', import.meta.url).pathname } },
  test: { include: ['tests/publicacao/**/*.test.ts'], environment: 'node' },
});
