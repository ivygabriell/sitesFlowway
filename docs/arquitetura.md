# Arquitetura: registro de decisões

Um registro curto por decisão: contexto, decisão, motivo e o que se perde. Quem escreve é o especialista Arquitetura, num PR próprio. As fontes ficam em [`referencias/arquitetura.md`](referencias/arquitetura.md).

**Contrato da API:** não existe. O site não tem back-end próprio; a rota do formulário de contato, quando entrar, ganha um contrato em `docs/contrato-api.md`.

| # | Decisão | Estado | Data |
|---|---|---|---|
| 001 | Dois layouts raiz por língua, com 404 por catch-all | Aceita pela integradora | 2026-10-31 |
| 002 | Textos como objetos puros, com pendências achadas por percurso | Aceita pela integradora | 2026-10-31 |
| 003 | Trava de publicação no build de produção, fora do CI | Aceita pela integradora (a ligação é feita em C5) | 2026-10-31 |
| 004 | Amostragem do símbolo por faixas de linha | Aceita pela integradora | 2026-10-31 |
| 005 | Esfera de letras como `THREE.Points` com tudo no shader | Aceita pela integradora | 2026-10-31 |
| 006 | Avisos do `npm audit`: aceitar com registro | **Proposta**, espera o portão da pessoa | 2026-10-31 |

---

## 001 · Dois layouts raiz por língua, com 404 por catch-all

**Contexto.** O português fica sem prefixo e o inglês em `/en` (spec, seção 1), com nomes de rota diferentes nas duas línguas (`/trabalhos` e `/en/work`). O `<html lang>` precisa estar certo já no HTML estático. O plano (tarefa 3) usa os grupos de rota `(pt)` e `(en)/en`, cada um com o próprio layout raiz, e remove o `app/layout.tsx`.

**Decisão.** Ficam os dois layouts raiz, com três acréscimos:
1. **404 por catch-all.** Entram `app/(pt)/[...resto]/page.tsx` e `app/(en)/en/[...resto]/page.tsx`, que chamam `notFound()`, e um `not-found.tsx` em cada grupo. Ele é provisório agora, e a esfera que forma "404" entra em E14. Isso cobre também `/trabalhos/<qualquer>` com HTTP 404.
2. **Seletor de língua fora da transição.** Navegar de um layout raiz para o outro recarrega a página inteira. Por isso o seletor PT/EN é um link comum, que a `<Transicao>` (tarefa 7) não intercepta.
3. **Um layout comum.** Os dois layouts são cascas finas de um `LayoutRaiz({ idioma, children })`, que reúne `html`, `head`, o script da abertura, o CSS do scroll-rig, o `globals.css`, as fontes e os metadados de base. Só o `lang` muda entre eles.

**Motivo.**
- Sem layout no topo, um endereço fora do mapa cai no 404 padrão do Next: sem a casca, sem o canvas, sem o `lang` e sem o `noindex` dos layouts. No Next 15.5.28 instalado, só o `experimental.globalNotFound` (desligado por padrão) resolve isso, e ele exige um `<html>` próprio, sem a casca nem o canvas global.
- O catch-all é estável e reaproveita o layout de cada língua.
- Uma camada de middleware para reescrever rotas seria uma peça a mais sem ganho: as rotas não têm o mesmo nome nas duas línguas.

**O que se perde.**
- A troca de língua não tem transição suave: recarrega.
- As duas páginas catch-all são renderizadas sob demanda (ƒ), e não pré-geradas.

**Testes.** `/qualquer` e `/en/qualquer` respondem 404, com `html[lang]` certo e `noindex`.

## 002 · Textos como objetos puros, com pendências achadas por percurso

**Contexto.** Cada texto é `{ pt, en?, pendente? }`, lido por `t()`. O plano previa um `registrar(modulo, textos)` chamado em cada módulo de `src/conteudo/` e um `pendencias()` sobre esse registro global.

**Decisão.**
- O modelo `{ pt, en?, pendente? }` fica. Ele é do tamanho certo e dispensa uma biblioteca de i18n.
- O `registrar()` sai:
  - cada módulo exporta um objeto (`export const casca = { … } satisfies Textos`, com aninhamento livre);
  - um `src/conteudo/index.ts` junta todos;
  - `pendencias(arvore)` percorre a árvore e devolve caminhos como `'casca.menu.contato (en)'`.
- A trava confere, com `import.meta.glob`, que todo `src/conteudo/*.ts` está no índice.
- Opcional: um `useIdioma()`, num contexto montado na `Casca`, evita passar `idioma` por todas as seções.

**Motivo.**
1. O tipo do plano (`Record<string, Texto | Texto[]>`) não aceita o aninhamento que o próprio `casca.ts` usa (`menu.trabalhos`) e não compila.
2. Um registro por efeito de import só vê o que foi importado: um módulo esquecido passa pela trava em silêncio.
3. O efeito colateral também iria para o bundle do cliente.

Uma função pura sobre objetos é mais fácil de testar e não depende da ordem dos imports.

**O que se perde.** É preciso lembrar de acrescentar cada módulo novo ao índice. O teste com `import.meta.glob` cobre isso.

## 003 · Trava de publicação no build de produção, fora do CI

**Contexto.** A spec manda que a trava falhe o build de publicação se houver texto pendente ou marcador de construção (seção 5). O plano cria `test:publicacao`, fora do CI, porque ela falha de propósito até C2. Um comando que ninguém roda não trava nada.

**Decisão.**
- Agora: `test:publicacao` existe fora do CI, como no plano.
- Na publicação (C5, execução do DevOps): o comando de build de produção roda a trava antes do `next build` quando `VERCEL_ENV=production`. As prévias e o CI não rodam a trava.

**Motivo.** É assim que a trava cumpre a spec (falhar o build publicado) sem deixar o CI e as prévias vermelhos durante a construção.

**O que se perde.** O gatilho depende de uma variável da hospedagem. Se a hospedagem mudar em C5, a condição muda junto. Fica anotado na lista de C5.

## 004 · Amostragem do símbolo por faixas de linha

**Contexto.**
- A esfera forma o F a partir dos paths de `assets/brand/floway-simbolo-fundo-claro.svg`: 3 paths, só com os comandos `M`, `C` e `Z` absolutos, num total de 182 curvas.
- O plano amostrava por rejeição: sorteia um ponto na caixa e testa `dentro()` contra todos os polígonos.
- A seção de contato monta junto com a Início.

**Decisão.**
- **Achatar:** `achatar()` continua.
- **Amostrar por faixas de linha:**
  - para cada linha y, os cruzamentos par-ímpar com as arestas são calculados uma vez e ordenados, o que dá as faixas dentro do símbolo;
  - cada ponto sorteia uma faixa, com peso pelo comprimento, e um x dentro dela;
  - não há tremor em y que saia da faixa.
- **Oráculo:** `dentro()` fica como oráculo do teste.
- **Quando calcular:**
  - o resultado fica em cache no módulo, uma vez por sessão;
  - o cálculo só acontece quando o contato se aproxima da tela (`IntersectionObserver` ou `requestIdleCallback`).
- **Teste da silhueta:** segue a spec. Cada borda da caixa dos pontos fica a menos de 2% da altura da caixa do SVG; a tolerância de 3% na proporção sai.

**Motivo.** Medido em Node num Apple M5 (script fora do repositório; detalhes nas referências):

| Método | 20 mil pontos | 8 mil pontos |
|---|---|---|
| Rejeição, `passos=8` (1462 arestas) | 336 ms | 119 ms |
| Rejeição, `passos=3` (552 arestas) | 114 ms | 46 ms |
| Faixas de linha, `passos=8`, 1024 linhas | 39 ms (incluindo 2.000 conferências com `dentro()`) | — |

Num celular médio, a rejeição ocuparia a thread principal por meio segundo ou mais durante o carregamento. As faixas continuam em TypeScript puro e testável no Vitest.

**O que se perde.** O código fica um pouco mais longo que a rejeição, por cerca de 40 linhas.

## 005 · Esfera de letras como `THREE.Points` com tudo no shader

**Contexto.** São 20 mil letras no desktop e 8 mil no celular, no canvas global do R3F, com morfose esfera ↔ F (e, em E14, ↔ "404"), buracos de ruído, giro e empurrão do cursor. O componente é compartilhado entre o contato da Início, `/contato` e a 404.

**Decisão.**
- **Geometria:** "pontos instanciados" quer dizer `THREE.Points` com `ShaderMaterial`: um vértice por letra, sempre de frente para a câmera, que é o que o F sem girar pede.
- **Material:**
  - `discard` pelo atlas;
  - sem transparência ordenada;
  - `gl_PointSize` vezes o dpr, com um teto, porque há Android com limite de 64 px.
- **Tamanho da letra:** ligado à quantidade (proporcional a 1/√n), para que cortar a quantidade em E4 não quebre o visual.
- **No vertex shader, por uniformes:** empurrão do cursor, buracos de ruído, giro e morfose. Nenhum atributo é atualizado por quadro.
- **Cor:** `aAzul` vira `vec2`, com o azul na esfera (cerca de 4%, sorteado) e o azul no alvo (o braço do F).
- **Alvo pronto:** o componente recebe o alvo já amostrado (`{ posicoes, azul }`), e não `alvo="simbolo"`, para que o "404" entre sem mexer no shader.
- **Fonte:** o atlas espera `document.fonts.load('800 64px ' + família)`, com a família lida da variável `--sans`. Só `document.fonts.ready` não basta: com o `next/font`, o peso 800 só baixa quando algo o usa.
- **Desempenho na tela:**
  - a cena fica dentro de um `ScrollScene` com `hideOffscreen`, sem atualizar uniformes fora da tela;
  - o shader é compilado na montagem (`gl.compileAsync`), para não engasgar quando o contato aparece.
- **Aceite:** "20 mil" é o número de pontos. Os buracos escondem parte deles na esfera, e todos aparecem no F.

**Motivo.**
- 20 mil vértices com uniformes custam pouco para a GPU. O custo real é o preenchimento, com as letras sobrepostas no F denso, e é ele que se mede no celular.
- Nada na CPU por quadro mantém a thread principal livre para o Lenis e o GSAP.

**O que se perde.**
- Pontos não giram no próprio plano e têm tamanho máximo, o que não atrapalha aqui.
- Sem ordenação de transparência, as bordas das letras são duras (`discard`).

## 006 · Avisos do `npm audit`: aceitar com registro (proposta)

**Contexto.** `npm audit --package-lock-only` na raiz em 2026-10-31 mostrou 22 avisos: 2 críticos, 4 altos e 16 moderados. A pilha decidida não muda, e não se roda `audit fix`: todas as correções oferecidas são versões maiores ou quebram.

| Grupo | Avisos | Alcance | Explorabilidade aqui | Proposta |
|---|---|---|---|---|
| `vitest` 3.2.7 → `tinypool` 1.1.1, `@vitest/mocker` | 2 críticos, 1 moderado | Só dev: teste local e CI; não vai ao bundle | As RCE do `tinypool` (GHSA-5gmw-xhrv-c9v3, GHSA-85c8-ppgw-ccpr) exigem código hostil já no processo de teste. O path traversal do mocker exige o servidor do vitest exposto (modo navegador, UI ou `--api`); usamos `vitest run` com jsdom. Praticamente nula | Aceitar. Fazer o upgrade para vitest ≥ 4.1.12 numa tarefa própria, depois do PR 3 do plano. A 3.2.7 é a última 3.x e fixa `tinypool ^1.1.1`. Sem override de `tinypool` 2, que tem outra API |
| `eslint`, `eslint-config-next` e a cadeia `minimatch` | 14 moderados | Só dev | ReDoS em padrões de glob da nossa própria configuração, sem entrada externa | Aceitar. Some no próximo upgrade do `eslint-config-next` |
| `@14islands/r3f-scroll-rig` 8.15.0 → `query-string` 6.14.1 → `decode-uri-component` 0.2.2 | 3 altos | Produção, **no cliente**: o scroll-rig chama `parse(window.location.search)` ao montar o `GlobalCanvas` (conferido no `dist`); no servidor não roda | Um link com `?%…` malicioso trava a aba de quem clica nele. Sem servidor afetado, sem dado vazado, sem efeito em mais ninguém. Baixa | Aceitar e reavaliar a cada versão do scroll-rig. A 8.15.0 é a mais nova e pede `query-string ^6`. O `decode-uri-component` corrigido (0.5.1) é só ESM, e um override quebraria o `require` do `query-string` 6. A alternativa, um patch local trocando o `parse` por `URLSearchParams`, é peça nova e precisa de portão |
| `next` 15.5.28 → `postcss` 8.4.31 | 1 alto, 1 moderado | Produção, mas **só no build** | A leitura de arquivo pelo `sourceMappingURL` e o XSS no stringify exigem CSS controlado por quem ataca entrando no build. Só entra CSS nosso e do scroll-rig. Baixa | Aceitar. O Next fixa `postcss` 8.4.31 exato, e a 15.5.28 é a última 15.x; a correção do audit é o Next 16. O override para 8.5.32 é possível, mas tira o Next da versão que ele testou, para um ganho quase nulo |

**Decisão (proposta).** Aceitar os quatro grupos com este registro e criar a tarefa futura "vitest 4". **A decisão de aceitar o risco é da pessoa**, por portão da integradora.

**O que se perde.** O audit continua mostrando os avisos até os upgrades. Revisar este registro a cada nova versão do scroll-rig, do Next 15 e do vitest.
