import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Formulario } from '@/componentes/contato/Formulario';
import { PaginaContato } from '@/paginas/PaginaContato';
import { Rodape } from '@/componentes/contato/Rodape';
import { ProvedorIdioma } from '@/lib/useIdioma';
const esfera = vi.hoisted(() => vi.fn());
vi.mock('@/compartilhados/esfera/EsferaDeLetras', () => ({ EsferaDeLetras: (p: unknown) => { esfera(p); return null; } }));
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
describe('Formulario B', () => {
  it('sem JS tem POST real de revisão B, campos, isca e link, sem token em URL', () => {
    const { container } = render(<Formulario />); const form = container.querySelector('form')!;
    expect(form.method).toBe('post'); expect(form.getAttribute('action')).toBe('/api/contato');
    for (const nome of ['nome', 'empresa', 'contato', 'mensagem', 'site', 'intencao', 'idioma']) expect(form.querySelector(`[name=${nome}]`)).not.toBeNull();
    expect(new FormData(form).get('acao')).toBe('revisar'); expect(new FormData(form).get('versao')).toBe('contato-b.1');
    expect(form.querySelector('[name=site]')!.closest('[aria-hidden=true]')).not.toBeNull();
    expect(screen.getByRole('link', { name: 'Política de Privacidade' }).getAttribute('href')).toBe('/privacidade');
  });
  it('valida somente no envio com resumo, links, mensagens, título e foco', () => {
    document.title = 'Contato | Floway'; const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
    const { container } = render(<Formulario />); const form = container.querySelector('form')!;
    fireEvent.blur(screen.getByLabelText('Nome')); expect(screen.queryByRole('alert')).toBeNull();
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: '  ' } }); fireEvent.submit(form);
    expect(fetch).not.toHaveBeenCalled(); const resumo = container.querySelector('.formulario-erros')!;
    expect(document.activeElement).toBe(resumo); expect(document.title).toMatch(/^Erro: /);
    for (const nome of ['nome', 'contato', 'mensagem']) {
      const campo = form.querySelector(`[name=${nome}]`)!; expect(campo.getAttribute('aria-invalid')).toBe('true');
      const erro = document.getElementById(campo.getAttribute('aria-describedby')!)!;
      const link = resumo.querySelector(`a[href="#${campo.id}"]`)!; expect(link.textContent).toBe(erro.textContent); fireEvent.click(link); expect(document.activeElement).toBe(campo);
    }
  });
  it.each([['Nome', 201], ['Empresa', 201], ['Contato', 201], ['Mensagem', 5001]])('limite %s valida ao revisar e não trunca', (rotulo, tamanho) => {
    render(<Formulario />);
    for (const nome of ['Nome', 'Contato', 'Mensagem']) fireEvent.change(screen.getByLabelText(nome), { target: { value: 'Texto' } });
    fireEvent.change(screen.getByLabelText(rotulo), { target: { value: 'x'.repeat(tamanho) } });
    fireEvent.click(screen.getByRole('button', { name: 'Revisar pedido' })); screen.getByRole('alert');
    expect((screen.getByLabelText(rotulo) as HTMLInputElement).value).toHaveLength(tamanho);
  });
  it('normaliza bordas e preserva contato livre e quebras internas antes da revisão', () => {
    render(<Formulario />);
    for (const [nome, value] of [['Nome', ' Pessoa '], ['Empresa', 'x'.repeat(200) + ' '], ['Contato', ' contato livre '], ['Mensagem', ' a\nb ']]) fireEvent.change(screen.getByLabelText(nome), { target: { value } });
    fireEvent.click(screen.getByRole('button', { name: 'Revisar pedido' }));
    expect(document.querySelector('dl')?.textContent).toContain('a\nb'); screen.getByRole('button', { name: 'Confirmar e enviar' });
  });
  it('sem configuração conserva os quatro campos e informa indisponibilidade honesta', () => {
    const fetch = vi.fn(); vi.stubGlobal('fetch', fetch); render(<Formulario />);
    for (const nome of ['Nome', 'Contato', 'Mensagem']) fireEvent.change(screen.getByLabelText(nome), { target: { value: 'Texto' } });
    fireEvent.click(screen.getByRole('button', { name: 'Revisar pedido' })); fireEvent.click(screen.getByRole('button', { name: 'Confirmar e enviar' }));
    expect(fetch).not.toHaveBeenCalled(); expect(document.activeElement).toBe(screen.getByText(/O envio está indisponível/));
    fireEvent.click(screen.getByRole('button', { name: 'Ajustar' })); expect((screen.getByLabelText('Mensagem') as HTMLTextAreaElement).value).toBe('Texto');
  });
});
it('rodapé da página não oferece CTA para a própria página', () => {
  const { container } = render(<ProvedorIdioma idioma="pt"><Rodape naPaginaDeContato /></ProvedorIdioma>);
  expect(container.querySelector('.rodape-cta')).toBeNull(); expect(container.querySelector('.rodape.visivel')).not.toBeNull();
});
it('URL enviada não comprova entrega nem forma F', () => {
  render(<PaginaContato estado="enviado" />); expect(esfera.mock.lastCall?.[0].formarAlvo).toBe(false); expect(screen.queryByText(/Envio aceito/)).toBeNull(); screen.getByLabelText('Nome');
});
