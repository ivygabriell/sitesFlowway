# Instruções para os agentes Codex deste projeto

Este arquivo é lido automaticamente pelo Codex. Ele foi gerado pelo método de desenvolvimento e vale junto com o `CLAUDE.md`: as regras são as mesmas para o Codex e para o Claude. Quem mudar um dos dois confere o outro.

O projeto usa o Claude Code e o Codex juntos: cada papel tem a sua ferramenta na tabela **Ferramenta por papel** do `processo/DESENVOLVIMENTO.md` (a Lead fica no Claude Code; Backend, Security e Ops costumam ficar no Codex). Uma Builder Codex pode também ter sido aberta por um papel do Claude, quando a cota dele apertou: a issue diz a ferramenta e, numa passagem, onde a outra parou. Se o seu papel não está no Codex e nada na issue explica, avise quem abriu você e pare.

Versão do método: 6.0.0

## Antes de começar

Leia, nesta ordem: `CLAUDE.md`, `processo/DESENVOLVIMENTO.md` e `processo/memoria-do-projeto.md`. As regras do `CLAUDE.md` valem para você como se estivessem aqui.

## Como você trabalha aqui

- **Responda em português.** Nomes de Skills, comandos e código ficam como são. Pronomes não declarados: use o neutro.
- **Consulte o método pela skill `metodo:consultar`** (plugin `metodo`). Se o plugin não estiver instalado no Codex, avise a Lead com `orca orchestration ask`; ela leva à pessoa. Não fale direto com a pessoa nem instale nada.
- **Use as Skills e diga qual está em uso:** `superpowers:test-driven-development` para implementar (o teste novo é escrito primeiro e visto falhar pelo motivo certo), `superpowers:systematic-debugging` para bugs e `superpowers:verification-before-completion` antes de dizer "pronto".
- **Se você é a Lead** (aberta pela pessoa na pasta principal): siga o prompt `modelos/prompt-lead-orca.md` do método (pela skill `metodo:consultar`) ou, no modo com especialistas, o harness `processo/agentes/lead.md`. Você é a única que integra: sem gatilho de aprovação, sozinha; com gatilho, só com o "pode integrar" da pessoa. Abre cada agente na ferramenta do papel dele (tabela Ferramenta por papel).
- **Se você é uma Builder**, faça só a tarefa recebida, nos arquivos permitidos dela. Dúvidas vão para a Lead com `orca orchestration ask`, nunca para a pessoa.
- **Com agentes especialistas**: se você foi aberto como especialista, leia primeiro o seu harness em `processo/agentes/` e atue dentro dele; se é uma Builder, siga a tarefa e as regras do harness de quem a abriu. Dúvidas vão para quem a abriu, com `orca orchestration ask`.
- **Contrato da API.** Se o projeto tem um contrato (por exemplo, `processo/contrato-api.md`), siga-o. Se a tarefa pedir algo que o contrato não prevê, pare e pergunte à Lead; não mude o contrato numa tarefa de construção.
- **Uma tarefa, uma branch, um PR.** Ao terminar: traga a `main` (`git fetch origin && git merge origin/main`), rode a suíte completa, os tipos e o build, envie a branch e abra o PR com o modelo, escrevendo `Closes #<N>`.
- **Se você não é a Lead, nunca integre** na `main`. Ninguém usa `push --force` nem reescreve histórico sem a pessoa.
- **O método é só leitura.** Uma lição nova vira nota para a Lead e vai para a memória do projeto.

## Método de desenvolvimento

Atualização para o método 3.1.0, aprovada pela pessoa em 2026-11-02. As regras desta seção substituem a identificação de todo Codex como trabalhadora e a escolha de ferramenta por tema. A proibição de integrar acima aplica-se às trabalhadoras e aos especialistas; a coordenadora só integra com o "pode integrar" da pessoa. Os modos Orca e com especialistas valem sem o selo de rascunho. As demais regras e decisões do projeto continuam valendo.

O projeto usa o Claude Code e o Codex juntos: cada papel tem a sua ferramenta na tabela **Ferramenta por papel** do `processo/DESENVOLVIMENTO.md` (a Lead fica no Claude Code; Backend, Security e Ops costumam ficar no Codex). Uma Builder Codex pode também ter sido aberta por um papel do Claude, quando a cota dele apertou: a issue diz a ferramenta e, numa passagem, onde a outra parou. Se o seu papel não está no Codex e nada na issue explica, avise quem abriu você e pare.

- **Leitura inicial:** leia, nesta ordem, `CLAUDE.md`, `processo/DESENVOLVIMENTO.md` e `processo/memoria-do-projeto.md`; no modo com especialistas, leia também o harness do seu papel em `processo/agentes/`.
- **Consulte o método pela skill `metodo:consultar`** (plugin `metodo`). Se o plugin não estiver instalado no Codex, avise quem abriu você com `orca orchestration ask` (a Lead leva à pessoa; se você é a Lead, avise a pessoa). Não instale nada.
- **Se você é a Lead** (aberta pela pessoa na pasta principal): siga o prompt `modelos/prompt-lead-orca.md` do método (pela skill `metodo:consultar`) ou, no modo com especialistas, o harness `processo/agentes/lead.md`. Você é a única que integra: sem gatilho de aprovação, sozinha; com gatilho, só com o "pode integrar" da pessoa. Abre cada agente na ferramenta do papel dele (tabela Ferramenta por papel).
- **Se você é uma Builder**, faça só a tarefa recebida, nos arquivos permitidos dela. Dúvidas vão para a Lead com `orca orchestration ask`, nunca para a pessoa.
- **Com agentes especialistas**: se você foi aberto como especialista, leia primeiro o seu harness em `processo/agentes/` e atue dentro dele; se é uma Builder, siga a tarefa e as regras do harness de quem a abriu. Dúvidas vão para quem a abriu, com `orca orchestration ask`.
- **Ponytail** (rascunho, se estiver instalado): a menor mudança que resolve a tarefa inteira vale para a solução. **O TDD do método vale sobre o ponytail:** o teste novo é escrito antes e visto falhar; o "um teste pequeno" dele não basta. Spec, portões, revisão e validação não se cortam. Nível `full`; o `ultra` não é usado. Atalho deliberado leva `shortcut: <o limite>, <quando melhorar>`. **No Codex, o ponytail fica só sob demanda** (`$ponytail:ponytail-review`, `$ponytail:ponytail-audit`, `$ponytail:ponytail-debt`), sem os ganchos que o deixam sempre ligado: nos modelos de raciocínio ele pode encarecer em vez de economizar. Ligar de vez é decisão da pessoa, depois de medir. No Codex, **não carregue a skill `ponytail` por conta própria**: use só os comandos de revisão, auditoria e dívida quando o harness ou a Lead pedirem. Nunca use `/ponytail default`, que muda todas as sessões do computador. Pedido vago passa pelo brainstorming ou por uma pergunta, nunca vira "a menor versão"; e o que os critérios de aceite, o contrato, o harness e as skills do método exigem conta como pedido, e não se corta.

## Atualização para o método 6.0.0 · 2026-11-21

Aprovada pela pessoa em 2026-11-21. Substitui a regra de um agente principal só (Codex) e a de que "se diz Claude Code, você não deveria estar trabalhando aqui": agora vale a tabela Ferramenta por papel do `processo/DESENVOLVIMENTO.md`. Neste projeto, o merge na `main` continua só com o "pode integrar" da pessoa (ver o `CLAUDE.md`).

- **Requisitos e telas antes do código**: toda tarefa atende requisitos de `processo/requisitos.md` (R-xx). Com interface, nenhuma tela é codada sem estar aprovada pela pessoa e registrada em `processo/telas/` (captura, link do frame do Figma e `tokens.json`); o código segue a versão registrada. Mudança de tela começa no Figma, é aprovada e registrada, e só então vai para o código. Requisito ou tela nova passa pela pessoa.
