import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Formulario } from '@/componentes/contato/Formulario';
import { PaginaContato } from '@/paginas/PaginaContato';
import { Rodape } from '@/componentes/contato/Rodape';
import { ProvedorIdioma } from '@/lib/useIdioma';

const esfera = vi.hoisted(() => vi.fn());
vi.mock('@/compartilhados/esfera/EsferaDeLetras', () => ({ EsferaDeLetras: (props: unknown) => { esfera(props); return null; } }));
const preencher = (form: HTMLFormElement) => {
  for (const [name, value] of Object.entries({ nome: 'Teste', empresa: 'Empresa', contato: 'Contato teste', mensagem: 'meu texto' }))
    fireEvent.change(form.querySelector(`[name="${name}"]`)!, { target: { value } });
};

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  esfera.mockClear();
});

describe('Formulario', () => {
  const montar = (inicial?: 'enviado' | 'falha') =>
    render(
      <ProvedorIdioma idioma="pt">
        <Formulario estadoInicial={inicial} />
      </ProvedorIdioma>,
    );

  it('funciona sem JS: POST na rota, com os campos da spec, a isca e o link de privacidade', () => {
    const { container } = montar();
    const form = container.querySelector('form')!;
    expect(form.getAttribute('method')).toBe('post');
    expect(form.getAttribute('action')).toBe('/api/contato');
    for (const nome of ['nome', 'empresa', 'contato', 'mensagem', 'site']) expect(form.querySelector(`[name="${nome}"]`)).not.toBeNull();
    expect(form.querySelector('[name="site"]')!.closest('[aria-hidden="true"]')).not.toBeNull();
    expect(screen.getByRole('link', { name: 'Política de Privacidade' }).getAttribute('href')).toBe('/privacidade');
  });

  it('na falha mostra "Tentar de novo" e não perde o texto', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 503 })));
    const { container } = montar();
    const mensagem = container.querySelector<HTMLTextAreaElement>('[name="mensagem"]')!;
    fireEvent.change(mensagem, { target: { value: 'meu texto' } });
    preencher(container.querySelector('form')!);
    fireEvent.submit(container.querySelector('form')!);
    await waitFor(() => screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(container.querySelector<HTMLTextAreaElement>('[name="mensagem"]')!.value).toBe('meu texto');
  });

  it('enviado troca o formulário pela confirmação', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{"ok":true}', { status: 200 })));
    const { container } = montar();
    preencher(container.querySelector('form')!);
    fireEvent.submit(container.querySelector('form')!);
    await waitFor(() => screen.getByText(/Pedido enviado/));
    expect(container.querySelector('form')).toBeNull();
  });

  it('anuncia espera e bloqueia dois submits no mesmo ciclo', async () => {
    let resolver!: (r: Response) => void;
    const fetch = vi.fn(() => new Promise<Response>((r) => { resolver = r; }));
    vi.stubGlobal('fetch', fetch);
    const { container } = montar();
    const form = container.querySelector('form')!;
    preencher(form);
    act(() => { fireEvent.submit(form); fireEvent.submit(form); });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('status').textContent).toContain('Enviando');
    expect(screen.getByRole('status').closest('[aria-busy="true"]')).toBeNull();
    for (const nome of ['nome', 'empresa', 'contato', 'mensagem']) expect(form.querySelector<HTMLInputElement>(`[name=${nome}]`)!.readOnly).toBe(true);
    expect(screen.getByRole<HTMLButtonElement>('button').disabled).toBe(true);
    await act(async () => resolver(new Response('{}', { status: 503 })));
    for (const nome of ['nome', 'empresa', 'contato', 'mensagem']) expect(form.querySelector<HTMLInputElement>(`[name=${nome}]`)!.readOnly).toBe(false);
  });

  it.each(['http', 'rede', 'json', 'ilegivel', 'nulo'])('falha %s mantém todos os campos e foca aviso; permite recuperar', async (tipo) => {
    const fetch = vi.fn().mockImplementationOnce(() => tipo === 'rede' ? Promise.reject(new TypeError('rede')) :
      Promise.resolve(new Response(tipo === 'json' ? '{"ok":false}' : tipo === 'ilegivel' ? 'sem json' : tipo === 'nulo' ? 'null' : '{}', { status: tipo === 'http' ? 503 : 200 })))
      .mockResolvedValueOnce(new Response('{"ok":true}', { status: 200 }));
    vi.stubGlobal('fetch', fetch);
    const { container } = montar();
    const form = container.querySelector('form')!;
    preencher(form);
    const antes = [...new FormData(form).entries()];
    fireEvent.submit(form);
    const aviso = await screen.findByRole('alert');
    await waitFor(() => expect(document.activeElement).toBe(aviso));
    expect([...new FormData(form).entries()]).toEqual(antes);
    expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Tentar de novo' }).disabled).toBe(false);
    fireEvent.change(form.querySelector('[name=mensagem]')!, { target: { value: 'Texto editado' } });
    fireEvent.submit(form);
    await screen.findByText(/Pedido enviado/);
    expect(fetch.mock.calls[1][1].body.get('mensagem')).toBe('Texto editado');
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('status')));
  });

  it('valida somente no envio, com resumo, links, mensagens, título e foco', () => {
    document.title = 'Contato | Floway';
    const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
    const { container } = montar();
    const form = container.querySelector('form')!;
    fireEvent.blur(form.querySelector('[name=nome]')!);
    expect(screen.queryByRole('alert')).toBeNull();
    fireEvent.change(form.querySelector('[name=nome]')!, { target: { value: '  ' } });
    fireEvent.submit(form);
    expect(fetch).not.toHaveBeenCalled();
    const resumo = container.querySelector('.formulario-erros')!;
    expect(document.activeElement).toBe(resumo);
    expect(document.title).toMatch(/^Erro: /);
    for (const nome of ['nome', 'contato', 'mensagem']) {
      const campo = form.querySelector<HTMLInputElement>(`[name=${nome}]`)!;
      expect(campo.getAttribute('aria-invalid')).toBe('true');
      const erro = document.getElementById(campo.getAttribute('aria-describedby')!)!;
      const link = resumo.querySelector<HTMLAnchorElement>(`a[href="#${campo.id}"]`)!;
      expect(link.textContent).toBe(erro.textContent);
      expect(erro.textContent).toMatch(/^Erro:/);
      fireEvent.click(link);
      expect(document.activeElement).toBe(campo);
    }
  });

  it('respeita máximos normalizados antes de enviar e aceita contato livre', async () => {
    const fetch = vi.fn(async () => new Response('{"ok":true}'));
    vi.stubGlobal('fetch', fetch);
    const { container } = montar(); const form = container.querySelector('form')!;
    preencher(form);
    fireEvent.change(form.querySelector('[name=empresa]')!, { target: { value: 'x'.repeat(201) } });
    fireEvent.submit(form);
    expect(fetch).not.toHaveBeenCalled();
    fireEvent.change(form.querySelector('[name=empresa]')!, { target: { value: ' '.repeat(2) + 'x'.repeat(200) + ' ' } });
    fireEvent.submit(form);
    await screen.findByText(/Pedido enviado/);
  });

  it('respeita o estado que veio do envio sem JS', () => {
    montar('falha');
    screen.getByRole('button', { name: 'Tentar de novo' });
  });
});

describe('Rodape na página de contato', () => {
  it('sem o CTA, que apontaria para a própria página', () => {
    const { container } = render(
      <ProvedorIdioma idioma="pt">
        <Rodape naPaginaDeContato />
      </ProvedorIdioma>,
    );
    expect(container.querySelector('.rodape-cta')).toBeNull();
    expect(container.querySelector('.rodape.visivel')).not.toBeNull();
  });
});

describe('esfera da página', () => {
  it('ignora URL enviada para a esfera e só forma F após resposta de submissão', async () => {
    const { unmount } = render(<PaginaContato estado="enviado" />);
    expect(esfera.mock.lastCall?.[0].formarAlvo).toBe(false);
    expect(screen.queryByText(/Pedido enviado/)).toBeNull();
    unmount();
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{"ok":true}')));
    const { container } = render(<PaginaContato />);
    preencher(container.querySelector('form')!);
    fireEvent.submit(container.querySelector('form')!);
    await screen.findByText(/Pedido enviado/);
    expect(esfera.mock.lastCall?.[0].formarAlvo).toBe(true);
  });
});
