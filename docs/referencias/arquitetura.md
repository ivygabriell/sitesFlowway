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
