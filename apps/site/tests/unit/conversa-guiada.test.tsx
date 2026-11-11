import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ConversaGuiada, emailValido, montarPedido, whatsappValido } from '@/componentes/contato/ConversaGuiada';

beforeEach(() => vi.useFakeTimers());
afterEach(() => { cleanup(); vi.useRealTimers(); });

const passar = () => act(() => { vi.runAllTimers(); });
const responder = (texto: string) => {
  fireEvent.change(screen.getByLabelText('Sua resposta'), { target: { value: texto } });
  fireEvent.click(screen.getByRole('button', { name: 'Enviar resposta' }));
  passar();
};
const respostas = { nome: 'Ana', empresa: 'Floway', necessidades: ['Site', 'Outro: Loja virtual'], prazo: 'Sem pressa', whatsapp: '(11) 98765-4321', email: 'ana@x.dev', descricao: 'Quero vender online' };

let tela: ReturnType<typeof render>;
function ateOFim(aoConcluir = vi.fn()) {
  tela = render(<ConversaGuiada aoConcluir={aoConcluir} />);
  passar();
  responder('Ana');
  responder('Floway');
  fireEvent.click(screen.getByRole('checkbox', { name: 'Site' }));
  fireEvent.click(screen.getByRole('checkbox', { name: 'Outro' }));
  const continuar = screen.getByRole('button', { name: /Continuar/ }) as HTMLButtonElement;
  expect(continuar.disabled).toBe(true); // "Outro" marcado pede o texto
  fireEvent.change(screen.getByRole('textbox', { name: 'Qual?' }), { target: { value: 'Loja virtual' } });
  fireEvent.click(continuar); passar();
  fireEvent.click(screen.getByRole('button', { name: 'Sem pressa' })); passar();
  responder('(11) 98765-4321');
  responder('ana@x.dev');
  responder('Quero vender online');
  return aoConcluir;
}

describe('montarPedido', () => {
  it('junta WhatsApp e e-mail no contato e o checklist e o prazo na mensagem', () => {
    expect(montarPedido(respostas, 'pt')).toEqual({ nome: 'Ana', empresa: 'Floway', contato: 'WhatsApp: (11) 98765-4321 · E-mail: ana@x.dev', mensagem: 'Preciso de: Site, Outro: Loja virtual\nPrazo: Sem pressa\n\nQuero vender online' });
  });
});

describe('ConversaGuiada', () => {
  it('todas obrigatórias, "Outro" com texto, WhatsApp e e-mail separados e validados', () => {
    const aoConcluir = vi.fn();
    render(<ConversaGuiada aoConcluir={aoConcluir} />);
    passar();
    responder('Ana');
    expect(screen.getByText('Ana').closest('.guiada-balao')?.classList.contains('voce')).toBe(true);
    expect(screen.queryByRole('button', { name: 'Pular' })).toBeNull();
    cleanup();
    const fim = ateOFim();
    expect(fim).toHaveBeenCalledWith(montarPedido(respostas, 'pt'));
  });

  it('recusa WhatsApp e e-mail inválidos sem avançar', () => {
    render(<ConversaGuiada aoConcluir={vi.fn()} />);
    passar(); responder('Ana'); responder('Floway');
    fireEvent.click(screen.getByRole('checkbox', { name: 'Site' }));
    fireEvent.click(screen.getByRole('button', { name: /Continuar/ })); passar();
    fireEvent.click(screen.getByRole('button', { name: 'Sem pressa' })); passar();
    responder('1198765');
    expect(screen.getByRole('alert').textContent).toMatch(/WhatsApp com DDD/);
    responder('11987654321');
    responder('ana@');
    expect(screen.getByRole('alert').textContent).toMatch(/e-mail válido/);
  });

  it('no resumo, editar uma etapa refaz só ela e volta ao resumo', () => {
    const aoConcluir = ateOFim();
    const resumo = screen.getByRole('region', { name: 'Resumo do pedido' });
    fireEvent.click(within(resumo).getByRole('button', { name: 'Editar E-mail' }));
    passar();
    expect(screen.queryByRole('region', { name: 'Resumo do pedido' })).toBeNull();
    responder('outra@x.dev');
    expect(aoConcluir).toHaveBeenLastCalledWith(montarPedido({ ...respostas, email: 'outra@x.dev' }, 'pt'));
    expect(within(screen.getByRole('region', { name: 'Resumo do pedido' })).getByText('outra@x.dev')).toBeTruthy();
    expect(screen.getByRole('region', { name: 'Resumo do pedido' }).textContent).toContain('Quero vender online');
  });

  it('não aceita resposta vazia nem acima do limite do servidor', () => {
    render(<ConversaGuiada aoConcluir={vi.fn()} />);
    passar();
    const enviar = screen.getByRole('button', { name: 'Enviar resposta' }) as HTMLButtonElement;
    fireEvent.change(screen.getByLabelText('Sua resposta'), { target: { value: '   ' } });
    expect(enviar.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText('Sua resposta'), { target: { value: 'x'.repeat(201) } });
    expect(enviar.disabled).toBe(true);
  });
});

describe('ConversaGuiada bloqueada', () => {
  it('com o envio em curso, o resumo não oferece mais editar etapas', () => {
    ateOFim();
    expect(screen.getAllByRole('button', { name: /^Editar / }).length).toBe(7);
    tela.rerender(<ConversaGuiada aoConcluir={vi.fn()} bloqueado />);
    expect(screen.queryAllByRole('button', { name: /^Editar / })).toHaveLength(0);
  });
});

describe('validadores', () => {
  it.each(['(11) 98765-4321', '+55 11 98765-4321', '11987654321', '1132654321'])('WhatsApp aceita %s', v => expect(whatsappValido(v)).toBe(true));
  it.each(['123', '11 8765-432', '(11) 98765-43210', '00 98765-4321', 'ana@x.dev'])('WhatsApp recusa %s', v => expect(whatsappValido(v)).toBe(false));
  it.each(['ana@empresa.dev', 'a.b+c@x.co'])('e-mail aceita %s', v => expect(emailValido(v)).toBe(true));
  it.each(['ana@', 'ana@x', 'ana x@y.dev', '11987654321'])('e-mail recusa %s', v => expect(emailValido(v)).toBe(false));
});
