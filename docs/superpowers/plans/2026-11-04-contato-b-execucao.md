# Contato B — plano de execução por etapas

> **Para agentes:** seguir o harness do papel e `metodo:consultar`. A execução usa especialistas no Orca, sem agentes de Produto e sem subagentes internos. Cada tarefa de produto exige novo despacho, arquivos exclusivos e `superpowers:test-driven-development`; a integradora valida e só integra com autorização da pessoa.

**Objetivo:** entregar a disposição B do contato com conversa real, confirmação antes do envio e alternativa funcional, preservando o texto quando houver falha.

**Arquitetura:** reaproveitar as páginas PT/EN, o formulário, a esfera e o índice de textos existentes. A conversa terá contrato próprio aprovado antes de código consumidor; a rota atual continua atendendo ao formulário enquanto a conversa não estiver disponível. A esfera representa o estado da página, sem decidir entrega ou guardar dados de contato.

**Pilha:** Next.js 15.5, React 19, Three.js/R3F, GSAP, Vitest e Playwright já instalados. Nenhuma dependência nova prevista neste plano.

**Fontes:** [estrutura, seção 4.6](../specs/2026-10-31-estrutura-site-design.md#46-contato-12), [reconciliação do contato B](../specs/2026-11-02-contato-b-correcao-design.md), [protótipo B](../specs/prototipos-correcao/contato-b.html), [contrato observado](../../contrato-api.md) e [memória](../../memoria-do-projeto.md).

**Estado em 2026-11-04:** plano preparatório local sobre `0ec2c92`. O “PROSSIGA” foi interpretado pela integradora como continuidade do planejamento na branch existente `docs/contato-b-planejamento`; não registra aprovação da composição móvel, de contrato novo, fornecedor, roteiro, copy, merge ou deploy. Os PRs da rodada anterior já estão integrados. Este plano não é autorização para construir a conversa.

## Restrições comuns

- O alvo B está definido: esfera central, “Conte o que você quer construir…” e quatro atalhos do protótipo12; primeira mensagem abre conversa à esquerda e desloca esfera à direita.
- A alternativa sem IA ou sem JS mantém nome, empresa, contato e mensagem. Não publicar respostas simuladas ou transformar os controles do protótipo em funcionalidades para visitantes.
- O envio atual é `POST /api/contato`, com FormData e JSON `{ ok: boolean }` ou 303 por idioma. Ele não é uma API de conversa. Este plano não o altera.
- `entregarPedido(pedido: Pedido): Promise<boolean>` retorna `false` hoje. Conexão de entrega, serviço e destino continuam pendentes; destino e credenciais ficam exclusivamente na configuração do servidor.
- Hoje, nome/contato/mensagem são obrigatórios; empresa é opcional; máximos 200/200/200/5000 após normalização do servidor. Limite atual: 5 tentativas válidas por endereço em 10 minutos, em memória por instância. Alterar essas regras exige contrato aprovado.
- A falha com JS já preserva os campos; o 303 sem JS não os restaura. Não anunciar preservação sem JS como resolvida nem inserir respostas pessoais em URL, logs ou artefatos.
- A Início continua com CTA para a página. Não alterar hero, marca, galeria, protótipos anteriores, dependências ou CI nesta entrega.
- PT/EN seguem o índice de conteúdo existente. Traduções ausentes continuam pendentes para C2; não inventar aprovação de inglês ou texto legal.
- Até a conferência visual final, as medidas do HTML são propostas. O artefato com fontes substitutas, notas editoriais e esfera SVG não comprova encaixe em uma tela nem WebGL real.

## Pontos de revisão

1. Mensagem editada ou apagada na alternativa não pode ser sobrescrita ao voltar à conversa e reabrir o formulário.
2. Serviço lento, falha de rede ou repetição após resultado incerto não pode produzir sucesso falso, perda de texto ou pedidos duplicados.
3. Teclado virtual, conteúdo longo e tela larga/baixa devem permitir alcançar entrada, ações e aviso sem sobreposição ou rolagem lateral.
4. Sem JS, sem WebGL ou com movimento reduzido, contato e anúncios de estado precisam continuar compreensíveis e utilizáveis.
5. A morfose automática atual da esfera não pode representar envio confirmado na conversa; falha e resposta da IA não são confirmação de entrega.

## Mapa de arquivos e responsabilidades

| Responsável | Arquivos existentes afetados ou consultados | Limite |
|---|---|---|
| Integradora | este plano, `docs/memoria-do-projeto.md` | Registro, sequência, issues e portões; sem código de produto |
| Arquitetura | `docs/contrato-api.md`, `docs/arquitetura.md`, `docs/referencias/arquitetura.md` | Propor interface, falhas e retenção; mudança do contrato depende de aprovação |
| Segurança | `docs/seguranca.md`, `docs/referencias/seguranca.md` | Revisar dados, abuso, credenciais e privacidade; auditoria completa é etapa própria |
| Design e Front | `apps/site/src/paginas/PaginaContato.tsx`, `apps/site/src/componentes/contato/{Formulario.tsx,estilo.css}`, `apps/site/src/conteudo/contato.ts` | Composição, estados, conteúdo aprovado e alternativa; não definir API |
| Design e Front, tarefa da esfera | `apps/site/src/compartilhados/esfera/{EsferaDeLetras.tsx,CenaEsfera.tsx}` | Estado visual controlado na página, preservando comportamento dos demais consumidores |
| Back e Dados | `apps/site/app/api/contato/route.ts`, `apps/site/src/lib/pedidoDeContato.ts` | Construir conforme contrato aprovado; novos arquivos só no despacho que definir suas interfaces |
| Rotas e consumidores a revalidar | `apps/site/app/(pt)/contato/page.tsx`, `apps/site/app/(en)/en/contact/page.tsx`, `apps/site/src/componentes/contato/{Contato.tsx,Rodape.tsx}` | Preservar estado por idioma, CTA e esfera da Início |
| Testes | `apps/site/tests/unit/{pagina-contato.test.tsx,rota-contato.test.ts,esfera.test.tsx,contato.test.tsx}`, `apps/site/tests/e2e/{pagina-contato.spec.ts,contato.spec.ts,idiomas.spec.ts}` | Ampliar testes existentes onde cobrem o comportamento; novos arquivos só se a responsabilidade exigir |

Não abrir duas tarefas que alterem `estilo.css`, o índice de textos ou a esfera ao mesmo tempo. A lista acima é mapa de impacto; cada despacho deve reduzir a permissão aos arquivos da tarefa correspondente.

## Etapa 1 — fechar desenho e entradas para o contrato

**Entrega:** decisões registradas suficientes para Arquitetura e Design e Front detalharem a construção. A coordenadora organiza; não recriar Produto.

- [ ] Conferir o protótipo B com a pessoa: vazio, aberta, resumo, ajuste, enviado, falha e alternativa. Registrar o arranjo móvel e o comportamento em tela baixa; rolagem móvel natural é permitida, não cortar conteúdo para caber.
- [ ] Preparar para decisão o serviço/destino da entrega, o roteiro de qualificação, os dados realmente necessários e os limites de promessa da IA. Gemini é a direção registrada; não decidir modelo, preço ou retenção por suposição.
- [ ] Reconciliar com C2 o convite, quatro atalhos, rótulos, estados de espera/falha/sucesso, aviso de privacidade e versões PT/EN. Não converter o aviso antigo em consentimento novo automaticamente.
- [ ] Registrar decisões da pessoa e o que continua pendente. Dados reais de destino e credenciais não entram no documento nem no Git.

**Saída verificável:** cada decisão tem origem e responsável; ausências aparecem como dependências, sem valores inventados. Nenhum código de produto nesta etapa.

## Etapa 2 — proposta de contrato e revisão de Segurança

**Responsável:** Arquitetura; Segurança revisa dados pessoais e exposição pública. **Depende:** entradas da etapa 1. **Arquivos:** os documentos dos respectivos papéis, sem app.

- [ ] Descrever separadamente conversar, produzir/editar resumo, confirmar pedido e realizar entrega. Fixar métodos, caminhos, campos, limites, respostas e estados; decidir com justificativa se a resposta precisa de streaming, sem assumir SSE ou WebSocket.
- [ ] Fixar a fronteira de sucesso: resposta da IA não envia pedido; a confirmação explícita precede a entrega. Definir a evidência que autoriza a confirmação visual e o tratamento de resultado incerto e repetição, sem duplicar entrega.
- [ ] Definir timeout, cancelamento, falha recuperável e disponibilidade da alternativa. Fixar limites de uso/custo e confiança no proxy, revendo a limitação por instância do contrato atual conforme a hospedagem escolhida.
- [ ] Resolver a retenção após erro sem JS com prazo, limpeza, isolamento e proteção de dados; documentar a escolha antes de implementá-la. Não escolher sessão, cookie ou armazenamento novo neste plano.
- [ ] Segurança revisar validação, tamanho de corpo, abuso, segredos somente no servidor, destino fixo, texto tratado como conteúdo, logs sem dados pessoais e privacidade. Não iniciar auditoria completa por consequência deste planejamento.
- [ ] Trazer a proposta concreta à pessoa pelo portão de contrato. Somente após aprovação atualizar o contrato normativo e detalhar os despachos de implementação com assinaturas e fixtures exatas.

**Saída verificável:** front e back conseguem escrever exemplos de requisição/resposta para sucesso, inválido, limite, falha e resultado incerto, incluindo o percurso sem JS. Não despachar construção com lacuna na interface.

## Etapa 3 — construção em tarefas revisáveis, com TDD

**Estado:** sequência condicionada à etapa 2; não é despacho executável enquanto o contrato novo não existir. Cada linha abaixo vira issue, branch e PR próprios. Interfaces novas, arquivos novos e valores de timeout vêm do contrato aprovado, não de suposições deste plano.

| Ordem | Entrega | Consumidores e interfaces | Testes vermelhos antes do código |
|---|---|---|---|
| 3.1 | Entrega real e falhas do formulário | Preservar `Pedido = { nome: string; empresa: string; contato: string; mensagem: string }` e a interface existente até mudança aprovada; adaptar entrega no servidor | Serviço recusando, indisponível ou incerto não anuncia sucesso; sucesso só conforme contrato; repetição respeita a garantia aprovada; nenhum dado pessoal retorna em URL |
| 3.2 | API real da conversa e confirmação | Interface exata da etapa 2, consumida pela página; segredos no servidor | Resposta da IA não dispara entrega; resumo ajustável; confirmação e repetição; limites e falhas; roteiro não promete prazo/preço/resultado |
| 3.3 | Composição B e estados da conversa | Reaproveitar `PaginaContato({ estado }: { estado?: string })`, formulário e índice de conteúdo; definir componente novo somente se necessário ao separar a conversa | Vazio central, primeira mensagem abre histórico sem duplicar, resposta/erro anunciados; editar/apagar mensagem na alternativa permanece após ida e volta; resumo/ajuste/confirmar seguem dados reais |
| 3.4 | Esfera controlada pelo estado e alternativa completa | Estender a esfera em tarefa própria; consumidores sem controle preservam comportamento atual. Só a página recebe o resultado real da entrega | Não formar F de confirmação antes do sucesso real; falha não confirma; esfera da Início mantém comportamento; reduzir movimento/sem WebGL não remove texto de sucesso |
| 3.5 | Retorno sem JS e validação final do contato | Estratégia aprovada na etapa 2; rotas PT/EN e formulário nativo preservados | Erro real preserva dados conforme contrato, sem exposição entre visitantes ou na URL; sucesso, inválido e limite retornam ao idioma correto |

Para cada issue:

- [ ] Design e Front ou Back e Dados define o teste pelo comportamento público e identifica qual ausência de código o faz falhar. Executa e registra RED pelo motivo certo; só depois implementa.
- [ ] Implementa o mínimo completo no padrão existente, registra GREEN e amplia os testes da tabela. Dublês do serviço ficam nos testes; nenhum modo de conversa falsa acessível ao visitante.
- [ ] Antes do código visual, acrescenta os E2E de geometria que falham no layout atual; uma conta interna ou screenshot de maquete não substitui o navegador com fonte e esfera reais.
- [ ] Traz `origin/main`, executa `npm test`, `npm run check` e `npm run test:build` na raiz, com códigos de saída registrados. Só um build/E2E na porta3100 por vez, liberado pela integradora.
- [ ] Obtém revisão do especialista, Segurança nas alterações sensíveis e validação independente da integradora. Push, PR e integração respeitam a autorização aplicável; preservar branches remotas.

Comandos focais existentes, a executar da raiz conforme a tarefa:

```sh
npm test -w apps/site -- tests/unit/pagina-contato.test.tsx
npm test -w apps/site -- tests/unit/rota-contato.test.ts
npm test -w apps/site -- tests/unit/esfera.test.tsx
```

Depois do build de teste e com slot3100, executar em `apps/site`: `npx playwright test tests/e2e/pagina-contato.spec.ts`. O foco acelera RED/GREEN e não substitui os três comandos completos da raiz.

## Etapa 4 — aceite integrado

- [ ] Conferir os estados vazio, aberta, respondendo, resumo, ajuste, enviando, enviado e falha, além da alternativa sem IA, em PT/EN conforme conteúdo aprovado.
- [ ] Medir 1440×900, 1883×703, tablet768×1024, 390×844 e 360×640: largura de documento não excede viewport; entrada, aviso, ações, esfera e rodapé não se sobrepõem; foco e envio alcançáveis com teclado virtual. Conferir uma tela no desktop com fontes reais; se o conteúdo aprovado não couber, reconciliar o desenho, sem escondê-lo.
- [ ] Explorar teclado/foco e anúncios; Enter na textarea cria linha, envio exige ação explícita; reduzir movimento elimina animação sem perder estado. Conteúdo longo permanece acessível e texto como `<b>` aparece literalmente.
- [ ] Percorrer conversa → falha → alternativa → editar/apagar mensagem → conversa → alternativa; a última edição continua intacta. Cobrir espera, timeout, retomada e repetição conforme contrato.
- [ ] Sem JS, formulário nativo e retorno seguro funcionam; sem WebGL, conversa e confirmação textual permanecem. O F visual acompanha sucesso real; captura com rota interceptada é evidência de interface, não de entrega externa.
- [ ] Revalidar Início/CTA/rodapé, restauração da rolagem ao voltar e os consumidores da esfera. Conferir console, suíte, tipos, build e CI da branch; após merge autorizado, repetir na main.

**Publicação:** segue bloqueada até entrega real, conteúdo/privacidade/traduções e validações próprias de C5. Este plano não inicia deploy nem a auditoria completa de segurança.

## Retomada

O próximo trabalho é a etapa 1, seguida da proposta de Arquitetura da etapa 2. Não reabrir a rodada de galeria, escolher A/B do hero, recriar Produto ou construir IA por inferência do “PROSSIGA”. Este documento organiza o contato B e torna explícito o que precisa ser decidido antes do despacho de produto.


## Progresso autorizado e validado · 2026-11-05

A pessoa autorizou construção depois deste plano. A frente independente #38 foi construída e validada localmente em `3933ae1`: alternativa temporária acessível/recuperável e esfera controlada, com 183 unitários, check, build e 91 E2E verdes na execução independente da integradora, mais inspeção própria dos cinco tamanhos e modos alternativos. Isso não conclui a conversa B nem conecta entrega real.

A proposta de Arquitetura #39 está em `9a1ce73` mais `62ec98a`, na branch `ivygabriell/arquitetura-contato-b`, com revisão leve de Back/Front e Segurança. O contrato observado não mudou. Portão `gate_a9c750e8db8e` pendente para adoção da interface; serviço/destino, modalidade/modelo Gemini, orçamento e privacidade/copy continuam com suas decisões próprias. Próxima construção consumidora exige esse portão; merge/deploy não foram autorizados nesta retomada.


## Construção da conversa autorizada · 2026-11-05

O portão `gate_a9c750e8db8e` foi resolvido com a resposta “aprovado pode seguir”: contrato #39 e Resend aprovados. O contrato normativo adotado em `30a0099` é a entrada obrigatória, preservando a API legada. Esta seção substitui o bloqueio documental anterior; sem merge/deploy ou ativação real por consequência.

### Execução concreta

1. #40, Back e Dados: uma filha a partir de `ivygabriell/contato-b-construcao`, TDD antes dos módulos exclusivos `src/lib/contato/**` e handlers aprovados; documentar DTOs server-only, configuração e renderer HTML para a consumidora. Testes de protocolo/limites/assinatura/replay/timeout/HTML e adaptadores com dependências falsas só na borda. Arquivos, critérios e limites completos na issue; nenhuma mudança de front/contrato/CI/dependências.
2. Revisão do backend e incorporação local da entrega pela integradora, preservando main; testes/limites e interfaces publicados à consumidora. Front pode mapear testes durante essa etapa, mas não abre sua filha antes da liberação.
3. #41, Design e Front: uma filha a partir da base local com backend; TDD do vazio B/abertura/resumo/ajuste/confirmar, preservação da alternativa e pendência 202→429. Consumir DTOs e estados do contrato sem segredos no cliente. Testar UI configurada e fallback sem introduzir modo de IA falsa no produto; pedido prévio à integradora para mudar configuração comum de testes.
4. Segurança focada, revisão independente e os três comandos completos na versão reunida; explorar estados/teclado/idiomas nos cinco tamanhos e nos modos reduzido/sem JS/sem WebGL. Sucesso interceptado é prova de interface. Serviços reais, hardware/leitor de tela físico e ativação dependem de configuração/decisões próprias, sem esconder limitações.

Interfaces internas e nomes de arquivos auxiliares serão registrados pelos especialistas antes de suas filhas começarem; não criar abstrações, novos serviços ou duplicar a validação do contrato por suposição. Escrita nos mesmos arquivos fica em sequência. Entregas locais com commit/descrição de PR e evidência; nenhum push/PR/merge/deploy sem autorização aplicável.


### Checkpoint de construção · 2026-11-06

#40 entregue em `385fb4b`, incorporada localmente como `20cb8d8`, com revisão de Back, 234 unitários/check/build e91E2E verdes e12casos HTML reais com provedores dublados. A integradora repetiu234unitários/check na base; testou em cópia temporária que o teste rejeita aceitação sem ID válido. Evidência e limites registrados na memória. #41 está liberada para uma filha sobre essa base; Segurança revisa o backend congelado. A próxima saída é a interface B completa, perfis de teste sequenciais ligados no pacote e QA independente integrado. Não reabrir o portão de contrato/Resend aprovado.
