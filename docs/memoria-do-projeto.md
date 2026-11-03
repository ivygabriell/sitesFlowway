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
- **Correção pedida na validação do PR #25:** o CI mediu 23,1% de pixels escuros no hero desktop, abaixo do aceite de 25%. Um teste novo com quadros de 700 ms reproduziu a entrada incompleta (0% de pixels escuros após a mesma espera), enquanto o teste normal passou. A entrada do hero passa a seguir o tempo real em sua própria timeline pausada, avançada por `performance.now()` e com o callback removido ao terminar ou desmontar. O relógio global do GSAP fica intacto, evitando disputa com a transição de página (ressalva levantada na revisão independente). O limiar de legibilidade permanece igual; reduzir e reposicionar o F continua sendo uma correção visual posterior.
- **Validação local dessa correção:** 170 testes unitários, tipos e lint, build e 79 testes de navegador passaram. O teste de quadros lentos mediu 30,1% de pixels escuros e p10 de 0,071; a revisão independente aprovou a correção final do relógio da entrada.

## Rodada de correções · 2026-11-03

- **Pasta principal:** permanece na `main`, limpa, em `3c0993c`, após integrar o PR #25. CI da main aprovado no run `41534043798`; as correções abaixo são entregas locais em branches próprias, ainda sem push, PR ou integração. A worktree antiga `front-22-hero-efeito` foi preservada, somente lida.
- **Decisão da pessoa:** não usar o agente de Produto nesta rodada. Ele foi apagado e não deve ser recriado. Design e Front assume diretamente a revisão do contato a partir da spec 4.6 e do protótipo 12 já aprovados; não espera um relatório de Produto.
- **#26 · Design e Front · Codex:** correção da galeria entregue em `ivygabriell/front-26-galeria-correcao`, commit `8fd8b19`. Quando os quatro cartões cabem, a seção acompanha a rolagem vertical, sem pin ou barra de percurso; rótulo alinhado e vão de 3vw mantidos. A integradora reproduziu independentemente o teste novo contra a main original (300 px esperados, 0 observados) e validou a correção com 170 unitários, tipos/lint, build e 82 E2E, todos com saída 0. Sem achado bloqueante na revisão Design e Front. Limite: os dados atuais não têm capas reais; hover/shader com capas não foi explorado visualmente. CI da branch aguarda publicação.
- **#22 · Design e Front · Codex, fase 1:** proposta do F inteiro e menor em `ivygabriell/front-22-hero-prototipo`, commit `ae2145e`; spec `2026-11-02-hero-f-correcao-design.md` e HTML `prototipos-correcao/hero-f.html`, sob `docs/superpowers/specs/`. Duas escalas A/B em 1440×900, 1883×703 e 390×844, com quatro paths oficiais idênticos. Capturas e controles/reduzido/fallback conferidos. As medidas de pixels do SVG são diagnóstico da maquete, não prova do WebGL. Escala, posição e relação com as faixas aguardam conferência visual da pessoa; não houve alteração do hero de produção nem fechamento da #22.
- **#28 · Arquitetura · Codex:** contrato observado, sem mudança de interface, em `ivygabriell/arquitetura-correcao`, commit `508b761`, somente `docs/contrato-api.md` e `docs/referencias/arquitetura.md`. Documenta validação, respostas JSON/303, limite em memória por instância e entrega deliberadamente indisponível; não aprova uma API de conversa.
- **#29 · Segurança · Codex:** orientação estática em `ivygabriell/seguranca-correcao`, commit `d0c9d6a`, somente `docs/seguranca.md`. Nenhuma vulnerabilidade confirmada nesta leitura, cinco perguntas `needs_validation`, sem aceitação de risco nem auditoria completa. Confirmar proxy/limites HTTP, futura entrega, privacidade e ambiente antes da publicação.
- **Contato, direção preservada:** o alvo B tem esfera e entrada centrais com atalhos; primeira mensagem abre conversa à esquerda e desloca esfera à direita. A implementação atual é o formulário temporário sem IA, com quatro campos desde a entrada; faltam conversa, resumo/confirmação e vínculo do F ao sucesso real. A Início mantém CTA para a página, sem conversa no rodapé. Falha com JS preserva campos; o retorno 303 sem JS não os repõe, e uma correção exige estratégia de contrato segura, sem dados pessoais na URL. Não publicar respostas simuladas nem confundir sucesso interceptado em teste com entrega real.
- **#27/#30 · Design e Front · Codex:** plano entregue em `ivygabriell/design-e-front-correcao`, commit final `da8ec8d`; contato documental em `ivygabriell/front-27-contato-b-prototipo`, commit `0d7c1a4`, somente spec `2026-11-02-contato-b-correcao-design.md` e HTML `prototipos-correcao/contato-b.html`, sob `docs/superpowers/specs/`. Inspecionados oito estados nos três formatos, com teclado/reduzido/sem JS/sem WebGL e repetição dos estados móveis após ajuste. A revisão identificou sobrescrita da mensagem editada/apagada ao retornar à alternativa; o defeito do protótipo foi reproduzido e corrigido. A integradora leu a spec e conferiu capturas desktop/móvel e composição contra a fonte aprovada, sem bloqueante documental. Fontes substitutas, esfera esquemática e altura do artefato não comprovam o encaixe do produto em uma tela. Sem alteração do app. IA real, roteiro, contrato de conversa, serviço/destino de entrega, privacidade e traduções continuam em suas etapas próprias. A indisponibilidade da entrega continua bloqueando a publicação.
- **Pendências seguintes:** conferir os protótipos de hero/contato antes de produto; abrir PRs e obter os portões próprios de integração; concluir a 404 em partículas, Trabalhos, C2/traduções e a montagem #9. Upgrade do Vitest #11, integração real do contato e publicação continuam separados.
- **Retomada e consumo:** processos foram encerrados antes da entrega e retomados nas mesmas tarefas/worktrees, sem descartar diffs nem duplicar implementação. A nova tentativa de um especialista não pôde recuperar suas filhas antigas; a integradora retomou as tarefas existentes e encaminhou os resultados para revisão. O vermelho da galeria foi preservado/reproduzido e o macro interrompido foi refeito. Tokens/custo não foram expostos pelas ferramentas; não foram estimados. Ponytail `full` foi ativado por instrução da sessão, sem instalação ou mudança de configuração global; TDD, revisão e validação foram mantidos.
- **Encerramento dos agentes:** a pessoa pediu fechar os agentes que não estão sendo utilizados. Depois da entrega aceita, não deixar agentes concluídos abertos sem tarefa. Conferir o resultado efetivo: `worker-release` pode retornar `retained` por `user_takeover` sem encerrar o processo. Nesta rodada, o fechamento explícito das sessões ociosas foi autorizado pela pessoa, preservando branches, worktrees e arquivos; a coordenadora permanece na main.
