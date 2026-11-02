# Instruções para as sessões deste projeto

Este arquivo é lido automaticamente por qualquer sessão do Claude Code aberta nesta pasta. Ele foi gerado pelo método de desenvolvimento; ajuste-o à medida que o projeto decidir.

Versão do método: 3.1.0

@docs/DESENVOLVIMENTO.md
@docs/memoria-do-projeto.md

## Como as sessões trabalham aqui

- **Responda em português.** Nomes de Skills, comandos e código ficam como são. Pronomes não declarados: use o neutro.
- **Consulte o método pela skill `metodo:consultar`** (plugin `metodo`): ela diz onde está a cópia do método e o que ler para cada fase, cenário ou dúvida. Se o plugin não estiver instalado, peça à pessoa.
- **Siga as fases do método** e diga qual Skill está usando: `superpowers:brainstorming` antes de criar ou reestruturar, `superpowers:test-driven-development` para implementar, `superpowers:systematic-debugging` para bugs e `superpowers:verification-before-completion` antes de dizer "pronto".
- **Comece lendo a memória** (`docs/memoria-do-projeto.md`) e atualize-a ao fim de cada fase, numa branch, junto com o trabalho da fase.
- **O método é só leitura.** Nunca altere a cópia do método. Uma lição nova vira nota na memória e é levada ao método na Fase 9.
- **Orquestração com o Orca** (modo em rascunho): se este projeto roda no Orca, a coordenadora é a integradora e cada agente supervisionado é uma trabalhadora. A coordenadora é sempre Claude. Os agentes são Claude (`--agent claude`); no back, podem ser Codex (`--agent codex`) se o projeto tiver o `AGENTS.md`, que é o arquivo que o Codex lê. Com o back no Codex, o contrato da API é fechado e aprovado antes de qualquer tarefa de construção. A coordenadora usa o prompt `modelos/prompt-coordenadora-orca.md` do método; os agentes nunca integram e perguntam à coordenadora com `orca orchestration ask`, nunca à pessoa; merge e deploy passam por um portão que só a pessoa resolve.
- **Com agentes especialistas** (modo em rascunho): se o projeto tem `docs/agentes/`, cada agente (a integradora, os especialistas) lê primeiro o seu harness ali e atua dentro dele: o harness manda; o que se consulta informa. A integradora coordena os especialistas, e cada especialista abre e coordena as suas trabalhadoras no Orca.
- **Método mais novo:** se a versão do método instalada (skill `metodo:consultar`) for maior que a "Versão do método" acima, sugira à pessoa rodar `/metodo:atualizar-projeto`.
- **Peça confirmação antes de ações externas ou irreversíveis:** push, abrir ou integrar PR, deploy, apagar algo, reescrever histórico. Nunca use `push --force`.
- **A `main` não tem proteção no GitHub** (repositório privado em conta gratuita; lição 019 do método). A regra "nunca commit direto na `main`" vale pela disciplina das sessões.

## Este projeto

- **Porta de entrada da identidade:** a passagem do repositório de identidade, [`docs/marca/04-passagem.md` de `CreateHubAI/identidadeFloway`](https://github.com/CreateHubAI/identidadeFloway/blob/main/docs/marca/04-passagem.md) (decisões, regras, lições e entregáveis C1 a C6). Esse repositório é **só leitura** daqui: nenhuma mudança de identidade nasce neste repositório; ela nasce lá, numa branch, com a autorização da pessoa.
- **Estrutura do site aprovada:** [`docs/superpowers/specs/2026-10-31-estrutura-site-design.md`](docs/superpowers/specs/2026-10-31-estrutura-site-design.md), com os protótipos de cada seção em `docs/superpowers/specs/prototipos-estrutura/`.
- **Referências:** o RayRay Lab (estrutura, efeitos e tempos medidos, auditoria no repositório de identidade) e, só para a esfera de partículas do contato e da 404, o auros.global. Nada das duas entra no repositório.
- **Monorepo:** `apps/site` (o site oficial), `apps/conceitos/<nome>` (um conceito por pasta, com testes e build próprios) e `packages/` (configuração e utilitários de teste comuns). O site nunca importa de `apps/conceitos`.
- **Antes de dizer que terminou:** `npm test`, `npm run check` e `npm run test:build` verdes na raiz, e a página olhada no navegador no desktop, no celular e com movimento reduzido. No máximo um build de teste por vez (porta 3100).

## Método de desenvolvimento

Atualização para o método 3.1.0, aprovada pela pessoa em 2026-11-02: o agente principal é o Codex. As regras desta seção substituem as indicações anteriores de ferramenta por tema e de coordenadora sempre Claude. O modo Orca e o modo com especialistas passam a valer sem o selo de rascunho; as descrições anteriores ficam preservadas como histórico. As decisões próprias do site continuam valendo.

- **Um agente principal**: este projeto usa uma ferramenta só, a da linha `Agente principal:` do `docs/DESENVOLVIMENTO.md`: Claude Code (lê este arquivo) ou Codex (lê o `AGENTS.md`, que manda ler este). Todas as sessões usam a mesma, nunca as duas: no Orca, `--agent claude` ou `--agent codex`, conforme essa linha. Trocar de ferramenta é uma decisão da pessoa.
- **Orquestração com o Orca**: se este projeto roda no Orca, a coordenadora é a integradora e cada agente supervisionado é uma trabalhadora. A coordenadora usa o prompt `modelos/prompt-coordenadora-orca.md` do método; os agentes nunca integram e perguntam à coordenadora com `orca orchestration ask`, nunca à pessoa; merge e deploy passam por um portão que só a pessoa resolve. Quando back e front são construídos em tarefas paralelas, o contrato da API é fechado e aprovado antes de qualquer tarefa de construção.
- **Com agentes especialistas**: se o projeto tem `docs/agentes/`, cada agente (a integradora, os especialistas) lê primeiro o seu harness ali e atua dentro dele: o harness manda; o que se consulta informa. A integradora coordena os especialistas, e cada especialista abre e coordena as suas trabalhadoras no Orca.
- **Ponytail** (rascunho, se estiver instalado): ele faz a menor mudança que resolve a tarefa inteira, e isso vale para a solução. **O TDD do método vale sobre o ponytail:** o teste novo é escrito antes e visto falhar, e a suíte, os tipos e o build fecham a tarefa; o "um teste pequeno" dele não basta. Spec, portões, revisão e validação não se cortam. Nível `full`; o `ultra` não é usado. Atalho deliberado leva `shortcut: <o limite>, <quando melhorar>` e vira pendência na memória. O nível vale por pasta: troque só na sessão (`/ponytail off`, `/ponytail full`) e nunca use `/ponytail default`, que muda todas as sessões do computador. Pedido vago passa pelo brainstorming ou por uma pergunta, nunca vira "a menor versão"; e o que os critérios de aceite, o contrato, o harness e as skills do método exigem conta como pedido, e não se corta.

- **Papéis no Codex:** a sessão aberta pela pessoa na pasta principal é a coordenadora (integradora); especialistas e trabalhadoras seguem os respectivos harnesses. A proibição de integrar dirigida aos agentes supervisionados continua valendo; só a integradora pode integrar, com o "pode integrar" da pessoa. As dúvidas de uma trabalhadora sobem para quem a abriu; a coordenadora fala com a pessoa.
