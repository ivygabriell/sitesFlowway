// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { createHmac } from 'node:crypto';
vi.mock('server-only', () => ({}));
import { criarIntencao, validarIntencao } from '@/lib/contato/intencao';
import { lerConfiguracao } from '@/lib/contato/configuracao';

const agora = Date.parse('2026-11-05T12:00:00Z');
const config = lerConfiguracao({ CONTATO_ORIGEM: 'https://floway.example', CONTATO_CHAVE_HMAC: 'x'.repeat(64), CONTATO_CANAL: 'canal-1' });
describe('intenção assinada', () => {
  it('deriva chave sem dados pessoais e fixa 23 horas', () => {
    const token = criarIntencao('pt', config, agora);
    const r = validarIntencao(token, 'pt', config, agora);
    expect(token.length).toBeLessThanOrEqual(1024);
    expect(r.chave).toMatch(/^contato\/[0-9a-f-]{36}$/);
    expect(r.expiraEm).toBe('2026-11-06T11:00:00.000Z');
  });
  it('recusa adulteração, língua e canal diferentes, futuro e expiração', () => {
    const token = criarIntencao('pt', config, agora);
    expect(() => validarIntencao(token + 'x', 'pt', config, agora)).toThrow('INTENCAO_INVALIDA');
    expect(() => validarIntencao(token, 'en', config, agora)).toThrow('INTENCAO_INVALIDA');
    expect(() => validarIntencao(token, 'pt', { ...config, canal: 'outro' }, agora)).toThrow('INTENCAO_INVALIDA');
    expect(() => validarIntencao(token, 'pt', config, agora - 1)).toThrow('INTENCAO_INVALIDA');
    expect(() => validarIntencao(token, 'pt', config, agora + 23 * 3600000)).toThrow('INTENCAO_EXPIRADA');
    expect(() => validarIntencao('x'.repeat(1025), 'pt', config, agora)).toThrow('INTENCAO_INVALIDA');
  });
  it('não emite intenção com origem insegura ou chave ausente', () => {
    expect(() => criarIntencao('pt', lerConfiguracao({}), agora)).toThrow();
    expect(() => criarIntencao('pt', { ...config, origem: 'http://floway.example' }, agora)).toThrow();
  });
  it('valida também estrutura, datas e duplicados de payload com assinatura correta', () => {
    const payload = { v: 1, id: '10000000-0000-4000-8000-000000000001', idioma: 'pt', emitidaEm: '2026-11-05T12:00:00.000Z', expiraEm: '2026-11-06T11:00:00.000Z', canal: 'canal-1' };
    const assinar = (json: string) => {
      const b64 = Buffer.from(json).toString('base64url');
      return `v1.${b64}.${createHmac('sha256', config.segredo).update(`v1.${b64}`).digest('base64url')}`;
    };
    const duplicado = JSON.stringify(payload).replace('"v":1', '"v":1,"v":1');
    for (const json of [duplicado, ...[{ ...payload, v: 2 }, { ...payload, id: 'sem-uuid' }, { ...payload, emitidaEm: 1 }, { ...payload, expiraEm: '2026-11-06T12:00:00.000Z' }, { ...payload, extra: true }, { ...payload, idioma: 'fr' }].map(p => JSON.stringify(p))]) {
      expect(() => validarIntencao(assinar(json), 'pt', config, agora)).toThrow('INTENCAO_INVALIDA');
    }
  });
});
