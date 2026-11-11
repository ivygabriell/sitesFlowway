import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ConversaIA } from '@/componentes/contato/ConversaIA';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

const resposta = (r: string, m: string | null = null) => vi.fn(async (_u: string, op: RequestInit) => Response.json({ turnoId: JSON.parse(String(op.body)).turnoId, resposta: r, mensagemSugerida: m }));
async function responder(texto: string) {
  fireEvent.change(screen.getByLabelText('Sua resposta'), { target: { value: texto } });
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Enviar resposta' })); });
}
async function dadosIniciais() {
  await screen.findByText(/qual é o seu nome/i);
  await responder('Ana');
  await screen.findByText('Prazer, Ana! Qual é a sua empresa?');
  await responder('Floway');
  await screen.findByText('Qual é o seu WhatsApp, com DDD?');
  await responder('123');
  expect(screen.getByRole('alert').textContent).toMatch(/WhatsApp com DDD/);
  await responder('(11) 98765-4321');
  await screen.findByText('E qual é o seu e-mail?');
  await responder('ana@');
  expect(screen.getByRole('alert').textContent).toMatch(/e-mail válido/);
  await responder('ana@x.dev');
  await screen.findByRole('button', { name: 'Quero uma landing page' });
}

describe('ConversaIA', () => {
  it('pede nome, empresa, WhatsApp e e-mail antes, sem chamar a IA, e só então abre a conversa com atalhos', async () => {
    const fetch = resposta('Para qual campanha ou produto é a página?'); vi.stubGlobal('fetch', fetch);
    render(<ConversaIA aoConcluir={vi.fn()} />);
    await dadosIniciais();
    expect(fetch).not.toHaveBeenCalled();
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Quero uma landing page' })); });
    await screen.findByText('Para qual campanha ou produto é a página?');
    const corpo = JSON.parse(String((fetch.mock.calls[0] as unknown as [string, RequestInit])[1].body));
    expect(corpo).toMatchObject({ idioma: 'pt', historico: [], mensagem: 'Quero uma landing page' });
  });

  it('quando a IA pergunta o investimento, mostra as faixas em pílula', async () => {
    vi.stubGlobal('fetch', resposta('Vocês já têm uma faixa de investimento em mente? Pode pular se preferir.'));
    render(<ConversaIA aoConcluir={vi.fn()} />);
    await dadosIniciais();
    await responder('Um site');
    await screen.findByRole('button', { name: 'R$ 5 a 15 mil' });
  });

  it('com o resumo da IA, mostra tudo preenchido e entrega o pedido completo', async () => {
    vi.stubGlobal('fetch', resposta('Montei um resumo para você conferir.', 'Projeto: Landing page\nObjetivo: Vender'));
    const aoConcluir = vi.fn();
    render(<ConversaIA aoConcluir={aoConcluir} />);
    await dadosIniciais();
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Ainda não sei' })); });
    const resumo = await screen.findByRole('region', { name: 'Resumo do pedido' });
    expect((within(resumo).getByLabelText('Resumo do projeto') as HTMLTextAreaElement).value).toBe('Projeto: Landing page\nObjetivo: Vender');
    expect((within(resumo).getByLabelText('Nome') as HTMLInputElement).value).toBe('Ana');
    expect((within(resumo).getByLabelText('WhatsApp') as HTMLInputElement).value).toBe('(11) 98765-4321');
    fireEvent.click(within(resumo).getByRole('button', { name: 'Revisar envio' }));
    expect(aoConcluir).toHaveBeenCalledWith({ nome: 'Ana', empresa: 'Floway', contato: 'WhatsApp: (11) 98765-4321 · E-mail: ana@x.dev', mensagem: 'Projeto: Landing page\nObjetivo: Vender' });
  });

  it('falha da IA mostra aviso e mantém o texto para tentar de novo', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ erro: { codigo: 'IA_INDISPONIVEL' } }, { status: 503 })));
    render(<ConversaIA aoConcluir={vi.fn()} />);
    await dadosIniciais();
    await responder('Meu projeto');
    await screen.findByRole('alert');
    expect((screen.getByLabelText('Sua resposta') as HTMLTextAreaElement).value).toBe('Meu projeto');
  });
});
