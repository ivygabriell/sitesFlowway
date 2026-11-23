import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ConversaGuiada, emailValido, projetoDe, whatsappValido } from '@/componentes/contato/ConversaGuiada';

// Roteiro fixo (sem Gemini) no visual do chat: o vazio (frame 02) recebe o projeto; depois, uma pergunta por vez.
beforeEach(() => vi.stubGlobal('matchMedia', (q: string) => ({ matches: q.includes('reduce'), media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} })));
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

const campo = () => screen.getByRole('textbox', { name: 'Sua mensagem' }) as HTMLTextAreaElement;
const responder = (texto: string) => {
  fireEvent.change(campo(), { target: { value: texto } });
  fireEvent.click(screen.getByRole('button', { name: 'Enviar mensagem' }));
};
const respostas = { nome: 'Ana', empresa: 'Floway', necessidades: ['Site', 'Outro: Loja virtual'], prazo: 'Sem pressa', whatsapp: '(11) 98765-4321', email: 'ana@x.dev', descricao: 'Quero vender online' };

function ateOFim(aoStatus = vi.fn()) {
  render(<ConversaGuiada aoStatus={aoStatus} />);
  responder('Quero vender online');
  screen.getByText(/qual é o seu nome/i);
  responder('Ana');
  responder('Floway');
  fireEvent.click(screen.getByRole('checkbox', { name: 'Site' }));
  fireEvent.click(screen.getByRole('checkbox', { name: 'Outro' }));
  const continuar = screen.getByRole('button', { name: /Continuar/ }) as HTMLButtonElement;
  expect(continuar.disabled).toBe(true); // "Outro" marcado pede o texto
  fireEvent.change(screen.getByRole('textbox', { name: 'Qual?' }), { target: { value: 'Loja virtual' } });
  fireEvent.click(continuar);
  fireEvent.click(screen.getByRole('button', { name: 'Sem pressa' }));
  responder('(11) 98765-4321');
  responder('ana@x.dev');
  return aoStatus;
}

describe('projetoDe', () => {
  it('junta o checklist e o prazo ao projeto', () => {
    expect(projetoDe(respostas, 'pt')).toBe('Preciso de: Site, Outro: Loja virtual\nPrazo: Sem pressa\n\nQuero vender online');
  });
});

describe('ConversaGuiada', () => {
  it('abre no vazio com as respostas rápidas; a primeira resposta é o projeto', () => {
    render(<ConversaGuiada />);
    screen.getByRole('heading', { name: 'Como podemos ajudar?' });
    fireEvent.click(screen.getByRole('button', { name: 'Automatizar um processo' }));
    expect(screen.getByText('Automatizar um processo').closest('.chat-voce')).not.toBeNull();
    screen.getByText(/qual é o seu nome/i);
  });

  it('todas obrigatórias, "Outro" com texto, e o resumo vira o cartão', () => {
    const aoStatus = ateOFim();
    const cartao = screen.getByRole('region', { name: 'Resumo do pedido' });
    within(cartao).getByText('Ana · Floway');
    within(cartao).getByText('(11) 98765-4321 · ana@x.dev');
    expect(within(cartao).getByText('Prazo').nextElementSibling?.textContent).toBe('Sem pressa');
    expect(aoStatus).toHaveBeenLastCalledWith('resumo');
  });

  it('recusa WhatsApp e e-mail inválidos sem avançar e sem apagar o que foi digitado', () => {
    render(<ConversaGuiada />);
    responder('Um site'); responder('Ana'); responder('Floway');
    fireEvent.click(screen.getByRole('checkbox', { name: 'Site' }));
    fireEvent.click(screen.getByRole('button', { name: /Continuar/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Sem pressa' }));
    responder('1198765');
    expect(screen.getByText(/WhatsApp com DDD/).closest('.chat-erro')).not.toBeNull();
    expect(campo().value).toBe('1198765');
    expect(campo().getAttribute('aria-invalid')).toBe('true');
    responder('11987654321');
    responder('ana@');
    expect(screen.getByText(/e-mail válido/).closest('.chat-erro')).not.toBeNull();
  });

  it('não aceita resposta acima do limite do servidor', () => {
    render(<ConversaGuiada />);
    responder('Um site');
    expect(campo().maxLength).toBe(200);
  });

  it('depois do resumo, o que a pessoa acrescenta entra no projeto do cartão', () => {
    ateOFim();
    responder('Tem que ter blog');
    expect(within(screen.getByRole('region', { name: 'Resumo do pedido' })).getByText(/Tem que ter blog/)).toBeTruthy();
    screen.getByText('Anotei no resumo. Confira o cartão acima.');
  });
});

describe('validadores', () => {
  it.each(['(11) 98765-4321', '+55 11 98765-4321', '11987654321', '1132654321'])('WhatsApp aceita %s', v => expect(whatsappValido(v)).toBe(true));
  it.each(['123', '11 8765-432', '(11) 98765-43210', '00 98765-4321', 'ana@x.dev'])('WhatsApp recusa %s', v => expect(whatsappValido(v)).toBe(false));
  it.each(['ana@empresa.dev', 'a.b+c@x.co'])('e-mail aceita %s', v => expect(emailValido(v)).toBe(true));
  it.each(['ana@', 'ana@x', 'ana x@y.dev', '11987654321'])('e-mail recusa %s', v => expect(emailValido(v)).toBe(false));
});
