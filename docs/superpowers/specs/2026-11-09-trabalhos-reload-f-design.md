# Trabalhos com peças reais, recarga sem salto, F de vidro e celular

Estado: **aprovada por Rafael em 2026-11-09.** Branch `feat/trabalhos-hover-logo`, base `origin/main` 7339e62. Nada de código escrito.

Atenção: os prints que motivaram o pedido vieram de uma cópia local antiga (`ef855c3`). A `main` atual já traz o F de vidro (42b28e7) e a galeria corrigida (#31); esta spec parte dela.

## Pedido

1. Trabalhos da Início com 5 quadros, na ordem site / landing / site / landing / site, usando as peças do repositório `CreateHubAI/sitesOfertas`; no hover, "abre a página toda"; ver em localhost.
2. Documentar no projeto: spec, harness, harness², Ponytail, Superpowers.
3. Ao recarregar a página rolada, "a logo sobe".
4. O vidro do hero deveria ser o F da Floway e está bugado.
5. Responsivo para celular.

## O que já existe (não refazer)

- Seção Trabalhos: dados em `apps/site/src/conteudo/trabalhos.ts` (tipo com `capa?` e `previa?`, `listaDeTrabalhos` vazia, 4 marcadores), fileira presa com rolagem horizontal (`Capitulos.tsx`), plano ASCII WebGL por capa (`CenaCartoes.tsx`), hover com zoom/escurecer e vídeo de prévia (`CartaoTrabalho.tsx:38-51`), modo lista no celular e grade no movimento reduzido. A quantidade sai do tamanho da lista.
- Spec 2026-10-31: prévia de site = "rolagem do site, 5 a 8 s" (:206); case só entra com todas as peças (:212); nenhum link sem case (:225).
- Trava de publicação `tests/publicacao/trava.test.ts`.
- Restauração da rolagem por `sessionStorage` (`Rolagem.tsx`, commit 390616c).
- F de vidro com geometria oficial correta (`marca/simbolo.ts`, `hero/laminas.ts`), e a proposta A/B pendente em `2026-11-02-hero-f-correcao-design.md` com protótipo `prototipos-correcao/hero-f.html`.
- Ponytail e Superpowers já descritos em `CLAUDE.md`, `AGENTS.md`, `docs/DESENVOLVIMENTO.md` e `docs/agentes/*`; harness = `docs/agentes/*.md`.
- Celular: sem rolagem lateral em 5 tamanhos (`responsivo.spec.ts`), alvos de 44 px, modo lista, recarga ao mudar largura.

## Proposta

### P1 Trabalhos com as peças reais
- `listaDeTrabalhos` com as peças na ordem decidida (Q1), `conceito: true`, nome descritivo de setor (ex.: "Companhia aérea"), sem a marca fictícia no título (spec :212), rótulo "Conceito".
- Capa: print da primeira dobra em 1440×900, recortado 730×1080, webp ~100 KB, em `apps/site/public/trabalhos/<slug>/`.
- Hover ("página toda"): vídeo da rolagem do site inteiro (gravado em 1440×900, 6–8 s, ~1 MB) ocupando o cartão inteiro por cima do plano ASCII, usando a `.cartao-previa` que já existe, ampliada. Só com `@media (hover: hover) and (pointer: fine)`. Sem link, sem foco por teclado (o cartão não tem ação).
- Corrige o bloco preto vazio da prévia quando não há vídeo.
- Captura por script Playwright fora do repo, servindo o `dist` de cada peça.
- Novo teste: item da lista exige `capa` e `previa`. Testes que contam 4 marcadores passam a testar a lista real.
- Em 1883×703 a fileira de 5 passa a ter um percurso curto (~160 px): aceito.
- Não integra na `main` sem o sim de Rafael (marcas fictícias com semelhança às referências; INPI pendente no handoff de Sites).

### P2 Recarga sem a logo subir
- Script no `<head>` (junto do da abertura): se a abertura já tocou, a navegação é reload/back_forward e há posição guardada > 0, põe `html.restaurando` (`visibility: hidden`) com teto próprio de ~2,5 s no próprio script.
- A classe sai quando a restauração termina (`parar()` e destino 0).
- `CenaHero` decide ao montar (pelo tipo de navegação e a posição guardada) e não registra a entrada: logo já no lugar.
- Teste e2e: amostras a cada 100 ms depois do reload; nenhuma amostra visível com scrollY 0 quando havia posição guardada; logo sem deslocamento.

### P3 F de vidro reconhecível
- Aplicar a opção escolhida (Q4) da spec 2026-11-02: F frontal, centrado, inclinação 0, escala pela altura da tela (A: ~40% no desktop, 21,6% no celular), limitada também pela largura.
- Mover faixas e intro para baixo do F (spec 2026-11-02 :33), com a mesma aprovação.
- Véu do shader fica como está (aumentar clareia a palavra e fere o critério de legibilidade).
- Testes: caixa do F inteira dentro da tela; `hero-legivel` (≥25% escuros, p10 ≤ 0,25) segue sem afrouxar.

### P4 Documentação do método
- Sem arquivo novo: um parágrafo em `docs/DESENVOLVIMENTO.md` amarrando spec (onde mora, quem aprova), harness (`docs/agentes`), harness² (conforme Q6), Ponytail e Superpowers, mais nota em `docs/memoria-do-projeto.md`. `CLAUDE.md` e `AGENTS.md` só se mudar regra, sempre os dois juntos. Escrito por subagente.

### P5 Celular
- Os itens acima conferidos em 390×844: Trabalhos em lista só com a capa (sem ação ao tocar), F a 21,6%, recarga sem salto.
- Hero: trocar `100vh` por `100svh` onde a palavra e o canvas precisam alinhar.
- Escopo do resto do site conforme Q8.

## Derrubado na rodada adversarial
- Print de página inteira rolando no hover (minha proposta): ilegível (página de 16 telas reduzida 4×), sai com áreas vazias de pin e sem o movimento das peças. Trocado pelo vídeo.
- Trocar o ASCII pela imagem DOM: quebraria o casamento de planos por ordem de `img` (`CenaCartoes.tsx:49-52`).
- Mesmo efeito no foco do teclado: criaria 5 paradas sem ação e desalinharia a fileira.
- Só pular a entrada do hero sem esconder a página: a página ficaria 1,3 s no topo e depois saltaria.
- `entrada.progress(1)`: o ticker reescreve o tempo a cada quadro (`CenaHero.tsx:141-146`).
- Reduzir a espera de 1300 ms: depende da saída do hero e dos pins.
- Véu maior no vidro e troca do teste de posição do hero: desnecessários ou nocivos.
- Arquivo novo `metodo-de-trabalho.md`: repetiria o que já existe.
- Contradição do `produto.md`: não é contradição (o agente foi apagado; o harness ficou).

## Decisões de Rafael (2026-11-09, "Aprovo tudo")
- Q1: ordem landing / site / landing / site / landing com as 5 peças reais (Tramo, Alísio, Prumo, Taipa, Lastro).
- Q2: hover por vídeo da rolagem do site inteiro cobrindo o cartão; substitui a prévia de 250 px da spec 2026-10-31 (:104, :230) para os trabalhos.
- Q3: nome por setor + "Conceito", sem a marca fictícia no título; nada vai para a `main` sem o sim dele.
- Q4: opção A da spec 2026-11-02, com faixas e intro abaixo do F.
- Q5: página escondida até restaurar (teto 2,5 s) e entrada do hero pulada na restauração.
- Q6: harness² = o ciclo de melhorar o próprio harness (erro → regra candidata → sonda A/B com dois subagentes → entra no harness).
- Q7: uma branch, um commit por item, um PR com seção por item.
- Q8: celular só no escopo desta tarefa, mais `svh` no hero.
- Revisão de Rafael depois de ver (2026-11-09): o F volta ao tamanho e lugar do começo do projeto (escala e posição da `main`), só de frente e com vidro limpo (sem serra nem borrão de 2 px); substitui a opção A. Vão entre os quadros de 3vw para 4,5vw. "Lag" da fileira e do vídeo corrigidos (capa atrasada um quadro; vídeo carregando só no hover).

## Estado final entregue (revisões de Rafael vendo o site, 2026-11-09 e 10)

Substitui o que está acima onde houver conflito; P1 a P3 ficam como registro do plano aprovado.

- **Trabalhos:** 5 cartões na ordem landing / site / landing / site / landing, nome por setor e "Conceito". O hover só aproxima a capa (shader ASCII); **clicar abre o site do conceito numa aba nova**, servido em `/conceitos/<slug>/index.html` (build das peças de `CreateHubAI/sitesOfertas` em `apps/site/public/conceitos`, gerado por `scripts/conceitos/gerar.sh`). O vídeo de prévia e o pop-up foram tentados e saíram. Vão entre cartões 4,5vw. A capa é a textura do próprio `<img>` (carrega perto da seção, uma vez). Tab rola a fileira presa até o cartão focado. O nome acessível do link leva nome, oferta e data.
- **Rolagem:** **recarregar vai ao topo** (o script do head marca `history.scrollRestoration = 'manual'`). Só o **voltar** do navegador devolve ao lugar, também quando a página volta do bfcache (o site recarrega com uma marca que conta como voltar) e no celular; a página fica escondida até chegar (teto 2,5 s) e a entrada do hero vem pronta. Mudar a largura da janela recarrega e, portanto, vai ao topo.
- **F de vidro:** a opção A foi substituída. O F tem a **escala original da main** (1,57 u; 2 u no celular), de frente (sem a inclinação de −0,12), com o topo entrando 25% na altura da palavra (a barra cobre o resto dela); vidro com tinta de 7% e borda mais escura, sem serra e com borrão leve; **o mouse não move o F** (só a flutuação lenta); a entrada esmaece o F no lugar e o glitch dura meio segundo; a saída cresce 1,15× sem giro e o vidro some em cerca de meia tela. Faixas e intro voltaram ao meio da tela, cruzando o F. Hero em `svh`.
- **Pendências para Rafael:** foto de pessoa na capa da companhia aérea (spec 2026-10-31 :212 pede sem fotos de pessoas reais); legibilidade do texto dos cartões sobre capas claras; sites dos conceitos versionados em `public/` (10 MB) em vez de `apps/conceitos/<nome>`; histórico da branch com os vídeos apagados (7 MB); semelhança das marcas fictícias com referências e INPI antes de publicar.

## Cenários de teste
- Desktop 1440×900 e 1883×703: 5 cartões na ordem; hover toca o vídeo cobrindo o cartão e para ao sair; sem link.
- Celular 390×844: lista com 5 capas, sem estouro lateral, sem prévia.
- Movimento reduzido: grade, sem vídeo automático; F parado.
- Sem WebGL: capas visíveis, palavra SVG.
- Recarga no meio da página (desktop e celular) e voltar do contato: nenhum quadro visível no topo; logo sem subir; teto de 2,5 s.
- Primeira visita: abertura toca normalmente.
- F: inteiro na tela nos 3 tamanhos; `hero-legivel` verde.
- Portões: `npm test`, `npm run check`, `npm run test:build` verdes; página vista em localhost no desktop, celular e movimento reduzido.
