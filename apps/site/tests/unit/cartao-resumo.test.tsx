import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CartaoResumo, type Campos } from '@/componentes/contato/CartaoResumo';
import type { ContatoServidorDTO } from '@/lib/contato/servidor';

// Cartão de resumo (frames 05 a 07): nada sai antes de "Confirmar e enviar"; o envio é o do Formulario (/api/contato).
const servidor: ContatoServidorDTO = { versao: 'contato-b.1', intencao: 'token-apenas-teste', chave: 'contato/00000000-0000-4000-8000-000000000001', repetirAte: new Date(Date.now() + 3600000).toISOString(), conversaDisponivel: true, envioDisponivel: true };
const CAMPOS: Campos = { nome: 'Ana Souza', empresa: 'Estúdio Norte', whatsapp: '(11) 98765-4321', email: 'ana@estudionorte.com', projeto: 'Projeto: Site novo com orçamento online\nPrazo: 1 a 3 meses' };
const aceito = () => Response.json({ ok: true, estado: 'aceito', requestId: '00000000-0000-4000-8000-000000000001', repetirAte: servidor.repetirAte });

function Teste({ aoStatus = vi.fn(), aoMudar = vi.fn() }) {
  const [campos, setCampos] = useState(CAMPOS);
  return <CartaoResumo campos={campos} aoMudar={c => { aoMudar(c); setCampos(c); }} servidor={servidor} aoStatus={aoStatus} />;
}
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.useRealTimers(); });
const cartao = () => screen.getByRole('region', { name: 'Resumo do pedido' });

describe('CartaoResumo', () => {
  it('mostra as linhas do resumo e nada é enviado antes de confirmar', () => {
    const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
    render(<Teste />);
    const linhas = within(cartao());
    expect(linhas.getByText('Ana Souza · Estúdio Norte')).toBeTruthy();
    expect(linhas.getByText('Prazo').nextElementSibling?.textContent).toBe('1 a 3 meses');
    expect(linhas.getByText('(11) 98765-4321 · ana@estudionorte.com')).toBeTruthy();
    within(cartao()).getByRole('button', { name: 'Confirmar e enviar' });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('"Ajustar algo" edita no próprio cartão, com a validação de WhatsApp, e volta ao resumo', () => {
    const aoMudar = vi.fn(); document.title = 'Contato | Floway';
    render(<Teste aoMudar={aoMudar} />);
    fireEvent.click(screen.getByRole('button', { name: 'Ajustar algo' }));
    const whatsapp = screen.getByLabelText('WhatsApp') as HTMLInputElement;
    expect(document.activeElement).toBe(screen.getByLabelText('Nome'));
    fireEvent.change(whatsapp, { target: { value: '123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Revisar pedido' }));
    expect(whatsapp.getAttribute('aria-invalid')).toBe('true');
    expect(document.getElementById(whatsapp.getAttribute('aria-describedby')!)?.textContent).toMatch(/WhatsApp com DDD/);
    expect(aoMudar).not.toHaveBeenCalled();
    // Resumo de erros (GOV.UK): foco nele, "Erro: " no título, link para o campo com o mesmo texto.
    const resumo = document.querySelector('.formulario-erros') as HTMLElement;
    expect(document.activeElement).toBe(resumo);
    expect(document.title).toMatch(/^Erro: /);
    const link = resumo.querySelector('a[href="#cartao-whatsapp"]')!;
    expect(link.textContent).toContain(document.getElementById('cartao-whatsapp-erro')!.textContent!.replace('Erro: ', ''));
    expect(document.getElementById('cartao-whatsapp-erro')?.textContent).toMatch(/^Erro: /);
    fireEvent.change(whatsapp, { target: { value: '(21) 99876-5432' } });
    fireEvent.click(screen.getByRole('button', { name: 'Revisar pedido' }));
    expect(aoMudar).toHaveBeenCalledWith({ ...CAMPOS, whatsapp: '(21) 99876-5432' });
    within(cartao()).getByText('(21) 99876-5432 · ana@estudionorte.com');
  });

  it('duplo clique em confirmar envia uma vez; o sucesso real vira "Pedido enviado"', async () => {
    const fetch = vi.fn(async () => aceito()); vi.stubGlobal('fetch', fetch);
    const aoStatus = vi.fn();
    render(<Teste aoStatus={aoStatus} />);
    const confirmar = screen.getByRole('button', { name: 'Confirmar e enviar' });
    await act(async () => { fireEvent.click(confirmar); fireEvent.click(confirmar); });
    await screen.findByRole('heading', { name: /Pedido enviado/ });
    expect(fetch).toHaveBeenCalledTimes(1);
    const corpo = (fetch.mock.calls[0] as unknown as [string, RequestInit])[1].body as FormData;
    expect(corpo.get('contato')).toBe('WhatsApp: (11) 98765-4321 · E-mail: ana@estudionorte.com');
    expect(corpo.get('mensagem')).toBe(CAMPOS.projeto);
    expect(aoStatus).toHaveBeenNthCalledWith(1, 'enviando');
    expect(aoStatus).toHaveBeenLastCalledWith('enviado');
    expect(screen.queryByRole('button', { name: 'Ajustar algo' })).toBeNull();
  });

  it('falha: o cartão continua, com "Tentar de novo", e a cópia fica travada', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ ok: false, estado: 'falha', codigo: 'LIMITE_ATINGIDO', repetivel: false }, { status: 503 })));
    const aoStatus = vi.fn();
    render(<Teste aoStatus={aoStatus} />);
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Confirmar e enviar' })); });
    await screen.findByRole('button', { name: 'Tentar de novo' });
    within(cartao()).getByText('Ana Souza · Estúdio Norte');
    expect(aoStatus).toHaveBeenLastCalledWith('falha');
    expect(screen.queryByRole('button', { name: 'Ajustar algo' })).toBeNull();
    expect(screen.queryByRole('heading', { name: /Pedido enviado/ })).toBeNull();
  });

  it('o cartão mostra o texto como vai ser enviado: só os rótulos das fontes viram linha, na ordem do texto', () => {
    vi.stubGlobal('fetch', vi.fn());
    render(<CartaoResumo campos={{ ...CAMPOS, projeto: 'Projeto: Site novo\nVeja https://site.com\nObs: tem blog\nPrazo desejado: março' }} aoMudar={vi.fn()} servidor={servidor} />);
    const rotulos = [...cartao().querySelectorAll('dt')].map(d => d.textContent);
    expect(rotulos).toEqual(['Nome', 'Projeto', 'Projeto', 'Prazo desejado', 'Contato']);
    const textos = [...cartao().querySelectorAll('dd')].map(d => d.textContent);
    expect(textos[2]).toBe('Veja https://site.com\nObs: tem blog');
  });

  it('cartão acima do limite (projeto > 5000 ou contato > 200) não oferece CONFIRMAR: mostra o erro e "Ajustar algo"', () => {
    const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
    render(<CartaoResumo campos={{ ...CAMPOS, projeto: 'x'.repeat(5001) }} aoMudar={vi.fn()} servidor={servidor} />);
    expect(screen.queryByRole('button', { name: 'Confirmar e enviar' })).toBeNull();
    within(cartao()).getByText(/Use até 5000 caracteres/);
    within(cartao()).getByRole('button', { name: 'Ajustar algo' });
    cleanup();
    render(<CartaoResumo campos={{ ...CAMPOS, email: `${'a'.repeat(110)}@x.dev`, whatsapp: `(11) 98765-4321${' '.repeat(70)}` }} aoMudar={vi.fn()} servidor={servidor} />);
    expect(screen.queryByRole('button', { name: 'Confirmar e enviar' })).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });
});
