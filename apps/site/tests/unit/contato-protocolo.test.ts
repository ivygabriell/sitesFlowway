// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { lerBytes, lerFormulario, validarConversa } from '@/lib/contato/protocolo';

const entrada = { idioma: 'pt', turnoId: '10000000-0000-4000-8000-000000000001', historico: [], mensagem: '  Quero um site\nnovo  ' };
describe('protocolo contato B', () => {
  it('limita bytes recebidos em partes, sem confiar Content-Length', async () => {
    const corpo = new ReadableStream({ start(c) { c.enqueue(new Uint8Array(32768)); c.enqueue(new Uint8Array(32768)); c.enqueue(new Uint8Array(1)); c.close(); } });
    const req = new Request('https://floway.example', { method: 'POST', body: corpo, duplex: 'half', headers: { 'content-length': '1' } } as RequestInit);
    await expect(lerBytes(req)).rejects.toMatchObject({ status: 413, codigo: 'CORPO_EXCESSIVO' });
    expect((await lerBytes(new Request('https://floway.example', { method: 'POST', body: 'x'.repeat(65536) }))).length).toBe(65536);
  });
  it('não deixa cliente lento segurar leitura além de 2s', async () => {
    vi.useFakeTimers();
    try {
      const req = new Request('https://floway.example', { method: 'POST', body: new ReadableStream(), duplex: 'half' } as RequestInit);
      const p = lerBytes(req);
      let resultado: unknown = null;
      void p.then(v => { resultado = v; }, e => { resultado = e; });
      await vi.advanceTimersByTimeAsync(2000);
      expect(resultado).toMatchObject({ status: 400, codigo: 'CORPO_INVALIDO' });
    } finally { vi.useRealTimers(); }
  });
  it('rejeita duplicados, desconhecidos, arquivos, tipo e sintaxe ilegíveis', async () => {
    for (const body of ['nome=a&nome=b', 'nome=a&extra=x']) {
      await expect(lerFormulario(new Request('https://floway.example', { method: 'POST', body, headers: { 'content-type': 'application/x-www-form-urlencoded' } }))).rejects.toMatchObject({ status: 422 });
    }
    const multipart = '--abc\r\nContent-Disposition: form-data; name="nome"; filename="a.txt"\r\nContent-Type: text/plain\r\n\r\na\r\n--abc--\r\n';
    await expect(lerFormulario(new Request('https://floway.example', { method: 'POST', body: multipart, headers: { 'content-type': 'multipart/form-data; boundary=abc' } }))).rejects.toMatchObject({ status: 422 });
    await expect(lerFormulario(new Request('https://floway.example', { method: 'POST', body: '{}' }))).rejects.toMatchObject({ status: 415 });
    await expect(lerFormulario(new Request('https://floway.example', { method: 'POST', body: '%GG', headers: { 'content-type': 'application/x-www-form-urlencoded' } }))).rejects.toMatchObject({ status: 400 });
  });
  it('normaliza sem perder quebras e valida turnos/pares/papéis/total UTF16', () => {
    expect(validarConversa(entrada).mensagem).toBe('Quero um site\nnovo');
    const ruins = [null, { ...entrada, turnoId: 'abc' }, { ...entrada, extra: 1 }, { ...entrada, mensagem: {} }, { ...entrada, mensagem: '😀'.repeat(1001) }, { ...entrada, historico: [{ papel: 'usuario', texto: 'Oi' }] }, { ...entrada, historico: [{ papel: 'system', texto: 'Oi' }, { papel: 'assistente', texto: 'Oi' }] }, { ...entrada, historico: Array.from({ length: 20 }, (_, i) => ({ papel: i % 2 ? 'assistente' : 'usuario', texto: 'Oi' })) }, { ...entrada, historico: Array.from({ length: 6 }, (_, i) => ({ papel: i % 2 ? 'assistente' : 'usuario', texto: 'a'.repeat(1500) })), mensagem: 'a'.repeat(2000) }];
    for (const ruim of ruins) expect(() => validarConversa(ruim)).toThrow('VALIDACAO');
  });
});
