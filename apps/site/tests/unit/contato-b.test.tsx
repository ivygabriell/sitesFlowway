import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { Formulario } from '@/componentes/contato/Formulario';
import type { ContatoServidorDTO } from '@/lib/contato/servidor';
const esfera = vi.hoisted(() => vi.fn());
vi.mock('@/compartilhados/esfera/EsferaDeLetras', () => ({ EsferaDeLetras: (p: unknown) => { esfera(p); return <div className="esfera" />; } }));
const servidor: ContatoServidorDTO = { versao: 'contato-b.1', intencao: 'token-apenas-teste', chave: 'contato/00000000-0000-4000-8000-000000000001', repetirAte: new Date(Date.now() + 3600000).toISOString(), conversaDisponivel: true, envioDisponivel: true };
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.useRealTimers(); });
const montar = (conversaDisponivel = false) => render(<Formulario servidor={{ ...servidor, conversaDisponivel }} />);
const campos = { nome: 'Pessoa teste', empresa: 'Empresa teste', contato: 'Contato livre', mensagem: 'Projeto\ncom detalhes' };
function preencher() { for (const [campo, value] of Object.entries(campos)) fireEvent.change(screen.getByLabelText(contatoRotulo(campo)), { target: { value } }); }
const contatoRotulo = (c: string) => ({ nome: 'Nome', empresa: 'Empresa', contato: 'Contato', mensagem: 'Mensagem' })[c as 'nome'];
async function revisar() { preencher(); fireEvent.click(screen.getByRole('button', { name: 'Revisar pedido' })); await screen.findByRole('button', { name: 'Confirmar e enviar' }); }
const aceito = () => Response.json({ ok: true, estado: 'aceito', requestId: '00000000-0000-4000-8000-000000000001', repetirAte: servidor.repetirAte });
it('revisa quatro campos, ajusta sem perder texto e só confirmação explícita envia cópia', async () => {
  const fetch = vi.fn(async () => aceito()); vi.stubGlobal('fetch', fetch); montar(); await revisar();
  expect(fetch).not.toHaveBeenCalled();
  for (const valor of Object.values(campos)) expect(document.querySelector('dl')?.textContent).toContain(valor);
  fireEvent.click(screen.getByRole('button', { name: 'Ajustar' }));
  expect((screen.getByLabelText('Mensagem') as HTMLTextAreaElement).value).toBe(campos.mensagem);
  fireEvent.change(screen.getByLabelText('Mensagem'), { target: { value: 'Última edição' } });
  fireEvent.click(screen.getByRole('button', { name: 'Revisar pedido' }));
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar e enviar' }));
  await screen.findByText('Envio aceito pelo serviço.');
  const op = fetch.mock.calls[0] as unknown as [string, RequestInit];
  expect((op[1].body as FormData).get('mensagem')).toBe('Última edição');
  expect((op[1].body as FormData).get('confirmar')).toBe('true');
});
it.each([{ ok: true }, { ok: true, estado: 'recebido' }, { ok: true, estado: 'aceito', requestId: 'nao-uuid', repetirAte: servidor.repetirAte }, null])('não autoriza F com resposta sem prova: %j', async dados => {
  vi.stubGlobal('fetch', vi.fn(async () => Response.json(dados))); montar(); await revisar();
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar e enviar' }));
  await screen.findByText(/Resultado pendente/);
  expect(screen.queryByRole('button', { name: 'Ajustar' })).toBeNull();
});
it.each([429, 503, 409, 410])('202 seguido de %s mantém cópia fixa, sem edição/nova intenção nem F', async status => {
  vi.useFakeTimers();
  const fetch = vi.fn().mockResolvedValueOnce(Response.json({ ok: false, estado: 'incerto', repetirAte: servidor.repetirAte }, { status: 202 })).mockResolvedValue(Response.json({ ok: false, estado: 'falha', codigo: status === 410 ? 'INTENCAO_EXPIRADA' : 'LIMITE_ATINGIDO', repetivel: false }, { status, headers: { 'Retry-After': '3' } }));
  vi.stubGlobal('fetch', fetch); montar(); preencher(); fireEvent.click(screen.getByRole('button', { name: 'Revisar pedido' }));
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar e enviar' }));
  await act(async () => { await vi.advanceTimersByTimeAsync(1); });
  await act(async () => { await vi.advanceTimersByTimeAsync(12000); });
  expect(fetch.mock.calls.length).toBeGreaterThanOrEqual(2);
  expect(fetch.mock.calls.length).toBeLessThanOrEqual(3);
  const corpos = fetch.mock.calls.map(c => [...(c[1].body as FormData).entries()]);
  for (const corpo of corpos) expect(corpo).toEqual(corpos[0]);
  expect(screen.queryByRole('button', { name: 'Ajustar' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Usar formulário simples' })).toBeNull();
  expect(screen.queryByRole('textbox', { name: 'Mensagem' })).toBeNull();
  if (status === 410) { screen.getByText(/Prazo de repetição encerrado/); expect(screen.queryByRole('button', { name: 'Repetir o mesmo envio' })).toBeNull(); }
});
it('timeout de envio preserva confirmação e duas retentativas, respeitando Retry-After e corte 30s', async () => {
  vi.useFakeTimers();
  const fetch = vi.fn((_url: string, op: RequestInit) => new Promise((_r, reject) => op.signal?.addEventListener('abort', () => reject(new Error('timeout')))));
  vi.stubGlobal('fetch', fetch);
  render(<Formulario servidor={{ ...servidor, conversaDisponivel: false, repetirAte: new Date(Date.now() + 47000).toISOString() }} />);
  preencher(); fireEvent.click(screen.getByRole('button', { name: 'Revisar pedido' })); fireEvent.click(screen.getByRole('button', { name: 'Confirmar e enviar' }));
  await act(async () => { await vi.advanceTimersByTimeAsync(15000); });
  screen.getByText(/Prazo de repetição encerrado/);
  await act(async () => { await vi.advanceTimersByTimeAsync(10000); });
  expect(fetch).toHaveBeenCalledTimes(1); screen.getByText(/Prazo de repetição encerrado/);
});
it('rede perdida permite no máximo duas repetições automáticas com o mesmo corpo e chave', async () => {
  vi.useFakeTimers(); vi.spyOn(Math, 'random').mockReturnValue(0);
  const fetch = vi.fn().mockRejectedValue(new TypeError('rede')); vi.stubGlobal('fetch', fetch);
  montar(); preencher(); fireEvent.click(screen.getByRole('button', { name: 'Revisar pedido' }));
  act(() => { fireEvent.click(screen.getByRole('button', { name: 'Confirmar e enviar' })); fireEvent.click(screen.getByRole('button', { name: 'Confirmar e enviar' })); });
  await act(async () => { await vi.advanceTimersByTimeAsync(6001); });
  expect(fetch).toHaveBeenCalledTimes(3);
  for (const chamada of fetch.mock.calls) { expect(chamada[1].body).toBe(fetch.mock.calls[0][1].body); expect(chamada[1].headers['Idempotency-Key']).toBe(servidor.chave); }
  await act(async () => { await vi.advanceTimersByTimeAsync(20000); }); expect(fetch).toHaveBeenCalledTimes(3);
  expect((screen.getByRole('button', { name: 'Repetir o mesmo envio' }) as HTMLButtonElement).disabled).toBe(false);
  vi.restoreAllMocks();
});
it('Retry-After de 8s impede as duas repetições antes do prazo, sem renovar intenção', async () => {
  vi.useFakeTimers(); const fetch = vi.fn(async () => Response.json({ ok: false, estado: 'incerto' }, { status: 202, headers: { 'Retry-After': '8' } })); vi.stubGlobal('fetch', fetch);
  montar(); preencher(); fireEvent.click(screen.getByRole('button', { name: 'Revisar pedido' })); fireEvent.click(screen.getByRole('button', { name: 'Confirmar e enviar' }));
  await act(async () => { await vi.advanceTimersByTimeAsync(7999); }); expect(fetch).toHaveBeenCalledTimes(1);
  await act(async () => { await vi.advanceTimersByTimeAsync(1); }); expect(fetch).toHaveBeenCalledTimes(2);
  await act(async () => { await vi.advanceTimersByTimeAsync(8000); }); expect(fetch).toHaveBeenCalledTimes(3);
});
it('desmontar aborta espera sem iniciar retentativa depois de sair da página', async () => {
  vi.useFakeTimers(); const fetch = vi.fn((_url: string, op: RequestInit) => new Promise((_r, reject) => op.signal?.addEventListener('abort', () => reject(new Error('abort'))))); vi.stubGlobal('fetch', fetch);
  const { unmount } = montar(); preencher(); fireEvent.click(screen.getByRole('button', { name: 'Revisar pedido' })); fireEvent.click(screen.getByRole('button', { name: 'Confirmar e enviar' }));
  unmount(); await act(async () => { await vi.advanceTimersByTimeAsync(30000); }); expect(fetch).toHaveBeenCalledTimes(1);
});
it('após duas retentativas automáticas, repetir explicitamente faz só uma tentativa', async () => {
  vi.useFakeTimers(); const fetch = vi.fn().mockRejectedValue(new TypeError('rede')); vi.stubGlobal('fetch', fetch);
  montar(); preencher(); fireEvent.click(screen.getByRole('button', { name: 'Revisar pedido' })); fireEvent.click(screen.getByRole('button', { name: 'Confirmar e enviar' }));
  await act(async () => { await vi.advanceTimersByTimeAsync(12000); }); expect(fetch).toHaveBeenCalledTimes(3);
  fireEvent.click(screen.getByRole('button', { name: 'Repetir o mesmo envio' }));
  await act(async () => { await vi.advanceTimersByTimeAsync(12000); }); expect(fetch).toHaveBeenCalledTimes(4);
});
it('conserva isca inclusive espaços no corpo confirmado e recebido202 nunca autoriza F', async () => {
  const fetch = vi.fn(async () => Response.json({ ok: true, estado: 'recebido', requestId: '10000000-0000-4000-8000-000000000001' }, { status: 202 })); vi.stubGlobal('fetch', fetch);
  const { container } = montar(); preencher(); fireEvent.change(container.querySelector('[name=site]')!, { target: { value: '  ' } });
  fireEvent.click(screen.getByRole('button', { name: 'Revisar pedido' })); fireEvent.click(screen.getByRole('button', { name: 'Confirmar e enviar' }));
  await screen.findByText(/Resultado pendente/);
  expect(((fetch.mock.calls[0] as unknown as [string, RequestInit])[1].body as FormData).get('site')).toBe('  ');
});