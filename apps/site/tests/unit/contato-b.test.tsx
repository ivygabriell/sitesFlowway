import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { PaginaContato } from '@/paginas/PaginaContato';
import type { ContatoServidorDTO } from '@/lib/contato/servidor';
const esfera = vi.hoisted(() => vi.fn());
vi.mock('@/compartilhados/esfera/EsferaDeLetras', () => ({ EsferaDeLetras: (p: unknown) => { esfera(p); return <div className="esfera" />; } }));
const servidor: ContatoServidorDTO = { versao: 'contato-b.1', intencao: 'token-apenas-teste', chave: 'contato/00000000-0000-4000-8000-000000000001', repetirAte: new Date(Date.now() + 3600000).toISOString(), conversaDisponivel: true, envioDisponivel: true };
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.useRealTimers(); });
it('vazio B tem convite e quatro atalhos exatos, sem campos obrigatórios à vista', () => {
  const { container } = render(<PaginaContato servidor={servidor} />);
  expect(container.querySelector('.contato-b-vazio')).not.toBeNull();
  screen.getByRole('textbox', { name: 'Conte o que você quer construir…' });
  for (const name of ['Quero uma landing page', 'Preciso de um site institucional', 'Quero automatizar um processo', 'Ainda não sei']) screen.getByRole('button', { name });
  expect(screen.queryByRole('textbox', { name: 'Nome' })).toBeNull();
});
it('primeira mensagem abre histórico à esquerda, bloqueia concorrência e Enter não envia', async () => {
  let resolver!: (r: Response) => void;
  const fetch = vi.fn(() => new Promise<Response>(r => { resolver = r; })); vi.stubGlobal('fetch', fetch);
  const { container } = render(<PaginaContato servidor={servidor} />);
  const entrada = screen.getByRole('textbox', { name: 'Conte o que você quer construir…' });
  fireEvent.change(entrada, { target: { value: '<b>Meu projeto</b>\nOutra linha' } });
  fireEvent.keyDown(entrada, { key: 'Enter' }); expect(fetch).not.toHaveBeenCalled();
  act(() => { fireEvent.click(screen.getByRole('button', { name: 'Enviar →' })); fireEvent.submit(entrada.closest('form')!); });
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(container.querySelector('.contato-b-aberta')).not.toBeNull();
  expect(container.querySelector('.conversa-mensagem p')?.textContent).toBe('<b>Meu projeto</b>\nOutra linha');
  expect(container.querySelector('b')).toBeNull();
  expect(screen.getByRole('status').textContent).toContain('Floway está escrevendo');
  expect(esfera.mock.lastCall?.[0].respondendo).toBe(true);
  await act(async () => resolver(Response.json({ turnoId: 'invalido', resposta: 'Resposta', mensagemSugerida: null })));
  await screen.findByRole('alert');
});
const montar = (conversaDisponivel = false) => render(<PaginaContato servidor={{ ...servidor, conversaDisponivel }} />);
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
  expect(esfera.mock.lastCall?.[0].formarAlvo).toBe(true);
});
it.each([{ ok: true }, { ok: true, estado: 'recebido' }, { ok: true, estado: 'aceito', requestId: 'nao-uuid', repetirAte: servidor.repetirAte }, null])('não autoriza F com resposta sem prova: %j', async dados => {
  vi.stubGlobal('fetch', vi.fn(async () => Response.json(dados))); montar(); await revisar();
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar e enviar' }));
  await screen.findByText(/Resultado pendente/);
  expect(esfera.mock.lastCall?.[0].formarAlvo).toBe(false);
  expect(screen.queryByRole('button', { name: 'Ajustar' })).toBeNull();
});
it('alternância preserva histórico, quatro campos e apagamento contra sugestão antiga', async () => {
  vi.stubGlobal('fetch', vi.fn(async (_url: string, op: RequestInit) => Response.json({ turnoId: JSON.parse(op.body as string).turnoId, resposta: 'Qual é o objetivo?', mensagemSugerida: 'Sugestão antiga' })));
  montar(true); fireEvent.click(screen.getByRole('button', { name: 'Ainda não sei' }));
  await screen.findByText('Qual é o objetivo?');
  fireEvent.click(screen.getByRole('button', { name: 'Usar formulário simples' }));
  preencher(); fireEvent.change(screen.getByLabelText('Mensagem'), { target: { value: '' } });
  fireEvent.click(screen.getByRole('button', { name: 'Voltar à conversa' }));
  fireEvent.change(screen.getByRole('textbox', { name: 'Conte o que você quer construir…' }), { target: { value: 'Mais detalhes' } });
  fireEvent.click(screen.getByRole('button', { name: 'Enviar →' }));
  await waitFor(() => expect(screen.getAllByText('Qual é o objetivo?')).toHaveLength(2));
  fireEvent.click(screen.getByRole('button', { name: 'Usar formulário simples' }));
  expect((screen.getByLabelText('Mensagem') as HTMLTextAreaElement).value).toBe('');
  for (const c of ['nome', 'empresa', 'contato'] as const) expect((screen.getByLabelText(contatoRotulo(c)) as HTMLInputElement).value).toBe(campos[c]);
});
it('conversa rejeita limites sem cortar texto nem chamar rede', () => {
  const fetch = vi.fn(); vi.stubGlobal('fetch', fetch); montar(true);
  const entrada = screen.getByRole('textbox', { name: 'Conte o que você quer construir…' });
  fireEvent.change(entrada, { target: { value: 'x'.repeat(2001) } }); fireEvent.click(screen.getByRole('button', { name: 'Enviar →' }));
  expect(fetch).not.toHaveBeenCalled(); expect((entrada as HTMLTextAreaElement).value).toHaveLength(2001); screen.getByRole('alert');
});
it('timeout da conversa em 25s preserva entrada e não repete computação', async () => {
  vi.useFakeTimers(); const fetch = vi.fn((_url: string, op: RequestInit) => new Promise((_r, reject) => op.signal?.addEventListener('abort', () => reject(new Error('abort'))))); vi.stubGlobal('fetch', fetch); montar(true);
  fireEvent.change(screen.getByRole('textbox', { name: 'Conte o que você quer construir…' }), { target: { value: 'Meu projeto' } }); fireEvent.click(screen.getByRole('button', { name: 'Enviar →' }));
  await act(async () => vi.advanceTimersByTimeAsync(25000));
  expect(fetch).toHaveBeenCalledTimes(1); expect((screen.getByRole('textbox', { name: 'Conte o que você quer construir…' }) as HTMLTextAreaElement).value).toBe('Meu projeto'); screen.getByRole('alert');
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
  expect(esfera.mock.lastCall?.[0].formarAlvo).toBe(false);
  if (status === 410) { screen.getByText(/Prazo de repetição encerrado/); expect(screen.queryByRole('button', { name: 'Repetir o mesmo envio' })).toBeNull(); }
});
it('timeout de envio preserva confirmação e duas retentativas, respeitando Retry-After e corte 30s', async () => {
  vi.useFakeTimers();
  const fetch = vi.fn((_url: string, op: RequestInit) => new Promise((_r, reject) => op.signal?.addEventListener('abort', () => reject(new Error('timeout')))));
  vi.stubGlobal('fetch', fetch);
  render(<PaginaContato servidor={{ ...servidor, conversaDisponivel: false, repetirAte: new Date(Date.now() + 47000).toISOString() }} />);
  preencher(); fireEvent.click(screen.getByRole('button', { name: 'Revisar pedido' })); fireEvent.click(screen.getByRole('button', { name: 'Confirmar e enviar' }));
  await act(async () => { await vi.advanceTimersByTimeAsync(15000); });
  screen.getByText(/Prazo de repetição encerrado/);
  await act(async () => { await vi.advanceTimersByTimeAsync(10000); });
  expect(fetch).toHaveBeenCalledTimes(1); screen.getByText(/Prazo de repetição encerrado/);
});
it('digitação visual segue o tempo real, mesmo com poucos quadros por segundo', async () => {
  const resposta = 'x'.repeat(1500);
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false })));
  vi.stubGlobal('fetch', vi.fn(async (_url: string, op: RequestInit) => Response.json({ turnoId: JSON.parse(op.body as string).turnoId, resposta, mensagemSugerida: null })));
  let t = 0; const relogio = vi.spyOn(performance, 'now').mockImplementation(() => (t += 60000));
  const { container } = montar(true); fireEvent.click(screen.getByRole('button', { name: 'Ainda não sei' }));
  await waitFor(() => expect(container.querySelector('.resposta-visual')?.textContent).toBe(resposta));
  relogio.mockRestore();
});
it.each([false, true])('resposta tem digitação visual só sem movimento reduzido (%s), anúncio completo uma vez', async reduzido => {
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: reduzido })));
  vi.stubGlobal('fetch', vi.fn(async (_url: string, op: RequestInit) => Response.json({ turnoId: JSON.parse(op.body as string).turnoId, resposta: 'Resposta completa da conversa', mensagemSugerida: null })));
  const { container } = montar(true); fireEvent.click(screen.getByRole('button', { name: 'Ainda não sei' }));
  await waitFor(() => expect(container.querySelector('.assistente')).not.toBeNull());
  const visual = container.querySelector('.resposta-visual')!;
  expect(visual).not.toBeNull();
  expect(container.querySelector('.resposta-acessivel')?.textContent).toBe('Resposta completa da conversa');
  if (reduzido) expect(visual.textContent).toBe('Resposta completa da conversa');
  else await waitFor(() => expect(visual.textContent).toBe('Resposta completa da conversa'));
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
it.each(['falha', 'null'])('alternativa recebe mensagem literal da conversa em %s, sem apagar última edição', async caso => {
  vi.stubGlobal('fetch', vi.fn(async (_url: string, op: RequestInit) => caso === 'falha' ? Response.json({}, { status: 503 }) : Response.json({ turnoId: JSON.parse(op.body as string).turnoId, resposta: 'Pergunta', mensagemSugerida: null })));
  montar(true); fireEvent.change(screen.getByRole('textbox', { name: 'Conte o que você quer construir…' }), { target: { value: '<b>Texto preservado</b>\nLinha' } }); fireEvent.click(screen.getByRole('button', { name: 'Enviar →' }));
  await waitFor(() => expect((screen.getByRole('button', { name: 'Usar formulário simples' }) as HTMLButtonElement).disabled).toBe(false));
  fireEvent.click(screen.getByRole('button', { name: 'Usar formulário simples' }));
  expect((screen.getByLabelText('Mensagem') as HTMLTextAreaElement).value).toBe('<b>Texto preservado</b>\nLinha');
});
it('erro da conversa associa descrição ao campo e link/foco, sem validar ao digitar', () => {
  montar(true); const entrada = screen.getByRole('textbox', { name: 'Conte o que você quer construir…' });
  fireEvent.change(entrada, { target: { value: '  ' } }); fireEvent.blur(entrada); expect(screen.queryByRole('alert')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Enviar →' }));
  const descricao = document.getElementById(entrada.getAttribute('aria-describedby')!)!;
  expect(descricao).not.toBeNull(); expect(descricao.textContent).toContain('Digite sua mensagem');
  expect(document.activeElement).toBe(document.querySelector('.conversa-contato .formulario-erros'));
  fireEvent.click(screen.getByRole('link', { name: 'Digite sua mensagem' })); expect(document.activeElement).toBe(entrada);
});
it('Ajustar e Voltar à conversa devolvem foco a um campo alcançável', async () => {
  montar(true); fireEvent.click(screen.getByRole('button', { name: 'Usar formulário simples' }));
  await waitFor(() => expect(document.activeElement).toBe(screen.getByLabelText('Nome')));
  await revisar(); fireEvent.click(screen.getByRole('button', { name: 'Ajustar' }));
  await waitFor(() => expect(document.activeElement).toBe(screen.getByLabelText('Nome')));
  fireEvent.click(screen.getByRole('button', { name: 'Voltar à conversa' }));
  await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('textbox', { name: 'Conte o que você quer construir…' })));
});
it('após duas retentativas automáticas, repetir explicitamente faz só uma tentativa', async () => {
  vi.useFakeTimers(); const fetch = vi.fn().mockRejectedValue(new TypeError('rede')); vi.stubGlobal('fetch', fetch);
  montar(); preencher(); fireEvent.click(screen.getByRole('button', { name: 'Revisar pedido' })); fireEvent.click(screen.getByRole('button', { name: 'Confirmar e enviar' }));
  await act(async () => { await vi.advanceTimersByTimeAsync(12000); }); expect(fetch).toHaveBeenCalledTimes(3);
  fireEvent.click(screen.getByRole('button', { name: 'Repetir o mesmo envio' }));
  await act(async () => { await vi.advanceTimersByTimeAsync(12000); }); expect(fetch).toHaveBeenCalledTimes(4);
});
it('após 10s a conversa oferece cancelar pelo teclado, preservando texto e sem repetir', async () => {
  vi.useFakeTimers(); const fetch = vi.fn((_url: string, op: RequestInit) => new Promise((_r, reject) => op.signal?.addEventListener('abort', () => reject(new Error('abort'))))); vi.stubGlobal('fetch', fetch);
  montar(true); fireEvent.change(screen.getByRole('textbox', { name: 'Conte o que você quer construir…' }), { target: { value: 'Texto preservado' } }); fireEvent.click(screen.getByRole('button', { name: 'Enviar →' }));
  await act(async () => { await vi.advanceTimersByTimeAsync(10000); }); screen.getByText(/Está demorando/);
  const cancelar = screen.getByRole('button', { name: 'Cancelar espera' }); cancelar.focus(); fireEvent.click(cancelar);
  await act(async () => { await vi.advanceTimersByTimeAsync(20000); });
  expect(fetch).toHaveBeenCalledTimes(1); screen.getByRole('alert'); expect((screen.getByRole('textbox', { name: 'Conte o que você quer construir…' }) as HTMLTextAreaElement).value).toBe('Texto preservado');
});
it('histórico longo é alcançável por teclado e tem rolagem própria rotulada', async () => {
  vi.stubGlobal('fetch', vi.fn(async (_url: string, op: RequestInit) => Response.json({ turnoId: JSON.parse(op.body as string).turnoId, resposta: 'Texto longo '.repeat(120), mensagemSugerida: null })));
  montar(true); fireEvent.click(screen.getByRole('button', { name: 'Ainda não sei' }));
  const log = await screen.findByRole('log');
  expect(log.tabIndex).toBe(0); expect(log.getAttribute('aria-label')).toBe('Histórico da conversa'); expect(log.hasAttribute('data-lenis-prevent')).toBe(true);
});
it('atalhos seguem a linha de entrada e precedem o aviso no vazio B', () => {
  const { container } = montar(true); const form = container.querySelector('.conversa-contato form')!;
  const atalhos = container.querySelector('.conversa-atalhos')!; const aviso = container.querySelector('.conversa-contato .formulario-aviso')!;
  expect(form.compareDocumentPosition(atalhos) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(atalhos.compareDocumentPosition(aviso) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
});
it('conserva isca inclusive espaços no corpo confirmado e recebido202 nunca autoriza F', async () => {
  const fetch = vi.fn(async () => Response.json({ ok: true, estado: 'recebido', requestId: '10000000-0000-4000-8000-000000000001' }, { status: 202 })); vi.stubGlobal('fetch', fetch);
  const { container } = montar(); preencher(); fireEvent.change(container.querySelector('[name=site]')!, { target: { value: '  ' } });
  fireEvent.click(screen.getByRole('button', { name: 'Revisar pedido' })); fireEvent.click(screen.getByRole('button', { name: 'Confirmar e enviar' }));
  await screen.findByText(/Resultado pendente/);
  expect(((fetch.mock.calls[0] as unknown as [string, RequestInit])[1].body as FormData).get('site')).toBe('  ');
  expect(esfera.mock.lastCall?.[0].formarAlvo).toBe(false);
});
it('primeira ida à alternativa reaproveita também texto ainda não enviado, sem chamar IA', () => {
  const fetch = vi.fn(); vi.stubGlobal('fetch', fetch); montar(true);
  fireEvent.change(screen.getByRole('textbox', { name: 'Conte o que você quer construir…' }), { target: { value: ' Rascunho ainda não enviado\nOutra linha ' } });
  fireEvent.click(screen.getByRole('button', { name: 'Usar formulário simples' }));
  expect((screen.getByLabelText('Mensagem') as HTMLTextAreaElement).value).toBe(' Rascunho ainda não enviado\nOutra linha ');
  expect(fetch).not.toHaveBeenCalled();
});
it('editar Nome não impede reaproveitar rascunho novo na Mensagem ainda não editada', () => {
  montar(true); fireEvent.click(screen.getByRole('button', { name: 'Usar formulário simples' }));
  fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Nome preservado' } }); fireEvent.click(screen.getByRole('button', { name: 'Voltar à conversa' }));
  fireEvent.change(screen.getByRole('textbox', { name: 'Conte o que você quer construir…' }), { target: { value: 'Descrição nova' } }); fireEvent.click(screen.getByRole('button', { name: 'Usar formulário simples' }));
  expect((screen.getByLabelText('Nome') as HTMLInputElement).value).toBe('Nome preservado'); expect((screen.getByLabelText('Mensagem') as HTMLTextAreaElement).value).toBe('Descrição nova');
});
