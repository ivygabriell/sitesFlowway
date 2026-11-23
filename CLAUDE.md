# Instruções para as sessões deste projeto

Este arquivo é lido automaticamente por qualquer sessão do Claude Code aberta nesta pasta. Ele foi gerado pelo método de desenvolvimento; ajuste-o à medida que o projeto decidir.

Versão do método: 6.0.0

@processo/DESENVOLVIMENTO.md
@processo/memoria-do-projeto.md

Tudo o que é do processo (regras, requisitos, telas, harnesses, memória, scripts de worktree) fica em `processo/`: a raiz é do código. A documentação do produto usa a própria pasta (`docs/`), que não é do método; aqui ela guarda as specs e os planos em `docs/superpowers/`.

## Como as sessões trabalham aqui

- **Responda em português.** Nomes de Skills, comandos e código ficam como são. Pronomes não declarados: use o neutro.
- **Consulte o método pela skill `metodo:consultar`** (plugin `metodo`): ela diz onde está a cópia do método e o que ler para cada fase, cenário ou dúvida. Se o plugin não estiver instalado, peça à pessoa.
- **Siga as fases do método** e diga qual Skill está usando: `superpowers:brainstorming` antes de criar ou reestruturar, `superpowers:test-driven-development` para implementar, `superpowers:systematic-debugging` para bugs e `superpowers:verification-before-completion` antes de dizer "pronto".
- **Comece lendo a memória** (`processo/memoria-do-projeto.md`) e atualize-a ao fim de cada fase, numa branch, junto com o trabalho da fase.
- **O método é só leitura.** Nunca altere a cópia do método. Uma lição nova vira nota na memória e é levada ao método na Fase 9.
- **Orquestração com o Orca**: se este projeto roda no Orca, a Lead coordena e cada agente supervisionado é uma Builder. A Lead usa o prompt `modelos/prompt-lead-orca.md` do método; os agentes nunca integram e perguntam à Lead com `orca orchestration ask`, nunca à pessoa; o que aciona um gatilho de aprovação (deploy, o irreversível, o merge com gatilho) passa por um portão que só a pessoa resolve; o resto a Lead decide e registra (seção Aprovações do `processo/DESENVOLVIMENTO.md`). Quando back e front são construídos em tarefas paralelas, o contrato da API é fechado e aprovado antes de qualquer tarefa de construção.
- **Com agentes especialistas**: se o projeto tem `processo/agentes/`, cada agente (a Lead, os especialistas) lê primeiro o seu harness ali e atua dentro dele: o harness manda; o que se consulta informa. A Lead coordena os especialistas, e cada especialista abre e coordena as suas Builders no Orca.
- **Método mais novo:** se a versão do método instalada (skill `metodo:consultar`) for maior que a "Versão do método" acima, sugira à pessoa rodar `/metodo:atualizar-projeto`.
- **Peça confirmação antes do que aciona um gatilho de aprovação** (seção Aprovações do `processo/DESENVOLVIMENTO.md`): publicar, apagar algo, reescrever histórico, integrar um PR com gatilho. Enviar a branch e abrir o PR fazem parte do fluxo; o PR sem gatilho, a Lead integra e registra. Nunca use `push --force`.
- **A `main` não tem proteção no GitHub** (repositório privado em conta gratuita; lição 019 do método). A regra "nunca commit direto na `main`" vale pela disciplina das sessões.

## Este projeto

- **Porta de entrada da identidade:** a passagem do repositório de identidade, [`docs/marca/04-passagem.md` de `CreateHubAI/identidadeFloway`](https://github.com/CreateHubAI/identidadeFloway/blob/main/docs/marca/04-passagem.md) (decisões, regras, lições e entregáveis C1 a C6). Esse repositório é **só leitura** daqui: nenhuma mudança de identidade nasce neste repositório; ela nasce lá, numa branch, com a autorização da pessoa.
- **Estrutura do site aprovada:** [`docs/superpowers/specs/2026-10-31-estrutura-site-design.md`](docs/superpowers/specs/2026-10-31-estrutura-site-design.md), com os protótipos de cada seção em `docs/superpowers/specs/prototipos-estrutura/`.
- **Referências:** o RayRay Lab (estrutura, efeitos e tempos medidos, auditoria no repositório de identidade) e, só para a esfera de partículas do contato e da 404, o auros.global. Nada das duas entra no repositório.
- **Monorepo:** hoje só `apps/site` é workspace. Os conceitos são páginas estáticas prontas em `apps/site/public/conceitos/<slug>/` (cinco geradas por `scripts/conceitos/gerar.sh` a partir de `CreateHubAI/sitesOfertas`; `landing-floway` escrita à mão), servidas em `/conceitos/<slug>/`, e o site não os importa. `apps/conceitos/` e `packages/` só voltam se um conceito precisar de build e testes próprios.
- **Antes de dizer que terminou:** `npm test`, `npm run check` e `npm run test:build` verdes na raiz, e a página olhada no navegador no desktop, no celular e com movimento reduzido. No máximo um build de teste por vez (porta 3100).

## Método de desenvolvimento

Atualização para o método 3.1.0, aprovada pela pessoa em 2026-11-02: o agente principal é o Codex. As regras desta seção substituem as indicações anteriores de ferramenta por tema e de coordenadora sempre Claude. O modo Orca e o modo com especialistas passam a valer sem o selo de rascunho; as descrições anteriores ficam preservadas como histórico. As decisões próprias do site continuam valendo.

- **Ferramenta por papel**: o projeto usa o Claude Code (lê este arquivo) e o Codex (lê o `AGENTS.md`, que manda ler este) juntos. A tabela Ferramenta por papel do `processo/DESENVOLVIMENTO.md` diz a de cada papel; no Orca, `--agent claude` ou `--agent codex`, conforme a tabela. A Builder vai para a outra ferramenta quando a cota aperta, com passagem pela issue (commit, branch enviada, comentário de onde parou). Todo PR recebe ao menos uma revisão da outra ferramenta. Mudar a tabela é uma decisão da pessoa.
- **Orquestração com o Orca**: se este projeto roda no Orca, a Lead coordena e cada agente supervisionado é uma Builder. A Lead usa o prompt `modelos/prompt-lead-orca.md` do método; os agentes nunca integram e perguntam à Lead com `orca orchestration ask`, nunca à pessoa; o que aciona um gatilho de aprovação (deploy, o irreversível, o merge com gatilho) passa por um portão que só a pessoa resolve; o resto a Lead decide e registra (seção Aprovações do `processo/DESENVOLVIMENTO.md`). Quando back e front são construídos em tarefas paralelas, o contrato da API é fechado e aprovado antes de qualquer tarefa de construção.
- **Com agentes especialistas**: se o projeto tem `processo/agentes/`, cada agente (a Lead, os especialistas) lê primeiro o seu harness ali e atua dentro dele: o harness manda; o que se consulta informa. A Lead coordena os especialistas, e cada especialista abre e coordena as suas Builders no Orca.
- **Ponytail** (rascunho, se estiver instalado): ele faz a menor mudança que resolve a tarefa inteira, e isso vale para a solução. **O TDD do método vale sobre o ponytail:** o teste novo é escrito antes e visto falhar, e a suíte, os tipos e o build fecham a tarefa; o "um teste pequeno" dele não basta. Spec, portões, revisão e validação não se cortam. Nível `full`; o `ultra` não é usado. Atalho deliberado leva `shortcut: <o limite>, <quando melhorar>` e vira pendência na memória. O nível vale por pasta: troque só na sessão (`/ponytail off`, `/ponytail full`) e nunca use `/ponytail default`, que muda todas as sessões do computador. Pedido vago passa pelo brainstorming ou por uma pergunta, nunca vira "a menor versão"; e o que os critérios de aceite, o contrato, o harness e as skills do método exigem conta como pedido, e não se corta.

- **Papéis:** a Lead é a sessão aberta pela pessoa na pasta principal (Claude Code, conforme a tabela Ferramenta por papel); especialistas e Builders seguem os respectivos harnesses, na ferramenta do papel. A Lead coordena e, sem gatilho de aprovação, integra e registra; as dúvidas de uma Builder sobem para quem a abriu, e a Lead fala com a pessoa. Decisão da pessoa em 2026-11-21: a Lead integra sozinha o PR sem gatilho (critérios da seção Aprovações do `processo/DESENVOLVIMENTO.md`) e só pede aprovação quando há gatilho. Publicar o site continua com a pessoa (marcas fictícias e INPI, decisão de 2026-11-09).

## Atualização para o método 6.0.0 · 2026-11-21

Aprovada pela pessoa em 2026-11-21 ("pode seguir"). Troca o agente único (Codex) pela tabela Ferramenta por papel do `processo/DESENVOLVIMENTO.md`, e as frases "um agente principal", "nunca as duas" e "coordenadora sempre Claude" acima ficam substituídas. As decisões próprias do site continuam valendo.

- **Requisitos e telas antes do código**: toda tarefa atende requisitos de `processo/requisitos.md` (R-xx). Com interface, nenhuma tela é codada sem estar aprovada pela pessoa e registrada em `processo/telas/` (captura, link do frame do Figma e `tokens.json`); o código segue a versão registrada. Mudança de tela começa no Figma, é aprovada e registrada, e só então vai para o código. Requisito ou tela nova passa pela pessoa.
- **Bugs** seguem o "Ciclo de um bug" do método (skill `metodo:consultar`): issue com o formulário de bug, triagem da Lead, teste que falha por causa do bug antes da correção. Bug achado **fora do escopo** da tarefa vira issue nova; não cresça a tarefa.

## Só Claude · 2026-11-22

Decisão da pessoa: "não utilize o codex, use somente o claude". Todas as sessões (Lead, especialistas, Builders e revisores) usam o Claude Code; o Codex não é aberto. Onde este arquivo, o `AGENTS.md` ou os harnesses falam em "revisão da outra ferramenta" ou em passar a Builder para o Codex, vale: revisão por uma sessão Claude de contexto limpo, e a Builder que fica sem cota para e deixa a passagem na issue. Tabela atualizada no `processo/DESENVOLVIMENTO.md`.
