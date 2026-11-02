import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from '../../app/api/contato/route';
import { entregarPedido, limparLimite } from '@/lib/pedidoDeContato';

vi.mock('@/lib/pedidoDeContato', async (original) => ({
  ...(await original<typeof import('@/lib/pedidoDeContato')>()),
  entregarPedido: vi.fn(async () => true),
}));

const entregar = vi.mocked(entregarPedido);
const VALIDO = { nome: 'Ana', empresa: 'ACME', contato: 'ana@exemplo.com', mensagem: 'Quero um site', idioma: 'pt' };

function pedido(campos: Record<string, string> = VALIDO, cabecalhos: Record<string, string> = { accept: 'application/json' }) {
  const corpo = new FormData();
  for (const [k, v] of Object.entries(campos)) corpo.set(k, v);
  // O FormData do jsdom não passa pelo Request do Node; a rota só usa estas três partes.
  return { url: 'http://localhost/api/contato', formData: async () => corpo, headers: new Headers({ 'x-forwarded-for': '10.0.0.1', ...cabecalhos }) } as unknown as Request;
}

beforeEach(() => {
  limparLimite();
  entregar.mockClear();
  entregar.mockResolvedValue(true);
});

describe('rota do contato', () => {
  it('entrega um pedido válido', async () => {
    expect((await POST(pedido())).status).toBe(200);
    expect(entregar).toHaveBeenCalledWith({ nome: 'Ana', empresa: 'ACME', contato: 'ana@exemplo.com', mensagem: 'Quero um site' });
  });

  it('recusa pedido sem contato ou sem mensagem', async () => {
    expect((await POST(pedido({ ...VALIDO, contato: '  ' }))).status).toBe(400);
    expect((await POST(pedido({ ...VALIDO, mensagem: '' }))).status).toBe(400);
    expect(entregar).not.toHaveBeenCalled();
  });

  it('recusa mensagem grande demais', async () => {
    expect((await POST(pedido({ ...VALIDO, mensagem: 'x'.repeat(5001) }))).status).toBe(400);
  });

  it('descarta o envio com o campo-isca preenchido, sem avisar o robô', async () => {
    expect((await POST(pedido({ ...VALIDO, site: 'http://spam' }))).status).toBe(200);
    expect(entregar).not.toHaveBeenCalled();
  });

  it('acima do limite por endereço responde 429', async () => {
    for (let i = 0; i < 5; i++) expect((await POST(pedido())).status).toBe(200);
    expect((await POST(pedido())).status).toBe(429);
    expect(entregar).toHaveBeenCalledTimes(5);
  });

  it('falha na entrega responde 503', async () => {
    entregar.mockResolvedValue(false);
    expect((await POST(pedido())).status).toBe(503);
  });

  it('sem JavaScript redireciona à página da língua com o estado', async () => {
    const r = await POST(pedido({ ...VALIDO, idioma: 'en' }, { accept: 'text/html' }));
    expect(r.status).toBe(303);
    expect(new URL(r.headers.get('location')!).pathname + new URL(r.headers.get('location')!).search).toBe('/en/contact?estado=enviado');
    entregar.mockResolvedValue(false);
    const f = await POST(pedido({ ...VALIDO, idioma: 'https://mal.exemplo' }, { accept: 'text/html' }));
    expect(new URL(f.headers.get('location')!).pathname + new URL(f.headers.get('location')!).search).toBe('/contato?estado=falha');
  });
});
