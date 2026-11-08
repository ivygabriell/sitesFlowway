import { describe, expect, it } from 'vitest';
import { receberContato, receberConversa, metodoNaoPermitido } from '@/lib/contato/servidor';
import { lerConfiguracao } from '@/lib/contato/configuracao';
import { responderContatoHtml, type EstadoHtml } from '@/lib/contato/html';

const base: EstadoHtml = { status: 200, idioma: 'pt', acao: 'revisar', estado: 'revisao', pedido: { nome: '<b>"Pessoa"</b>', empresa: '</textarea><script>bad()</script>', contato: 'pessoa@example.test', mensagem: '<b>literal</b>\nOutra linha' }, intencao: 'token-original', chave: 'contato/10000000-0000-4000-8000-000000000001', repetirAte: '2026-11-06T11:00:00.000Z', agora: Date.parse('2026-11-05T12:00:00Z') };
async function dom(estado: EstadoHtml) { const r = responderContatoHtml(estado); return { r, d: new DOMParser().parseFromString(await r.text(), 'text/html') }; }

describe('HTML nativo do contato', () => {
  it.each([
    [200, 'revisao', 'revisar'], [422, 'falha', 'revisar'], [403, 'falha', 'revisar'],
    [200, 'aceito', 'enviar'], [202, 'recebido', 'enviar'], [202, 'incerto', 'enviar'],
    [429, 'falha', 'enviar'], [503, 'falha', 'enviar'], [409, 'incerto', 'enviar'], [410, 'incerto', 'enviar'],
  ])('estado %i/%s mantém POST interno e proteções privadas', (status, estado, acao) => {
    const r = responderContatoHtml({ ...base, status: Number(status), estado: String(estado), acao: String(acao) });
    expect(r.headers.get('referrer-policy')).toBe('same-origin');
    expect(r.headers.get('cache-control')).toBe('private, no-store');
    expect(r.headers.get('x-robots-tag')).toBe('noindex');
    expect(r.headers.get('content-security-policy')).toBe("default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'");
  });
  it.each(['pt', 'en'] as const)('revisão %s preserva valores como texto e confirma no POST sem recursos terceiros', async idioma => {
    const { r, d } = await dom({ ...base, idioma });
    expect(r.status).toBe(200);
    expect(r.headers.get('cache-control')).toBe('private, no-store');
    expect(r.headers.get('referrer-policy')).toBe('same-origin');
    expect(r.headers.get('x-robots-tag')).toBe('noindex');
    expect(d.documentElement.lang).toBe(idioma);
    expect(d.querySelector('script,b,iframe,img')).toBeNull();
    expect(d.body.textContent).toContain('<b>literal</b>');
    expect(d.querySelector<HTMLInputElement>('[name=nome]')?.value).toBe(base.pedido.nome);
    expect(d.querySelector('[name=intencao]')?.getAttribute('value')).toBe('token-original');
    expect(d.querySelector('form')?.getAttribute('action')).toBe('/api/contato');
    expect(d.querySelector('[name=confirmar]')?.getAttribute('value')).toBe('true');
    for (const a of d.querySelectorAll('a')) expect(a.getAttribute('href')).not.toContain('pessoa');
    expect(d.querySelector('details input[name=nome]') || d.querySelector('details textarea[name=mensagem]')).not.toBeNull();
  });
  it('erro de revisão conserva campos editáveis e resumo com foco e rótulos associados', async () => {
    const { r, d } = await dom({ ...base, estado: 'falha', status: 422, codigo: 'VALIDACAO', campos: { contato: 'OBRIGATORIO' } });
    expect(r.status).toBe(422);
    expect(d.querySelector('.formulario-erros[tabindex="-1"] h2[role=alert]')).not.toBeNull();
    const input = d.querySelector<HTMLInputElement>('#pedido-contato')!;
    expect(input.value).toBe(base.pedido.contato);
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(d.querySelector('label[for=pedido-contato]')).not.toBeNull();
    expect(d.getElementById(input.getAttribute('aria-describedby')!)).not.toBeNull();
    expect(d.querySelector('[name=intencao]')?.getAttribute('value')).toBe('token-original');
  });
  it.each([202, 429, 503, 409])('envio %i mantém cópia imutável e repetição conservadora sem Ajustar', async status => {
    const { r, d } = await dom({ ...base, acao: 'enviar', estado: status === 202 ? 'incerto' : 'falha', status, codigo: 'RESULTADO_INCERTO', retryAfter: 120 });
    expect(r.status).toBe(status);
    expect(r.headers.get('retry-after')).toBe('120');
    expect(d.querySelector('details')).toBeNull();
    expect(d.querySelector('input:not([type=hidden]),textarea')).toBeNull();
    expect(d.querySelector('[name=mensagem]')?.getAttribute('value')).toBe(base.pedido.mensagem);
    expect(d.querySelector('[name=chave]')?.getAttribute('value')).toBe(base.chave);
    expect(d.querySelector('[name=acao]')?.getAttribute('value')).toBe('enviar');
    expect(d.querySelector('[name=confirmar]')?.getAttribute('value')).toBe('true');
    expect(d.body.textContent).toContain('120');
    expect(d.body.textContent).not.toMatch(/Pedido enviado|Ajustar/);
  });
  it('prazo esgotado ou espera além do corte conserva pendência sem nova submissão', async () => {
    for (const agora of [Date.parse(base.repetirAte!), Date.parse(base.repetirAte!) - 100000]) {
      const { d } = await dom({ ...base, status: 410, codigo: 'INTENCAO_EXPIRADA', acao: 'enviar', estado: 'incerto', agora, retryAfter: 120 });
      expect(d.querySelector('form,button,details')).toBeNull();
      expect(d.querySelector('[name=intencao]')?.getAttribute('value')).toBe(base.intencao);
      expect(d.querySelector('[name=chave]')?.getAttribute('value')).toBe(base.chave);
      expect(d.querySelector('[name=idioma]')?.getAttribute('value')).toBe('pt');
      expect(d.body.textContent).toContain(base.pedido.mensagem);
      expect(d.body.textContent).toContain('conferência');
    }
  });
  it('aceitação verificável encerra pendência sem formulário', async () => {
    const { d } = await dom({ ...base, acao: 'enviar', estado: 'aceito' });
    expect(d.querySelector('form')).toBeNull();
    expect(d.querySelector('[role=status]')?.textContent).toContain('aceito');
  });
});

it('apresentação nativa reutiliza frase/rodapé e mostra erros humanos iguais no link e campo com foco no resumo', async () => {
  const { d } = await dom({ ...base, estado: 'falha', status: 422, campos: { nome: 'OBRIGATORIO', mensagem: 'LONGO' } });
  expect(d.querySelector('h1.frase-contato')).not.toBeNull();
  expect(d.querySelector('footer.rodape')).not.toBeNull();
  const resumo = d.querySelector('.formulario-erros')!;
  expect(resumo.hasAttribute('autofocus')).toBe(true); expect(resumo.getAttribute('tabindex')).toBe('-1');
  expect(resumo.querySelector('h2[role=alert]')).not.toBeNull();
  for (const campo of ['nome', 'mensagem']) {
    const erro = d.getElementById(`erro-${campo}`)!;
    expect(erro.textContent).toMatch(/^Erro:/);
    expect(resumo.querySelector(`a[href="#pedido-${campo}"]`)?.textContent).toBe(erro.textContent);
    expect(erro.textContent).not.toMatch(/OBRIGATORIO|LONGO/);
  }
});
it('Ajustar nativo não corta texto nem antecipa validação do servidor por atributo', async () => {
  const { d } = await dom(base);
  for (const campo of ['nome', 'empresa', 'contato', 'mensagem']) {
    const el = d.querySelector(`details [name=${campo}]`)!;
    expect(el.hasAttribute('maxlength')).toBe(false); expect(el.hasAttribute('required')).toBe(false);
  }
});

it('JSON das duas APIs conserva no-referrer inclusive em erros e 405', async () => {
  const deps = { configuracao: lerConfiguracao({ CONTATO_ORIGEM: 'https://floway.example' }), agora: () => base.agora, fetch: async () => { throw new Error('Provedor não deve ser chamado'); } };
  for (const origin of ['https://floway.example', 'null']) {
    const req = new Request('https://floway.example/api/contato', { method: 'POST', headers: { origin, accept: 'application/json' }, body: new URLSearchParams({ versao: 'contato-b.1', idioma: 'pt', acao: 'revisar' }) });
    const conversa = new Request('https://floway.example/api/contato/conversa', { method: 'POST', headers: { origin, accept: 'application/json', 'content-type': 'application/json' }, body: JSON.stringify({ idioma: 'pt', turnoId: '10000000-0000-4000-8000-000000000001', historico: [], mensagem: 'Um site' }) });
    for (const r of [await receberContato(req, deps), await receberConversa(conversa, deps), metodoNaoPermitido(), metodoNaoPermitido('conversa')]) {
      expect(r.headers.get('referrer-policy')).toBe('no-referrer');
      expect(r.headers.get('content-type')).toContain('application/json');
      expect(r.headers.get('cache-control')).toBe('private, no-store');
      expect(r.headers.get('x-robots-tag')).toBe('noindex');
    }
  }
});
