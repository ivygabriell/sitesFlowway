import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ConversaIA } from '@/componentes/contato/ConversaIA';

// Fonte com o Gemini no visual do chat (spec 2026-11-22): a conversa começa no vazio (frame 02) e vai à IA;
// nome, empresa, WhatsApp e e-mail vêm depois, por perguntas fixas, e nunca vão para o modelo.
// Movimento reduzido aqui: a revelação palavra por palavra tem o próprio teste (chat-contato.test.tsx).
beforeEach(() => vi.stubGlobal('matchMedia', (q: string) => ({ matches: q.includes('reduce'), media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} })));
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

const resposta = (r: string, m: string | null = null, opcoes: string[] = []) => vi.fn(async (_u: string, op: RequestInit) => Response.json({ turnoId: JSON.parse(String(op.body)).turnoId, resposta: r, mensagemSugerida: m, opcoes }));
const campo = () => screen.getByRole('textbox', { name: 'Sua mensagem' }) as HTMLTextAreaElement;
async function responder_(texto: string) {
  fireEvent.change(campo(), { target: { value: texto } });
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Enviar mensagem' })); });
}
const corpo = (fetch: ReturnType<typeof vi.fn>, i: number) => JSON.parse(String((fetch.mock.calls[i] as unknown as [string, RequestInit])[1].body));

async function ateOCartao() {
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Ainda não sei, quero conversar' })); });
  await screen.findByText(/qual é o seu nome/i);
  await responder_('Ana');
  await screen.findByText('Prazer, Ana! Qual é a sua empresa?');
  await responder_('Estúdio Norte');
  await responder_('123');
  expect(screen.getByText(/WhatsApp com DDD/).closest('.chat-erro')).not.toBeNull();
  expect(campo().value).toBe('123');
  await responder_('(11) 98765-4321');
  await responder_('ana@estudionorte.com');
  return screen.findByRole('region', { name: 'Resumo do pedido' });
}

describe('ConversaIA', () => {
  it('abre no vazio com as respostas rápidas e a primeira mensagem vai à IA', async () => {
    const fetch = resposta('Legal! Vocês já têm um site hoje?', null, ['Já temos', 'Do zero']); vi.stubGlobal('fetch', fetch);
    render(<ConversaIA />);
    screen.getByRole('heading', { name: 'Como podemos ajudar?' });
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Quero um site novo' })); });
    expect(corpo(fetch, 0)).toMatchObject({ idioma: 'pt', historico: [], mensagem: 'Quero um site novo' });
    expect(screen.getByText('Quero um site novo').closest('.chat-voce')).not.toBeNull();
    screen.getByText('Legal! Vocês já têm um site hoje?');
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Do zero' })); });
    expect(corpo(fetch, 1)).toMatchObject({ historico: [{ papel: 'usuario', texto: 'Quero um site novo' }, { papel: 'assistente', texto: 'Legal! Vocês já têm um site hoje?' }], mensagem: 'Do zero' });
  });

  it('na pergunta de investimento, mostra as faixas em pílula', async () => {
    vi.stubGlobal('fetch', resposta('Vocês já têm uma faixa de investimento em mente?'));
    render(<ConversaIA />);
    await responder_('Um site');
    await screen.findByRole('button', { name: 'R$ 5 a 15 mil' });
  });

  it('as opções da IA têm prioridade sobre as faixas quando a frase só menciona orçamento', async () => {
    vi.stubGlobal('fetch', resposta('Um site com orçamento online. Para quando vocês precisam dele?', null, ['Urgente', 'Sem pressa']));
    render(<ConversaIA />);
    await responder_('Um site');
    await screen.findByRole('button', { name: 'Urgente' });
    expect(screen.queryByRole('button', { name: 'R$ 5 a 15 mil' })).toBeNull();
  });

  it('com o resumo da IA, pede os dados por perguntas fixas, sem mandá-los ao modelo, e monta o cartão', async () => {
    const fetch = resposta('Montei um resumo.', 'Projeto: Site novo\nPrazo: 1 a 3 meses'); vi.stubGlobal('fetch', fetch);
    render(<ConversaIA />);
    const cartao = await ateOCartao();
    expect(fetch).toHaveBeenCalledTimes(1);
    within(cartao).getByText('Ana · Estúdio Norte');
    within(cartao).getByText('(11) 98765-4321 · ana@estudionorte.com');
    expect(within(cartao).getByText('Prazo').nextElementSibling?.textContent).toBe('1 a 3 meses');
    screen.getByText(/Perfeito, Ana\. Organizei tudo/);
  });

  it('"Parar" com o pedido no ar aborta o fetch e devolve o texto ao campo', async () => {
    let sinal: AbortSignal | undefined;
    vi.stubGlobal('fetch', vi.fn((_u: string, op: RequestInit) => new Promise((_r, rejeitar) => { sinal = op.signal!; sinal.addEventListener('abort', () => rejeitar(new DOMException('abortado', 'AbortError'))); })));
    render(<ConversaIA />);
    await responder_('Meu projeto');
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Parar' })); });
    expect(sinal?.aborted).toBe(true);
    expect(campo().value).toBe('Meu projeto');
    expect(document.querySelector('.chat-erro')).toBeNull();
  });

  it('"Parar" devolve o texto na hora, mesmo que a chamada demore a terminar, e ignora a resposta que chegar depois', async () => {
    let responder!: (r: Response) => void;
    vi.stubGlobal('fetch', vi.fn((_u: string, op: RequestInit) => new Promise<Response>(r => { responder = () => r(Response.json({ turnoId: JSON.parse(String(op.body)).turnoId, resposta: 'Tarde demais', mensagemSugerida: null, opcoes: [] })); })));
    render(<ConversaIA />);
    await responder_('Meu projeto');
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Parar' })); });
    expect(campo().value).toBe('Meu projeto');
    screen.getByRole('heading', { name: 'Como podemos ajudar?' });
    await act(async () => { responder(new Response()); });
    expect(screen.queryByText('Tarde demais')).toBeNull();
  });

  it('falha da IA vira mensagem em azul e mantém o texto para tentar de novo', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ erro: { codigo: 'IA_INDISPONIVEL' } }, { status: 503 })));
    render(<ConversaIA />);
    await responder_('Meu projeto');
    expect(screen.getByText(/Não consegui responder agora/).closest('.chat-erro')).not.toBeNull();
    expect(campo().value).toBe('Meu projeto');
  });

  it('o status do globo acompanha a conversa e o cartão', async () => {
    vi.stubGlobal('fetch', resposta('Montei um resumo.', 'Projeto: Site'));
    const aoStatus = vi.fn();
    render(<ConversaIA aoStatus={aoStatus} />);
    expect(aoStatus).toHaveBeenLastCalledWith('online');
    await ateOCartao();
    expect(aoStatus).toHaveBeenCalledWith('pensando');
    expect(aoStatus).toHaveBeenLastCalledWith('resumo');
  });
});
