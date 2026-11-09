# Como desenvolvemos este projeto

Versão do método: 3.1.0
Agente principal: Codex
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
- Agente principal: todas as sessões deste projeto usam Codex, nunca as duas ferramentas; no Orca, todo agente abre com `--agent codex`. O Claude Code lê o `CLAUDE.md`; o Codex lê o `AGENTS.md`, que manda ler o `CLAUDE.md`. Trocar de ferramenta é uma decisão da pessoa, registrada na memória. Com back e front em tarefas paralelas, o contrato da API é aprovado antes de qualquer tarefa de construção.
- Para trazer este projeto à versão mais nova do método: `/metodo:atualizar-projeto`.
- Memória do projeto: `docs/memoria-do-projeto.md`.
- Com agentes especialistas (modo em rascunho): cada agente lê primeiro o seu harness em `docs/agentes/` e atua dentro dele. A integradora coordena os especialistas, e cada especialista abre as suas trabalhadoras. Exige no Orca: Settings → Orchestration → Nested worker depth = 2.
- Especialistas deste projeto (site sem back-end próprio): Integradora, Arquitetura, Design e Front (até 2 trabalhadoras Claude) e Segurança, sempre; DevOps só na publicação (C5) e Back e Dados só se a rota do formulário ou a IA do contato pedirem; Produto, sob demanda.

## Método de desenvolvimento

A pessoa escolheu o Codex como agente principal e aprovou a atualização dos sete harnesses em 2026-11-02. As referências anteriores a trabalhadoras Claude e ao selo de rascunho dos modos Orca e com especialistas ficam como histórico: todas as sessões usam Codex, inclusive a integradora, os especialistas e as até duas trabalhadoras de Design e Front. Os papéis, os limites de sessões e a presença de cada especialista definidos para este site continuam valendo.

- Com o Orca: a coordenadora é a integradora e distribui as tarefas aos agentes (`orca orchestration worker-start`); o Orca cria e remove as worktrees, e os scripts acima ficam para quem trabalha sem ele. Prompt: `modelos/prompt-coordenadora-orca.md` do método.
- Com agentes especialistas: cada agente lê primeiro o seu harness em `docs/agentes/` e atua dentro dele. A integradora coordena os especialistas, e cada especialista abre as suas trabalhadoras. Exige no Orca: Settings → Orchestration → Nested worker depth = 2.
- Os harnesses atualizados incluem a leitura das lições do método, as skills de cada papel e o fluxo de auditoria de segurança com aprovação própria. No Codex, Ponytail fica sob demanda, conforme o `AGENTS.md`; esta atualização não instala nem ativa ferramentas.

## Spec, harness e skills

- **Spec:** mora em `docs/superpowers/specs/AAAA-MM-DD-<tema>-design.md`, com os protótipos ao lado. É escrita antes do código e só se implementa depois que a pessoa aprova.
- **Harness:** as regras de cada agente, em `docs/agentes/*.md`. O harness manda.
- **Harness²** (decidido em 2026-11-09): o ciclo que melhora o próprio harness. Um retrabalho, uma correção da pessoa ou um bug que ela achou antes vira regra candidata ("proposta de harness"). Só entra depois de uma sonda com dois subagentes no mesmo caso (A sem a regra, B com ela). As propostas pendentes ficam na `docs/memoria-do-projeto.md` até serem adotadas ou descartadas. Adotar muda `docs/agentes` e é decisão da pessoa.
- **Ponytail** e **Superpowers:** as regras estão no `CLAUDE.md` e no `AGENTS.md` (seções de Skills e Ponytail); não se repetem aqui.

## Antes do primeiro push para um repositório público

Rode a higiene de dados do método: nada de e-mail pessoal, telefone ou token em documentos, testes e commits.
