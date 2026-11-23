// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { lerConfiguracao } from '@/lib/contato/configuracao';
import { validarIntencao } from '@/lib/contato/intencao';

// Emenda 1 do contato-b.1 (processo/contrato-api.md, registro 008): a Início, estática, recebe o DTO do contato por uma
// Server Action chamada só no clique de "Iniciar um projeto". Ressalvas (b), (c) e (d) do Security viram testes aqui.
const cabecalhos = vi.hoisted(() => ({ atual: new Headers() }));
vi.mock('next/headers', () => ({ headers: async () => cabecalhos.atual }));
const { emitirContato } = await import('@/lib/contato/acao');

const ORIGEM = 'https://floway.example';
const env = { CONTATO_ENVIO_ATIVO: 'true', CONTATO_ORIGEM: ORIGEM, CONTATO_CHAVE_HMAC: 'x'.repeat(64), CONTATO_CANAL: 'canal-1', RESEND_API_KEY: 'teste', CONTATO_REMETENTE: 'sender@example.test', CONTATO_DESTINO: 'dest@example.test' };
const comOrigem = (origem?: string) => { cabecalhos.atual = new Headers(origem ? { origin: origem, host: 'floway.example' } : { host: 'floway.example' }); };
const emitir = emitirContato as (...args: unknown[]) => Promise<unknown>;

// (d) Só Error comum ou FalhaContato: nada de notFound(), forbidden() ou redirect() (que carregam digest do Next).
async function rejeita(promessa: Promise<unknown>) {
  const erro = await promessa.then(() => null, (e: unknown) => e);
  expect(erro).toBeInstanceOf(Error);
  expect(erro).not.toHaveProperty('digest');
  return erro as Error;
}

beforeEach(() => { for (const [nome, valor] of Object.entries(env)) vi.stubEnv(nome, valor); comOrigem(ORIGEM); });
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });

describe('emitirContato (Server Action da Início)', () => {
  it('com idioma válido e a origem configurada, devolve o DTO com uma intenção que passa em validarIntencao', async () => {
    for (const idioma of ['pt', 'en'] as const) {
      const dto = await emitirContato(idioma);
      expect(dto).toMatchObject({ versao: 'contato-b.1', envioDisponivel: true });
      expect(Object.keys(dto).sort()).toEqual(['chave', 'conversaDisponivel', 'envioDisponivel', 'intencao', 'repetirAte', 'versao']);
      const valida = validarIntencao(dto.intencao!, idioma, lerConfiguracao(), Date.now());
      expect(dto.chave).toBe(valida.chave);
      expect(dto.repetirAte).toBe(valida.expiraEm);
    }
  });

  it('(b) origem válida com o envio desligado devolve o DTO indisponível, igual ao /contato', async () => {
    vi.stubEnv('CONTATO_ENVIO_ATIVO', 'false');
    expect(await emitirContato('pt')).toEqual({ versao: 'contato-b.1', intencao: null, chave: null, repetirAte: null, conversaDisponivel: false, envioDisponivel: false });
  });

  it('(b) sem origem configurada falha fechada, como as rotas', async () => {
    vi.stubEnv('CONTATO_ORIGEM', '');
    await rejeita(emitir('pt'));
    vi.stubEnv('CONTATO_ORIGEM', 'http://floway.example');
    comOrigem('http://floway.example');
    await rejeita(emitir('pt'));
  });

  it('Origin ausente, de outro site ou do mesmo host em http rejeita sem emitir', async () => {
    for (const origem of [undefined, 'https://outro.example', 'http://floway.example', 'https://floway.example.outro.com', 'null']) {
      comOrigem(origem);
      await rejeita(emitir('pt'));
    }
  });

  it('(c) entrada não confiável: só um argumento, "pt" ou "en"', async () => {
    for (const args of [[], ['pt', 'en'], ['pt', undefined], [{ idioma: 'pt' }], [['pt']], [null], ['PT'], ['es'], [1]]) {
      await rejeita(emitir(...args));
    }
  });

  it('não leva o token nem o DTO a log', async () => {
    const espioes = (['log', 'info', 'warn', 'error', 'debug', 'trace'] as const).map(m => vi.spyOn(console, m).mockImplementation(() => {}));
    const dto = await emitirContato('pt');
    comOrigem('https://outro.example');
    await rejeita(emitir('pt'));
    await rejeita(emitir('pt', 'en'));
    const registrado = JSON.stringify(espioes.flatMap(e => e.mock.calls));
    expect(registrado).not.toContain(dto.intencao!);
    expect(registrado).not.toContain(dto.chave!);
    expect(registrado).not.toContain(dto.intencao!.split('.')[2]);
  });

  it('o next.config não abre serverActions.allowedOrigins', async () => {
    const config = (await import(/* @vite-ignore */ new URL('../../next.config.mjs', import.meta.url).href)).default as { experimental?: { serverActions?: { allowedOrigins?: unknown } }; serverActions?: unknown };
    expect(config.experimental?.serverActions?.allowedOrigins).toBeUndefined();
    expect(config.serverActions).toBeUndefined();
  });
});
