# Correções da Início — plano da primeira onda

> **For agentic workers:** a execução já foi autorizada pela pessoa e é supervisionada por `orca orchestration worker-start` no mesmo Run. No modo Orca, a coordenação segue o harness e `metodo:consultar` (`nucleo/03-skills-e-testes.md`, Skills fora dos agentes); não criar outra Run nem substituir por subagentes internos.

**Goal:** propor um F de vidro menor e reconhecível, corrigir a galeria sem percurso e reconciliar o contato com a disposição B aprovada.

**Architecture:** Design e Front coordena e revisa, sem construir produto na sua worktree. Duas trabalhadoras Codex independentes, em filhas novas de `origin/main`, entregam respectivamente desenho do hero e correção da galeria. Após uma delas concluir, uma nova filha entrega somente o protótipo do contato B; a revisão documental é feita diretamente por Design e Front, e produto depende de novo despacho.

**Tech Stack:** Next.js 15.5, React 19, GSAP, Three.js/R3F, Vitest e Playwright existentes; HTML local para o protótipo.

**Spec:** `docs/superpowers/specs/2026-10-31-estrutura-site-design.md`, seções 4.3 e 4.6; issues [#30](https://github.com/CreateHubAI/siteOficialFloway/issues/30), [#22](https://github.com/CreateHubAI/siteOficialFloway/issues/22), [#26](https://github.com/CreateHubAI/siteOficialFloway/issues/26) e [#27](https://github.com/CreateHubAI/siteOficialFloway/issues/27), com a direção confirmada em 2026-11-02 prevalecendo sobre a antiga cobertura integral da palavra.

## Limites globais

- Agente principal Codex; duas trabalhadoras no máximo, `--agent codex --model gpt-6.1-sol --effort medium`. Mesma Run, profundidade necessária 2; se o Orca recusar, guardar recibo e perguntar à integradora, sem contorno.
- Especialista altera somente este plano. Cada trabalhadora fica nos arquivos da sua tarefa; sem produto do contato, esfera, CSS compartilhado, marca, dependências, CI, memória ou instruções. O desenho do contato tem somente os dois arquivos novos autorizados abaixo.
- Worktree antiga `front-22-hero-efeito`: somente leitura, sem descartar trabalho.
- Sem IA simulada para visitantes, integração Gemini, escolha de serviço de e-mail ou promessa comercial.
- Teste de comportamento novo falha antes do código de produção; geometria deve ser observada no navegador, sem mock que apenas repita a conta da implementação.
- Antes de qualquer build ou Playwright, pedir slot da porta **3100** à integradora. Um por vez na máquina; não mudar porta para contornar fila. Inicialmente reservado à QA da main.
- `npm test`, `npm run check` e `npm run test:build` na raiz para a correção de produto. Documentação/protótipo exige inspeção e medidas próprias, sem anunciar equivalência com WebGL de produção.
- Uma branch por tarefa; nenhuma integração, histórico reescrito ou push forçado. A integradora confirmou entrega **local** nesta rodada: commit e descrição conforme `.github/pull_request_template.md`, sem push, PR ou comentário no GitHub. Na galeria, preparar `Closes #26`; no hero, referenciar #22 sem encerrar a correção de produto na fase 1. A descrição deste plano referencia #30.

## Foco da revisão

1. Tela larga e baixa (1883×703): galeria que cabe não prende nem mostra percurso; F inteiro, sem recorte acidental.
2. Excedente real (1440×900): conservar acesso ao último cartão, pin e barra de 29 traços, sem mudar o vão de 3vw.
3. Celular (390×844) e tablet: conteúdo e foco visíveis, sem rolagem lateral; F proporcional.
4. Movimento reduzido e ausência de WebGL: conteúdo legível, sem seção presa no reduzido nem efeito obrigatório para entender a tela.
5. Contato: estados têm fontes e dependências explícitas; formulário temporário não se apresenta como conversa de IA nem substitui silenciosamente o desenho B.

## Tarefa 1 — hero #22, fase 1: desenho para conferência

**Dona:** trabalhadora `front-22-hero-prototipo`; Design e Front revisa.

**Arquivos exclusivos:** criar `docs/superpowers/specs/2026-11-02-hero-f-correcao-design.md` e `docs/superpowers/specs/prototipos-correcao/hero-f.html`. Nenhum arquivo de produto.

**Entradas:** direção atual da pessoa (preservar o F de vidro menor e reconhecível), SVG oficial local e trabalho não integrado da worktree antiga. **Saída:** proposta visual, medidas sugeridas e origem dos paths, sem escala final aprovada.

- [ ] Ler a worktree antiga somente por inspeção de arquivos/diff; registrar o que é reaproveitável e o que permanece preservado.
- [ ] Inspecionar o SVG oficial e seu viewBox/paths; usar as mesmas proporções, sem redesenhar vetores nem adicionar referência externa.
- [ ] Produzir HTML local com F inteiro, vidro e FLOWAY legível em 1440×900, 1883×703 e 390×844; registrar largura, altura, posição, margem e origem dos paths na spec da correção.
- [ ] Inspecionar visualmente os três tamanhos, reduzido e fallback sem WebGL. Se usar Playwright, aguardar slot; anexar apenas capturas da tela alterada por mensagem.
- [ ] Manter os limites de produção de **≥25% de pixels escuros e p10≤0,25**. Diferenciar medição do mockup da futura medição do shader; HTML não comprova o efeito real.
- [ ] Conferir `git diff --check` e lista de arquivos; entregar proposta à integradora para conferência da pessoa. Preparar descrição com referência à #22 e escopo fase 1; não declarar a correção de produção concluída.

**Aceite:** F inteiro e proporcional nos três tamanhos, efeito de vidro representado, medidas auditáveis e decisões finais explicitamente pendentes. **Portão:** terminar e idlar; somente novo despacho após a conferência autoriza escala final e produto.

## Tarefa 2 — galeria #26: não prender sem percurso

**Dona:** trabalhadora `front-26-galeria-correcao`; Design e Front revisa.

**Arquivos exatos previstos:** `apps/site/src/componentes/capitulos/Capitulos.tsx`, `apps/site/src/componentes/capitulos/estilo.css`, `apps/site/tests/e2e/capitulos.spec.ts`; `apps/site/tests/unit/capitulos.test.tsx` se houver comportamento unitário pertinente. A issue também permite demais arquivos em `componentes/capitulos/**` e utilitário exclusivo de teste da galeria, somente se necessário e identificado na entrega.

**Entradas:** largura real da fileira, viewport, modo atual e trabalhos existentes. **Saída:** mesma galeria e conteúdo, com fixação e indicador apenas quando há percurso horizontal.

- [ ] Ler todos os usos dos elementos alterados e reproduzir em 1883×703 após obter o slot. Escrever primeiro teste `galeria sem excedente não prende nem mostra indicador`: quatro cartões dentro da tela, sem pin/spacer de percurso e topo da seção avançando com a rolagem. Executá-lo contra o código atual e guardar falha pela fixação real.
- [ ] Corrigir a decisão de fixar no componente compartilhado da galeria; manter cartões e informações centrados quando cabem. Preservar estados de revelação/hover e acessibilidade; barra ausente quando não há percurso.
- [ ] Executar o teste novo e observar verde. Em 1440×900 verificar que existe excedente, pin, deslocamento, 29 traços e último cartão acessível; manter **3vw** de vão.
- [ ] Conferir rótulo Trabalhos e margens alinhados à fileira, celular 390×844, tablet, reduzido e sem WebGL; adicionar assertivas observáveis na suíte da galeria para os estados alterados. Não mudar dados ou `CartaoTrabalho`/CSS compartilhado.
- [ ] Rodar `npm test` e `npm run check`; com o slot, `npm run test:build`. Para vermelho/verde focal, executar `NEXT_DIST_DIR=.next-teste npm run build` e depois `npx playwright test tests/e2e/capitulos.spec.ts --grep 'sem percurso horizontal'` em `apps/site`, conforme configuração já instalada. O teste usa a geometria real; a suíte completa da raiz continua obrigatória ao terminar.
- [ ] Antes da entrega, `git fetch origin` e `git merge origin/main` na branch da trabalhadora, então repetir os três comandos da raiz com slot. Registrar contagens, códigos de saída, capturas e limitações; entregar commit e descrição local pelo modelo com `Closes #26`, sem publicar.

**Aceite:** regressão vermelha antes e verde depois; 1883×703 sem rolagem presa vazia, 1440×900 com percurso intacto, demais modos conferidos e nenhum arquivo proibido alterado. A integradora refaz a validação e decide integração com a pessoa.

## Tarefa 3 — contato #27: reconciliação e protótipo B, sem produto

**Dona:** Design e Front, diretamente, por redirecionamento da integradora após a pessoa cancelar o uso de Produto. Não recriar esse agente nem esperar relatório. Em ampliação explícita da integradora, abrir uma filha nova **após uma das duas atuais concluir**, mesmo Run/modelo, para os dois arquivos visuais abaixo; nenhum arquivo de produto autorizado.

**Arquivos exclusivos da filha:** criar `docs/superpowers/specs/2026-11-02-contato-b-correcao-design.md` e `docs/superpowers/specs/prototipos-correcao/contato-b.html`. Nenhum outro documento, protótipo aprovado existente ou código pode ser editado.

**Entradas lidas:** spec 4.6, protótipo aprovado `docs/superpowers/specs/prototipos-estrutura/12-pagina-contato.html`, `apps/site/src/paginas/PaginaContato.tsx`, `componentes/contato/{Formulario,Contato,Rodape}.tsx`, `componentes/contato/estilo.css`, `conteudo/contato.ts`, rotas PT/EN, `/api/contato` e testes `pagina-contato.spec.ts`. Os caminhos sem prefixo nesta lista estão sob `apps/site/src/`.

- [x] Comparar diretamente o desenho aprovado e o código atual, sem reescrever o protótipo aprovado; diferenças e sequência abaixo.
- [x] Propor o alvo B já aprovado e reconfirmado pela integradora nesta rodada: esfera central, linha “Conte o que você quer construir…” e atalhos no vazio; primeira mensagem abre conversa à esquerda e desloca esfera à direita. IA respondendo (relógio/cursor/digitação/esfera acelerada), resumo, confirmação, enviado (F) e falha com texto preservado são estados do desenho, sujeitos à etapa real da IA.
- [ ] Separar alternativa temporária real: sem IA ou sem JS, formulário simples de nome, empresa, contato e mensagem com aviso de privacidade. A Início mantém CTA para a página; não inventar conversa no rodapé nem simular resposta para visitantes.
- [x] Registrar proposta e critérios verificáveis abaixo. O HTML documental foi autorizado depois pela integradora, nos dois arquivos exclusivos acima; produto continua exigindo novo despacho. Nenhum serviço de e-mail, roteiro, preço, prazo ou promessa será escolhido aqui.
- [ ] Após receber `worker_done` de uma filha atual, abrir a filha do protótipo B; mostrar vazio central, conversa aberta, resumo/ajuste/confirmação, enviado, falha e formulário sem IA/JS. Reaproveitar apenas desenho/conteúdo aprovado do protótipo12; marcar conteúdo/contrato/IA/envio pendentes, sem roteiro ou copy comercial nova.
- [ ] Com slot após galeria e hero, inspecionar HTML em 1440×900, 1883×703 e 390×844, teclado e reduzido. Registrar estados e limitações na spec nova; verificar `git diff --check`/escopo e entregar commit local, sem GitHub. A demonstração identifica-se como protótipo, nunca experiência pública ou envio/IA real.

**Aceite documental:** diferenças de layout/copy/movimento/estados rastreáveis à aprovação; escopo da futura correção e dependências explícitos. TDD de produto não se aplica nesta revisão; os futuros testes cobrirão PT/EN, teclado, estados, falha preservando dados, sem JS, reduzido e sem WebGL conforme o despacho futuro.

### Diferenças verificadas e alvo da correção

| Aspecto | Aprovação / fonte | Código atual / diferença concreta |
|---|---|---|
| Vazio B | Protótipo12:48–52,67–70,78: esfera central, uma linha e quatro atalhos, histórico oculto | `PaginaContato.tsx:19–21` sempre monta formulário à esquerda e esfera à direita; CSS:71 fixa duas colunas. Não existe estado de entrada B. |
| Primeira mensagem | Protótipo12:50–52,137–138: abre histórico à esquerda e desloca esfera para direita | `Formulario.tsx` só envia FormData; não há mensagem inicial, histórico ou transição de composição. |
| Campos / copy | Spec4.6 e protótipo12:78,82: vazio sem quatro campos; fallback tem nome/empresa/contato/mensagem | O formulário atual mostra os quatro campos desde a entrada. Isso atende a alternativa temporária, mas não é o vazio final aprovado. Aviso atual diz “Ao conversar” mesmo no formulário (`conteudo/contato.ts`), copy a reconciliar em tarefa de conteúdo, sem inventar consentimento/LGPD. |
| Respondendo | Protótipo12:29,42,79,139–140: ponto azul, cursor, digitação e esfera acelerada | `Formulario.tsx:19–25,58–61`: estado `enviando` apenas desabilita botão; o texto continua Enviar. Não há estado de IA, corretamente sem simulação para visitantes. |
| Resumo / confirmação | Spec4.6; protótipo12:133,142–143: resumo, confirmar/enviar e ajustar | Não existem no formulário. Não copiar o roteiro simulado do HTML: é demonstração, não regra comercial nem IA real. |
| Enviado | Spec4.6 / protótipo12:143: confirmação após envio e esfera forma F | `Formulario.tsx:31–37`: texto de sucesso com `role=status`; `PaginaContato` não recebe esse estado, então o F não fica ligado ao sucesso. A morfose própria da esfera não comprova estado de envio. |
| Falha / preservação | Spec4.6; protótipo12:81: texto curto, tentar novamente e preservar o escrito | No fluxo JS, formulário permanece montado e a falha permite repetir. Sem JS, rota:10–13 retorna 303 com estado, sem repor os campos; `PaginaContato` só recebe estado. A retenção de texto sem JS exige contrato/estratégia própria, sem pôr dados pessoais na URL. O teste atual sem JS confere falha, não preservação. |
| Sem IA / JS e entrega | Spec4.6: formulário simples real até a IA entrar | Esse é o modo disponível hoje. `/api/contato` retorna 400/429/503 conforme o caso e 200 em sucesso; destino de entrega segue pendente. Não tratar resposta simulada de teste como envio real nem mudar contrato nesta tarefa. |
| Movimento / fallback | Spec4.6 e regras globais: legível sem animação ou WebGL | CSS:74–76 encolhe círculo e o remove no reduzido; CSS:97–103 empilha no celular e sem WebGL. Não existe movimento B a avaliar no produto; preservar esses modos quando vier a conversa. |
| Início / idiomas | Spec4.3: esfera, frase e CTA para a página; `Rodape.tsx:15–18` usa rota por idioma | A Início monta frase/esfera/rodapé (`Contato.tsx`), sem formulário; o CTA leva a `/contato` ou `/en/contact`. Não há evidência para pôr a conversa no rodapé. `conteudo/contato.ts` tem inglês aprovado apenas em parte dos textos; a rota EN não comprova tradução completa (C2 pendente). |

### Sequência da futura correção (novo despacho obrigatório)

1. **Desenho, autorizado nesta onda:** abrir a filha visual nos dois arquivos exclusivos com estados B (vazio e aberta) e respondendo/resumo/ajuste/confirmação/enviado/falha, reaproveitando o protótipo12 sem inventar roteiro. Comparar 1440×900, 1883×703 e 390×844, reduzido, sem WebGL, foco/teclado e privacidade. Conferir com a pessoa antes de produto; não transformar o fallback temporário em outra experiência por suposição.
2. **Contrato e entrega:** a integradora resolve com os responsáveis o contrato da conversa/envio, retenção segura no retorno sem JS e destino de entrega. IA real, abuso/limites, roteiro, LGPD e traduções seguem seus portões; Design e Front não decide esses itens. Se o serviço não estiver disponível, visitantes continuam com formulário real, sem respostas de IA fingidas.
3. **Construção TDD, só com escopo novo:** candidata a `PaginaContato.tsx`, `componentes/contato/**` e testes `unit/pagina-contato.test.tsx`/`e2e/pagina-contato.spec.ts`, lista final definida pela integradora. Antes do código, teste falha no vazio central; outro envia a primeira mensagem por adaptador controlado de teste e observa conversa à esquerda/esfera à direita, sem duplicar dados. Cobrir resumo/ajuste/confirmação, sucesso somente após envio, falha recuperável sem perda, anúncios de estado e validação ao enviar. A IA falsa fica exclusivamente nos testes, sem modo público. Mudanças em conteúdo, esfera compartilhada ou API exigem tarefas/autorização próprias.
4. **Validação:** testes de viewport e teclado nos modos acima, PT/EN conforme copy aprovada, formulário sem JS com retorno seguro, sucesso/falha de serviço e nenhum salto/sobreposição. Rodar os três comandos da raiz após sincronizar `origin/main`, usando slot3100, e revisão independente da integradora. Sem publicação nesta rodada.

**Revisões recebidas:** Arquitetura, commit `508b761`, `docs/referencias/arquitetura.md` e `docs/contrato-api.md` da worktree `arquitetura-correcao`, lidos sem alterar: preservar o relógio `performance.now()` do hero, revelação/links das capas ao retirar pin, ordem dos gatilhos e restauração da rolagem ao voltar do contato. O contrato descritivo confirma 303 sem reposição dos campos e nenhuma API de IA. Segurança, commit `d0c9d6a`, `docs/seguranca.md` da worktree `seguranca-correcao`, somente leitura: orientação documental sem achado confirmado; privacidade, abuso, hospedagem e entrega são validações dos responsáveis, sem abrir implementação ou auditoria extra aqui.

## Entrega da coordenação

- [x] Revisar diffs das três entregas somente por leitura e comparar com os escopos; exigir evidência antes de afirmar conclusão (`superpowers:verification-before-completion`).
- [x] Repassar achados para a trabalhadora antes de seu `worker_done`; se já tiver concluído, solicitar novo despacho, sem tentar reabrir por mensagem solta.
- [x] Conferir os encerramentos de hero/galeria acompanhados pela integradora e receber `worker_done` da filha do contato, verificar IDs/evidências e informar à integradora arquivos, commits locais, estados, riscos e pendências.
- [ ] Mandar `worker_done` próprio uma única vez e idlar. Sem merge, edição de memória ou nova tarefa.

## Estado da execução

As duas filhas foram abertas a partir de `origin/main` no mesmo Run, em Codex `gpt-6.1-sol`, sem recusa de profundidade. A QA da main terminou com 170 unitários, check e 79 E2E segundo a integradora; esse resultado é da base, não certifica as correções. Slot3100 concedido exclusivamente à galeria para RED/GREEN; hero espera sua vez. O RED real da galeria foi conferido no log: ao rolar 300px, a seção deslocou 0px em 1883×703, antes da correção. A pessoa cancelou Produto, e a integradora encaminhou a revisão direta ao Design e Front; comparação documental acima concluída, sem autorização para construir contato. `git fetch origin` e `git merge origin/main` na branch deste plano: já atualizada; `git diff --check` sem erro.


### Retomada em 2026-11-03

O plano e os diffs das filhas foram encontrados preservados após `operator_close`; não foram reconstruídos nem descartados. A integradora confirmou os redirecionamentos acima: sem Produto, entregas locais e contato B somente documental. Os resultados RED/GREEN e macro descritos no estado anterior são históricos; os logs temporários não estão disponíveis nesta retomada, e as trabalhadoras devem recuperar evidência reproduzível e repetir os macro antes de concluir.

A recuperação da galeria com `--task task_db96d7240379 --retry-of ctx_f604abdea5fd` pelo novo dispatch do especialista foi recusada: `task_not_found`, porque a filha pertence ao dispatch anterior. Recibo `ea4abe42-68c9-4f53-bc7e-3498c1537738`, encaminhado à integradora. Não criar tarefa ou Run substituta para contornar o vínculo; a integradora recupera as tarefas existentes. A mesma restrição impede iniciar o hero antigo pelo novo dispatch sem recuperação da autoridade.

Slot confirmado pela integradora: galeria → hero → QA independente da galeria pela integradora → inspeção do contato. O contato pode ser desenhado antes de seu slot, depois de uma das duas filhas concluir. Hero entrega com `Refs #22`, sem fechar a issue de produto. Para revisão da galeria, além dos aceites, conferir o estado de revelação das capas quando `progresso=1`, margens nos dois lados do limite e retorno/restauração da rolagem depois da remoção do pin. A proposta do hero não certifica o shader de produção.


### Descrição local da entrega documental #30

**O que mudou:** plano executável de hero, galeria e reconciliação do contato B, com donas, arquivos, aceites, evidências e portões separados. Não altera o produto.

**Por quê:** coordenação da primeira onda de correções da Início; `Closes #30` somente na futura publicação da entrega completa, após conferência da integradora.

**Como testei:** confronto documental com issues, spec 4.3/4.6, protótipo12 e limites de Arquitetura/Segurança; escopo e espaços conferidos localmente. Suíte, tipos, build e CI não são declarados executados por este plano; os resultados de produto são atribuídos às entregas das trabalhadoras e à QA independente.

**Riscos e pendências:** recuperação das filhas, macro e inspeções atuais; escala/posição/faixas do hero e desenho do contato aguardam conferência da pessoa. Entrega local, sem push/PR ou integração; a integradora registra a validação independente e decide publicação.

**Conferência independente de origem do hero (2026-11-03):** leitura XML dos SVGs oficiais e comparação literal com o HTML da filha confirmou os três paths do F e o quarto path da assinatura, com os quatro SHA-256 iguais aos registrados na spec. Isso verifica origem geométrica, sem certificar composição visual ou refração. Nenhum arquivo de marca foi editado.

**Recuperação confirmada pela integradora (2026-11-03):** mesmas tarefas/worktrees, galeria `task_db96d7240379` → `ctx_5d314f91b5a2` e hero `task_d00fee8dfb67` → `ctx_1734a3f2a844`. O lifecycle dessas tentativas fica com a integradora; Design e Front revisa em leitura e encaminha achados aos dispatches. O recibo inicial `start_unknown` do hero não autorizou duplicata: a integradora confirmou atividade pelo transcript. A recusa anterior era vínculo ao dispatch de autoria, sem falha de profundidade.


**Galeria entregue localmente:** `8fd8b1999bacd0ae6f976ff35995e0663b48aa27`, somente `Capitulos.tsx`, `estilo.css` e `capitulos.spec.ts`; dispatch recuperado `ctx_5d314f91b5a2` consta `succeeded/completed`. RED atual reproduzido com código original (300 px esperados, 0 observados); relatório da trabalhadora registra 170 unitários, check, build e 82 E2E com saída 0. Design e Front leu o diff, log e geometria e abriu capturas larga/horizontal/celular, sem bloqueantes. Limite observado: 1610 px com pin / 1612 sem pin; recarga e retorno do contato preservaram y3586 em 1883. Limitação: não há capas reais para explorar visualmente revelação/hover/shader; QA independente da integradora continua pendente. Evidências locais: `/tmp/floway-26-evidencias/relatorio.md`, `descricao-pr.md`, logs, capturas e JSONs; arquivos temporários não substituem esta descrição durável.

**Contato visual despachado após a galeria concluir:** `task_4db4e7cd0c56` / `ctx_ad124c9db7bd`, worktree filha `front-27-contato-b-prototipo` de `origin/main`, Codex `gpt-6.1-sol`, esforço médio, mesmo Run. A filha recebeu somente os dois arquivos autorizados, os estados B e a fila de navegador após hero e QAroot; nenhuma construção pública/IA/envio está autorizada. O especialista acompanha o lifecycle desta filha; a integradora acompanha os retries de hero/galeria.

**Hero fase 1 entregue localmente:** `ae2145e`, somente os dois documentos autorizados, com descrição `Refs #22`. Design e Front conferiu os quatro paths oficiais, método de medidas e capturas A nos três tamanhos e B em 1440. Sem bloqueante documental; F inteiro e faixas separadas. Inspeção da trabalhadora registra A/B, teclado, reduzido, fallback manual e diagnóstico SVG ≥25%/p10≤0,25. Essa evidência não prova shader, perda real de contexto ou produto; escala/posição/faixas continuam para conferência da pessoa. Slot foi devolvido à integradora antes do contato.


## Fechamento da rodada documental e de revisão · 2026-11-03

- **Plano:** commit inicial `f088656`; somente este arquivo foi alterado na worktree do especialista. Conteúdo final confrontado com as issues e fontes, escopo e `git diff --check`.
- **Galeria:** `8fd8b19`, entrega de produto. A integradora repetiu independentemente 170 unitários, check, build e 82 E2E com saída 0 e a contraprova contra o build original da main (esperado 300 / observado 0), além da captura larga. Sem bloqueante; capas reais/hover/shader não foram explorados visualmente. CI da branch não acionado, pois não houve push.
- **Hero:** `ae2145e`, proposta visual somente, `Refs #22`, origem oficial conferida; A/B, escala/posição e composição das faixas permanecem para a pessoa. Não encerra produto nem autoriza fase 2.
- **Contato B:** `0d7c1a4`, somente os dois documentos exclusivos, `Refs #27`, revisão sem bloqueante documental. A filha registrou 24 combinações (oito estados nos três formatos), repetição dos oito estados móveis, teclado/foco, reduzido, sem JS e sem WebGL; zero erros de página/console e requisições HTTP. Design e Front abriu capturas 1440 vazio, 1883 aberta e 390 vazio/sem JS e leu código, método e medidas. Corrigido o achado da revisão que sobrescrevia edição ou apagamento deliberado na alternativa, com contraprova antes/depois; convite móvel também corrigido após inspeção. Fontes substitutas, esfera SVG e altura de demonstração não certificam encaixe de produto. Evidências temporárias em `/tmp/floway-contato-b-20261103`; método e medidas ficam duráveis na spec.
- **Lifecycle:** hero e galeria `succeeded/completed`, acompanhados pela integradora. Contato `worker_done` aceito de `task_4db4e7cd0c56` / `ctx_ad124c9db7bd`; `worker-release` solicitado, retorno `retained`, motivo `user_takeover`, `processAction: none`. Não forçar encerramento nem apagar worktree; decisão de cleanup registrada e encaminhada à integradora. Navegador da filha fechado e slot devolvido.
- **Pendências próprias das próximas etapas:** conferência humana dos desenhos, produto do hero/contato com novos despachos, contrato de conversa/envio, entrega, privacidade, traduções e validação final de publicação. Nenhum serviço, IA, marca ou código público do contato alterado; sem push, PR, comentários no GitHub, merge ou publicação nesta rodada. Descrições locais ficam no fim das specs e neste plano.

Suíte/build de produto não foram executados pelo especialista para um plano; resultados de produto acima são atribuídos à trabalhadora da galeria e à contraprova independente da integradora. Consumo numérico desta sessão não foi exposto pelo ambiente; não há valor estimado para registrar.
