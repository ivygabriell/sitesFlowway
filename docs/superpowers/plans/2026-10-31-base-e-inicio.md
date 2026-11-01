# Base do site e Início — plano de implementação

> **Para agentes:** SUB-SKILL OBRIGATÓRIA: use `superpowers:subagent-driven-development` (recomendado) ou `superpowers:executing-plans` para executar tarefa por tarefa. Os passos usam caixas (`- [ ]`) para acompanhar.

**Objetivo:** transformar a página de identidade copiada em C1 na Início da Floway, com a base do site: tokens, textos em duas línguas, rotas `/` e `/en`, metadados, ícones, cabeçalho, selo, transição e estados. Os cartões de trabalho ficam vazios (marcadores de construção).

**Arquitetura:** tudo em `apps/site`. Cada seção mantém a pasta em `src/componentes/<seção>/` e passa a ter o próprio `estilo.css`. Os textos saem de `src/conteudo/identidade.ts` e vão para um arquivo por entregável, cada texto como `{ pt, en? }`, lido por `t()`. As duas línguas usam dois layouts raiz (grupos de rota `(pt)` e `(en)`) e uma casca comum. A esfera de letras é um componente compartilhado em `src/compartilhados/esfera/`, desenhado no canvas global do R3F.

**Pilha:** Next.js 15.5 (App Router), React 19, Three r180, @react-three/fiber 9, @14islands/r3f-scroll-rig 8 com Lenis, GSAP 3.13, Vitest 3, Playwright 1.56.

**Spec:** [`docs/superpowers/specs/2026-10-31-estrutura-site-design.md`](../specs/2026-10-31-estrutura-site-design.md). Leia junto com a [`02-site.md` do repositório de identidade](https://github.com/CreateHubAI/identidadeFloway/blob/main/docs/marca/02-site.md): ela vale onde a spec não fala (tokens, medidas, estados).

**Entregas em PR:**
- **PR 1 (base):** tarefas 1 a 7.
- **PR 2 (seções da Início):** tarefas 8 a 13.
- **PR 3 (montagem):** tarefa 14.

Cada PR tem a própria branch a partir da `main` atualizada, com CI verde, e só é integrado com o "pode integrar" da pessoa.

## Restrições globais

- **Cores:** só `#F7F7F5`, `#DCDCD8`, `#787878`, `#121212`, `#002FA7` (só no claro), `#5B7BFF` (só no escuro) e `#FFFFFF` (só como papel). O `#787878` só em texto ≥ 24 px e em linhas. O teste `guardas.test.ts` continua valendo.
- **Fontes:** só Inter Tight (400, 500, 700, 800), Azeret Mono 400 e Instrument Serif 400 (normal e itálico).
- **Tokens:** todo tempo e toda curva vêm dos tokens da tarefa 2. Nenhum número de duração solto em componente novo.
- **Responsividade e modos:** celular abaixo de 900 px. Movimento reduzido sem animação ligada à rolagem, sem seção presa, com tudo visível. Sem WebGL, tudo legível.
- **Nada inventado:** nem cliente, nem número, nem prêmio. Nenhum e-mail ou telefone (o teste `guardas` já confere).
- **Buscadores:** `robots: { index: false, follow: false }` em todas as páginas, até C5.
- **Referências:** nada do RayRay Lab nem do auros.global entra no repositório.
- **Logotipo:** só a partir de `assets/brand/` (na raiz do monorepo).
- **Ganchos dos testes de ponta a ponta:** mantenha as classes `.cabecalho`, `.abertura`, `.secao-hero`, `.secao-manifesto`, `.manifesto-texto`, `.secao-capitulos`, `.cartoes`, `.cartao`, `.barra-ativa`, `.secao-decisoes`, `.lista-decisoes`, `.secao-contato` e `.frase-contato`.
- **Lições da passagem:** props que mudam vão no `<UseCanvas>`; timelines com `pin` em `useEfeitoDeLayout`; `lagSmoothing(0)` no que segue o relógio; um `test:build` por vez; conferir o código de saída.
- **Comandos (da raiz):** `npm test`, `npm run check`, `npm run test:build`. Para um arquivo: `npx vitest run <arquivo>` dentro de `apps/site`.

## Foco da revisão

1. **Clique com Ctrl, Cmd, Shift, Alt ou botão do meio** no menu, no selo ou num link interno: abre como o navegador faz, sem círculo. Teste na tarefa 7.
2. **`/en` com textos ainda sem tradução:** a página abre com `<html lang="en">`, mostra o português no lugar e não quebra. Teste na tarefa 3.
3. **Fonte ainda carregando quando a esfera monta:** o atlas de letras só é desenhado depois de `document.fonts.ready`; antes, a esfera não aparece. Teste na tarefa 12.
4. **Sem WebGL na Início:** a palavra do hero aparece em SVG, sem lâminas nem esfera; contato e rodapé legíveis. Teste na tarefa 14 (`sem-webgl.spec.ts`).
5. **Menu "Trabalhos" e "Contato" enquanto essas páginas não existem:** os links apontam para `/trabalhos` e `/contato` (ou `/en/work` e `/en/contact`), que nesta etapa respondem 404 do Next. Isso é esperado e fica registrado no PR 3. Nenhum cartão leva a um trabalho. Teste na tarefa 11.

---

## PR 1 · Base

### Tarefa 1: Passo zero — estilo de cada seção na própria pasta

**Arquivos:**
- Criar: `src/componentes/{abertura,cabecalho,hero,passagem,manifesto,capitulos,decisoes,contato}/estilo.css`
- Modificar: `app/globals.css` (fica só com tokens de cor, reset e base), cada componente da pasta (importa o próprio `./estilo.css`)
- Testar: `tests/unit/estilos.test.ts`

**Interfaces:** produz um `estilo.css` por pasta. Daqui em diante, cada tarefa só edita o `estilo.css` das próprias pastas.

- [ ] **Passo 1: teste que falha.** Em `estilos.test.ts`, escreva `it('globals.css só tem tokens, reset e base')`. Ele confere que `app/globals.css` não contém nenhum dos seletores `.cabecalho`, `.selo`, `.abertura`, `.secao-`, `.cubo`, `.cartao`, `.lista-decisoes`, `.frase-contato` e `.rodape`. Escreva também `it('cada pasta de seção importa o próprio estilo.css')`: para cada pasta listada, existe `estilo.css` e algum `.tsx` da pasta tem `import './estilo.css'`.
- [ ] **Passo 2:** `npx vitest run tests/unit/estilos.test.ts` → FALHA (os seletores ainda estão em `globals.css`).
- [ ] **Passo 3:** mova as regras de cada seção, incluindo os `@media` e `@keyframes` delas, para o `estilo.css` da pasta dona, sem mudar nenhum valor. As regras do selo vão para `cabecalho/estilo.css`.
- [ ] **Passo 4:** `npm test` e `npm run test:build` → os dois PASSAM. Os 23 testes de ponta a ponta não mudam, o que prova que nada mudou na tela.
- [ ] **Passo 5:** commit `refactor(site): estilo de cada seção na própria pasta (passo zero)`.

### Tarefa 2: Tokens de movimento (E1)

**Arquivos:**
- Criar: `src/movimento/tokens.ts`, `src/movimento/tokens.css`, `src/movimento/modo.ts`
- Modificar: `app/globals.css` (importa `tokens.css`)
- Testar: `tests/unit/movimento.test.ts`

**Interfaces:**
- Produz `TEMPOS`, `INTERVALOS` e `CURVAS` (objetos `as const`, chaves com os nomes da tabela, valores em segundos ou strings do GSAP e do CSS).
- Produz `tempo(nome: keyof typeof TEMPOS): number`.
- Produz `modoDeExibicao(largura: number, reduzido: boolean, webgl: boolean): 'desktop' | 'celular' | 'reduzido' | 'sem-webgl'`. A prioridade é: sem-webgl, depois reduzido, depois celular.
- Produz as variáveis CSS `--tempo-<nome>: <valor>s`, `--intervalo-<nome>` e `--curva-<nome>`.

- [ ] **Passo 1: teste que falha.** Em `movimento.test.ts`, `it('os tokens são os da tabela da 02-site')` compara `TEMPOS`, `INTERVALOS` e `CURVAS` com um objeto esperado. Esse objeto é a **cópia exata** da tabela "Tokens de tempo e de curva" da `02-site.md` (`identidadeFloway@ec93f7b`): 25 tempos, 9 intervalos e 12 curvas, por exemplo `tempo-curto: 0.3`, `tempo-circulo: 1.5`, `curva-circulo: 'expoScale(3, 1)'`, `curva-cabecalho: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'`. Inclua também:
  - `it('o CSS declara cada token com o mesmo valor')`: lê `tokens.css`.
  - `it('modoDeExibicao')`: `(1440,false,true)→'desktop'`, `(899,false,true)→'celular'`, `(1440,true,true)→'reduzido'`, `(390,true,false)→'sem-webgl'`.
- [ ] **Passo 2:** `npx vitest run tests/unit/movimento.test.ts` → FALHA (módulo inexistente).
- [ ] **Passo 3:** escreva `tokens.ts`, `tokens.css` e `modo.ts`.
- [ ] **Passo 4:** `npx vitest run tests/unit/movimento.test.ts` → PASSA.
- [ ] **Passo 5:** commit `feat(site): tokens de movimento (E1)`.

### Tarefa 3: Textos em duas línguas e rotas `/` e `/en`

**Arquivos:**
- Criar: `src/conteudo/textos.ts`, `src/conteudo/casca.ts`, `src/lib/idioma.ts`, `src/fontes.ts`, `app/(pt)/layout.tsx`, `app/(pt)/page.tsx`, `app/(en)/en/layout.tsx`, `app/(en)/en/page.tsx`, `src/paginas/Inicio.tsx`, `src/componentes/casca/Casca.tsx`
- Remover: `app/layout.tsx`, `app/page.tsx` (o conteúdo vai para `Casca.tsx` e `Inicio.tsx`)
- Criar o script `test:publicacao` em `apps/site/package.json`: `vitest run --config vitest.publicacao.config.ts`, com o arquivo `tests/publicacao/trava.test.ts`. Ele **não** entra no CI desta etapa.
- Testar: `tests/unit/textos.test.ts`, `tests/unit/idioma.test.ts`, `tests/e2e/idiomas.spec.ts`

**Interfaces:**
- `textos.ts`:
  - `type Idioma = 'pt' | 'en'`
  - `type Texto = { pt: string; en?: string; pendente?: true }`
  - `t(texto: Texto, idioma: Idioma): string` devolve `en ?? pt`.
  - `pendente(descricao: string): Texto` devolve `{ pt: '[pendente: ' + descricao + ']', pendente: true }`.
  - `registrar(modulo: string, textos: Record<string, Texto | Texto[]>): void` e `pendencias(): string[]` (cada texto pendente ou sem `en`, como `'casca.descritor (pt)'` ou `'casca.selo (en)'`).
- `idioma.ts`:
  - `type Pagina = 'inicio' | 'trabalhos' | 'contato' | 'privacidade'`
  - `rota(pagina: Pagina, idioma: Idioma): string` com o mapa `inicio: '/'↔'/en'`, `trabalhos: '/trabalhos'↔'/en/work'`, `contato: '/contato'↔'/en/contact'`, `privacidade: '/privacidade'↔'/en/privacy'`.
  - `idiomaDoCaminho(caminho: string): Idioma` e `naOutraLingua(caminho: string): string` (caminho desconhecido → início da outra língua).
- `Casca({ idioma, children }): JSX` contém tudo o que `app/layout.tsx` tinha dentro do `<body>`.
- `Inicio({ idioma }): JSX` contém o que `app/page.tsx` tinha.
- `casca.ts` registra:
  - `nome: { pt: '©FLOWAY', en: '©FLOWAY' }`
  - `descritor: pendente('descritor do cabeçalho, até 3 palavras')`
  - `menu: { trabalhos: { pt: 'Trabalhos', en: 'Work' }, contato: { pt: 'Contato', en: 'Contact' } }`
  - `voltar: { pt: 'Voltar ao início', en: 'Back to home' }`
  - `selo: { pt: 'Iniciar projeto', en: 'Start a project' }`

- [ ] **Passo 1: testes que falham.**
  - `textos.test.ts`: `t({pt:'a'},'en')==='a'`, `t({pt:'a',en:'b'},'en')==='b'`; `pendencias()` contém `'casca.descritor (pt)'`.
  - `idioma.test.ts`: os quatro pares de `rota`, `naOutraLingua('/en/work')==='/trabalhos'` e `naOutraLingua('/qualquer')==='/en'`.
  - `idiomas.spec.ts`: `/` tem `html[lang="pt-BR"]`, `/en` tem `html[lang="en"]`, e as duas mostram `.secao-hero` e `meta[name=robots]` com `noindex`.
- [ ] **Passo 2:** `npx vitest run tests/unit/textos.test.ts tests/unit/idioma.test.ts` → FALHA.
- [ ] **Passo 3:** implemente. Os dois layouts usam `fontes.ts` (as três famílias de hoje), o mesmo script de abertura e `<Casca>`. As páginas usam `<Inicio idioma=…/>`. O `trava.test.ts` espera `pendencias()` vazio e vai falhar até C2; é o comportamento esperado.
- [ ] **Passo 4:** `npm test` → PASSA. `npm run test:build` → PASSA, incluindo `idiomas.spec.ts`.
- [ ] **Passo 5:** commit `feat(site): textos em duas línguas, rotas / e /en e trava de publicação`.

### Tarefa 4: Buscadores e metadados (E2, parcial)

**Arquivos:**
- Criar: `src/seo/paginas.ts`, `app/robots.ts`, `app/sitemap.ts`, `vercel.json` (em `apps/site`)
- Modificar: os dois `page.tsx` (exportam `metadata` vindo de `metadadosDaPagina`)
- Testar: `tests/unit/seo.test.ts`

**Interfaces:**
- `INDEXAR = false`
- `metadadosDaPagina(pagina: Pagina, idioma: Idioma): Metadata`. Devolve título e descrição de `paginas[pagina]`, `robots: { index: false, follow: false }` enquanto `!INDEXAR`, e `alternates.languages` com `{ 'pt-BR': rota(p,'pt'), en: rota(p,'en'), 'x-default': rota(p,'pt') }`.
- Textos da Início: título `pendente('título da Início, até 60 caracteres, sem nichos')` e descrição `pendente('descrição da Início, até 155 caracteres')`.

- [ ] **Passo 1: teste que falha.** Em `seo.test.ts`:
  - `metadadosDaPagina('inicio','en').robots` é `{index:false,follow:false}`;
  - `alternates.languages.en === '/en'`;
  - `robots()` devolve `disallow: '/'`;
  - `sitemap()` devolve `[]`;
  - `vercel.json` tem o cabeçalho `X-Robots-Tag: noindex, nofollow` e `framework: 'nextjs'`.
- [ ] **Passo 2:** `npx vitest run tests/unit/seo.test.ts` → FALHA.
- [ ] **Passo 3:** implemente.
- [ ] **Passo 4:** PASSA; `npm run check` PASSA.
- [ ] **Passo 5:** commit `feat(site): metadados nas duas línguas, robots e sitemap fechados (E2)`.

### Tarefa 5: Ícones (E3)

**Arquivos:**
- Substituir: `app/icon.svg`
- Criar: `app/apple-icon.png`, `app/favicon.ico` (copiados de `assets/brand/favicon/`: `icon.svg`, `apple-icon.png`, `favicon.ico`)
- Testar: `tests/unit/icones.test.ts`

- [ ] **Passo 1: teste que falha.** Cada arquivo de `app/` é **byte a byte igual** ao de `assets/brand/favicon/`. O `icon.svg` não contém o ponto antigo (`r="4"`).
- [ ] **Passo 2:** FALHA.
- [ ] **Passo 3:** copie os arquivos.
- [ ] **Passo 4:** PASSA.
- [ ] **Passo 5:** commit `feat(site): ícones da Floway (E3)`.

### Tarefa 6: Cabeçalho, menu, seletor de idioma e selo (E4)

**Arquivos:**
- Modificar: `src/componentes/cabecalho/Cabecalho.tsx`, `SeloLateral.tsx`, `estilo.css`
- Criar: `src/componentes/cabecalho/useFundoSobCabecalho.ts`
- Modificar: as seções (`data-fundo="claro"` ou `data-fundo="escuro"` na raiz de cada `<section>`)
- Testar: `tests/unit/cabecalho.test.tsx` (reescrito), `tests/e2e/casca.spec.ts`

**Interfaces:**
- `Cabecalho({ visivel, idioma, pagina }: { visivel: boolean; idioma: Idioma; pagina: Pagina })`.
- `useFundoSobCabecalho(): 'claro' | 'escuro'`. Lê `document.elementFromPoint(40, 20)?.closest('[data-fundo]')` a cada `scroll` (com `requestAnimationFrame`).
- `SeloLateral({ idioma })` é um `<a class="selo" href={rota('contato', idioma)}>`.

**Valores:**
- Nome: "©FLOWAY" mais o descritor, que recolhe no hover.
- Menu: dois links (`rota('trabalhos')` e `rota('contato')`). O item da página atual tem `aria-current="page"`, aparece riscado (`text-decoration: line-through`) e o clique não navega.
- Seletor: "PT" e "EN" antes do menu, levando a `naOutraLingua(pathname)`.
- Fora da Início, o relógio vira o link "Voltar ao início".
- O ponto do relógio sai da mistura (`mix-blend-mode: normal` no `i`) e fica `#002FA7` com fundo claro e `#5B7BFF` com fundo escuro.
- Selo: Azeret Mono 11 px, caixa-alta, `pointer-events: auto`, com foco visível.

- [ ] **Passo 1: testes que falham.**
  - `cabecalho.test.tsx`:
    - com `idioma='en'`, os links são `/en/work` e `/en/contact`, e o seletor leva a `/`;
    - com `pagina='contato'`, o link de contato tem `aria-current`;
    - com `pagina='trabalhos'`, aparece "Voltar ao início" e não o relógio;
    - o selo tem `href='/contato'` e o texto "Iniciar projeto".
  - `casca.spec.ts` (no build): na Início, no topo, o ponto tem `background-color: rgb(0, 47, 167)`; depois de rolar até `.secao-manifesto`, tem `rgb(91, 123, 255)`.
- [ ] **Passo 2:** FALHA.
- [ ] **Passo 3:** implemente. Os textos vêm de `casca.ts`.
- [ ] **Passo 4:** `npm test` e `npm run test:build` → PASSAM.
- [ ] **Passo 5:** commit `feat(site): cabeçalho, seletor de idioma e selo "Iniciar projeto" (E4)`.

### Tarefa 7: Transição de página e estados globais (E4)

**Arquivos:**
- Criar: `src/componentes/transicao/Transicao.tsx`, `src/componentes/transicao/estilo.css`, `src/componentes/transicao/cliqueSimples.ts`
- Modificar: `src/componentes/casca/Casca.tsx` (monta `<Transicao/>`), `src/lib/webgl.ts` (classe de estado no `<html>`)
- Testar: `tests/unit/transicao.test.tsx`, `tests/e2e/transicao.spec.ts`

**Interfaces:**
- `ehCliqueSimples(e: MouseEvent): boolean` devolve falso com `button !== 0`, `ctrlKey`, `metaKey`, `shiftKey` ou `altKey`.
- `<Transicao/>` intercepta cliques em `a[href^="/"]` internos que passem em `ehCliqueSimples`:
  - um círculo centrado, abaixo do cabeçalho, cresce de `scale(0)` a `scale(1)`, com 130vw (270vw abaixo de 900 px);
  - a cor é `var(--claro)` quando o destino é `/` ou `/en`, e `var(--escuro)` nos outros casos;
  - dura `tempo('tempo-transicao')` com `CURVAS['curva-padrao']`, e depois chama `router.push(href)`;
  - na página nova, o círculo some de uma vez depois de `INTERVALOS['intervalo-curto']`.
- Com movimento reduzido, não há círculo: navega direto.
- O `<html>` ganha uma das classes `modo-desktop`, `modo-celular`, `modo-reduzido` ou `modo-sem-webgl`, a partir de `modoDeExibicao`.

- [ ] **Passo 1: testes que falham.**
  - `transicao.test.tsx`: `ehCliqueSimples` é falso para `{button:1}`, `{metaKey:true}` e `{ctrlKey:true}`, e verdadeiro para `{button:0}`.
  - `transicao.spec.ts`:
    - clique no selo → aparece `.transicao` com cor `rgb(18, 18, 18)` antes de a URL virar `/contato`;
    - Cmd+clique no selo não cria `.transicao` e a URL da aba atual não muda;
    - com `reducedMotion: 'reduce'`, a URL muda sem `.transicao`.
- [ ] **Passo 2:** FALHA.
- [ ] **Passo 3:** implemente.
- [ ] **Passo 4:** `npm test` e `npm run test:build` → PASSAM.
- [ ] **Passo 5:** commit `feat(site): transição de página e estados globais (E4)`. Abra o **PR 1**.

---

## PR 2 · Seções da Início

### Tarefa 8: Abertura e hero — palavra FLOWAY e lâminas (E7)

**Arquivos:**
- Criar: `src/marca/palavra.ts`, `src/componentes/hero/laminas.ts`, `src/conteudo/inicio-topo.ts`
- Modificar: `src/componentes/abertura/filmeAbertura.ts`, `Abertura.tsx`, `src/componentes/hero/Hero.tsx`, `CenaHero.tsx`, `estilo.css`, `src/texturas/logotipo.ts` (renomeado para `src/texturas/palavra.ts`)
- Remover: `src/componentes/hero/formas.ts`, `tests/unit/formas.test.ts`
- Testar: `tests/unit/palavra.test.ts`, `tests/unit/laminas.test.ts`, `tests/unit/hero.test.tsx`, `tests/unit/abertura.test.tsx`, `tests/e2e/abertura.spec.ts`

**Interfaces:**
- `palavra.ts` exporta `PALAVRA = { d: string; viewBox: [850, 110, 1360, 292] }`. O `d` é o **4º path** de `assets/brand/floway-assinatura-horizontal-fundo-claro.svg`.
- `desenharPalavra(largura: number): HTMLCanvasElement`: desenha `new Path2D(PALAVRA.d)` em `#121212`, escalado para a largura e recortado no `viewBox`.
- `contornoLamina(largura: number, altura: number, raio: number): THREE.Shape`: paralelogramo cujos lados inclinados sobem a 45° (deslocamento horizontal = altura), com cantos arredondados.
- `criarLaminas(): { principal: BufferGeometry; segunda: BufferGeometry; terceira: BufferGeometry }`: extrusão de profundidade 0.2 e chanfro 0.06. Larguras e alturas: 1.9×0.42, 1.4×0.42 e 1.1×0.36, nas unidades atuais do hero.
- `inicio-topo.ts` registra:
  - `trechos: [pendente('trecho 1 da abertura'), pendente('trecho 2'), pendente('trecho 3')]`
  - `faixas`: os 9 itens da (01) e da (02) da spec, com `(01)` e `(02)` nas posições da spec e `en` pendente
  - `intro: pendente('intro do hero, até 30 palavras')`
  - `rolar: { pt: 'Role para baixo', en: 'Scroll down' }`

**Valores:**
- Filme da abertura: o mesmo desenho de hoje, com "FLOWAY" no lugar de "IDENTIDADE".
- Hero:
  - a textura do plano com glitch vem de `desenharPalavra(86vw)`;
  - as três malhas de vidro usam `criarLaminas()` no lugar de `criarFormas()`, mantendo materiais, entrada, flutuação, mouse, paralaxe e saída;
  - no celular, só a `principal`;
  - o `vidro-dom` vira um paralelogramo com `clip-path: polygon(...)` a 45°;
  - sem WebGL, o `.titulo-hero` mostra `<svg viewBox="850 110 1360 292"><path d={PALAVRA.d}/></svg>` no lugar do texto "IDENTIDADE.".

- [ ] **Passo 1: testes que falham.**
  - `palavra.test.ts`: `PALAVRA.d` é igual ao 4º `d=` do SVG lido do disco (`../../assets/brand/...`).
  - `laminas.test.ts`: em `contornoLamina(1.9,0.42,0.05).getPoints()`, os dois segmentos inclinados mais longos têm ângulo de 45° ± 1° com a horizontal. `criarLaminas()` devolve as três geometrias com `boundingBox` de profundidade ≈ 0.32.
  - `hero.test.tsx`: as faixas renderizam "Feito para o seu negócio" e "Experiência premium"; sem canvas, o hero tem um `svg path` com o `d` da palavra; não existe o texto "IDENTIDADE".
  - `abertura.test.tsx`: `desenharFilme` chama `fillText('FLOWAY', …)` (contexto falso).
- [ ] **Passo 2:** FALHA.
- [ ] **Passo 3:** implemente.
- [ ] **Passo 4:** `npm test` e `npm run test:build` → PASSAM. Olhe o hero no navegador (1440 px, 390 px e movimento reduzido) e compare com `docs/superpowers/specs/prototipos-estrutura/02-hero.html`.
- [ ] **Passo 5:** commit `feat(site): abertura com FLOWAY e hero com a palavra e as lâminas de vidro (E7)`.

### Tarefa 9: Manifesto, cubo e "O que é único" (E8)

**Arquivos:**
- Criar: `src/conteudo/inicio-manifesto.ts`, `public/inicio/cubo-lateral.webp`
- Modificar: `src/componentes/manifesto/Manifesto.tsx`, `CuboMarca.tsx`, `estilo.css`
- Remover: `src/texturas/fundoDesfocado.ts`
- Testar: `tests/unit/manifesto.test.tsx`

**Interfaces:** `inicio-manifesto.ts` registra:
- `rotulo: { pt: '(Quem somos)', en: '(Who we are)' }`
- `partes`: 4 textos, com um vão **entre** partes:
  1. "A Floway transforma tecnologia em vantagem para o seu negócio."
  2. "Estratégia, branding e inteligência artificial"
  3. "em soluções que simplificam processos"
  4. "e impulsionam negócios."
- `apoio`, `legenda`, `unico.rotulo` (`'(O que é único)'`) e `unico.paragrafos`: os textos exatos da seção 4.3 da spec, com `en` pendente.
- `palavraCubo: 'FLOWAY'`.

**Valores:**
- Foto: `public/inicio/cubo-lateral.webp`, convertida de `~/Downloads/Silhueta Abstrata em Movimento.png` com `sips -s format webp -s formatOptions 70`, em até 150 KB e 1600 px de largura.
- A lateral usa `background-image: url(/inicio/cubo-lateral.webp)` com `filter: grayscale(1)`.

- [ ] **Passo 1: teste que falha.** Em `manifesto.test.tsx`:
  - o texto do manifesto tem exatamente 3 `.vao`, nas posições depois de "negócio.", "artificial" e "processos";
  - o cubo tem 21 `.palavra-contorno` com "FLOWAY";
  - a legenda é "Experiências digitais que transformam a forma de conectar";
  - `.cubo-lado` usa `/inicio/cubo-lateral.webp`;
  - os dois parágrafos de "(O que é único)" são os da spec.
- [ ] **Passo 2:** FALHA.
- [ ] **Passo 3:** implemente; confira que o `.webp` tem ≤ 150 KB.
- [ ] **Passo 4:** PASSA; `npm run test:build` PASSA.
- [ ] **Passo 5:** commit `feat(site): manifesto, cubo com a foto e "O que é único" (E8)`.

### Tarefa 10: Lençol "(O que entregamos)" (E10)

**Arquivos:**
- Criar: `src/conteudo/inicio-lencol.ts`
- Modificar: `src/componentes/decisoes/Decisoes.tsx`, `src/texturas/folhaDecisoes.ts`, `estilo.css`
- Testar: `tests/unit/decisoes.test.tsx`, `tests/e2e/decisoes.spec.ts`

**Interfaces:** `inicio-lencol.ts` registra:
- `titulo: [{ pt: '(O que', en: '(What we' }, { pt: 'entregamos)', en: 'deliver)' }]`
- `frases`: as 2 frases da spec
- `itens`: os 7 da spec, nesta ordem: Estratégia digital, Design de interfaces, Desenvolvimento web, Inteligência artificial, Automações e integrações, Experiências digitais, Manutenção e evolução

- [ ] **Passo 1: teste que falha.** `decisoes.test.tsx`: a lista tem 7 `li` com `(1)` a `(7)`, o título tem "(O que" e "entregamos)", e as frases são as da spec. `decisoes.spec.ts`: no celular, a folha estática mostra os 7 itens.
- [ ] **Passo 2:** FALHA.
- [ ] **Passo 3:** implemente. A textura da folha usa os mesmos itens.
- [ ] **Passo 4:** PASSA.
- [ ] **Passo 5:** commit `feat(site): lençol "(O que entregamos)" (E10)`.

### Tarefa 11: Trabalhos em destaque com cartões vazios (E5 e E9)

**Arquivos:**
- Criar: `src/conteudo/trabalhos.ts`, `src/compartilhados/CartaoTrabalho.tsx`, `src/compartilhados/estilo.css`
- Modificar: `src/componentes/capitulos/Capitulos.tsx`, `CenaCartoes.tsx`, `estilo.css`
- Remover: `src/texturas/cartazes.ts`
- Testar: `tests/unit/trabalhos-conteudo.test.ts`, `tests/unit/capitulos.test.tsx`, `tests/e2e/capitulos.spec.ts`

**Interfaces:**
- `type Oferta = 'landing-page' | 'site-institucional' | 'automacao'`; `NOMES_OFERTA: Record<Oferta, Texto>` ("Landing page", "Site institucional", "Automação").
- `type Trabalho = { slug: string; nome: Texto; setor: Texto; mesAno: Texto; oferta: Oferta; conceito: boolean; capa?: string; previa?: string }`.
- `trabalhos: Trabalho[] = []`, a lista real, que começa vazia.
- `marcadoresDeConstrucao: Trabalho[]`: 4 itens com nome `{pt:'Conceito · …'}` e as ofertas dos protótipos.
- `trabalhosVisiveis(): Trabalho[]` devolve `trabalhos.length ? trabalhos : marcadoresDeConstrucao`.
- `linhaDoCartao(t: Trabalho, idioma: Idioma): [string, string]` devolve `[t(mesAno), t(NOMES_OFERTA[oferta]) + (conceito ? ' · Conceito' : '')]`.
- `CartaoTrabalho({ trabalho, idioma, indice })`:
  - **sem `capa`:** `<div class="cartao sem-capa">`, fundo `var(--c2)`, sem `UseCanvas`, sem ASCII e sem link;
  - **com `capa`:** o caminho de hoje (plano WebGL com ASCII, varredura, zoom de 10% e escurecimento de 30% no hover, `.cartao-previa` de 250 px que abre com `scaleY` em `tempo('tempo-rapido')`).
- O trava de publicação (tarefa 3) ganha `it('não há marcadores de construção')`: `trabalhos.length > 0`.

**Valores:** rótulo `{pt:'(Trabalhos)', en:'(Work)'}`, barra de 29 tracinhos, celular em lista e movimento reduzido em grade, como hoje.

- [ ] **Passo 1: testes que falham.**
  - `trabalhos-conteudo.test.ts`: com `trabalhos` vazio, `trabalhosVisiveis()` são os 4 marcadores; `linhaDoCartao` de um conceito de automação dá `['…', 'Automação · Conceito']`.
  - `capitulos.test.tsx`: renderiza 4 `.cartao.sem-capa`, nenhum `a[href^="/trabalhos/"]`, e as linhas de informação.
  - Um teste com `trabalho` falso com `capa` renderiza `.cartao-previa` e não tem `.sem-capa`.
- [ ] **Passo 2:** FALHA.
- [ ] **Passo 3:** implemente. `Capitulos` mapeia `trabalhosVisiveis()` para `CartaoTrabalho`.
- [ ] **Passo 4:** `npm test` e `npm run test:build` → PASSAM (o `capitulos.spec.ts` foi atualizado para os cartões sem capa).
- [ ] **Passo 5:** commit `feat(site): trabalhos em destaque com cartões em cor estática (E5, E9)`.

### Tarefa 12: Esfera de letras (componente compartilhado)

**Arquivos:**
- Criar: `src/marca/simbolo.ts`, `src/marca/amostrar.ts`, `src/compartilhados/esfera/geometria.ts`, `atlas.ts`, `shader.ts`, `EsferaDeLetras.tsx`, `estilo.css`
- Testar: `tests/unit/simbolo.test.ts`, `tests/unit/amostrar.test.ts`, `tests/unit/esfera.test.tsx`

**Interfaces:**
- `SIMBOLO = { lamina: string; braco: string; haste: string; largura: 730; altura: 512 }`: os 3 `d` de `assets/brand/floway-simbolo-fundo-claro.svg`, na ordem do arquivo.
- `achatar(d: string, passos?: number): [number, number][][]`: aceita os comandos M, L, H, V, C e Z (absolutos), e cada curva vira `passos` segmentos (padrão 8).
- `dentro(poligonos: [number, number][][], x: number, y: number): boolean`: regra par-ímpar.
- `pontosEsfera(n: number): Float32Array` (Fibonacci, raio 1, `3n` valores).
- `pontosSimbolo(n: number, aleatorio: () => number): { posicoes: Float32Array; azul: Uint8Array }`:
  - amostra pontos dentro do símbolo;
  - x e y vão a `(px - 365)/365 * 1.15` e `-(py - 256)/365 * 1.15`, com z aleatório em ±0.03;
  - `azul[i] = 1` quando o ponto cai no braço.
- `desenharAtlas(): Promise<HTMLCanvasElement>`:
  - espera `document.fonts.ready`;
  - desenha F, L, O, W, A e Y em Inter Tight 800, brancas, em células de 64 px (6×1).
- `QUANTIDADE = { desktop: 20000, celular: 8000 } as const`.
- `<EsferaDeLetras alvo="simbolo" />`:
  - acompanha um `div.esfera` no DOM com `<UseCanvas>`;
  - pontos com os atributos `aEsfera`, `aAlvo`, `aLetra` e `aAzul`;
  - uniformes `uMorf`, `uTempo`, `uMouse` e `uGiro`.

**Valores:**
- Cor `#121212`. O azul `#002FA7` vale para as letras com `aAzul = 1` quando `uMorf > 0.5`; na esfera, para cerca de 4% das letras, sorteadas.
- Buracos: ruído 3D com corte em 0.32.
- Giro de 0.18 rad/s, multiplicado por `(1 - uMorf)`. Com o F formado, o giro é zero.
- A morfose alterna a cada 7 s, com transição suavizada. O mouse empurra as letras até 38 px num raio de 110 px.
- **Celular:** 8 mil letras, sem morfose automática, e o toque empurra.
- **Movimento reduzido:** esfera formada, parada.
- **Sem WebGL:** não renderiza nada.

- [ ] **Passo 1: testes que falham.**
  - `simbolo.test.ts`: os 3 `d` são iguais aos do SVG no disco.
  - `amostrar.test.ts`:
    - `achatar('M0 0 L10 0 L10 10 L0 10 Z')` dá 1 polígono de 5 pontos;
    - `dentro(quadrado,5,5)` é verdadeiro e `dentro(quadrado,15,5)` é falso;
    - `pontosSimbolo(2000, rng com semente)` tem todos os pontos dentro de `achatar` do símbolo;
    - a fração de `azul` fica entre 0.15 e 0.35 (a área do braço);
    - a caixa dos pontos tem proporção 730:512 ± 3%.
  - `esfera.test.tsx`: `pontosEsfera(1000)` tem todos os raios em 1 ± 1e-6. `desenharAtlas` só resolve depois de `document.fonts.ready` (promessa falsa controlada). `EsferaDeLetras` sem canvas disponível não renderiza `canvas` nem lança erro.
- [ ] **Passo 2:** FALHA.
- [ ] **Passo 3:** implemente. Use `pontosSimbolo` uma vez por montagem e passe tudo como `BufferAttribute`.
- [ ] **Passo 4:** PASSA. Olhe no navegador e compare com `prototipos-estrutura/07-contato-esfera.html`: o F reconhecível, de frente, com o braço azul.
- [ ] **Passo 5:** commit `feat(site): esfera de letras FLOWAY que forma o símbolo (componente compartilhado)`.

### Tarefa 13: Seção de contato e rodapé da Início (E11, parte da Início)

**Arquivos:**
- Criar: `src/conteudo/contato.ts`
- Modificar: `src/componentes/contato/Contato.tsx`, `Rodape.tsx`, `estilo.css`
- Remover: `src/componentes/contato/CenaFisica.tsx`, `mundo.ts`, `tests/unit/mundo.test.ts`
- Testar: `tests/unit/contato.test.tsx`

**Interfaces:** `contato.ts` registra:
- `frase`: as 22 palavras da spec
- `cta: { pt: 'Iniciar um projeto →', en: 'Start a project →' }`
- `rodape`: `especialidades`, `localizacao` (Brasil), `instagram` (`@floway`) e `direitos` ("© 2026 Floway. Todos os direitos reservados."), cada um com o rótulo em itálico

O CTA é um link para `rota('contato', idioma)`. O `cannon-es` continua no `package.json`, porque faz parte da pilha decidida, mas deixa de ser importado.

- [ ] **Passo 1: teste que falha.** `contato.test.tsx`: a `.frase-contato` tem a frase exata; o CTA tem `href='/contato'` (e `'/en/contact'` em `en`); o rodapé tem "especialidades", "localização", "@floway" e "© 2026 Floway"; existe `div.esfera`; não aparece nenhum `@` além do Instagram.
- [ ] **Passo 2:** FALHA.
- [ ] **Passo 3:** implemente. O círculo que encolhe continua igual, e `cena.contatoAtivo` também.
- [ ] **Passo 4:** `npm test` e `npm run test:build` → PASSAM.
- [ ] **Passo 5:** commit `feat(site): contato da Início com a esfera de letras e o rodapé novo (E11)`. Abra o **PR 2**.

---

## PR 3 · Montagem

### Tarefa 14: Início montada e testes da página inteira (E15)

**Arquivos:**
- Remover: `src/conteudo/identidade.ts`
- Modificar: `src/paginas/Inicio.tsx`, `tests/unit/conteudo.test.ts`, e os testes de ponta a ponta `base`, `ordem`, `cor`, `pins`, `ponteiro`, `celular`, `reduzido`, `sem-js`, `sem-webgl` e `redimensionar`
- Testar: os mesmos

- [ ] **Passo 1: testes que falham.**
  - `conteudo.test.ts`: nenhum módulo importa `@/conteudo/identidade`, e todo módulo de `src/conteudo/` chama `registrar`.
  - `base.spec.ts`: o título da aba não é "Identidade da marca"; a página não contém "IDENTIDADE", "©MARCA" nem "Rascunho".
  - `ordem.spec.ts`: as seções seguem `['secao-hero','secao-manifesto','secao-capitulos','secao-decisoes','secao-contato']` em `/` e em `/en`.
  - `sem-webgl.spec.ts`: a palavra em SVG está visível, não existe `canvas` da esfera, e `.frase-contato` e o rodapé estão visíveis.
  - `reduzido.spec.ts`: nenhum `pin-spacer`, a esfera não gira (dois quadros com 1 s de diferença são iguais em pixels) e tudo fica visível.
- [ ] **Passo 2:** FALHA.
- [ ] **Passo 3:** apague `identidade.ts` e ajuste o que sobrou.
- [ ] **Passo 4:** `npm test`, `npm run check` e `npm run test:build` → os três PASSAM com saída 0. Olhe `/` e `/en` no navegador: desktop 1440, celular 390 e movimento reduzido, sem rolagem horizontal.
- [ ] **Passo 5:** commit `feat(site): Início da Floway montada (E15)`. Atualize `docs/memoria-do-projeto.md` com onde parou e abra o **PR 3**. No PR, registre que os links do menu levam a páginas ainda inexistentes, as próximas da ordem.

---

## Execução com agentes especialistas (método, modo em rascunho)

A integradora (a coordenadora no Orca) abre uma issue por bloco e a entrega ao especialista do tema. Cada issue tem uma branch e um PR. Só a integradora integra, sempre com o "pode integrar" da pessoa.

| Issue | Tarefas | Especialista | Trabalhadora | Pode rodar junto com |
|---|---|---|---|---|
| Base | 1 a 7 | Design e Front (a Arquitetura revisa a tarefa 3: rotas, layouts raiz e modelo de textos) | 1 Claude | nada (mexe na casca e no layout, pontos quentes) |
| Abertura e hero | 8 | Design e Front | 1 Claude | Manifesto e cubo |
| Manifesto e cubo | 9 | Design e Front | 1 Claude | Abertura e hero |
| Lençol | 10 | Design e Front | 1 Claude | Trabalhos em destaque |
| Trabalhos em destaque | 11 | Design e Front | 1 Claude | Lençol |
| Esfera de letras | 12 | Design e Front (a Arquitetura revisa o desempenho: 20 mil e 8 mil pontos) | 1 Claude | nada |
| Contato da Início | 13 | Design e Front | 1 Claude | nada (depende da 12) |
| Montagem | 14 | Design e Front | 1 Claude | nada |

- **Segurança:** faz o mapa de riscos no começo e revisa os PRs da Base (cabeçalhos `noindex`, `vercel.json`, links externos) e do Contato da Início (nenhum dado de contato exposto).
- **DevOps, Back e Dados e Produto:** não abrem nesta etapa.
- **Arquivos comuns** (`package.json` da raiz, `.github/workflows/ci.yml`, `docs/memoria-do-projeto.md`): só a integradora mexe neles.
- **Teto de sessões:** 6 ao mesmo tempo (a integradora, a Arquitetura, Design e Front, a Segurança e até 2 trabalhadoras).
