import { cleanup, render } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Contato } from '@/componentes/contato/Contato';
import { ProvedorIdioma } from '@/lib/useIdioma';
import { alvoDoSimbolo } from '@/marca/amostrar';

// Cada alvo que a esfera recebe fica registrado; a esfera de verdade continua desenhando a div.esfera.
const alvosRecebidos = vi.hoisted(() => [] as unknown[]);
vi.mock('@/compartilhados/esfera/EsferaDeLetras', async (original) => {
  const real = await original<typeof import('@/compartilhados/esfera/EsferaDeLetras')>();
  return {
    ...real,
    EsferaDeLetras: (props: ComponentProps<typeof real.EsferaDeLetras>) => {
      alvosRecebidos.push(props.alvo);
      return <real.EsferaDeLetras {...props} />;
    },
  };
});

// Textos exatos da spec (seção 4.3, linhas Contato e Rodapé).
const FRASE =
  'Na Floway, estratégia e desenvolvimento caminham juntos. Unimos visão criativa, engenharia de software e inteligência artificial para transformar desafios em soluções inteligentes.';
const ESPECIALIDADES = 'Estratégia digital, desenvolvimento web, inteligência artificial, automações e experiências digitais';

beforeEach(() => void (alvosRecebidos.length = 0));
afterEach(cleanup);

describe('Contato', () => {
  it('a .frase-contato tem a frase exata da spec (22 palavras)', () => {
    const { container } = render(<Contato />);
    const frase = container.querySelector('.secao-contato .frase-contato')?.textContent;
    expect(frase).toBe(FRASE);
    expect(frase!.split(/\s+/)).toHaveLength(22);
  });

  it('o CTA "Iniciar um projeto →" leva a /contato', () => {
    const { getByRole } = render(<Contato />);
    expect(getByRole('link', { name: 'Iniciar um projeto →' }).getAttribute('href')).toBe('/contato');
  });

  it('em inglês o CTA é "Start a project →" e leva a /en/contact', () => {
    const { getByRole } = render(
      <ProvedorIdioma idioma="en">
        <Contato />
      </ProvedorIdioma>,
    );
    expect(getByRole('link', { name: 'Start a project →' }).getAttribute('href')).toBe('/en/contact');
  });

  it('o rodapé tem especialidades, localização, instagram e direitos, com os rótulos em itálico', () => {
    const { container } = render(<Contato />);
    const rodape = container.querySelector('footer.rodape')!;
    const rotulos = [...rodape.querySelectorAll('i')].map((i) => i.textContent);
    expect(rotulos).toEqual(['especialidades', 'localização', 'instagram']);
    expect(rodape.textContent).toContain(ESPECIALIDADES);
    expect(rodape.textContent).toContain('Brasil');
    expect(rodape.textContent).toContain('@floway');
    expect(rodape.textContent).toContain('© 2026 Floway. Todos os direitos reservados.');
  });

  it('a esfera de letras está na seção, no lugar do cubo com física', () => {
    const { container } = render(<Contato />);
    expect(container.querySelector('.secao-contato div.esfera')).toBeTruthy();
    expect(container.querySelector('.circulo-escuro')).toBeTruthy();
  });

  it('nenhum @ além do Instagram (sem e-mail)', () => {
    const { container } = render(<Contato />);
    expect(container.textContent!.match(/@/g)).toEqual(['@']);
    expect(container.textContent).toContain('@floway');
  });

  // R1 da Arquitetura: uma arrow inline recriaria os 20 mil atributos a cada render do pai.
  it('passa à esfera a fábrica estável alvoDoSimbolo, a mesma em todo render', () => {
    const { rerender } = render(<Contato />);
    rerender(<Contato />);
    expect(alvosRecebidos.length).toBeGreaterThanOrEqual(2);
    for (const alvo of alvosRecebidos) expect(alvo).toBe(alvoDoSimbolo);
  });
});
