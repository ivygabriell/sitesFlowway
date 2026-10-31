# Como desenvolvemos este projeto

Versão do método: 2.12.0
Cenários aplicados:
- site-estatico (testado em 1 projeto)

Os detalhes de cada fase, os cenários, os casos e as lições ficam no repositório do método (privado). Este documento registra só o que vale **neste projeto**: ajuste-o à medida que decidir.

## Regras que valem aqui

1. **Alvo antes de construir.** Entender, escrever de volta, desenhar e só então construir.
2. **Uma mudança, uma branch.** Nunca commit direto na `main`; tudo entra por Pull Request com o CI verde.
3. **Teste primeiro, em duas camadas.** Micro (TDD, visto falhar antes do código) e macro (suíte completa, build, exploração).
4. **Quem constrói não valida.** A sessão integradora refaz os testes e explora o resultado antes de integrar.
5. **As branches integradas ficam no GitHub.** Integre com `gh pr merge N --merge`, sem `--delete-branch`.
6. **O humano decide o que é externo ou irreversível:** publicar, integrar, apagar, reescrever histórico.

## Comandos do projeto

Todos na raiz; rodam em todos os workspaces. Para um app só, acrescente `-w apps/site`.

- Testes: `npm test` (Vitest, micro)
- Tipos e lint: `npm run check`
- Build e testes do build: `npm run test:build` (build em `.next-teste` + Playwright na porta 3100; fora do CI usa o Chrome da máquina)
- Servidor local: `npm run dev -w apps/site` (http://localhost:3000)

## Pilha

Next.js 15.5 (App Router), React 19, Three.js r180, @react-three/fiber 9, @14islands/r3f-scroll-rig 8 com Lenis, GSAP 3.13 e cannon-es, em workspaces do npm. As lições da passagem do repositório de identidade valem aqui (scroll-rig e `UseCanvas`, `useEfeitoDeLayout` para timelines com `pin`, `NEXT_DIST_DIR` nos testes, `syncInterval` do ScrollTrigger, CI sem GPU com `lagSmoothing(0)`, `next/font` instável no CI, um build de teste por vez, conferir o código de saída).

## Tarefas e sessões

- Tarefas: issues com o formulário de tarefa (`.github/ISSUE_TEMPLATE/tarefa.yml`).
- Worktrees: `scripts/nova-tarefa.sh <tipo> <slug>` e `scripts/remover-tarefa.sh <tipo> <slug>`.
- Com o Orca (modo em rascunho): a coordenadora é a integradora e distribui as tarefas aos agentes (`orca orchestration worker-start`); o Orca cria e remove as worktrees, e os scripts acima ficam para quem trabalha sem ele. Prompt: `modelos/prompt-coordenadora-orca.md` do método.
- Back com o Codex e front com o Claude (modo em rascunho): a coordenadora Claude inicia os agentes do back com `--agent codex`; o Codex lê o `AGENTS.md`, com as mesmas regras do `CLAUDE.md`. O contrato da API é aprovado antes de qualquer tarefa de construção.
- Para trazer este projeto à versão mais nova do método: `/metodo:atualizar-projeto`.
- Memória do projeto: `docs/memoria-do-projeto.md`.

## Antes do primeiro push para um repositório público

Rode a higiene de dados do método: nada de e-mail pessoal, telefone ou token em documentos, testes e commits.
