import { existsSync, readFileSync, statSync } from 'node:fs';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { CuboMarca } from '@/componentes/manifesto/CuboMarca';
import { Manifesto } from '@/componentes/manifesto/Manifesto';
import { ProvedorIdioma } from '@/lib/useIdioma';

afterEach(cleanup);

// Textos exatos da seção 4.3 da spec (2026-10-31-estrutura-site-design.md).
const APOIO =
  'Boas experiências digitais não acontecem por acaso. Cada interação é uma oportunidade de aproximar marcas e pessoas. Na Floway, exploramos novas possibilidades da tecnologia e da inteligência artificial para criar experiências intuitivas, marcantes e feitas para gerar impacto.';
const UNICO_P1 =
  'Cada marca carrega uma identidade, uma visão e uma história própria. Nosso trabalho é interpretar esses elementos sob diferentes perspectivas, explorando a criatividade para construir uma presença digital autêntica, capaz de despertar interesse e estabelecer conexões duradouras.';
const UNICO_P2 =
  'Para dar vida a essa visão, combinamos tecnologia, inteligência artificial e atenção aos detalhes. Cada escolha tem um propósito: tornar a navegação mais intuitiva, valorizar a comunicação e transformar cada ponto de contato em algo relevante e memorável.';
const LEGENDA = 'Experiências digitais que transformam a forma de conectar';

// O texto que vem antes de cada .vao, dentro do texto do manifesto (sem o rótulo).
function textoAntesDosVaos(texto: Element): string[] {
  const antes: string[] = [];
  let acumulado = '';
  texto.childNodes.forEach((no) => {
    if (no instanceof HTMLElement && no.classList.contains('vao')) antes.push(acumulado.trim());
    else if (!(no instanceof HTMLElement && no.classList.contains('rotulo-manifesto'))) acumulado += no.textContent;
  });
  return antes;
}

describe('Manifesto', () => {
  it('tem "(Quem somos)" e o texto da spec, com exatamente 3 vãos depois de "negócio.", "artificial" e "processos"', () => {
    const { container } = render(<Manifesto />);
    expect(container.querySelector('.secao-manifesto')?.classList.contains('trecho-escuro')).toBe(true);
    expect(container.querySelector('h2.rotulo-manifesto')?.textContent).toBe('(Quem somos)');
    const texto = container.querySelector('.manifesto-texto')!;
    expect(texto.querySelectorAll('.vao')).toHaveLength(3);
    const antes = textoAntesDosVaos(texto);
    expect(antes[0]).toMatch(/negócio\.$/);
    expect(antes[1]).toMatch(/artificial$/);
    expect(antes[2]).toMatch(/processos$/);
    const corrido = (texto.textContent ?? '').replace('(Quem somos)', '').replace(/\s+/g, ' ').trim();
    expect(corrido).toBe(
      'A Floway transforma tecnologia em vantagem para o seu negócio. Estratégia, branding e inteligência artificial em soluções que simplificam processos e impulsionam negócios.',
    );
  });

  it('tem o apoio da spec', () => {
    const { container } = render(<Manifesto />);
    expect(container.querySelector('.manifesto-apoio')?.textContent).toBe(APOIO);
  });

  it('"(O que é único)" tem os dois parágrafos da spec', () => {
    const { container } = render(<Manifesto />);
    expect(container.querySelector('.rotulo-unico')?.textContent).toBe('(O que é único)');
    const paragrafos = Array.from(container.querySelectorAll('.unico p')).map((p) => p.textContent);
    expect(paragrafos).toEqual([UNICO_P1, UNICO_P2]);
  });

  it('em inglês usa "(Who we are)" e o apoio em inglês', () => {
    const { container } = render(
      <ProvedorIdioma idioma="en">
        <Manifesto />
      </ProvedorIdioma>,
    );
    expect(container.querySelector('h2.rotulo-manifesto')?.textContent).toBe('(Who we are)');
    expect(container.querySelector('.manifesto-apoio')?.textContent).toMatch(/^Great digital experiences/);
  });

  it('não lê mais o conteúdo da página de identidade', () => {
    for (const arquivo of ['Manifesto.tsx', 'CuboMarca.tsx']) {
      expect(readFileSync(`src/componentes/manifesto/${arquivo}`, 'utf8'), arquivo).not.toContain('conteudo/identidade');
    }
  });
});

describe('CuboMarca', () => {
  it('tem 3 linhas × 7 palavras em contorno com FLOWAY', () => {
    const { container } = render(<CuboMarca />);
    const palavras = container.querySelectorAll('.cubo-frente .palavra-contorno');
    expect(palavras).toHaveLength(21);
    palavras.forEach((p) => expect(p.textContent).toBe('FLOWAY'));
  });

  it('tem a face lateral com 10 retângulos e a legenda da spec', () => {
    const { container } = render(<CuboMarca />);
    expect(container.querySelectorAll('.cubo-lado .caixa')).toHaveLength(10);
    expect(container.querySelector('.cubo-lado .cubo-legenda')?.textContent).toBe(LEGENDA);
  });

  it('a lateral usa a foto /inicio/cubo-lateral.webp, que existe e tem até 150 KB', () => {
    const { container } = render(<CuboMarca />);
    const lado = container.querySelector<HTMLElement>('.cubo-lado')!;
    expect(lado.style.backgroundImage).toContain('/inicio/cubo-lateral.webp');
    const arquivo = 'public/inicio/cubo-lateral.webp';
    expect(existsSync(arquivo)).toBe(true);
    expect(statSync(arquivo).size).toBeLessThanOrEqual(150 * 1024);
  });

  it('o fundo desfocado gerado em canvas saiu', () => {
    expect(existsSync('src/texturas/fundoDesfocado.ts')).toBe(false);
  });
});
