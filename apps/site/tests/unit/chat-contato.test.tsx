import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ChatContato, type MensagemChat } from '@/componentes/contato/ChatContato';

// Componente comum do chat (spec 2026-11-22, frames 02 a 04): a resposta da IA chega palavra por palavra no cliente.
const RESPOSTA = 'Legal! Vocês já têm um site hoje, ou começamos do zero?';
const visivel = () => document.querySelector('.chat-revelando p')?.textContent ?? '';
const passar = (ms: number) => act(() => { vi.advanceTimersByTime(ms); });
const reduzir = (sim: boolean) => vi.stubGlobal('matchMedia', (q: string) => ({ matches: sim && q.includes('reduce'), media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }));

function Teste({ inicial = [] as MensagemChat[], pensando = false, aoEnviar = vi.fn(), aoParar = vi.fn(), respostas = ['Urgente', 'Sem pressa'] }) {
  const [mensagens, setMensagens] = useState(inicial);
  const [entrada, setEntrada] = useState('');
  return <>
    <button type="button" onClick={() => setMensagens(m => [...m, { de: 'ia', texto: RESPOSTA }])}>chega resposta</button>
    <ChatContato mensagens={mensagens} pensando={pensando} respostas={respostas} entrada={entrada} aoMudar={setEntrada} aoEnviar={aoEnviar} aoParar={aoParar} placeholder="Escreva sua mensagem…" />
  </>;
}
const chegar = () => fireEvent.click(screen.getByRole('button', { name: 'chega resposta' }));

beforeEach(() => { vi.useFakeTimers(); reduzir(false); });
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('ChatContato', () => {
  it('vazio: título, campo e respostas rápidas iniciais', () => {
    render(<Teste />);
    screen.getByRole('heading', { name: 'Como podemos ajudar?' });
    screen.getByRole('textbox', { name: 'Sua mensagem' });
    screen.getByRole('button', { name: 'Urgente' });
  });

  it('revela a resposta palavra por palavra com cursor, e só a mensagem terminada entra na região viva', () => {
    render(<Teste inicial={[{ de: 'voce', texto: 'Quero um site' }]} />);
    chegar();
    const lista = screen.getByRole('log');
    expect(lista.getAttribute('aria-live')).toBe('polite');
    expect(visivel()).toBe('');
    expect(document.querySelector('.chat-revelando')?.getAttribute('aria-hidden')).toBe('true');
    expect(document.querySelector('.chat-cursor')).not.toBeNull();
    passar(200);
    const parcial = visivel();
    expect(parcial.length).toBeGreaterThan(0);
    expect(parcial.length).toBeLessThan(RESPOSTA.length);
    expect(RESPOSTA.startsWith(parcial.trimEnd())).toBe(true);
    expect(screen.queryByText(RESPOSTA)).toBeNull();
    passar(5000);
    expect(document.querySelector('.chat-revelando')).toBeNull();
    expect(document.querySelector('.chat-cursor')).toBeNull();
    expect(screen.getByText(RESPOSTA).closest('[aria-hidden]')).toBeNull();
  });

  it('enquanto revela, o botão vira "Parar": parar mostra a mensagem inteira e devolve o foco ao campo', () => {
    render(<Teste inicial={[{ de: 'voce', texto: 'Quero um site' }]} />);
    chegar();
    passar(120);
    expect(screen.queryByRole('button', { name: 'Enviar mensagem' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Parar' }));
    expect(document.querySelector('.chat-revelando')).toBeNull();
    screen.getByText(RESPOSTA);
    expect(document.activeElement).toBe(screen.getByRole('textbox', { name: 'Sua mensagem' }));
    screen.getByRole('button', { name: 'Enviar mensagem' });
  });

  it('com o pedido no ar, mostra "pensando", trava o campo e "Parar" chama aoParar', () => {
    const aoParar = vi.fn(); const aoEnviar = vi.fn();
    render(<Teste inicial={[{ de: 'voce', texto: 'Quero um site' }]} pensando aoParar={aoParar} aoEnviar={aoEnviar} />);
    expect(document.querySelector('.chat-pensando')).not.toBeNull();
    const campo = screen.getByRole('textbox', { name: 'Sua mensagem' }) as HTMLTextAreaElement;
    expect(campo.readOnly).toBe(true);
    fireEvent.change(campo, { target: { value: 'mais' } });
    fireEvent.keyDown(campo, { key: 'Enter' });
    expect(aoEnviar).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Parar' }));
    expect(aoParar).toHaveBeenCalledTimes(1);
  });

  it('pensando por mais de 10 s avisa que está demorando, com o "Parar" à mão', () => {
    render(<Teste inicial={[{ de: 'voce', texto: 'Quero um site' }]} pensando />);
    expect(screen.queryByText(/Está demorando/)).toBeNull();
    passar(10_100);
    screen.getByText(/Está demorando/);
    screen.getByRole('button', { name: 'Parar' });
  });

  it('o erro da última mensagem fica ligado ao campo', () => {
    reduzir(true);
    render(<ChatContato mensagens={[{ de: 'voce', texto: '123' }, { de: 'ia', texto: 'Informe um WhatsApp com DDD.', erro: true }]} pensando={false} entrada="123" aoMudar={vi.fn()} aoEnviar={vi.fn()} placeholder="" invalido />);
    const campo = screen.getByRole('textbox', { name: 'Sua mensagem' });
    expect(campo.getAttribute('aria-invalid')).toBe('true');
    expect(document.getElementById(campo.getAttribute('aria-describedby')!)?.textContent).toMatch(/WhatsApp com DDD/);
  });

  it('respostas rápidas só aparecem depois que a mensagem da IA termina, e clicar envia o texto', () => {
    const aoEnviar = vi.fn();
    render(<Teste inicial={[{ de: 'voce', texto: 'Quero um site' }]} aoEnviar={aoEnviar} />);
    chegar();
    passar(200);
    expect(screen.queryByRole('button', { name: 'Urgente' })).toBeNull();
    passar(5000);
    fireEvent.click(screen.getByRole('button', { name: 'Urgente' }));
    expect(aoEnviar).toHaveBeenCalledWith('Urgente');
  });

  it('Enter envia, Shift+Enter não envia', () => {
    const aoEnviar = vi.fn();
    render(<Teste aoEnviar={aoEnviar} />);
    const campo = screen.getByRole('textbox', { name: 'Sua mensagem' });
    fireEvent.change(campo, { target: { value: 'Oi' } });
    fireEvent.keyDown(campo, { key: 'Enter', shiftKey: true });
    expect(aoEnviar).not.toHaveBeenCalled();
    fireEvent.keyDown(campo, { key: 'Enter' });
    expect(aoEnviar).toHaveBeenCalledWith('Oi');
  });

  it('com movimento reduzido, a mensagem aparece inteira e as respostas rápidas na hora', () => {
    reduzir(true);
    render(<Teste inicial={[{ de: 'voce', texto: 'Quero um site' }]} />);
    chegar();
    expect(document.querySelector('.chat-revelando')).toBeNull();
    screen.getByText(RESPOSTA);
    screen.getByRole('button', { name: 'Urgente' });
  });
});
