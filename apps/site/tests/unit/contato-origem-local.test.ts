import { afterEach, describe, expect, it, vi } from 'vitest';
import { origemSegura } from '@/lib/contato/configuracao';

afterEach(() => vi.unstubAllEnvs());

describe('origemSegura', () => {
  it('aceita https e, só fora de produção, http://localhost para testar no computador', () => {
    expect(origemSegura('https://floway.com.br')).toBe(true);
    vi.stubEnv('NODE_ENV', 'development');
    expect(origemSegura('http://localhost:3310')).toBe(true);
    expect(origemSegura('http://exemplo.dev')).toBe(false);
    expect(origemSegura('http://localhost:3310/')).toBe(false);
    vi.stubEnv('NODE_ENV', 'production');
    expect(origemSegura('http://localhost:3310')).toBe(false);
  });
});
