import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Formulario } from '@/componentes/contato/Formulario';
import { Rodape } from '@/componentes/contato/Rodape';
import { ProvedorIdioma } from '@/lib/useIdioma';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
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
    fireEvent.submit(container.querySelector('form')!);
    await waitFor(() => screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(container.querySelector<HTMLTextAreaElement>('[name="mensagem"]')!.value).toBe('meu texto');
  });

  it('enviado troca o formulário pela confirmação', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 200 })));
    const { container } = montar();
    fireEvent.submit(container.querySelector('form')!);
    await waitFor(() => screen.getByText(/Pedido enviado/));
    expect(container.querySelector('form')).toBeNull();
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
