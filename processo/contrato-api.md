# Contrato da API de contato

**Estado:** contrato B aprovado pela pessoa em 2026-11-05, issue #39, gate `gate_a9c750e8db8e`, conforme decisão registrada pela integradora: “aprovado pode seguir” para o texto de `9a1ce73` + `62ec98a` e para **Resend** como serviço de entrega. O [registro 007](arquitetura.md#007--contato-b-contrato-aprovado-e-serviço-de-entrega) resume a decisão. A aprovação permite despachos de construção, não comprova implementação ou ativação.

O protocolo normativo novo está abaixo; o [fluxo legado observado](#fluxo-legado-observado-sem-versão-explícita) fica preservado em seção própria. O legado continua atendendo pedidos sem `versao` até migração autorizada. Modelo/API/modalidade Gemini, orçamento, privacidade, configuração e dados privados de entrega permanecem definições próprias; nenhum valor real entra neste documento. Aprovação de contrato/Resend não autoriza merge, deploy ou chamadas reais.

## Contato B — protocolo normativo `contato-b.1`

**Base aprovada:** [spec 4.6](../docs/superpowers/specs/2026-10-31-estrutura-site-design.md#46-contato-12), [reconciliação B](../docs/superpowers/specs/2026-11-02-contato-b-correcao-design.md), [protótipo B](../docs/superpowers/specs/prototipos-correcao/contato-b.html), [Segurança](seguranca.md) e proposta completa dos commits citados, incluindo a preservação de incerteza em JS e HTML. Os limites de ativação ao fim desta seção não alteram a interface aprovada.

### Decisão e limites

Reaproveitar Next e o formulário; acrescentar **somente `POST /api/contato/conversa`** e evoluir **`POST /api/contato`** para o envio confirmado. Gemini pergunta/sugere; front prepara resumo editável dos quatro campos; visitante confirma; servidor valida novamente e entrega. Sem streaming: uma resposta completa permite validar antes de exibir; a digitação visual respeita movimento reduzido. Sem banco, fila, sessão persistente, snapshot cifrado, consulta histórica, polling, webhook, ferramentas do modelo ou serviço adicional.

| Alternativa | Consequência | Decisão |
|---|---|---|
| Deduplicar só no `Map` do processo | Reinício e múltiplas instâncias permitem duplicação | Não usar como garantia de envio único |
| Corpo confirmado pelo visitante + mesma chave no provedor, com prazo limitado | Resolve repetição desse envio, sem guardar pedido no site | Adotada com Resend; comprovar a integração e a deduplicação antes da ativação |
| Registro compartilhado/histórico | Permite retomada e operação sem a aba, mas acrescenta dependência/dados/custo | Só propor depois de necessidade concreta; não é requisito inferido do contato |

**Sucesso:** o provedor realmente aceitou o envio para o destino configurado e devolveu identificador verificável ao servidor. Isso autoriza `estado:"aceito"`, confirmação textual de envio ao serviço e F; não promete recebimento SMTP, caixa de entrada, leitura ou resposta humana. Resposta Gemini, confirmação local, isca e 2xx genérico não bastam. A fronteira de aceitação está aprovada; a redação final de sucesso/pendência continua em C2 e privacidade.

**Garantia limitada:** uma intenção reutiliza chave e corpo externo por até **23 h desde sua emissão**, dentro da janela de deduplicação comprovada do provedor. Não é deduplicação por pessoa ou garantia ilimitada. O raciocínio de repetir a mesma operação vem da [Stripe](https://stripe.com/blog/idempotency). O serviço escolhido é **Resend**, que [documenta 24 h, replay e conflitos de corpo/concorrência](https://resend.com/docs/dashboard/emails/idempotency-keys). A integração deve comprovar essas garantias; trocar de fornecedor exige decisão própria. Após resultado incerto, texto/chave permanecem e não se cria outra intenção automaticamente.

### Estrutura, intenção e dados

Página PT/EN controla composição B, cópia local, revisão e confirmação; esfera apenas recebe o estado, preservando Início/404. Handler de conversa chama Gemini; handler de contato valida/confirma e chama adaptador de entrega. Destino/remetente/credenciais/template são exclusivamente do servidor. Não há transação ou migração persistente no site.

A página emite um token de **intenção sem dados pessoais**, necessário apenas para limitar reenvio: `{v:1,id:UUID,idioma:"pt"|"en",emitidaEm:ISO,expiraEm:ISO,canal:string}`; expiração fixa em emissão + 23 h. `canal` é versão opaca da conta/configuração/template de entrega. Formato `v1.<payload base64url>.<HMAC-SHA256>`, até 1024 caracteres; chave só no servidor, assinatura em tempo constante, parsing/tipos/horários validados. `node:crypto` já oferece [HMAC e comparação segura](https://nodejs.org/api/crypto.html); não instalar biblioteca. Manter chaves/canal por toda a validade. Não trocar provedor/conta/template ao repetir: reconstruir o mesmo payload pela versão assinada, sem timestamps ou IDs novos na mensagem externa.

**Necessidade da assinatura, em concreto:** se o cliente pudesse renovar a data mantendo a chave, repetiria depois das 24 h do provedor e poderia enviar de novo. A intenção assinada impede estender essa autorização; a chave é derivada no servidor como `contato/<UUID da intenção>`. Não precisa conter/cifrar os quatro campos: provedor recusa corpo diferente para a mesma chave já usada.

Token fica em campo oculto/estado da página e no corpo do POST, nunca URL, cookie, storage persistente, log ou captura. Páginas que o emitem precisam renderização por requisição e `Cache-Control: private, no-store`, sem token compartilhado em HTML estático/CDN. Nova aba/novo GET pode criar nova intenção: não há deduplicação entre intenções. Resumo é a cópia do próprio visitante; `confirmar=true` é a manifestação explícita, não prova criptográfica de leitura. O servidor não afirma revogar resumo antigo nem controlar revisão global sem estado.

Antes do efeito, o cliente fixa uma cópia do corpo confirmado. Resultado incerto bloqueia sua substituição por dados editados e conserva a mesma intenção/chave; servidor também recusa chave diferente da derivada. Retentar com corpo válido diferente devolve conflito do provedor, não outro envio. Para outro projeto, nova intenção é ação deliberada, nunca alternativa sugerida para contornar incerteza.

### Interfaces compartilhadas entre Front e Back

Clientes: somente site PT/EN com JS e formulário nativo, publicados junto com o back; sem integração de terceiros ou app móvel. Sem versão no caminho. Na rota existente, o campo `versao=contato-b.1` seleciona o novo fluxo; ausência continua no fluxo observado (valor de versão diferente de `contato-b.1` é 422), com respostas `{ok}`/303 e entrega deliberadamente indisponível até migração autorizada. Isso impede cliente antigo que usa só `Response.ok` de confundir novo 202 com sucesso. A versão de entrada identifica o protocolo; esta revisão documental não é versão de fornecedor.

**Regras comuns novas:** HTTPS e `Origin` igual à origem fixa de configuração nos POST; ausência/divergência é 403, sem CORS de terceiros. Limite de **64 KiB efetivamente recebidos antes do parsing**, inclusive corpo em partes; 413 por excesso, 400 por sintaxe ilegível, 415 por tipo não suportado. Rejeitar tipo errado, arquivo, campo duplicado/desconhecido com 422; não transformar objeto/arquivo em string. Não refletir `Host`, `Origin` ou `returnTo` como destino. Respostas privadas sem cache, sem corpo/token/resposta bruta de provedor nos logs.

| Método/caminho | Entrada e limites | Resposta/efeito |
|---|---|---|
| `POST /api/contato/conversa` | JSON `{idioma,turnoId:UUID,historico,mensagem}` e `Accept: application/json`; idioma `pt/en`; mensagem 1–2000 após trim; histórico até 9 pares completos `{papel,texto}`, alternados; papel `usuario` ou `assistente` e texto string; usuário até 2000, assistente até 1500; texto total até 10.000 unidades UTF-16 | 200 `{turnoId,resposta,mensagemSugerida}`; resposta 1–1500, sugestão até 5000 ou null. Histórico é entrada não confiável, não autoridade. Não confirma/entrega |
| `POST /api/contato`, revisão nativa | FormData ou URL-encoded: campos existentes `nome,empresa,contato,mensagem,idioma,site`, mais `versao=contato-b.1,intencao,acao=revisar` | 200 HTML com resumo dos quatro campos e botão Confirmar e enviar; Ajustar reabre campos preenchidos. Sem chamada Gemini/provedor. Também pode responder JSON `{ok:true,estado:"revisao",pedido}` se solicitado |
| `POST /api/contato`, envio | Mesmo formato/campos, `acao=enviar`, `confirmar=true` literal e chave derivada em `Idempotency-Key` (JS) ou campo oculto `chave` (nativo); se ambos presentes, devem coincidir | Validar novamente; enviar só o corpo confirmado ao canal assinado. 200 `{ok:true,estado:"aceito",repetirAte,requestId}` apenas com aceitação verificável; 202 `{ok:false,estado:"incerto",codigo:"RESULTADO_INCERTO",repetirAte,requestId}` se desconhecido |

Na conversa, outros formatos/Accept são 415/406; métodos não listados são 405 com `Allow`. A rota de contato **não ganha entrada JSON**: mantém FormData/URL-encoded; `Accept: application/json` seleciona resposta JSON, demais retornam HTML no fluxo novo. Nenhuma listagem/paginação ou endpoint de confirmação/estado separado.

`Pedido = {nome:string,empresa:string,contato:string,mensagem:string}`. Após `trim()`: nome/contato obrigatórios até 200 unidades UTF-16 cada; empresa opcional/ausente vira `""`, até 200; mensagem obrigatória até 5000. Preservar quebras internas. Contato é livre e nunca vira `Reply-To`, destinatário, cabeçalho ou URL. Idioma novo deve ser `pt/en` e coincidir com a intenção. `site` preenchido, inclusive só com espaços, descarta sem chamada externa: no fluxo novo retorna 202 `{ok:true,estado:"recebido",requestId}`, sem evidência/F. Fluxo legado não muda por esta adoção.

Erros de conversa: `{erro:{codigo,mensagem,repetivel},requestId}`. Erros do contato novo: `{ok:false,estado:"falha",codigo,campos?,repetivel,requestId}`; `campos` associa campo a código estável. `ENVIO_EM_ANDAMENTO` usa `estado:"incerto"`, com `repetirAte` e `repetivel:true`. `falha` descreve a tentativa respondida, não prova recusa de tentativas anteriores da mesma intenção. `requestId` é UUID aleatório; `repetirAte` é ISO UTC da intenção. Cliente ignora campo novo e trata estado desconhecido sem confirmar sucesso. Remover/mudar tipo/semântica exige portão. Nenhum ID/dado do provedor precisa ser exposto. Falha antes de identificar a versão pode usar o erro legado `{ok:false}`; o cliente novo trata ausência de código/estado como erro e mantém sua cópia.

### Roteiro, prazos e limites de uso

Roteiro técnico mínimo aprovado: entender o projeto, perguntar uma lacuna de objetivo/contexto por turno, sugerir descrição fiel e oferecer revisão. Nome, empresa e contato são conferidos nos campos; IA não os inventa. Não pedir senha, documento, dado financeiro/sensível nem prometer preço, prazo, disponibilidade ou resultado. Instrução fixa do servidor fica fora do histórico do visitante; não aceitar papel `system`, ferramentas ou chamada de entrega. Texto livre pode conter dado pessoal espontâneo; não prometer anonimização.

Gemini retorna `{resposta:string,mensagemSugerida:string|null}`. Servidor valida tamanho/tipo/conteúdo antes de exibir; resposta vazia, bloqueada, truncada, inválida ou promessa detectada vira 502 `IA_RESPOSTA_INVALIDA`. [Saída estruturada Google](https://aistudio.google.com/docs/structured-output) não dispensa validação. Filtro não garante veracidade nem captura toda promessa: roteiro/ensaios são necessários. O resumo local copia sugestão/última edição para campos editáveis e não dispara envio; a edição da alternativa, inclusive apagamento, prevalece ao ir e voltar.

| Trabalho | Prazo | Depois do prazo |
|---|---|---|
| Conversa Gemini | Uma chamada até 15 s; HTTP até 20 s; JS até 25 s | 504 `IA_TIMEOUT`, conservar entrada/histórico e oferecer formulário; sem resposta parcial/simulada |
| Entrega | Uma tentativa até 8 s; HTTP até 12 s; JS até 15 s | Aceitação desconhecida é 202 `incerto`, nunca falha conclusiva nem F |
| Cancelamento/rede perdida | Abortar espera no cliente | Não cancela envio já iniciado; conservar corpo/chave para repetir com segurança |

Teto de entrada de 8192 tokens, verificado pelo mecanismo oficial do modelo escolhido, e até 2048 tokens gerados incluindo raciocínio se aplicável. Contagem separada tem prazo de 3 s dentro dos 20 s e entra no custo. Modelo/API precisam demonstrar suporte; ainda não foram escolhidos. O modelo deve ser exigido por configuração exclusiva do servidor, sem valor padrão; nomes de variáveis ainda não estão determinados neste contrato. Limite de histórico é por requisição, **não cota por pessoa**: não impede replay/computação adicional.

Preservar 5 tentativas válidas de envio/origem/10 min como contenção local; revisão não chama entrega/não consome essa cota. Limitar a 10 chamadas Gemini/origem/10 min; 429 com segundos restantes em `Retry-After`. Repetição de envio pode consumir a proteção de frequência, mas mantém a chave externa. O `Map` atual é por instância; não garante cota global. Proxy deve impor origem confiável, não aceitar livremente o primeiro `x-forwarded-for`.

**Ativação pública depende de controle efetivo de abuso/custo na infraestrutura/provedor aprovados**, orçamento mensal e limite diário medidos/ensaiados. Sem isso ou sem configuração, Gemini responde 503 e alternativa não usa IA. Não escolher Redis/CAPTCHA/banco para completar a lacuna. Se a infraestrutura escolhida não resolver, levar necessidade/custo ao portão. [Cotas Gemini](https://aistudio.google.com/docs/rate-limits) dependem de modelo/projeto, não equivalem automaticamente a orçamento; não há custo mensal fundamentado sem modelo, preços, histórico reenviado, contagem/raciocínio e plano de e-mail.

Os [termos Gemini](https://aistudio.google.com/docs/terms) distinguem modalidade paga/não paga e restringem informação pessoal/confidencial/sensível nos serviços não pagos. Escolher modalidade apropriada e aprovar privacidade antes de conversas reais; pago não significa retenção zero. Modelo/API/versão e modalidade Gemini permanecem decisões separadas; Resend já foi escolhido para a entrega.

### Repetição, falha recuperável e retorno sem JS

- Validar assinatura, idioma, campos e prazo antes do envio; chave diferente da derivada é 422 `CHAVE_INVALIDA`. Não iniciar chamada externa nos últimos 30 s da intenção. Repetir só enquanto válida, com os mesmos campos normalizados, `canal`, chave e bytes de payload. A versão de template não introduz valor volátil entre tentativas.
- Repetição da mesma chave/corpo devolve o resultado externo original/mesmo ID dentro da janela do provedor; resposta HTTP local pode ter outro requestId. Concorrência em andamento: 409 `ENVIO_EM_ANDAMENTO`, estado `incerto`, `Retry-After: 2`; chave com outro corpo válido: 409 `INTENCAO_JA_UTILIZADA`, sem criar chave nova. Queda/reinício é resolvida pelo provedor, não por memória da instância.
- Aceitação incerta preserva a cópia confirmada. Cliente pode repetir envio duas vezes, após 2 s e 4 s com variação de até 500 ms, respeitando `Retry-After`; depois, ação explícita ainda na janela. Não repetir automaticamente computação Gemini: timeout pode ter sido cobrado; `turnoId` só evita inserir mensagem duplicada no DOM.
- Expiração: 410 `INTENCAO_EXPIRADA`, sem efeito externo nem renovação automática. Se já houve incerteza, não orientar reenviar por outra intenção/formulário. Expiração não prova falha; integradora define conferência manual com o fornecedor aprovado. Sem tokens/texto preservados não existe recuperação garantida; não há consulta histórica/alerta por pedido com aba fechada.

**Ações para JS e HTML:** enquanto qualquer tentativa da intenção puder ter sido aceita, a cópia confirmada, a intenção e a chave são imutáveis. 429/503/409 de uma repetição não apagam essa incerteza, mesmo com `estado:"falha"` ou `repetivel:false`; uma recusa local não resolve o resultado anterior.

| Evidência do envio | Ações permitidas em JS e HTML |
|---|---|
| Revisão antes de qualquer tentativa de envio | Ajustar campos e revisar/confirmar; sem F |
| 202 `incerto`, 409 `ENVIO_EM_ANDAMENTO` ou outra resposta sem resolver possível aceitação anterior (inclusive 429/503/409) | Mostrar pendência e a cópia confirmada sem edição; repetir somente o mesmo envio na janela, respeitando `Retry-After` e o corte dos últimos 30 s; sem Ajustar, nova intenção, troca de formulário ou F |
| Incerteza sem tempo válido para repetir, inclusive intenção expirada | Manter cópia e pendência; orientar conferência manual pela integradora com o fornecedor aprovado; sem repetir, Ajustar, nova intenção ou F |
| Aceitação verificável da mesma intenção/corpo | Confirmação/F; encerrar a pendência |

No HTML de `acao=enviar`, sem histórico persistido, o servidor não presume que é a primeira tentativa: se a resposta não excluir aceitação anterior, aplica a linha de pendência. O formulário de repetição preserva campos ocultos com a mesma cópia/intenção/chave e `acao=enviar&confirmar=true`; não oferece Ajustar nem cria intenção. Não se acrescenta estado persistido, token ou endpoint para expressar essa regra. JS conserva a pendência local ao receber erro da repetição; HTML apresenta a mesma restrição conservadora.

**Nativo:** o primeiro POST `acao=revisar` devolve HTML completo do contato, idioma da intenção, valores normalizados escapados e ação de confirmar. A segunda submissão inclui os quatro campos, intenção original, chave e `confirmar=true`; o servidor não confia nos campos ocultos: valida tudo novamente. Esta revisão adicional não é endpoint nem snapshot persistido. A alternativa com JS pode fazer a revisão local e enviar diretamente a cópia explicitamente confirmada.

Erro tratado no fluxo novo devolve **HTML no próprio POST com status real**, campos/tokens preservados, erro por campo e resumo de erros/foco. Não usar 303 de erro ou dado pessoal em URL/cookie. Página sob `/api/contato` precisa casca/formulário reutilizados, links de navegação/assets absolutos e idioma certo. Os [Route Handlers Next 15](https://nextjs.org/docs/15/app/api-reference/file-conventions/route) aceitam `Request`/`Response` e FormData; a construção deve comprovar a renderização compartilhada sem importar internals do framework.

Respostas privadas: `Cache-Control: private, no-store` e `X-Robots-Tag: noindex`; respostas HTML nativas do contato usam `Referrer-Policy: same-origin` para permitir os POSTs internos de correção, confirmação e repetição mantendo `Origin` HTTPS exato; respostas JSON conservam `Referrer-Policy: no-referrer`. Texto/atributos permanecem escapados, sem analytics/recurso terceiro, sem pedido/intenção/chave na URL e com a CSP preservada. Não interpretar `<b>` como HTML. Servidor retém entrada só durante a requisição; texto/token vivem no DOM/memória enquanto a página existir. Expiração invalida token, não apaga dispositivo/histórico. `no-store` não garante apagar formulário do navegador. Corpo ilegível/excessivo, queda antes do HTML, fechamento/recarregamento, troca de idioma e expiração não garantem restauração sem JS; explicar o limite, sem afirmar que há rascunho salvo. JS só remove sua cópia após `aceito` ou descarte explícito.

Depois de aceitação, provedor e caixa da equipe têm retenção externa própria. Gemini também trata/retém dados conforme modalidade. Finalidade, local, prazo e exclusão dependem de privacidade/Segurança; expirar intenção não apaga essas cópias. Proposta de logs técnicos por 7 dias, a validar em C5: só requestId, etapa, código, HTTP, duração e contagens agregadas de uso/erro. Nunca texto, nome, empresa, contato, token, chave, IP bruto, destino ou resposta bruta. Proxy/APM precisam suprimir corpos e cabeçalhos privados; não há armazenamento local de pedidos para observabilidade.

### Exemplos do contrato aprovado

Dados fictícios; marcadores de intenção não são tokens válidos; **nenhuma chamada real foi executada**. Copy das amostras é técnica, não aprovação de C2.

**Conversa, sem entrega:**

```http
POST /api/contato/conversa HTTP/1.1
Origin: https://floway.example
Accept: application/json
Content-Type: application/json

{"idioma":"pt","turnoId":"10000000-0000-4000-8000-000000000001","historico":[],"mensagem":"Quero um site institucional para apresentar serviços."}
```

```json
{"turnoId":"10000000-0000-4000-8000-000000000001","resposta":"Qual objetivo principal o site deve atender?","mensagemSugerida":null}
```

HTTP 200. Front apresenta campos editáveis e resumo antes de habilitar confirmar; qualquer sugestão é revisável e não autoriza entrega.

**Envio de corpo confirmado na intenção emitida em `2026-11-04T15:00:00Z`:**

```http
POST /api/contato HTTP/1.1
Origin: https://floway.example
Accept: application/json
Content-Type: application/x-www-form-urlencoded
Idempotency-Key: contato/30000000-0000-4000-8000-000000000001

versao=contato-b.1&acao=enviar&confirmar=true&intencao=INTENCAO_PT_FICTICIA&nome=Pessoa+Exemplo&empresa=Empresa+Exemplo&contato=pessoa%40example.com&mensagem=Site+institucional+para+apresentar+servicos.&idioma=pt&site=
```

```json
{"ok":true,"estado":"aceito","repetirAte":"2026-11-05T14:00:00Z","requestId":"20000000-0000-4000-8000-000000000001"}
```

HTTP 200 apenas com resposta verificável do provedor, suficiente para confirmação/F na fronteira aprovada. **Timeout desconhecido** do mesmo envio: HTTP 202, sem F:

```json
{"ok":false,"estado":"incerto","codigo":"RESULTADO_INCERTO","repetirAte":"2026-11-05T14:00:00Z","requestId":"20000000-0000-4000-8000-000000000002"}
```

Repetir usa exatamente o corpo/intenção/chave acima, inclusive após perder a resposta. O provedor retorna o mesmo resultado/ID, sem outro efeito dentro da janela; servidor pode então responder 200 aceito. Se alterar mensagem mantendo chave já usada: 409 `INTENCAO_JA_UTILIZADA`; se mudar chave: 422 `CHAVE_INVALIDA` antes da chamada. Nenhuma das duas falhas orienta criar outra intenção para contornar o resultado.

| Caso | HTTP/cabeçalho | Corpo JSON completo |
|---|---|---|
| Contato vazio | 422 | `{"ok":false,"estado":"falha","codigo":"VALIDACAO","campos":{"contato":"OBRIGATORIO"},"repetivel":false,"requestId":"20000000-0000-4000-8000-000000000003"}` |
| Frequência atingida antes da chamada | 429, `Retry-After: 120` | `{"ok":false,"estado":"falha","codigo":"LIMITE_ATINGIDO","repetivel":true,"requestId":"20000000-0000-4000-8000-000000000004"}` |
| Entrega indisponível, certeza de não aceitação desta tentativa | 503, `Retry-After: 30` | `{"ok":false,"estado":"falha","codigo":"ENTREGA_INDISPONIVEL","repetivel":true,"requestId":"20000000-0000-4000-8000-000000000005"}` |
| IA desabilitada/configuração ausente | 503 | `{"erro":{"codigo":"IA_INDISPONIVEL","mensagem":"Use o formulário simples.","repetivel":false},"requestId":"20000000-0000-4000-8000-000000000006"}` |
| IA sem resposta em 15 s | 504 | `{"erro":{"codigo":"IA_TIMEOUT","mensagem":"A resposta demorou. Texto preservado.","repetivel":false},"requestId":"20000000-0000-4000-8000-000000000007"}` |
| Provedor processando mesma chave | 409, `Retry-After: 2` | `{"ok":false,"estado":"incerto","codigo":"ENVIO_EM_ANDAMENTO","repetirAte":"2026-11-05T14:00:00Z","repetivel":true,"requestId":"20000000-0000-4000-8000-000000000008"}` |

**Sequência 202 → 429:** após o 202 acima, repetir o corpo/intenção/chave originais recebe o 429 `LIMITE_ATINGIDO` da tabela, com `Retry-After: 120`. Em JS, continua pendente; sem JS, o 429 HTML mostra a mesma cópia imutável e ação de repetir o mesmo envio após pelo menos 120 s, somente se ainda fora dos últimos 30 s da validade. Sem Ajustar, nova intenção ou F. Se a espera ultrapassar essa janela, não repetir: orientar conferência manual após expirar, preservando cópia e pendência. Um 503/409 na repetição mantém as mesmas restrições; somente evidência do resultado da intenção resolve a incerteza.

Outros códigos no formato da rota: 400 `CORPO_INVALIDO`; 401 `INTENCAO_INVALIDA`; 403 `ORIGEM_INVALIDA`; 406 `RESPOSTA_NAO_SUPORTADA`; 410 `INTENCAO_EXPIRADA`; 413 `CORPO_EXCESSIVO`; 415 `TIPO_NAO_SUPORTADO`; 422 `VALIDACAO`/`CHAVE_INVALIDA`; 409 `INTENCAO_JA_UTILIZADA`; 502 `IA_RESPOSTA_INVALIDA` ou `ENTREGA_RECUSADA` (recusa permanente conclusiva, `repetivel:false`). `confirmar` ausente/falso no envio é 422. Erro inesperado antes de efeito: 500 `ERRO_INTERNO`; depois de possível envio, manter incerteza mesmo se a conexão cair sem envelope. Erro genérico de rede/5xx não prova recusa; o adaptador deve distinguir os casos.

**Sem JS, EN:** `POST /api/contato` URL-encoded, sem Accept JSON, corpo `versao=contato-b.1&acao=revisar&intencao=INTENCAO_EN_FICTICIA&nome=Example+Person&empresa=&contato=&mensagem=Company+website&idioma=en&site=` retorna **422 HTML**, `lang="en"`, campos escapados/erro de contato e intenção original, sem `Location`. Corrigir contato retorna 200 HTML com resumo; confirmar usa `acao=enviar&confirmar=true&chave=contato%2F30000000-0000-4000-8000-000000000001`, além dos mesmos quatro campos/intenção/idioma/isca/versão. Resultado incerto é 202 HTML com a cópia confirmada e botão de repetir o mesmo envio; 409 em andamento e 429/503 da repetição preservam pendência/cópia e seguem as ações da tabela, sem Ajustar; aceitação real é 200 HTML com confirmação. PT usa intenção PT/`lang="pt"`. Nome, contato, mensagem e token nunca vão à URL.

### Falhas, impacto e revisão

| Fluxo/dependência | Criticidade / chance estimada sem medição | Mitigação e detecção |
|---|---|---|
| Conversa/Gemini lento, fora do ar, quota ou saída inválida | Conveniência / média, externo | Prazo, erro claro e alternativa sem Gemini; métricas agregadas de duração/código/tokens |
| Envio/configuração recusada | Crítico / média | Sem sucesso falso ou troca de canal; código de recusa e alerta operacional agregado |
| Envio/rede/resposta perdida | Crítico / média | Mesmo corpo/chave dentro da janela; incerteza preserva dados; contagem agregada de incerteza/repetição |
| Proxy/abuso/custo | Crítico / alta em rota pública | Não ativar IA sem controle aprovado; limite local não basta; cotas/429/consumo |
| Retorno/servidor/navegador sem rede | Crítico / média | Preservação HTML só quando há resposta; cópia local com JS; disponibilidade sem corpo em logs |
| WebGL/movimento | Fraco / média em dispositivos limitados | Texto/formulário independentes; explorar modos alternativos |

Quadro adapta a [análise de falhas Azure](https://learn.microsoft.com/en-us/azure/well-architected/reliability/failure-mode-analysis), sem importar infraestrutura de grande escala. Prazos/cotas são limites do contrato, não medições de produção. Sem disjuntor distribuído/redundância novos; prazo, limitação, alternativa e desligamento operacional são proporcionais aqui.

Front implementa estado B, resumo/ajuste, cópia confirmada, falhas e retorno nativo; Back implementa os dois caminhos/adaptador conforme este contrato; Segurança revisa entrada, tokens, dados e abuso; DevOps confirma proxy, duração das funções, chaves/canal e orçamento. `entregarPedido(): Promise<boolean>` atual não expressa incerteza: mudar sua interface será despacho próprio, não esta tarefa. C2 fecha copy/privacidade/PT/EN. Não alterar marca/hero/galeria/dependências ou transferir conversa para a Início.

Migração: publicar consumidor que envia versão explícita e lê `estado`, sem transformar `Response.ok` em sucesso. Não espelhar envio nos fluxos antigo/novo. Reversão desabilita novas intenções/IA, preservando processamento idempotente de intenções já emitidas e suas chaves/canal até expiração; não levar pedido incerto à rota antiga. Revogar chave em emergência impede repetição e exige decisão operacional; não prova cancelamento externo. Sem migração de dados.

Na construção, TDD e revisão independente devem provar: IA não envia/confirma; resumo ajustável; mesma chave/corpo concorrente e após reinício/perda de resposta gera um efeito no provedor; payload diferente conflita; expiração/adulteração não chama serviço; isca/202/IA não formam F; só aceitação real confirma. Cobrir 429, recusa, timeout, resposta inválida, cancelamento, HTML PT/EN, `<b>` literal, duplicados/arquivos/excesso de corpo e edição/apagamento na alternativa. Fixture/mocks só nos testes; resposta interceptada não demonstra envio externo. Comprovar adaptador, configuração e controles de produção em ambiente autorizado.

**Verificação documental desta tarefa:** fontes/links, parsing dos exemplos JSON, coerência de tipos/estados/prazos e `git diff --check`; sem testes de busca de texto. Sem código: suíte/tipos/build/navegador, TDD e chamadas reais de IA/e-mail não foram executados nesta entrega. Revisão documental independente e despachos de construção seguem com a integradora; esta adoção não autoriza merge ou deploy.

### Limites de ativação e decisões ainda necessárias

| Responsável | Definição ainda pendente | Bloqueia |
|---|---|---|
| Pessoa, pela integradora | Conta/domínio Resend, destino/remetente privados, credenciais e custo; valores reais somente em configuração do servidor | Configuração, deduplicação comprovada e entrega real |
| Pessoa + Design e Front/C2 | Copy final de sucesso/pendência, privacidade/PT/EN, detalhamento do roteiro aprovado e composição móvel/baixa | Promessas e aceite visual/textual do produto |
| Pessoa + Segurança | Modelo/API/modalidade Gemini, retenção externa e orçamento fundamentado | IA pública; nenhuma escolha por inferência |
| Segurança/Back/DevOps; pessoa para novo custo/serviço | Proxy, limite efetivo de abuso/custo, instrumentação, manutenção de chaves/canal e conferência manual após incerteza/expiração | Publicação; `Map` local não comprova proteção global |

Valores de timeout/tamanho/TTL, intenção assinada, ausência de persistência e fronteira de aceitação são escolhas **aprovadas neste portão**. Retomada sem token, revogação de resumo, deduplicação além da janela ou operação com aba fechada exigiriam necessidade nova explícita, avaliada antes de escolher serviço. Nenhum push, PR, comentário externo, merge ou deploy é consequência desta entrega.

## Fluxo legado observado, sem versão explícita

**Preservação histórica:** o bloco abaixo mantém a descrição da interface existente conferida na issue #28; as menções a serviço ainda não escolhido descrevem aquele levantamento de 2026-11-02, anterior à escolha de Resend acima. Não representa implementação do protocolo B nem perde validade para o fluxo sem `versao` por esta adoção documental.

**Estado:** rascunho descritivo da interface existente, conferido em 2026-11-02 sobre `3c0993c` (issue #28). Este registro não aprova mudança de contrato nem cria uma API de conversa com IA. A rota não tem versão explícita; a data e o commit identificam esta revisão documental.

### Consumidores e fronteira

O consumidor identificado é o formulário de `/contato` e `/en/contact`, publicado junto com a rota. Com JavaScript, usa `fetch`; sem JavaScript, usa o envio nativo do formulário. A esfera é decoração independente: não recebe pedidos nem representa o resultado da entrega. Não há autenticação, sessão ou chave de API exigida por este handler. Não há integração de terceiros identificada no código revisado. Fontes: [formulário, linhas 19–43](../apps/site/src/componentes/contato/Formulario.tsx#L19), [página, linhas 14–24](../apps/site/src/paginas/PaginaContato.tsx#L14) e [handler completo](../apps/site/app/api/contato/route.ts#L1).

### Requisição existente: `POST /api/contato`

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

#### Ordem de processamento e limite

1. Lê o corpo e escolhe o idioma.
2. Descarta a isca preenchida, com resposta de sucesso.
3. Normaliza e valida o pedido; inválido termina com 400 no modo JSON.
4. Obtém o primeiro item de `x-forwarded-for`, separado por vírgula e aparado; se vazio/ausente, usa a chave compartilhada `desconhecido`.
5. Admite até **5 tentativas válidas por endereço em uma janela móvel de 10 minutos**, em memória no processo. A sexta é recusada; uma tentativa admitida conta mesmo se a entrega retornar falha. Entradas com idade igual ou superior a 10 minutos são removidas na próxima verificação.
6. Chama `entregarPedido({ nome, empresa, contato, mensagem })`: `true` escolhe 200; `false`, 503.

O limite não é persistente nem compartilhado entre instâncias; reinício apaga as contagens. A identidade depende do cabeçalho recebido: este código não verifica a cadeia de proxies. Não há `Retry-After` emitido pela rota. Fontes: [rota, linhas 17–25](../apps/site/app/api/contato/route.ts#L17) e [limite, linhas 15–29](../apps/site/src/lib/pedidoDeContato.ts#L15).

### Respostas com JSON

O handler escolhe JSON quando o texto do cabeçalho `Accept` contém exatamente a substring `application/json`. Não há interpretação de prioridade ou de `q` nessa seleção. A resposta é um objeto com apenas `ok`; não inclui os dados enviados, mensagem, código de erro por campo ou identificador do pedido. Fonte: [rota, linhas 10–14](../apps/site/app/api/contato/route.ts#L10).

| HTTP | Corpo | Quando |
|---|---|---|
| 200 | `{ "ok": true }` | Isca preenchida e descartada, ou entrega que retorna `true` |
| 400 | `{ "ok": false }` | Obrigatório vazio, máximo excedido ou corpo que não pôde ser lido |
| 429 | `{ "ok": false }` | Limite por endereço atingido, após validação |
| 503 | `{ "ok": false }` | Entrega retorna `false`; é o comportamento atual de todo pedido válido admitido com isca vazia |

**Sucesso não é recibo de entrega:** o caminho da isca também retorna 200 sem chamar a entrega. Os testes de sucesso normal substituem `entregarPedido` por um mock; não demonstram envio real. Fontes: [rota, linha 17](../apps/site/app/api/contato/route.ts#L17), [mock, linhas 5–8](../apps/site/tests/unit/rota-contato.test.ts#L5) e [entrega atual, linhas 34–38](../apps/site/src/lib/pedidoDeContato.ts#L34).

O cliente atual decide pelo status HTTP (`Response.ok`), sem ler o JSON. Em sucesso troca o formulário pela confirmação; em erro HTTP ou rejeição de `fetch`, mantém os campos no DOM e mostra a opção de tentar novamente. O botão fica desabilitado durante o envio. Fontes: [formulário, linhas 19–34](../apps/site/src/componentes/contato/Formulario.tsx#L19) e [ações, linhas 55–59](../apps/site/src/componentes/contato/Formulario.tsx#L55).

### Respostas sem JSON e envio sem JavaScript

Sem a substring acima em `Accept`, inclusive sem o cabeçalho, todos os resultados tratados usam **303**, sem expor o 400/429/503 como status da resposta. O `Location` é construído na origem de `req.url`, com destino fixo pela língua:

| Resultado interno | `pt` | `en` |
|---|---|---|
| 200 | `/contato?estado=enviado` | `/en/contact?estado=enviado` |
| 400, 429 ou 503 | `/contato?estado=falha` | `/en/contact?estado=falha` |

As páginas leem `estado` e só aceitam `enviado` ou `falha` como estado inicial do formulário. Não recebem os campos de volta: sem JavaScript, a navegação não preserva o texto por este fluxo. O parâmetro é apenas apresentação, editável na URL, não uma consulta ou prova de entrega. Fontes: [redirecionamento, linhas 10–14](../apps/site/app/api/contato/route.ts#L10), [rotas, linha 9](../apps/site/src/lib/idioma.ts#L9), [página PT, linhas 6–8](../apps/site/app/(pt)/contato/page.tsx#L6), [página EN, linhas 6–8](../apps/site/app/(en)/en/contact/page.tsx#L6) e [estado inicial, linha 20](../apps/site/src/paginas/PaginaContato.tsx#L20).

### Limitações atuais e decisões futuras separadas

**Observado agora:** `entregarPedido` retorna `false` deliberadamente; serviço e destino de e-mail não foram escolhidos. Não há armazenamento do pedido, fila, prazo de entrega, retentativa automática, deduplicação ou suporte a `Idempotency-Key`. O limite de frequência não garante envio único. Se uma entrega real for conectada no futuro, a perda da resposta poderá deixar o cliente sem saber se houve entrega; esta versão não resolve esse caso. O handler também não captura uma eventual rejeição de `entregarPedido`, portanto a tabela de respostas não promete formato para essa exceção. Não há logs, métricas ou identificador de rastreio próprios nesta rota. Fontes: [handler](../apps/site/app/api/contato/route.ts#L6) e [entrega indisponível](../apps/site/src/lib/pedidoDeContato.ts#L34).

**Futuro, sem aprovação ou implementação nesta issue:** escolher o serviço e o destino, definir prazo e tratamento de falha/resultado desconhecido, garantia de repetição e observabilidade sem dados pessoais; revisar o limite conforme a hospedagem e seus proxies. Essas decisões exigem tarefa e portão da pessoa pela integradora quando mudarem o contrato, trouxerem serviço ou custo. A entrega indisponível continua bloqueando a publicação, conforme a [spec de contato, seções 1 e 4](../docs/superpowers/specs/2026-11-01-bugs-cta-celular-design.md). Nenhum endpoint ou formato de conversa com IA é definido aqui.

### Evidências e cobertura

| Fonte existente | O que cobre |
|---|---|
| [Unitários da rota, linhas 26–65](../apps/site/tests/unit/rota-contato.test.ts#L26) | Pedido válido com entrega simulada, contato/mensagem vazios, mensagem acima de 5000, isca, sexta tentativa, entrega falsa, 303 em inglês e idioma inválido voltando ao português |
| [Unitários do formulário, linhas 20–50](../apps/site/tests/unit/pagina-contato.test.tsx#L20) | Campos e envio nativo, confirmação, falha preservando o texto com JS e estado inicial |
| [E2E do contato, linhas 28–48 e 79–89](../apps/site/tests/e2e/pagina-contato.spec.ts#L28) | Sucesso simulado, falha real preservando texto com JS e envio sem JS voltando com falha |

Os limites exatos dos demais campos, expiração da janela, corpo ilegível, valores repetidos ou `File` e exceção da entrega foram descritos por leitura do código; esses casos não têm ensaio específico nos testes citados. Esta revisão não cria teste de comportamento novo: não há implementação nova. Notas dos limites visuais e das decisões 001–006 estão em [referências da arquitetura](referencias/architect.md#2026-11-02--limites-das-correções-e-contrato-observado-issue-28).
