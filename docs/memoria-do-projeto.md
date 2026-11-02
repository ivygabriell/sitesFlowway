# Memória do projeto

A memória do projeto é o que a próxima sessão precisa saber para não recomeçar do zero. Guarde no mecanismo de memória do Claude Code ou em um `CLAUDE.md` na raiz. **Regra:** guarde o que não dá para descobrir lendo o código ou o histórico (decisões, preferências, pendências, lições), e nunca dados sensíveis.

## O que guardar

| Tipo | Exemplos |
|---|---|
| **Quem é a pessoa e como trabalha** | Idioma das respostas; quer o fluxo Superpowers; corrige por mensagens curtas, então confirme a interpretação com evidência antes de entregar |
| **Fluxo combinado** | Uma branch por mudança; enviar a branch antes de integrar; só a integradora integra; Skills em todo cenário; proteção da `main` ativa |
| **Decisões do projeto** | Público-alvo, estrutura aprovada, paleta, o que não pode mudar, o que ficou de fora e por quê |
| **Estado** | O que está integrado, o que está em andamento, o endereço do repositório, os comandos de teste |
| **Pendências** | Lista curta e viva, com a decisão que cada uma espera |
| **Lições** | Regras que vieram de um erro (por exemplo, "achar a seção pelo título exato") |
| **Tarefas e retrabalho** | Por tarefa: a issue, o especialista (no modo com especialistas), o agente que fez (Claude ou Codex), se houve retrabalho e por quê, e o consumo. É a medida dos modos na Fase 9 |
| **Referências** | Onde estão a spec, o plano, o painel de tarefas e a referência estudada |

## O que NÃO guardar

- E-mail, telefone, tokens, chaves e senhas.
- O que já está no código ou no histórico do Git (estrutura de arquivos, quem mudou o quê).
- Detalhes que só valem para a conversa de hoje.

## Gabarito

```markdown
---
name: nome-curto-do-projeto
description: uma linha que diga para que serve esta memória
type: project
---

Estado (AAAA-MM-DD): o que está integrado e onde (repositório, branch principal, comandos de teste).

Decisões da pessoa: ...

Pendências (em aberto):
- ...

Tarefas (issue · especialista · agente · retrabalho · consumo):
- #N · back-e-dados · codex · sem retrabalho · consumo da sessão

**Why:** por que esta memória existe.
**How to apply:** como usar nas próximas sessões.
```

Mantenha **uma linha por memória** no índice (`MEMORY.md`), com um gancho que diga quando ela é relevante, e atualize ou apague memórias que ficaram erradas.

## Estado do projeto

**2026-10-31 · Fases 0 a 2 e C1**

- **O que é:** o site oficial da Floway (empresa de tecnologia B2B: landing pages, sites institucionais e automações, com a oferta crescendo) e os sites de portfólio ("conceitos"), num repositório só (`CreateHubAI/siteOficialFloway`, privado). Identidade decidida no repositório `CreateHubAI/identidadeFloway` (só leitura daqui).
- **Estrutura aprovada (2026-10-31):** [spec](superpowers/specs/2026-10-31-estrutura-site-design.md), decidida seção por seção com protótipos no navegador. Destaques: sem página por oferta (o lençol "(O que entregamos)" lista as capacidades); hero com a palavra FLOWAY com glitch sob lâminas de vidro; esfera de letras FLOWAY que vira o "F" no contato e na 404; contato por conversa com IA (Gemini, montada depois; até lá, formulário simples); público B2B, nichos só como setor nos conceitos.
- **Identidade revista (2026-10-31):** PR #20 do repositório de identidade, integrado em `ec93f7b` (palavra no hero, símbolo em partículas, auros.global como exceção de referência só para a esfera).
- **C1 (2026-10-31):** monorepo com o método 2.12.0; o código de `identidadeFloway@2e0c5fa` copiado para `apps/site` (sem os testes do manual, que leem documentos que ficaram lá, e sem o `vercel.json`, que a construção escreve em E2); `noindex` ligado; os três comandos verdes.
- **Pendências:** a página Trabalho e os cases (quando houver projetos); o modelo de case (rascunho na spec); a lista de conceitos; os textos de C2 (trechos da abertura, intro do hero, descritor do cabeçalho, buscadores, privacidade, inglês); o roteiro da IA do contato; a publicação (C5).
- **Como a pessoa trabalha:** aprova vendo protótipos HTML interativos, uma seção por vez; manda a própria copy e pede textos "menores e mais clean"; quer a referência seguida à risca, adaptada à identidade.
- **Lições do modo com especialistas (2026-10-31, para a Fase 9):** (1) quando uma trabalhadora já mandou `worker_done`, um pedido de correção precisa de um despacho novo; mensagem não basta, e o Orca recusa `--terminal` em helper, então entra um agente novo na mesma worktree. (2) Um especialista pode ficar esperando sem ler a própria caixa; a integradora destrava com `orca terminal send` no terminal dele. (3) Os sinais de vida chegam aos milhares; a integradora consome as entregas só com sinal de vida e para na primeira mensagem real. (4) No CI, o `next/font` falhou de forma passageira num PR só de documentos (lição 6 da passagem); rodar de novo resolveu.
- **Onde parou (2026-11-01):** integrados na `main` os PRs #12 (Base, issue #2), #13 (manifesto e cubo, #4) e #14 (abertura e hero, #3). Em construção: #5 (lençol) e #6 (trabalhos em destaque). Na fila: #7 (esfera) e #15 (hero mais legível, pedido da pessoa, com critério medido contra o RayRay), depois #8 e #9. Decisões: npm audit aceito com registro (decisão 006 em `docs/arquitetura.md`, issue #11 do Vitest 4 para depois); a pessoa autorizou integrar o que estiver validado. Para C5: `metadataBase` com o domínio. Para a montagem (#9): seletor de língua no celular e 404 sem JavaScript. Servidor local da `main` para a pessoa acompanhar: http://localhost:3200.
- **Tarefas (issue · especialista · agente · retrabalho):** #2 · Design e Front · Claude · 1 retrabalho (achado da Segurança na transição e ressalvas R1/R3 da Arquitetura); #4 · Design e Front · Claude · sem retrabalho; #3 · Design e Front · Claude · só o merge da `main` (conflito trivial no índice de textos). O consumo por tarefa não foi medido (o limite de uso de 5 horas parou todos os agentes uma vez).
- **Contato, bugs e celular (2026-11-01):** na branch `claude/bugs-cta-celular-46e8c1`, sem push: `/contato`, `/en/contact`, `/privacidade`, `/en/privacy` e a rota `/api/contato` ([spec](superpowers/specs/2026-11-01-bugs-cta-celular-design.md)). **Pendência da pessoa: escolher o serviço de e-mail e o destino;** até lá `entregarPedido` responde falha de propósito, e isso bloqueia publicar. Ainda faltam a esfera formando 404 e a página Trabalhos.
- **Lição:** a Início não suporta remontar no cliente (o ScrollTrigger recoloca a rolagem num ponto errado). A transição navega por documento inteiro, e o site restaura o lugar pelo `sessionStorage`. No teste, `FormData` do jsdom não passa pelo `Request` do Node.

## Atualização do método · 2026-11-02

- Atualizado para o método `3.1.0` em `2026-11-02`: a pessoa escolheu **Codex** como agente principal de todas as sessões e aprovou a substituição dos sete harnesses pelos modelos atuais, mantendo o cenário `site-estatico`, os comandos, o CI e as decisões próprias do site. As regras antigas de ferramenta por tema ficam como histórico, substituídas pelas seções de atualização do `CLAUDE.md`, do `AGENTS.md` e do `DESENVOLVIMENTO.md`.
- A referência instalada passou de 3.0.0 para 3.1.0 durante a retomada. Os harnesses incluem a leitura das lições, as skills de cada papel, a segurança até a publicação e as regras de consumo. **Ponytail no Codex fica só sob demanda**, sem instalação nem ativação nesta atualização; a auditoria completa de segurança continua dependendo de aprovação própria.

## Retomada e direção das correções · 2026-11-02

- A pessoa pediu concluir a atualização local do método para destravar o planejamento das correções. A referência `3.1.0` foi gerada com `--especialistas --agente codex site-estatico`; os sete harnesses foram conferidos contra ela. Os harnesses de Back e Dados, Design e Front e DevOps receberam um acréscimo que aplica a decisão do `AGENTS.md` sobre Ponytail sob demanda no Codex. O CI e os comandos do projeto foram preservados; o repositório já está registrado no Orca.
- **Estado que substitui as anotações anteriores de andamento:** o contato da Início (PR #23) e a página de contato com correções de celular e rolagem (PR #24) já estão integrados na `main`, em `66b71e1`. As issues #9 (montagem), #22 (efeito do hero) e #11 (Vitest 4) seguem abertas na revisão desta retomada. Há trabalho não integrado na worktree `front-22-hero-efeito`, que deve ser preservado e reconciliado com a versão atual antes de qualquer implementação do hero.
- **Direção confirmada pela pessoa para o hero:** preservar o F de vidro, deixando-o menor e mais reconhecível como F. Essa decisão orienta o próximo desenho de correção e substitui a escolha entre retornar às três lâminas ou manter o F; tamanho e posicionamento finais ainda precisam de conferência visual. Não aplicar automaticamente o critério antigo da #22 de cobrir a palavra inteira, que precisa ser reconciliado com essa direção. A identidade continua tendo o próprio repositório como fonte; nenhuma alteração nos arquivos da marca foi autorizada aqui.
- **Pendências para o planejamento:** corrigir a fixação da galeria quando a fileira cabe na tela, revalidar as telas largas e baixas, concluir a 404 com partículas e a página Trabalhos, fechar C2 e as traduções, documentar a API do contato e conectar o serviço de e-mail. IA real, cases e publicação continuam em suas etapas próprias. Os testes da revisão passaram (170 unitários, tipos e lint, build e 78 testes de navegador); isso não substitui a comparação visual com o desenho aprovado, que ficou pendente por indisponibilidade do navegador conectado.
