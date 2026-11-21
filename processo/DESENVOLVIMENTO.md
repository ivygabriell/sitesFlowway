# Como desenvolvemos este projeto

Versão do método: 6.0.0
Lead: Claude Code
Telas: (link do arquivo do Figma ainda não registrado; registro em processo/telas/)
Cenários aplicados:
- site-estatico (testado em 1 projeto)

Os detalhes de cada fase, os cenários, os casos e as lições ficam no repositório do método (privado). Este documento registra só o que vale **neste projeto**: ajuste-o à medida que decidir.

## Regras que valem aqui

1. **Alvo antes de construir.** Entender, escrever de volta, desenhar e só então construir.
2. **Uma mudança, uma branch.** Nunca commit direto na `main`; tudo entra por Pull Request com o CI verde.
3. **Teste primeiro, em duas camadas.** Micro (TDD, visto falhar antes do código) e macro (suíte completa, build, exploração).
4. **Quem constrói não valida.** A sessão Lead refaz os testes e explora o resultado antes de integrar.
5. **As branches integradas ficam no GitHub.** Integre com `gh pr merge N --merge`, sem `--delete-branch`.
6. **O humano decide o que é externo ou irreversível:** publicar, integrar, apagar, reescrever histórico.

## Ferramenta por papel

Cada sessão usa a ferramenta do seu papel; a Builder usa a do papel de quem a abre e vai para a outra quando a cota aperta (com passagem pela issue). No Orca: `--agent claude --model claude-opus-5-5` (Claude Code) ou `--agent codex --model gpt-6.1-sol` (Codex). Mudar esta tabela é uma decisão da pessoa, registrada na memória.

| Papel | Ferramenta padrão |
|---|---|
| Lead | Claude Code |
| Product | Claude Code |
| Architect | Claude Code |
| Frontend | Claude Code |
| Backend | Codex |
| Security | Codex |
| Ops | Codex |

## Aprovações

Uma decisão é da pessoa quando aciona pelo menos um gatilho: muda **o que** será construído; é difícil ou impossível de desfazer; atinge usuários reais; custa dinheiro ou muita cota; aceita um risco de segurança ou de dados pessoais; muda as regras do jogo (harness, método, a Lead, a tabela Ferramenta por papel). Sem gatilho, a Lead decide e registra na issue ou na memória; na dúvida, sobe para a pessoa. Um PR dentro do plano aprovado, com CI verde, validação sem achado crítico nem importante, só nos arquivos permitidos e sem gatilho, a Lead integra sozinha. A Lead escreve um resumo por marco do que aprovou sozinha. A tabela completa está no núcleo 01 do método ("Portões de aprovação"); anote aqui o que a pessoa mudar:

- Decisão da pessoa em 2026-11-21: a Lead integra sozinha o PR sem gatilho (critérios desta seção) e só pede aprovação quando há gatilho. Publicar o site continua com a pessoa (marcas fictícias e INPI, decisão de 2026-11-09).

## Comandos do projeto

Todos na raiz; rodam em todos os workspaces. Para um app só, acrescente `-w apps/site`.

- Testes: `npm test` (Vitest, micro)
- Tipos e lint: `npm run check`
- Build e testes do build: `npm run test:build` (build em `.next-teste` + Playwright na porta 3100; fora do CI usa o Chrome da máquina)
- Servidor local: `npm run dev -w apps/site` (http://localhost:3000)

## Pilha

Next.js 15.5 (App Router), React 19, Three.js r180, @react-three/fiber 9, @14islands/r3f-scroll-rig 8 com Lenis, GSAP 3.13 e cannon-es, em workspaces do npm. As lições da passagem do repositório de identidade valem aqui (scroll-rig e `UseCanvas`, `useEfeitoDeLayout` para timelines com `pin`, `NEXT_DIST_DIR` nos testes, `syncInterval` do ScrollTrigger, CI sem GPU com `lagSmoothing(0)`, `next/font` instável no CI, um build de teste por vez, conferir o código de saída).

## Tarefas e sessões

- Tarefas: issues com o formulário de tarefa (`.github/ISSUE_TEMPLATE/tarefa.yml`). Bugs: o formulário de bug (`.github/ISSUE_TEMPLATE/bug.yml`) e o "Ciclo de um bug" do método.
- Worktrees: `processo/scripts/nova-tarefa.sh <tipo> <slug>` e `processo/scripts/remover-tarefa.sh <tipo> <slug>`.
- Com o Orca: a Lead distribui as tarefas aos agentes (`orca orchestration worker-start`); o Orca cria e remove as worktrees, e os scripts acima ficam para quem trabalha sem ele. Prompt: `modelos/prompt-lead-orca.md` do método.
- Ferramentas: cada papel usa a sua (seção Ferramenta por papel, acima). O Claude Code lê o `CLAUDE.md`; o Codex lê o `AGENTS.md`, que manda ler o `CLAUDE.md`. Todo PR recebe ao menos uma revisão da outra ferramenta. Quando a cota acaba no meio da tarefa, a Builder faz commit, envia a branch e comenta na issue onde parou; outra Builder, na outra ferramenta, continua na mesma branch. Com back e front em tarefas paralelas, o contrato da API é aprovado antes de qualquer tarefa de construção.
- Para trazer este projeto à versão mais nova do método: `/metodo:atualizar-projeto`.
- Requisitos: `processo/requisitos.md` (fichas R-xx com o peso). Com interface, a identidade e todas as telas são aprovadas no Figma e registradas em `processo/telas/` antes do plano; o código segue a versão registrada.
- Memória do projeto: `processo/memoria-do-projeto.md`.
- Com agentes especialistas: cada agente lê primeiro o seu harness em `processo/agentes/` e atua dentro dele. A Lead coordena os especialistas, e cada especialista abre as suas Builders. Exige no Orca: Settings → Orchestration → Nested worker depth = 2.
- Especialistas deste projeto (site sem back-end próprio): Lead, Architect, Frontend (até 2 Builders) e Security, sempre; Ops só na publicação (C5) e Backend só se a rota do formulário ou a IA do contato pedirem; Product, sob demanda (a pessoa decidiu em 2026-11-03 não usá-lo nas rodadas de correção).

## Método de desenvolvimento

Em 2026-11-21 o método passou ao 6.0.0 e o agente único deu lugar à seção Ferramenta por papel (os harnesses ganharam os nomes em inglês: integradora→lead, arquitetura→architect, back-e-dados→backend, design-e-front→frontend, seguranca→security, produto→product, devops→ops). O texto abaixo é o histórico de 2026-11-02. A pessoa escolheu o Codex como agente principal e aprovou a atualização dos sete harnesses em 2026-11-02. As referências anteriores a trabalhadoras Claude e ao selo de rascunho dos modos Orca e com especialistas ficam como histórico: todas as sessões usam Codex, inclusive a integradora, os especialistas e as até duas trabalhadoras de Design e Front. Os papéis, os limites de sessões e a presença de cada especialista definidos para este site continuam valendo.

- Com o Orca: a Lead distribui as tarefas aos agentes (`orca orchestration worker-start`); o Orca cria e remove as worktrees, e os scripts acima ficam para quem trabalha sem ele. Prompt: `modelos/prompt-lead-orca.md` do método.
- Com agentes especialistas: cada agente lê primeiro o seu harness em `processo/agentes/` e atua dentro dele. A Lead coordena os especialistas, e cada especialista abre as suas Builders. Exige no Orca: Settings → Orchestration → Nested worker depth = 2.
- Os harnesses atualizados incluem a leitura das lições do método, as skills de cada papel e o fluxo de auditoria de segurança com aprovação própria. No Codex, Ponytail fica sob demanda, conforme o `AGENTS.md`; esta atualização não instala nem ativa ferramentas.

## Spec, harness e skills

- **Spec:** mora em `docs/superpowers/specs/AAAA-MM-DD-<tema>-design.md`, com os protótipos ao lado. É escrita antes do código e só se implementa depois que a pessoa aprova.
- **Harness:** as regras de cada agente, em `processo/agentes/*.md`. O harness manda.
- **Harness²** (decidido em 2026-11-09): o ciclo que melhora o próprio harness. Um retrabalho, uma correção da pessoa ou um bug que ela achou antes vira regra candidata ("proposta de harness"). Só entra depois de uma sonda com dois subagentes no mesmo caso (A sem a regra, B com ela). As propostas pendentes ficam na `processo/memoria-do-projeto.md` até serem adotadas ou descartadas. Adotar muda `processo/agentes` e é decisão da pessoa.
- **Ponytail** e **Superpowers:** as regras estão no `CLAUDE.md` e no `AGENTS.md` (seções de Skills e Ponytail); não se repetem aqui.

## Antes do primeiro push para um repositório público

Rode a higiene de dados do método: nada de e-mail pessoal, telefone ou token em documentos, testes e commits.
