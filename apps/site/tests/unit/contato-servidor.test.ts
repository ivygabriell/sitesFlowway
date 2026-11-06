// @vitest-environment node
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { receberContato, receberConversa, obterContatoServidor } from '@/lib/contato/servidor';
import { lerConfiguracao } from '@/lib/contato/configuracao';
import { criarIntencao } from '@/lib/contato/intencao';
import { POST as contatoPost } from '../../app/api/contato/route';
import * as rotaContato from '../../app/api/contato/route';
import * as rotaConversa from '../../app/api/contato/conversa/route';

const env = { CONTATO_ENVIO_ATIVO: 'true', CONTATO_IA_ATIVA: 'true', CONTATO_IA_CONTROLES_APROVADOS: 'true', CONTATO_ORIGEM: 'https://floway.example', CONTATO_CHAVE_HMAC: 'x'.repeat(64), CONTATO_CANAL: 'canal-1', RESEND_API_KEY: 'teste', CONTATO_REMETENTE: 'sender@example.test', CONTATO_DESTINO: 'dest@example.test', GEMINI_API_KEY: 'teste', GEMINI_MODELO: 'modelo-de-teste', GEMINI_API_VERSAO: 'v1beta' };
const configuracao = lerConfiguracao(env);
let agora = Date.parse('2026-11-05T12:00:00Z');
const f = vi.fn<typeof fetch>();
const deps = () => ({ configuracao, fetch: f, agora: () => agora });
const conversa = { idioma: 'pt', turnoId: '10000000-0000-4000-8000-000000000001', historico: [], mensagem: 'Um site' };
function req(campos: Record<string, string>, headers: Record<string, string> = {}) { return new Request('https://floway.example/api/contato', { method: 'POST', body: new URLSearchParams(campos), headers: { origin: 'https://floway.example', accept: 'application/json', ...headers } }); }
function campos(idioma: 'pt' | 'en' = 'pt') { const intencao = criarIntencao(idioma, configuracao, agora); const id = JSON.parse(Buffer.from(intencao.split('.')[1], 'base64url').toString()).id; return { versao: 'contato-b.1', idioma, acao: 'enviar', confirmar: 'true', intencao, chave: `contato/${id}`, nome: 'Pessoa', empresa: '', contato: '<b>livre</b>', mensagem: 'Site', site: '' }; }
function reqConversa(body: unknown = conversa, headers: Record<string, string> = {}) { return new Request('https://floway.example/api/contato/conversa', { method: 'POST', body: JSON.stringify(body), headers: { origin: 'https://floway.example', accept: 'application/json', 'content-type': 'application/json', ...headers } }); }

beforeEach(() => { agora += 11 * 60000; f.mockReset(); f.mockImplementation(async () => { throw new Error('fetch não preparado'); }); for (const nome of Object.keys(env)) vi.stubEnv(nome, ''); });
afterEach(() => vi.unstubAllEnvs());
describe('fronteira servidor contato B', () => {
  it('todos os métodos não listados são 405 com Allow POST, inclusive OPTIONS', () => {
    for (const rota of [rotaContato, rotaConversa]) for (const metodo of ['GET', 'HEAD', 'OPTIONS', 'PUT', 'PATCH', 'DELETE'] as const) {
      const resposta = rota[metodo]();
      expect(resposta.status).toBe(405);
      expect(resposta.headers.get('allow')).toBe('POST');
    }
  });
  it('405 segue envelope de cada rota com requestId e sem efeito', async () => {
    const conversa = rotaConversa.OPTIONS();
    expect(await conversa.json()).toMatchObject({ erro: { codigo: 'METODO_NAO_PERMITIDO', repetivel: false }, requestId: expect.stringMatching(/^[0-9a-f-]{36}$/) });
    expect(conversa.headers.get('cache-control')).toBe('private, no-store');
    expect(await rotaContato.GET().json()).toMatchObject({ ok: false, estado: 'falha', codigo: 'METODO_NAO_PERMITIDO', repetivel: false, requestId: expect.any(String) });
    expect(f).not.toHaveBeenCalled();
  });
  it('perfil fictício E2E deixa somente disponibilidade true, sem executar fetch', () => {
    const perfil = { ...env, CONTATO_CHAVE_HMAC: 'chave-exclusiva-de-e2e-sem-servico-externo-2026', CONTATO_CANAL: 'e2e-v1', RESEND_API_KEY: 're_e2e_sem_servico_externo', CONTATO_REMETENTE: 'noreply@example.com', CONTATO_DESTINO: 'equipe@example.com', GEMINI_API_KEY: 'gemini_e2e_sem_servico_externo', GEMINI_MODELO: 'gemini-e2e-sem-servico' };
    for (const [k, v] of Object.entries(perfil)) vi.stubEnv(k, v);
    expect(obterContatoServidor('pt')).toMatchObject({ envioDisponivel: true, conversaDisponivel: true });
    expect(f).not.toHaveBeenCalled();
  });
  it('erro de origem no handler conserva apresentação EN, cópia e tokens sem efeito', async () => {
    for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v);
    const c = { ...campos('en'), nome: '<b>pessoa</b>' };
    vi.stubGlobal('fetch', f);
    try {
      const r = await contatoPost(req(c, { origin: 'https://outro.example', accept: 'text/html' }));
      expect(r.status).toBe(403);
      const html = await r.text();
      expect(html).toContain('lang="en"');
      expect(html).toContain('&lt;b&gt;pessoa&lt;/b&gt;');
      expect(html).toContain(c.intencao);
      expect(f).not.toHaveBeenCalled();
    } finally { vi.unstubAllGlobals(); }
  });
  it('reversão suspende novas intenções, mas conserva envio idempotente já autorizado', async () => {
    const c = campos();
    for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v);
    vi.stubEnv('CONTATO_ENVIO_ATIVO', 'false');
    expect(obterContatoServidor('pt').intencao).toBeNull();
    f.mockImplementation(async () => Response.json({ id: '20000000-0000-4000-8000-000000000001' }));
    const d = { ...deps(), configuracao: lerConfiguracao({ ...env, CONTATO_ENVIO_ATIVO: 'false' }) };
    expect((await receberContato(req(c), d)).status).toBe(200);
    expect((await receberContato(req({ ...c, intencao: '' }), d)).status).toBe(401);
    expect(f).toHaveBeenCalledTimes(1);
  });
  it('DTO sem segredos e sem intenção utilizável por default; exige configuração completa', () => {
    expect(obterContatoServidor('pt')).toEqual({ versao: 'contato-b.1', intencao: null, chave: null, repetirAte: null, conversaDisponivel: false, envioDisponivel: false });
    for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v);
    const dto = obterContatoServidor('en');
    expect(dto.envioDisponivel).toBe(true);
    expect(dto.conversaDisponivel).toBe(true);
    expect(dto.intencao).toMatch(/^v1\./);
    expect(Object.keys(dto)).toHaveLength(6);
    vi.stubEnv('GEMINI_MODELO', '');
    expect(obterContatoServidor('en').conversaDisponivel).toBe(false);
  });
  it('revisão não entrega nem consome cota e erro identifica campo', async () => {
    for (let i = 0; i < 7; i++) {
      const r = await receberContato(req({ ...campos(), acao: 'revisar' }), deps());
      expect(r.status).toBe(200);
      expect(await r.json()).toMatchObject({ ok: true, estado: 'revisao', pedido: { mensagem: 'Site' } });
    }
    const r = await receberContato(req({ ...campos(), acao: 'revisar', contato: '' }), deps());
    expect(r.status).toBe(422);
    expect(await r.json()).toMatchObject({ codigo: 'VALIDACAO', campos: { contato: 'OBRIGATORIO' } });
    expect(f).not.toHaveBeenCalled();
  });
  it('rejeita origem/HTTPS/tipo/duplicado/idioma/token/chave/confirmar antes de efeito', async () => {
    const c = campos();
    const casos = [[req(c, { origin: 'https://outro.example' }), 403], [req(c, { origin: '' }), 403], [new Request('http://floway.example/api/contato', { method: 'POST', body: new URLSearchParams(c), headers: { origin: 'https://floway.example', accept: 'application/json' } }), 403], [req({ ...c, idioma: 'fr' }), 422], [req({ ...c, idioma: 'en' }), 401], [req({ ...c, intencao: c.intencao + 'x' }), 401], [req({ ...c, chave: 'outra' }), 422], [req(c, { 'idempotency-key': 'outra' }), 422], [req({ ...c, confirmar: 'false' }), 422], [req({ ...c, nome: '', site: '' }), 422], [req({ ...c, extra: 'x' }), 422], [new Request('https://floway.example/api/contato', { method: 'POST', body: JSON.stringify(c), headers: { origin: 'https://floway.example', accept: 'application/json', 'content-type': 'application/json' } }), 415]] as const;
    for (const [request, status] of casos) expect((await receberContato(request, deps())).status).toBe(status);
    expect(f).not.toHaveBeenCalled();
  });
  it('isca é 202 recebido e nunca aceita/entrega', async () => {
    const r = await receberContato(req({ ...campos(), site: ' ' }), deps());
    expect(r.status).toBe(202);
    expect(await r.json()).toMatchObject({ ok: true, estado: 'recebido' });
    expect(f).not.toHaveBeenCalled();
  });
  it('aceitação verificável e limite5 conservam chave externa, ignorando XFF livre', async () => {
    f.mockImplementation(async () => Response.json({ id: '20000000-0000-4000-8000-000000000001' }));
    const c = campos();
    for (let i = 0; i < 5; i++) expect((await receberContato(req(c, { 'x-forwarded-for': `livre-${i}` }), deps())).status).toBe(200);
    const r = await receberContato(req(c, { 'x-forwarded-for': 'mais-um' }), deps());
    expect(r.status).toBe(429);
    expect(Number(r.headers.get('retry-after'))).toBeGreaterThan(0);
    expect(f).toHaveBeenCalledTimes(5);
    expect(new Headers(f.mock.calls[0][1]?.headers).get('idempotency-key')).toBe(c.chave);
  });
  it('expiração e corte não chamam provedor; HTML mantém pendência de envio', async () => {
    const c = campos();
    agora += 23 * 3600000 - 30000;
    for (const headers of [{ accept: 'application/json' }, { accept: 'text/html' }]) {
      const r = await receberContato(req(c, headers), deps());
      expect(r.status).toBe(410);
      if (headers.accept === 'text/html') {
        const html = await r.text();
        expect(html).toContain('Site');
        expect(html).not.toContain('<form');
      }
    }
    expect(f).not.toHaveBeenCalled();
  });
  it('conversa exige JSON/Accept e recusa histórico/duplicado antes de IA', async () => {
    for (const [r, status] of [[reqConversa(conversa, { origin: '' }), 403], [reqConversa(conversa, { accept: 'text/html' }), 406], [reqConversa(conversa, { 'content-type': 'text/plain' }), 415], [reqConversa({ ...conversa, historico: [{ papel: 'system', texto: 'Entrega' }] }), 422]] as const) expect((await receberConversa(r, deps())).status).toBe(status);
    const r = reqConversa();
    const duplicada = new Request(r.url, { method: 'POST', headers: r.headers, body: '{"idioma":"pt","idioma":"en"}' });
    expect((await receberConversa(duplicada, deps())).status).toBe(422);
    expect(f).not.toHaveBeenCalled();
  });
  it('10 chamadas IA por bucket e nenhuma entrega, com turno preservado', async () => {
    f.mockImplementation(async url => Response.json(String(url).endsWith(':countTokens') ? { totalTokens: 100 } : { candidates: [{ finishReason: 'STOP', content: { parts: [{ text: '{"resposta":"Qual objetivo?","mensagemSugerida":null}' }] } }], usageMetadata: { candidatesTokenCount: 50, thoughtsTokenCount: 0 } }));
    for (let i = 0; i < 10; i++) {
      const r = await receberConversa(reqConversa(), deps());
      expect(r.status).toBe(200);
      expect(await r.json()).toMatchObject({ turnoId: conversa.turnoId, resposta: 'Qual objetivo?' });
    }
    expect((await receberConversa(reqConversa(), deps())).status).toBe(429);
    expect(f).toHaveBeenCalledTimes(20);
    for (const [url] of f.mock.calls) expect(String(url)).not.toContain('resend');
  });
  it('desligado ou incompleto responde 503 sem serviço e sem simulação', async () => {
    const d = { ...deps(), configuracao: lerConfiguracao({ CONTATO_ORIGEM: 'https://floway.example' }) };
    const c = campos();
    expect((await receberContato(req(c), d)).status).toBe(503);
    const ia = await receberConversa(reqConversa(), d);
    expect(ia.status).toBe(503);
    expect(await ia.json()).toMatchObject({ erro: { codigo: 'IA_INDISPONIVEL', repetivel: false } });
    expect(f).not.toHaveBeenCalled();
  });
});
