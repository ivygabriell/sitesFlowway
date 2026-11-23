import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
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
const servidor = { versao: 'contato-b.1', intencao: 'token-apenas-teste', chave: 'contato/00000000-0000-4000-8000-000000000001', repetirAte: new Date(Date.now() + 3600000).toISOString(), conversaDisponivel: false, envioDisponivel: true } as const;
const ultimaEsfera = () => esfera.mock.calls[esfera.mock.calls.length - 1][0] as { respondendo?: boolean; formarAlvo?: boolean; className?: string };
async function ateOCartao() {
  vi.stubGlobal('matchMedia', (q: string) => ({ matches: q.includes('reduce'), media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }));
  const { container } = render(<PaginaContato servidor={servidor} />);
  for (const texto of ['Um site', 'Ana', 'Floway']) { fireEvent.change(screen.getByRole('textbox', { name: 'Sua mensagem' }), { target: { value: texto } }); fireEvent.click(screen.getByRole('button', { name: 'Enviar mensagem' })); }
  fireEvent.click(screen.getByRole('checkbox', { name: 'Site' })); fireEvent.click(screen.getByRole('button', { name: /Continuar/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Sem pressa' }));
  for (const texto of ['(11) 98765-4321', 'ana@x.dev']) { fireEvent.change(screen.getByRole('textbox', { name: 'Sua mensagem' }), { target: { value: texto } }); fireEvent.click(screen.getByRole('button', { name: 'Enviar mensagem' })); }
  return container;
}
describe('PaginaContato no chat', () => {
  it('abre no estado 02: chat vazio e o globo no canto com "Floway IA · online", sem o F', () => {
    const { container } = render(<PaginaContato servidor={servidor} />);
    screen.getByRole('heading', { name: 'Como podemos ajudar?' });
    expect(container.querySelector('.contato-globo .esfera, .contato-globo')).not.toBeNull();
    expect(container.querySelector('.contato-globo-status')?.textContent).toMatch(/Floway IA.*online/);
    expect(ultimaEsfera()).toMatchObject({ respondendo: false, formarAlvo: false });
    expect(container.querySelector('.circulo-escuro')).toBeNull();
  });
  it('o F só se forma depois do sucesso real do envio', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ ok: true, estado: 'aceito', requestId: '00000000-0000-4000-8000-000000000001', repetirAte: servidor.repetirAte })));
    const container = await ateOCartao();
    expect(container.querySelector('.contato-globo-status')?.textContent).toMatch(/resumo pronto/);
    expect(ultimaEsfera().formarAlvo).toBe(false);
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Confirmar e enviar' })); });
    await screen.findByRole('heading', { name: /Pedido enviado/ });
    expect(ultimaEsfera().formarAlvo).toBe(true);
    expect(container.querySelector('.contato-globo-status')?.textContent).toMatch(/pedido recebido/);
    screen.getByRole('link', { name: 'Ver trabalhos' });
  });
  it('resultado sem prova de aceite não forma o F: status de falha e "Tentar de novo"', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ ok: true, estado: 'recebido' })));
    const container = await ateOCartao();
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Confirmar e enviar' })); });
    await screen.findByRole('button', { name: 'Tentar de novo' });
    expect(ultimaEsfera().formarAlvo).toBe(false);
    expect(container.querySelector('.contato-globo-status')?.textContent).toMatch(/não foi desta vez/);
  });
});
it('URL enviada não comprova entrega', () => {
  render(<PaginaContato estado="enviado" />);
  expect(screen.queryByText(/Envio aceito/)).toBeNull(); screen.getByRole('heading', { name: 'Como podemos ajudar?' });
});
