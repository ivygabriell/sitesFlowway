# Segurança: mapa de riscos e revisão das correções

## Escopo e veredito

**2026-11-02 · issue #29 · base `3c0993cb5e890b53e4902847e82a2471ee147565`.** Orientação pelas skills `security-audit` e `metodo:auditoria-de-seguranca`, com leitura do fluxo de contato existente. Não é auditoria completa nem autorização para publicar.

**Veredito: aprovar com ressalva o acompanhamento desta rodada.** Nenhuma vulnerabilidade `confirmed` foi estabelecida nesta leitura; isso não comprova ausência de falhas. As perguntas abaixo permanecem `needs_validation`, sem gravidade. Não houve aceitação de risco nesta tarefa. A publicação continua dependendo da entrega real do contato e do aviso de privacidade, pendências já registradas na [spec das correções](superpowers/specs/2026-11-01-bugs-cta-celular-design.md).

Somente este documento foi criado. Código, dependências, infraestrutura, instruções, marca e memória ficaram fora da edição. A Segurança revisa os PRs sensíveis quando enviados pela integradora; correções são entregues ao especialista dono da pasta.

## Pessoas, autoridade e dados

- **Visitante anônimo, inclusive automação:** pode ler páginas e enviar o formulário público. Campos, cabeçalhos, URL e frequência de pedidos são entrada não confiável. O navegador não concede identidade ou autorização ao servidor.
- **Servidor da aplicação:** valida o pedido e decide se pode tentar entregá-lo. Não há login, conta, banco ou consulta de pedidos neste fluxo inspecionado.
- **Operação/proxy da hospedagem:** determina a origem confiável dos cabeçalhos, os limites HTTP, TLS, número de instâncias e registros de acesso. A configuração efetiva não foi observada.
- **Equipe e futuro provedor de e-mail:** serão destinatários dos pedidos quando a integração existir. Credenciais e destino devem permanecer no servidor; visitante não escolhe destinatário, remetente ou URL de provedor.

**Dados tratados:** nome, empresa opcional, contato livre e mensagem; idioma e campo-isca auxiliam o fluxo. Nome, contato e texto livre podem conter dados pessoais. O servidor mantém em memória uma chave derivada de `x-forwarded-for` (ou o valor de fallback) e horários dos pedidos válidos para uma janela de dez minutos. A limpeza ocorre ao chamar o limitador novamente; sem novos pedidos, entradas podem permanecer até o processo encerrar. No caminho lido, o pedido não é persistido nem registrado pelo código da aplicação e a entrega ainda é uma função que retorna `false`. Isso não comprova ausência de registros no proxy ou em ferramentas de observabilidade.

## Fronteiras e controles visíveis

| Fronteira / recurso | Entrada e percurso | Controle no código e limite da evidência |
|---|---|---|
| Navegador → API pública / processamento do pedido | `Formulario` faz `POST /api/contato` com `FormData`, via fetch ou formulário sem JavaScript | Validação também no servidor: campos obrigatórios após trim; limites de 200 para nome, empresa e contato e 5000 para mensagem. São comprimentos de strings, não limite do corpo HTTP. [Formulário](../apps/site/src/componentes/contato/Formulario.tsx), [leitor](../apps/site/src/lib/pedidoDeContato.ts). |
| HTTP/proxy → servidor / recursos e chave de limitação | A rota lê o corpo e depois o primeiro elemento de `x-forwarded-for` | Campo-isca preenchido recebe sucesso sem entregar; pedido inválido é recusado antes da entrega. Limitação de cinco tentativas válidas por chave em dez minutos, em `Map` por processo; não demonstra proteção global ou identidade confiável. [Rota](../apps/site/app/api/contato/route.ts), [limitador](../apps/site/src/lib/pedidoDeContato.ts). |
| Servidor → futuro provedor / mensagem e credencial | `entregarPedido(pedido)` | Atualmente retorna `false`: pedido normal válido recebe falha, sem chamada externa. Não há template, destinatário operacional ou credencial dessa integração para revisar. [Entrega](../apps/site/src/lib/pedidoDeContato.ts). |
| Servidor → navegador / resposta e navegação | `Accept` escolhe JSON ou redirecionamento 303 | JSON contém apenas `ok`; retorno sem JS usa caminho PT/EN fixo e estado fixo, sem campos pessoais na query. Não há reflexão da mensagem em HTML nessa resposta. A origem absoluta depende de `req.url` e, portanto, da hospedagem. [Rota](../apps/site/app/api/contato/route.ts), [rotas](../apps/site/src/lib/idioma.ts). |
| Aplicação → registros e operadores / dados pessoais | Campos enviados e metadados da requisição | Sem log explícito do pedido no caminho lido. Política, retenção e ferramentas externas ainda precisam de confirmação. [Aviso pendente](../apps/site/src/conteudo/contato.ts), [página](../apps/site/src/paginas/PaginaPrivacidade.tsx). |
| Configuração → navegador / cabeçalhos | Configuração de hospedagem | `vercel.json` declara `nosniff`, política de referência, bloqueio de frame e `noindex`. Declaração não prova aplicação no ambiente; `noindex` não restringe acesso. [Configuração](../apps/site/vercel.json). |

**Domínios aplicáveis:** web/navegador, abuso de recursos, privacidade e a futura integração externa. Dependências e cadeia de suprimentos entram na revisão própria de publicação; não foram auditadas nesta rodada. Login/sessão, isolamento entre clientes, pagamentos, filas, execução de comandos e IA não têm caminho operacional no contato lido. Reabrir o mapa quando uma dessas superfícies entrar; não atribuir proteção a componentes futuros.

## Perguntas e riscos a validar

Todos os itens desta tabela são **`needs_validation`, sem gravidade**. Descrevem um fato faltante e seu critério de fechamento, não uma exploração demonstrada.

| ID | Fronteira e condição a validar | Quem confirma e evidência necessária |
|---|---|---|
| S1 · abuso | A chave de limitação vem de cabeçalho HTTP e a memória é por processo. A eficácia depende de o proxy impor identidade confiável e de como os pedidos se distribuem entre instâncias. Spam/custo futuro é risco a validar; bypass em produção não foi demonstrado. | DevOps e dono da API: documentar proxy, tratamento de cabeçalhos encaminhados, acesso direto à origem, instâncias/reinícios e controle compartilhado ou equivalente na borda. Conferir a política com dados fictícios em ambiente local isolado; não alternar cabeçalhos contra produção. |
| S2 · custo de entrada | `req.formData()` acontece antes da validação de campos e da limitação. O código lido não estabelece teto de bytes antes do parse; falta saber o limite efetivo do servidor/proxy e o orçamento de processamento. Não foi demonstrada indisponibilidade. | DevOps e dono da API: declarar tamanho, tipos de conteúdo, quantidade de campos/partes e limite de concorrência suportados; comprovar recusa antecipada de excesso com fixture pequena e limitada em sandbox. Não basta `maxLength` do navegador nem conferir só `Content-Length`. |
| S3 · contrato e entrega | Ainda não existe `docs/contrato-api.md`; a entrega real está desativada. Tipos aceitos, campos duplicados/arquivos, falhas e fronteira com o futuro provedor precisam de regra antes da construção. A conversão atual para string não prova validação de tipo. | Arquitetura/Back e Dados, via integradora: fechar contrato antes de conectar e-mail. Rever destinatário/remetente fixados pelo servidor, campos como texto, eventual `Reply-To`, prazos, erros e repetição; provar com provedor simulado e dados fictícios. Não afirmar injeção de cabeçalho ou XSS sem um destino interpretador alcançável. |
| S4 · privacidade | O visitante já fornece dados, mas o aviso de privacidade segue pendente. Não se conhece retenção/acesso dos logs da hospedagem ou o tratamento pelo provedor que será escolhido. Não há evidência de vazamento. | Pessoa responsável, com Produto/DevOps/Back e Dados: decidir finalidade, necessidade de cada campo, fundamento do tratamento, destinatários, retenção, acesso e canal de atendimento; refletir o fluxo real no aviso PT/EN. Segurança não decide fundamento legal nem aceita risco. |
| S5 · ambiente | O código não comprova TLS, aplicação dos cabeçalhos, origem canônica dos redirecionamentos, CORS, controles de logs ou proteção dos segredos de implantação. | DevOps: apresentar configuração e evidências do ambiente sob sua responsabilidade. Preservar respostas genéricas e impedir que dados do pedido cheguem a URL, log ou bundle. Inspeção de artefato com REA fica para o portão próprio de publicação. |

**Hipóteses sem achado:** injeção em template/cabeçalho de e-mail, chamada a URL escolhida pelo visitante e abuso de ferramentas de IA dependem de funcionalidades ainda ausentes. Não são `confirmed` nem correções exigidas no código atual; viram critérios se esses destinos forem construídos. A ausência de token CSRF, isoladamente, também não demonstra ação com autoridade de uma vítima neste formulário anônimo; envio automatizado é tratado em S1/S2.

**Dependências:** a [decisão 006 da Arquitetura](arquitetura.md) registra a aceitação anterior pela pessoa, com data, alcance e gatilhos de revisão. Esta tarefa não renova essa aceitação nem confirma que os avisos continuam iguais. Upgrade do Vitest é escopo da issue #11; aviso novo ou mudança de exposição exige nova avaliação pelo responsável.

## Critérios para os próximos PRs

1. **Contrato antes de integrar a entrega:** preservar o formulário com e sem JS, PT/EN, campos permitidos, estados e respostas genéricas. Alteração que o contrato não prevê volta à integradora; a Segurança não escreve o contrato nesta tarefa.
2. **Validar no servidor antes do efeito:** campo obrigatório vazio, comprimentos no limite e acima dele, tipo diferente de texto, duplicação, corpo inválido e excesso do corpo devem ter comportamento definido e teste com dados fictícios. O campo-isca não entrega; pedido recusado não chama o provedor. Correção exige TDD pelo especialista dono da pasta.
3. **Abuso com identidade confiável:** demonstrar a sexta tentativa recusada, recuperação da janela e comportamento do controle entre instâncias/reinícios conforme a implantação escolhida. Não tomar um teste de helper em memória como prova do proxy em produção.
4. **Futura entrega como fronteira de confiança:** credencial e destino exclusivamente no servidor; nenhum campo vira destinatário arbitrário, HTML executável, cabeçalho bruto, comando ou URL de saída. Usar texto/escape no destino adequado; validar metadados do provedor. Aplicar `metodo:entrada-nao-confiavel`, passos 2 e 3 para HTML/links e passo 5 somente se houver busca de URL externa.
5. **Erros e dados:** indisponibilidade, exceção e prazo esgotado não geram confirmação enganosa nem expõem stack, resposta do provedor, segredo ou pedido completo. Não introduzir dados pessoais nos logs, testes, capturas ou relatórios. Retentativas não podem gerar entregas duplicadas sem política definida.
6. **Navegador e conteúdo:** preservar links de privacidade, rótulos e estados acessíveis. Não levar dados do formulário a URL/storage nem adicionar saída de HTML não confiável. Uma CSP seria defesa adicional a avaliar em C5, não achado por ausência isolada.
7. **Veredito de segurança:** cada achado exige principal de menor confiança, entrada, controle esperado, fronteira, recurso afetado e resultado concreto. `confirmed` crítico/alto bloqueia; médio aprova com ressalva; baixo é nota. Sem o fato decisivo, usar `needs_validation` sem gravidade. Quem confere deve ser independente de quem encontrou; aceitar risco cabe à pessoa.

## Evidências e limites da rodada

Leitura estática da rota, leitor/limitador/entrega, formulário e páginas de contato/privacidade, textos, configuração de cabeçalhos, spec e decisão de dependências. Busca dos usos de `lerPedido`, `dentroDoLimite`, `entregarPedido` e `/api/contato` vinculou a entrada ao destino descrito acima.

Os testes existentes foram **lidos, não executados**: [rota](../apps/site/tests/unit/rota-contato.test.ts) cobre válido, obrigatório, mensagem longa, isca, sexta tentativa, falha e redirecionamento; [formulário](../apps/site/tests/unit/pagina-contato.test.tsx) cobre estrutura e estados; [navegador](../apps/site/tests/e2e/pagina-contato.spec.ts) inclui envio sem serviço e sem JS. A rota unitária simula a entrega e `formData()`, e o teste de sucesso no navegador intercepta a API: isso não comprova parsing HTTP, proxy ou entrega real.

Não houve execução de código do alvo, `npm audit`, build, Playwright, contato com ambiente publicado, subagentes ou auditoria completa. A sandbox exigida pela `security-audit` para executar código não foi comprovada nesta sessão: sem rede externa, ambiente vazio, alvo/toolchain somente leitura, escrita restrita e limites de recursos. Suíte, tipos, build e exploração seguem pendentes com a integradora, sob as condições de execução aplicáveis e a reserva da porta 3100. As verificações desta entrega documental são confronto com as fontes e com os critérios da issue, integridade dos links locais e `git diff --check`.

Não foi produzido relatório técnico de falhas abertas: nenhum achado foi confirmado nesta orientação. Caso apareça falha, o detalhe fica fora do repositório e é encaminhado privadamente pelo Orca; aqui entra só o resumo não sensível. Esta rodada não cria nem substitui registros de auditoria completa. Antes da primeira publicação, a integradora resolve com a pessoa o portão de auditoria/artefato, perfil, escopo e orçamento.

## Referências aplicadas

Base local consultada: harness de Segurança, `metodo:consultar`, `metodo:auditoria-de-seguranca`, `metodo:entrada-nao-confiavel`, base de referências de Segurança do método 3.1.0 e lição 012 (higiene de dados). Não existia `docs/referencias/seguranca.md` nesta base; a issue restringe a edição a este documento.

- [security-audit: princípios e modos](https://github.com/cloudflare/security-audit-skill/blob/main/skills/security-audit/SKILL.md): fronteira e resultado concreto, separação entre certeza e gravidade, orientação sem executar as seis fases; leitura da cópia instalada em 2026-11-02.
- [OWASP Input Validation](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html): consultada em 2026-11-02 para S2/S3; limitar antes de parsear e validar tipos no servidor, preservando texto livre legítimo. Validação não substitui escape no destino.
- [OWASP REST Security](https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html): consultada em 2026-11-02 para S1/S2 e os critérios HTTP; tamanho do corpo, formatos aceitos, limitação e respostas sem detalhes internos. Aplicar ao contato anônimo sem inventar autenticação exigida pelo produto.
