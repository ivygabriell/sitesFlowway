// @vitest-environment node
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { entregarResend } from '@/lib/contato/resend';
import { lerConfiguracao } from '@/lib/contato/configuracao';

const agora = Date.parse('2026-11-05T12:00:00Z');
const configuracao = lerConfiguracao({ CONTATO_ENVIO_ATIVO: 'true', CONTATO_ORIGEM: 'https://floway.example', CONTATO_CHAVE_HMAC: 'x'.repeat(64), CONTATO_CANAL: 'canal-1', RESEND_API_KEY: 'teste', CONTATO_REMETENTE: 'sender@example.test', CONTATO_DESTINO: 'dest@example.test' });
const intencao = { chave: 'contato/10000000-0000-4000-8000-000000000001', expiraEm: '2026-11-06T11:00:00.000Z', canal: 'canal-1' };
const pedido = { nome: 'Pessoa', empresa: '', contato: '<b>livre</b>', mensagem: 'Um site\ncom contato' };
const id = '20000000-0000-4000-8000-000000000001';
const agoraFn = () => agora;
beforeEach(() => vi.useRealTimers());
afterEach(() => vi.useRealTimers());

describe('Resend na fronteira de fetch', () => {
  it('duas chamadas simultâneas disputam a mesma chave no provedor, não no Map local', async () => {
    let liberar!: () => void;
    const pendente = new Promise<void>(r => { liberar = r; });
    let entrou = false;
    let efeitos = 0;
    const f: typeof fetch = async () => {
      if (entrou) return Response.json({ name: 'concurrent_idempotent_requests' }, { status: 409 });
      entrou = true;
      efeitos++;
      await pendente;
      return Response.json({ id });
    };
    const primeira = entregarResend(pedido, intencao, { configuracao, fetch: f, agora: agoraFn });
    const segunda = entregarResend(pedido, intencao, { configuracao, fetch: f, agora: agoraFn });
    expect(await segunda).toMatchObject({ status: 409, codigo: 'ENVIO_EM_ANDAMENTO', estado: 'incerto' });
    liberar();
    expect(await primeira).toMatchObject({ estado: 'aceito' });
    expect(efeitos).toBe(1);
  });
  it('corpo de resposta que trava também permanece dentro dos 8s', async () => {
    vi.useFakeTimers();
    const p = entregarResend(pedido, intencao, { configuracao, agora: agoraFn, fetch: async () => new Response(new ReadableStream()) });
    let resultado: unknown = null;
    void p.then(r => { resultado = r; });
    await vi.advanceTimersByTimeAsync(8000);
    expect(resultado).toMatchObject({ status: 202, estado: 'incerto' });
  });
  it('replay após perda de resposta e reinício usa mesma chave e BYTES, com um efeito', async () => {
    const registros = new Map<string, { bytes: string; emCurso: boolean; id: string }>();
    const recebidos: string[] = [];
    let efeitos = 0;
    let perderResposta = true;
    const fetchFalso: typeof fetch = async (_url, init) => {
      const chave = new Headers(init?.headers).get('Idempotency-Key')!;
      const bytes = String(init?.body);
      recebidos.push(bytes);
      const anterior = registros.get(chave);
      if (anterior && anterior.bytes !== bytes) return Response.json({ name: 'invalid_idempotent_request' }, { status: 409 });
      if (anterior?.emCurso) return Response.json({ name: 'concurrent_idempotent_requests' }, { status: 409 });
      if (!anterior) { efeitos++; registros.set(chave, { bytes, id, emCurso: false }); }
      if (perderResposta) { perderResposta = false; throw new TypeError('resposta perdida após aceitação'); }
      return Response.json({ id });
    };
    const dep = { configuracao, fetch: fetchFalso, agora: agoraFn };
    expect(await entregarResend(pedido, intencao, dep)).toMatchObject({ estado: 'incerto', codigo: 'RESULTADO_INCERTO' });
    vi.resetModules();
    const { entregarResend: depoisReinicio } = await import('@/lib/contato/resend');
    expect(await depoisReinicio({ ...pedido }, { ...intencao }, { ...dep })).toMatchObject({ estado: 'aceito' });
    expect(efeitos).toBe(1);
    expect(recebidos[0]).toBe(recebidos[1]);
    const payload = JSON.parse(recebidos[0]);
    expect(payload).toEqual({ from: 'sender@example.test', to: ['dest@example.test'], subject: 'Contato Floway', text: 'Nome: Pessoa\nEmpresa: \nContato: <b>livre</b>\n\nUm site\ncom contato' });
    expect(payload).not.toHaveProperty('reply_to');
    expect(await entregarResend({ ...pedido, mensagem: 'Outro' }, intencao, dep)).toMatchObject({ status: 409, codigo: 'INTENCAO_JA_UTILIZADA' });
    registros.get(intencao.chave)!.emCurso = true;
    expect(await entregarResend(pedido, intencao, dep)).toMatchObject({ status: 409, estado: 'incerto', retryAfter: 2 });
    expect(efeitos).toBe(1);
  });
  it('só aceita UUID verificável, distingue recusa conclusiva de 5xx/rede/429', async () => {
    for (const [status, corpo, esperado] of [
      [200, {}, { estado: 'incerto' }],
      [200, { id: 'qualquer' }, { estado: 'incerto' }],
      [200, { id }, { estado: 'aceito' }],
      [503, { name: 'internal_server_error' }, { estado: 'incerto' }],
      [400, { name: 'validation_error' }, { status: 502, codigo: 'ENTREGA_RECUSADA' }],
      [401, { name: 'validation_error' }, { status: 502, codigo: 'ENTREGA_RECUSADA' }],
      [403, { name: 'validation_error' }, { status: 502, codigo: 'ENTREGA_RECUSADA' }],
      [422, { name: 'invalid_parameter' }, { status: 502, codigo: 'ENTREGA_RECUSADA' }],
      [401, { name: 'missing_api_key' }, { status: 502, codigo: 'ENTREGA_RECUSADA' }],
      [403, { name: 'restricted_api_key' }, { status: 502, codigo: 'ENTREGA_RECUSADA' }],
      [401, { name: 'sinal_desconhecido' }, { estado: 'incerto' }],
      [429, { name: 'rate_limit_exceeded' }, { status: 503, codigo: 'ENTREGA_INDISPONIVEL' }],
    ] as const) {
      const r = await entregarResend(pedido, intencao, { configuracao, agora: agoraFn, fetch: async () => Response.json(corpo, { status }) });
      expect(r).toMatchObject(esperado);
    }
  });
  it('não chama sem configuração, canal coerente ou nos últimos 30s', async () => {
    const fetchFalso = vi.fn();
    for (const [config, tempo] of [[lerConfiguracao({}), agora], [configuracao, Date.parse(intencao.expiraEm) - 30000], [{ ...configuracao, canal: 'novo' }, agora]] as const) {
      expect((await entregarResend(pedido, intencao, { configuracao: config, agora: () => tempo, fetch: fetchFalso })).estado).not.toBe('aceito');
    }
    expect(fetchFalso).not.toHaveBeenCalled();
  });
  it('encerra fetch pendente em 8s como resultado incerto sem repetir', async () => {
    vi.useFakeTimers();
    const fetchFalso = vi.fn(() => new Promise<Response>(() => {}));
    const promessa = entregarResend(pedido, intencao, { configuracao, agora: agoraFn, fetch: fetchFalso });
    await vi.advanceTimersByTimeAsync(8000);
    expect(await promessa).toMatchObject({ status: 202, estado: 'incerto' });
    expect(fetchFalso).toHaveBeenCalledTimes(1);
  });
});
