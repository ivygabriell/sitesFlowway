import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ConversaGuiada, montarPedido } from '@/componentes/contato/ConversaGuiada';

beforeEach(() => vi.useFakeTimers());
afterEach(() => { cleanup(); vi.useRealTimers(); });

const responder = (texto: string) => {
  fireEvent.change(screen.getByLabelText('Sua resposta'), { target: { value: texto } });
  fireEvent.click(screen.getByRole('button', { name: 'Enviar resposta' }));
  act(() => { vi.runAllTimers(); });
};

describe('montarPedido', () => {
  it('junta o checklist, o prazo e o texto livre na mensagem, sem perder nada', () => {
    const p = montarPedido({ nome: ' Ana ', empresa: '', necessidades: ['Site', 'Automações'], prazo: 'Sem pressa', contato: 'ana@x.com', descricao: 'Quero vender online' }, 'pt');
    expect(p).toEqual({ nome: 'Ana', empresa: '', contato: 'ana@x.com', mensagem: 'Preciso de: Site, Automações\nPrazo: Sem pressa\n\nQuero vender online' });
  });
});

describe('ConversaGuiada', () => {
  it('pergunta uma coisa por vez, aceita checklist e escolha, e entrega o pedido no fim', () => {
    const aoConcluir = vi.fn();
    render(<ConversaGuiada aoConcluir={aoConcluir} />);
    act(() => { vi.runAllTimers(); });
    expect(screen.getByText(/qual é o seu nome/i)).toBeTruthy();
    responder('Ana');
    expect(screen.getByText('Ana').closest('.guiada-balao')?.classList.contains('voce')).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Pular' }));
    act(() => { vi.runAllTimers(); });
    const continuar = screen.getByRole('button', { name: 'Continuar' }) as HTMLButtonElement;
    expect(continuar.disabled).toBe(true);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Site' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Automações' }));
    fireEvent.click(continuar);
    act(() => { vi.runAllTimers(); });
    fireEvent.click(screen.getByRole('button', { name: 'Sem pressa' }));
    act(() => { vi.runAllTimers(); });
    responder('ana@x.com');
    expect(aoConcluir).not.toHaveBeenCalled();
    responder('Quero vender online');
    expect(aoConcluir).toHaveBeenCalledWith({ nome: 'Ana', empresa: '', contato: 'ana@x.com', mensagem: 'Preciso de: Site, Automações\nPrazo: Sem pressa\n\nQuero vender online' });
  });

  it('não aceita resposta vazia nem acima do limite do servidor', () => {
    render(<ConversaGuiada aoConcluir={vi.fn()} />);
    act(() => { vi.runAllTimers(); });
    const enviar = screen.getByRole('button', { name: 'Enviar resposta' }) as HTMLButtonElement;
    fireEvent.change(screen.getByLabelText('Sua resposta'), { target: { value: '   ' } });
    expect(enviar.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText('Sua resposta'), { target: { value: 'x'.repeat(201) } });
    expect(enviar.disabled).toBe(true);
  });
});
