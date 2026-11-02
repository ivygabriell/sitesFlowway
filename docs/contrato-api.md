# Contrato observado do contato

**Estado:** rascunho descritivo da interface existente, conferido em 2026-11-02 sobre `3c0993c` (issue #28). Este registro não aprova mudança de contrato nem cria uma API de conversa com IA. A rota não tem versão explícita; a data e o commit identificam esta revisão documental.

## Consumidores e fronteira

O consumidor identificado é o formulário de `/contato` e `/en/contact`, publicado junto com a rota. Com JavaScript, usa `fetch`; sem JavaScript, usa o envio nativo do formulário. A esfera é decoração independente: não recebe pedidos nem representa o resultado da entrega. Não há autenticação, sessão ou chave de API exigida por este handler. Não há integração de terceiros identificada no código revisado. Fontes: [formulário, linhas 19–43](../apps/site/src/componentes/contato/Formulario.tsx#L19), [página, linhas 14–24](../apps/site/src/paginas/PaginaContato.tsx#L14) e [handler completo](../apps/site/app/api/contato/route.ts#L1).

## Requisição existente: `POST /api/contato`

O corpo é lido com `Request.formData()`: formulário `multipart/form-data` (o `fetch` atual) ou `application/x-www-form-urlencoded` (envio HTML nativo). JSON não é uma entrada implementada. Falha ao ler o corpo vira `FormData` vazio, que falha na validação e escolhe português. Não há outro método exportado por este arquivo. Fonte: [rota, linhas 6–8](../apps/site/app/api/contato/route.ts#L6).

| Campo | Regra observada no servidor |
|---|---|
| `nome` | Obrigatório após `trim()`, até 200 unidades de comprimento de string JavaScript |
| `empresa` | Opcional; ausente vira `''`, até 200 após `trim()` |
| `contato` | Obrigatório após `trim()`, até 200; texto livre, sem validação específica de e-mail ou telefone |
| `mensagem` | Obrigatória após `trim()`, até 5000 |
| `idioma` | Somente o valor exato `en` escolhe inglês; qualquer outro valor ou ausência escolhe `pt`. Não é repassado a `entregarPedido` |
| `site` | Campo-isca: se `corpo.get('site')` for verdadeiro, descarta antes de validar ou contar o limite e responde como sucesso. Texto não vazio, inclusive espaços, aciona esse caminho |

Para os quatro campos do pedido, o servidor usa `String(corpo.get(nome) ?? '').trim()`. `get` lê o primeiro valor de cada nome; campos extras são ignorados. Não há validação explícita para rejeitar `File`, nem limite de bytes do corpo definido neste handler; os máximos acima verificam o comprimento das strings normalizadas. O navegador também usa `required` nos obrigatórios e `maxLength` nos quatro campos. Fontes: [validação, linhas 1–12](../apps/site/src/lib/pedidoDeContato.ts#L1), [isca, linha 17](../apps/site/app/api/contato/route.ts#L17) e [campos HTML, linhas 39–54](../apps/site/src/componentes/contato/Formulario.tsx#L39).

### Ordem de processamento e limite

1. Lê o corpo e escolhe o idioma.
2. Descarta a isca preenchida, com resposta de sucesso.
3. Normaliza e valida o pedido; inválido termina com 400 no modo JSON.
4. Obtém o primeiro item de `x-forwarded-for`, separado por vírgula e aparado; se vazio/ausente, usa a chave compartilhada `desconhecido`.
5. Admite até **5 tentativas válidas por endereço em uma janela móvel de 10 minutos**, em memória no processo. A sexta é recusada; uma tentativa admitida conta mesmo se a entrega retornar falha. Entradas com idade igual ou superior a 10 minutos são removidas na próxima verificação.
6. Chama `entregarPedido({ nome, empresa, contato, mensagem })`: `true` escolhe 200; `false`, 503.

O limite não é persistente nem compartilhado entre instâncias; reinício apaga as contagens. A identidade depende do cabeçalho recebido: este código não verifica a cadeia de proxies. Não há `Retry-After` emitido pela rota. Fontes: [rota, linhas 17–25](../apps/site/app/api/contato/route.ts#L17) e [limite, linhas 15–29](../apps/site/src/lib/pedidoDeContato.ts#L15).

## Respostas com JSON

O handler escolhe JSON quando o texto do cabeçalho `Accept` contém exatamente a substring `application/json`. Não há interpretação de prioridade ou de `q` nessa seleção. A resposta é um objeto com apenas `ok`; não inclui os dados enviados, mensagem, código de erro por campo ou identificador do pedido. Fonte: [rota, linhas 10–14](../apps/site/app/api/contato/route.ts#L10).

| HTTP | Corpo | Quando |
|---|---|---|
| 200 | `{ "ok": true }` | Isca preenchida e descartada, ou entrega que retorna `true` |
| 400 | `{ "ok": false }` | Obrigatório vazio, máximo excedido ou corpo que não pôde ser lido |
| 429 | `{ "ok": false }` | Limite por endereço atingido, após validação |
| 503 | `{ "ok": false }` | Entrega retorna `false`; é o comportamento atual de todo pedido válido admitido com isca vazia |

**Sucesso não é recibo de entrega:** o caminho da isca também retorna 200 sem chamar a entrega. Os testes de sucesso normal substituem `entregarPedido` por um mock; não demonstram envio real. Fontes: [rota, linha 17](../apps/site/app/api/contato/route.ts#L17), [mock, linhas 5–8](../apps/site/tests/unit/rota-contato.test.ts#L5) e [entrega atual, linhas 34–38](../apps/site/src/lib/pedidoDeContato.ts#L34).

O cliente atual decide pelo status HTTP (`Response.ok`), sem ler o JSON. Em sucesso troca o formulário pela confirmação; em erro HTTP ou rejeição de `fetch`, mantém os campos no DOM e mostra a opção de tentar novamente. O botão fica desabilitado durante o envio. Fontes: [formulário, linhas 19–34](../apps/site/src/componentes/contato/Formulario.tsx#L19) e [ações, linhas 55–59](../apps/site/src/componentes/contato/Formulario.tsx#L55).

## Respostas sem JSON e envio sem JavaScript

Sem a substring acima em `Accept`, inclusive sem o cabeçalho, todos os resultados tratados usam **303**, sem expor o 400/429/503 como status da resposta. O `Location` é construído na origem de `req.url`, com destino fixo pela língua:

| Resultado interno | `pt` | `en` |
|---|---|---|
| 200 | `/contato?estado=enviado` | `/en/contact?estado=enviado` |
| 400, 429 ou 503 | `/contato?estado=falha` | `/en/contact?estado=falha` |

As páginas leem `estado` e só aceitam `enviado` ou `falha` como estado inicial do formulário. Não recebem os campos de volta: sem JavaScript, a navegação não preserva o texto por este fluxo. O parâmetro é apenas apresentação, editável na URL, não uma consulta ou prova de entrega. Fontes: [redirecionamento, linhas 10–14](../apps/site/app/api/contato/route.ts#L10), [rotas, linha 9](../apps/site/src/lib/idioma.ts#L9), [página PT, linhas 6–8](../apps/site/app/(pt)/contato/page.tsx#L6), [página EN, linhas 6–8](../apps/site/app/(en)/en/contact/page.tsx#L6) e [estado inicial, linha 20](../apps/site/src/paginas/PaginaContato.tsx#L20).

## Limitações atuais e decisões futuras separadas

**Observado agora:** `entregarPedido` retorna `false` deliberadamente; serviço e destino de e-mail não foram escolhidos. Não há armazenamento do pedido, fila, prazo de entrega, retentativa automática, deduplicação ou suporte a `Idempotency-Key`. O limite de frequência não garante envio único. Se uma entrega real for conectada no futuro, a perda da resposta poderá deixar o cliente sem saber se houve entrega; esta versão não resolve esse caso. O handler também não captura uma eventual rejeição de `entregarPedido`, portanto a tabela de respostas não promete formato para essa exceção. Não há logs, métricas ou identificador de rastreio próprios nesta rota. Fontes: [handler](../apps/site/app/api/contato/route.ts#L6) e [entrega indisponível](../apps/site/src/lib/pedidoDeContato.ts#L34).

**Futuro, sem aprovação ou implementação nesta issue:** escolher o serviço e o destino, definir prazo e tratamento de falha/resultado desconhecido, garantia de repetição e observabilidade sem dados pessoais; revisar o limite conforme a hospedagem e seus proxies. Essas decisões exigem tarefa e portão da pessoa pela integradora quando mudarem o contrato, trouxerem serviço ou custo. A entrega indisponível continua bloqueando a publicação, conforme a [spec de contato, seções 1 e 4](superpowers/specs/2026-11-01-bugs-cta-celular-design.md). Nenhum endpoint ou formato de conversa com IA é definido aqui.

## Evidências e cobertura

| Fonte existente | O que cobre |
|---|---|
| [Unitários da rota, linhas 26–65](../apps/site/tests/unit/rota-contato.test.ts#L26) | Pedido válido com entrega simulada, contato/mensagem vazios, mensagem acima de 5000, isca, sexta tentativa, entrega falsa, 303 em inglês e idioma inválido voltando ao português |
| [Unitários do formulário, linhas 20–50](../apps/site/tests/unit/pagina-contato.test.tsx#L20) | Campos e envio nativo, confirmação, falha preservando o texto com JS e estado inicial |
| [E2E do contato, linhas 28–48 e 79–89](../apps/site/tests/e2e/pagina-contato.spec.ts#L28) | Sucesso simulado, falha real preservando texto com JS e envio sem JS voltando com falha |

Os limites exatos dos demais campos, expiração da janela, corpo ilegível, valores repetidos ou `File` e exceção da entrega foram descritos por leitura do código; esses casos não têm ensaio específico nos testes citados. Esta revisão não cria teste de comportamento novo: não há implementação nova. Notas dos limites visuais e das decisões 001–006 estão em [referências da arquitetura](referencias/arquitetura.md#2026-11-02--limites-das-correções-e-contrato-observado-issue-28).
