import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ConversaIA } from '@/componentes/contato/ConversaIA';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

const resposta = (r: string, m: string | null = null) => vi.fn(async (_u: string, op: RequestInit) => Response.json({ turnoId: JSON.parse(String(op.body)).turnoId, resposta: r, mensagemSugerida: m }));

describe('ConversaIA', () => {
  it('atalho envia a mensagem ao Gemini com histórico e mostra a resposta em balão', async () => {
    const fetch = resposta('Para qual campanha ou produto é a página?'); vi.stubGlobal('fetch', fetch);
    render(<ConversaIA aoConcluir={vi.fn()} />);
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Quero uma landing page' })); });
    await screen.findByText('Para qual campanha ou produto é a página?');
    const corpo = JSON.parse(String((fetch.mock.calls[0] as unknown as [string, RequestInit])[1].body));
    expect(corpo).toMatchObject({ idioma: 'pt', historico: [], mensagem: 'Quero uma landing page' });
    expect(screen.queryByRole('button', { name: 'Quero uma landing page' })).toBeNull();
  });

  it('quando a IA pergunta o investimento, mostra as faixas em pílula', async () => {
    vi.stubGlobal('fetch', resposta('Vocês já têm uma faixa de investimento em mente? Pode pular se preferir.'));
    render(<ConversaIA aoConcluir={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Sua resposta'), { target: { value: 'Um site' } });
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Enviar resposta' })); });
    await screen.findByRole('button', { name: 'R$ 5 a 15 mil' });
  });

  it('com o resumo da IA, pede nome, empresa, WhatsApp e e-mail validados e entrega o pedido', async () => {
    vi.stubGlobal('fetch', resposta('Montei um resumo para você conferir.', 'Projeto: Landing page\nObjetivo: Vender'));
    const aoConcluir = vi.fn();
    render(<ConversaIA aoConcluir={aoConcluir} />);
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Ainda não sei' })); });
    const resumo = await screen.findByRole('region', { name: 'Resumo do pedido' });
    expect((within(resumo).getByLabelText('Resumo do projeto') as HTMLTextAreaElement).value).toBe('Projeto: Landing page\nObjetivo: Vender');
    fireEvent.change(within(resumo).getByLabelText('Nome'), { target: { value: 'Ana' } });
    fireEvent.change(within(resumo).getByLabelText('Empresa'), { target: { value: 'Floway' } });
    fireEvent.change(within(resumo).getByLabelText('WhatsApp'), { target: { value: '123' } });
    fireEvent.change(within(resumo).getByLabelText('E-mail'), { target: { value: 'ana@x.dev' } });
    fireEvent.click(within(resumo).getByRole('button', { name: 'Revisar envio' }));
    expect(aoConcluir).not.toHaveBeenCalled();
    expect(within(resumo).getByText(/WhatsApp com DDD/)).toBeTruthy();
    fireEvent.change(within(resumo).getByLabelText('WhatsApp'), { target: { value: '(11) 98765-4321' } });
    fireEvent.click(within(resumo).getByRole('button', { name: 'Revisar envio' }));
    expect(aoConcluir).toHaveBeenCalledWith({ nome: 'Ana', empresa: 'Floway', contato: 'WhatsApp: (11) 98765-4321 · E-mail: ana@x.dev', mensagem: 'Projeto: Landing page\nObjetivo: Vender' });
  });

  it('falha da IA mostra aviso e mantém o texto para tentar de novo', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ erro: { codigo: 'IA_INDISPONIVEL' } }, { status: 503 })));
    render(<ConversaIA aoConcluir={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Sua resposta'), { target: { value: 'Meu projeto' } });
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Enviar resposta' })); });
    await screen.findByRole('alert');
    expect((screen.getByLabelText('Sua resposta') as HTMLTextAreaElement).value).toBe('Meu projeto');
  });
});
