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
