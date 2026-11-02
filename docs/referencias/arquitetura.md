# Referências da Arquitetura

O que já foi lido para decidir, com a data, o que foi aproveitado e por quê. A próxima consulta começa por aqui. Os registros de decisão ficam em [`../arquitetura.md`](../arquitetura.md).

## 2026-10-31 · Revisão das tarefas 3 e 12 do plano e triagem do `npm audit`

As decisões 001 a 006 saíram de evidência local: o código instalado, o lock, o npm e medições. Nenhum dos blogs de engenharia do harness foi lido, porque nenhuma das decisões pedia: são escolhas de framework e de algoritmo, num site sem back-end.

| Fonte | O que foi conferido | Usado em |
|---|---|---|
| Código instalado do Next 15.5.28 (`next/dist/server/config-shared.js`, `next/dist/build/entries.js`) | `experimental.globalNotFound` existe e vem `false`; o 404 composto por layout com vários layouts raiz depende dele | 001 |
| Documentação do Next (App Router), "Creating multiple root layouts" e `global-not-found`: **não relida nesta sessão**, vem de conhecimento prévio, e só a existência da flag foi confirmada no código instalado | Navegar entre layouts raiz recarrega a página; o `global-not-found` exige `<html>` próprio. Conferir no PR #2 com um teste | 001 |
| `assets/brand/floway-simbolo-fundo-claro.svg` | 3 paths; só os comandos `M`, `C` e `Z` absolutos; 182 curvas | 004 |
| Medição local: script em Node, fora do repositório, Apple M5 | Rejeição com `dentro()`: 336 ms (20 mil) e 119 ms (8 mil) com `passos=8`. Faixas de linha: 39 ms (20 mil, incluindo 2.000 conferências) | 004 |
| `@14islands/r3f-scroll-rig` 8.15.0, `dist/scrollrig.module.js` | Chama `parse(window.location.search)` do `query-string` só no cliente, ao montar o `GlobalCanvas` | 006 |
| `npm audit --package-lock-only --json` na raiz e `package-lock.json` | 22 avisos; quais são `dev`; versões resolvidas | 006 |
| `npm view` (vitest@3, tinypool, postcss, decode-uri-component@0.5, next@15, r3f-scroll-rig) | vitest 3.2.7 é a última 3.x e pede `tinypool ^1.1.1`; tinypool corrigido é 2.1.2; decode-uri-component 0.5.1 é `type: module`; next 15.5.28 é a última 15.x e fixa postcss 8.4.31; o scroll-rig 8.15.0 é o mais novo | 006 |
| Avisos do GitHub: GHSA-5gmw-xhrv-c9v3, GHSA-85c8-ppgw-ccpr, GHSA-82fw-gwwq-j7x9, GHSA-qxg6-89mg-rqv8, GHSA-vcc3-ghjq-m6fr, GHSA-qr28-fpjm-wq7f, GHSA-g3hv-75wg-m249, GHSA-qx2v-qp2m-jg93, GHSA-6g55-p6wh-862q, GHSA-fxqj-rqcc-2cmp, GHSA-r28c-9q8g-f849 | Título, faixa afetada e condição de exploração (como resumidos pelo audit) | 006 |

**Para a Fase 9 (método):**
- Com vários layouts raiz no Next 15, prever o 404 por catch-all desde a primeira tarefa.
- Amostrar uma forma por faixas de linha, e não por rejeição, quando roda no carregamento.

## 2026-11-02 · Limites das correções e contrato observado (issue #28)

**Base:** `3c0993c`, após o PR #25. Revisão do código e dos testes existentes para orientar as correções paralelas; não altera as decisões 001–006, o produto ou a identidade. O [contrato do contato](../contrato-api.md) registra somente a interface já implementada. A indicação antiga de que o contrato ainda não existe em `docs/arquitetura.md` fica para atualização pela integradora em tarefa autorizada; aquele arquivo está fora desta issue.

**Fontes consultadas:** evidência local abaixo e a base de Arquitetura do método 3.1.0 (`modelos/referencias/arquitetura.md`), via `metodo:consultar`. Foram usados os checklists `metodo:contrato-de-api` e `metodo:analise-de-falhas` para explicitar garantias ausentes, sem acrescentá-las ao contrato. Não houve pesquisa externa nova nem reavaliação do `npm audit` de 2026-10-31; a decisão 006 permanece histórica. As skills `engineering:architecture` e `engineering:system-design` não estavam disponíveis nesta sessão; nenhuma decisão nova foi criada.

### Limites observados e riscos concretos

| Área e fonte | Responsabilidade atual | Risco para a rodada e conferência recomendada à integradora |
|---|---|---|
| [Casca, linhas 12–22](../../apps/site/src/componentes/casca/Casca.tsx#L12), [canvas, linhas 7–30](../../apps/site/src/componentes/canvas/CanvasGlobal.tsx#L7) | A casca reúne idioma, abertura, rolagem, cabeçalho, conteúdo, um canvas e transição. Cada seção envia a própria cena por `UseCanvas`; o DOM sustenta conteúdo e alternativas sem WebGL | Correção local não precisa de outro canvas ou provedor. Alterar câmera, DPR ou contexto global para consertar o hero pode afetar esfera e cartões. Conferir todas as cenas e o caminho sem WebGL se essa fronteira for tocada |
| [Transição, linhas 45–66](../../apps/site/src/componentes/transicao/Transicao.tsx#L45), [restauração, linhas 30–73](../../apps/site/src/componentes/canvas/Rolagem.tsx#L30) | Navegação por documento inteiro; restauração manual após a montagem dos pins, com interrupção pela interação da pessoa | Trocar por navegação de cliente reabre a limitação de remontagem da Início registrada na spec de 2026-11-01. Mudar altura/pin da galeria desloca também os gatilhos seguintes e a posição guardada: conferir ida ao contato, voltar e recarregar no meio da página |
| [Hero, linhas 117–146 e 178–184](../../apps/site/src/componentes/hero/CenaHero.tsx#L117) | A entrada espera a abertura terminar; usa timeline pausada avançada por `performance.now()` e remove o callback ao terminar/desmontar | Preservar a correção do PR #25. Voltar a tocar a timeline no relógio suavizado ou alterar `lagSmoothing` global pode arrastar a entrada com quadros de 700 ms e disputar com a transição, que também muda esse ajuste. Manter os testes de legibilidade, inclusive o de quadros lentos |
| [Hero, linhas 187–224](../../apps/site/src/componentes/hero/CenaHero.tsx#L187), [DOM, linhas 18–23](../../apps/site/src/componentes/hero/Hero.tsx#L18) | A cena cuida de vidro, glitch e paralaxe; o SVG acessível da palavra continua no DOM. A refração renderiza a cena global em um alvo e para fora do hero | Reduzir/reposicionar o F exige conferir legibilidade e saída, sem editar a marca. Não usar a spec antiga de três lâminas para substituir a direção posterior da pessoa de manter o F menor (memória de 2026-11-02). Verificar desktop, tela larga/baixa, celular, reduzido e sem WebGL |
| [Galeria, linhas 37–75](../../apps/site/src/componentes/capitulos/Capitulos.tsx#L37) | `Capitulos` decide lista/grade/galeria e controla pin, deslocamento e progresso. Calcula `extra = max(0, scrollWidth - innerWidth)` | **Achado por leitura:** com `extra = 0`, o deslocamento é zero, mas `pin: true` continua por pelo menos `innerHeight` (linhas 51–59), inclusive a trava de ponteiro antes de 15% de progresso. A correção deve conferir também revelação, barra e links; apenas zerar `x` já é o comportamento atual. Reproduzir em tela larga/baixa e testar os dois lados do limite em que a fileira passa a caber |
| [Cena dos cartões, linhas 48–64](../../apps/site/src/componentes/capitulos/CenaCartoes.tsx#L48), [CSS, linhas 2–5 e 11–25](../../apps/site/src/componentes/capitulos/estilo.css#L2) | A cena segue os retângulos das imagens no DOM e consome progresso/hover; cartões sem capa permanecem blocos estáticos. CSS define largura, vão de 3vw, rótulo e modos alternativos | Desativar a timeline sem definir o estado de revelação pode deixar capas futuras em ASCII ou invisíveis, ainda que os marcadores atuais pareçam corretos. Conferir com/sem capa, teclado e modos lista/grade. O rótulo absoluto (`top: -35px; left: 30px`) depende do palco; conferir alinhamento com a geometria final |
| [Ordem dos gatilhos, linhas 17–26](../../apps/site/src/gsap.ts#L17) | A prioridade segue hero → manifesto → capítulos → decisões → contato; o refresh é centralizado | Remover pin muda o espaço de todas as seções abaixo. Preservar a ordem de refresh e o desfazer do contexto; observar manifesto/lençol/contato depois de qualquer alteração na galeria |
| [Esfera, linhas 13–16 e 37–67](../../apps/site/src/compartilhados/esfera/EsferaDeLetras.tsx#L13) | Recebe fábrica de alvo estável; amostra apenas ao se aproximar da tela; monta 20 mil pontos no desktop e 8 mil no celular. Sem canvas, não amostra | Uma fábrica inline refaz atributos a cada render. A futura 404 pode usar outro alvo, sem mudar o shader nem o alvo do contato. Essa é uma fronteira já existente, não autorização de implementação na #28 |
| [Cena da esfera, linhas 35–49, 97–139 e 167–180](../../apps/site/src/compartilhados/esfera/CenaEsfera.tsx#L35), [usos no contato, linha 99](../../apps/site/src/componentes/contato/Contato.tsx#L99) e [página, linha 21](../../apps/site/src/paginas/PaginaContato.tsx#L21) | Início usa `fixa`, com `StickyScrollScene` apenas se o CSS tiver `position: sticky` e `top` em px; página usa `ScrollScene`. Compila antes de exibir, pausa morfose fora da tela e não atualiza uniformes no modo reduzido | Mudar sticky para pin do GSAP ou `top` para valor sem px pode desacoplar cena e DOM. A 404 não deve herdar a fixação da Início por conveniência. Conferir esfera redonda e separada do formulário nas telas 1440×900, 1883×703, 390×844 e 360×640 |

Os riscos acima são inferências sobre mudanças futuras a partir dos pontos de acoplamento. A fixação com deslocamento zero é consequência direta do código; não se afirma aqui reprodução visual nova nem correção do bug.

### Relação com as decisões 001–006

| Decisão existente | Conferência e limite para esta rodada |
|---|---|
| 001 · Layouts por língua e catch-all | Os [layouts PT](../../apps/site/app/(pt)/layout.tsx#L6) e [EN](../../apps/site/app/(en)/en/layout.tsx#L6) compartilham `LayoutRaiz`; os catch-all [PT](../../apps/site/app/(pt)/[...resto]/page.tsx#L4) e [EN](../../apps/site/app/(en)/en/[...resto]/page.tsx#L4) chamam `notFound()`. Acrescentar partículas não exige refazer o roteamento ou a casca |
| 002 · Conteúdo puro e índice | [Índice](../../apps/site/src/conteudo/index.ts#L11), [percurso](../../apps/site/src/conteudo/textos.ts#L28) e [teste-guarda](../../apps/site/tests/unit/indice.test.ts#L8) mantêm a fronteira de conteúdo. Correção de posição não justifica mudar textos ou seus registros; C2 permanece separado |
| 003 · Trava na publicação | O [teste de publicação](../../apps/site/tests/publicacao/trava.test.ts#L8) continua separado do teste comum; não confundir suíte verde com autorização de publicar. A ligação de produção é de C5, fora desta rodada |
| 004 · Faixas para amostrar o símbolo | [Amostragem e cache](../../apps/site/src/marca/amostrar.ts#L156) permanecem no módulo da marca; [montagem tardia](../../apps/site/src/compartilhados/esfera/EsferaDeLetras.tsx#L37) evita custo no carregamento inicial. Não recalcular o F a cada render ou alterá-lo para implementar outro alvo |
| 005 · `THREE.Points` e uniformes | [Geometria/cena](../../apps/site/src/compartilhados/esfera/CenaEsfera.tsx#L63) e [shader](../../apps/site/src/compartilhados/esfera/shader.ts#L15) mantêm atributos prontos, `discard`, material sem transparência ordenada e teto de 64 px. A extensão do alvo para 404 já cabe na interface; não requer outra pilha |
| 006 · Audit aceito | A aceitação registrada não foi reaberta nem atualizada; nenhuma dependência mudou. O upgrade do Vitest é da #11 e a revisão de publicação continua obrigatória conforme os gatilhos da própria decisão |

### Contato: falhas observadas e pendências

| Fluxo/dependência | Efeito observado e detecção | Encaminhamento, sem implementar nesta rodada |
|---|---|---|
| Enviar pedido — crítico; entrega forte, ainda indisponível | Pedido válido admitido retorna 503 JSON ou 303 com `estado=falha`; [E2E real](../../apps/site/tests/e2e/pagina-contato.spec.ts#L39) verifica a falha. Indisponibilidade é certa com o stub atual | Serviço e destino dependem da pessoa; publicação continua bloqueada. Não criar promessa de entrega ou conversa com IA |
| Rede/servidor — forte no envio | `fetch` rejeitado mostra falha e conserva texto com JS; não há timeout próprio no cliente. Sem JS, depende da navegação do navegador; não há prazo contratado | Ao conectar serviço real, definir prazo, resultado desconhecido e repetição segura antes de prometer entrega; frequência de falhas de rede não foi medida |
| Memória do limite — proteção local | Reinício e múltiplas instâncias perdem/dividem contagem; chance depende da hospedagem ainda não definida. [Código](../../apps/site/src/lib/pedidoDeContato.ts#L15) não emite métricas e conta também as entregas que falham | Revisar armazenamento comum e confiança em `x-forwarded-for` com Segurança/DevOps em C5; não chamar isso de proteção global ou idempotência |
| WebGL — fraco para ler e enviar formulário | Sem canvas, a decoração desaparece; formulário e texto permanecem no DOM | Manter a independência entre envio e esfera, inclusive em reduced motion e sem JS |

**Notas para a integradora:** encaminhar os pontos de galeria/hero ao Front; preservar casca/GSAP/rolagem compartilhados fora de correção local; pedir revisão de Segurança e do responsável pela entrega antes de conectar e-mail. O contrato diferencia leitura comprovada em código de casos exercitados pelos testes e separa propostas futuras. Nenhum serviço, custo, prazo ou garantia nova foi aprovado; não há custo operacional acrescentado por estes documentos.
