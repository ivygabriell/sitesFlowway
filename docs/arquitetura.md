# Arquitetura: registro de decisões

Um registro curto por decisão: contexto, decisão, motivo e o que se perde. Quem escreve é o especialista Arquitetura, num PR próprio. As fontes ficam em [`referencias/arquitetura.md`](referencias/arquitetura.md).

**Contrato da API:** o [contrato observado do formulário](contrato-api.md) descreve a rota existente, sem aprovar conversa com IA. O registro 007 abaixo é uma proposta separada, não aprovada; não substitui esse contrato.

| # | Decisão | Estado | Data |
|---|---|---|---|
| 001 | Dois layouts raiz por língua, com 404 por catch-all | Aceita pela integradora | 2026-10-31 |
| 002 | Textos como objetos puros, com pendências achadas por percurso | Aceita pela integradora | 2026-10-31 |
| 003 | Trava de publicação no build de produção, fora do CI | Aceita pela integradora (a ligação é feita em C5) | 2026-10-31 |
| 004 | Amostragem do símbolo por faixas de linha | Aceita pela integradora | 2026-10-31 |
| 005 | Esfera de letras como `THREE.Points` com tudo no shader | Aceita pela integradora | 2026-10-31 |
| 006 | Avisos do `npm audit`: aceitar com registro | Aceita pela pessoa | 2026-10-31 |
| 007 | Contato B: conversa, resumo, confirmação e entrega | Proposta não aprovada; portão pendente | 2026-11-04 |

---

## 001 · Dois layouts raiz por língua, com 404 por catch-all

**Contexto.** O português fica sem prefixo e o inglês em `/en` (spec, seção 1), com nomes de rota diferentes nas duas línguas (`/trabalhos` e `/en/work`). O `<html lang>` precisa estar certo já no HTML estático. O plano (tarefa 3) usa os grupos de rota `(pt)` e `(en)/en`, cada um com o próprio layout raiz, e remove o `app/layout.tsx`.

**Decisão.** Ficam os dois layouts raiz, com três acréscimos:
1. **404 por catch-all.** Entram `app/(pt)/[...resto]/page.tsx` e `app/(en)/en/[...resto]/page.tsx`, que chamam `notFound()`, e um `not-found.tsx` em cada grupo. Ele é provisório agora, e a esfera que forma "404" entra em E14. Isso cobre também `/trabalhos/<qualquer>` com HTTP 404.
2. **Seletor de língua fora da transição.** Navegar de um layout raiz para o outro recarrega a página inteira. Por isso o seletor PT/EN é um link comum, que a `<Transicao>` (tarefa 7) não intercepta.
3. **Um layout comum.** Os dois layouts são cascas finas de um `LayoutRaiz({ idioma, children })`, que reúne `html`, `head`, o script da abertura, o CSS do scroll-rig, o `globals.css`, as fontes e os metadados de base. Só o `lang` muda entre eles.

**Motivo.**
- Sem layout no topo, um endereço fora do mapa cai no 404 padrão do Next: sem a casca, sem o canvas, sem o `lang` e sem o `noindex` dos layouts. No Next 15.5.28 instalado, só o `experimental.globalNotFound` (desligado por padrão) resolve isso, e ele exige um `<html>` próprio, sem a casca nem o canvas global.
- O catch-all é estável e reaproveita o layout de cada língua.
- Uma camada de middleware para reescrever rotas seria uma peça a mais sem ganho: as rotas não têm o mesmo nome nas duas línguas.

**O que se perde.**
- A troca de língua não tem transição suave: recarrega.
- As duas páginas catch-all são renderizadas sob demanda (ƒ), e não pré-geradas.

**Testes.** `/qualquer` e `/en/qualquer` respondem 404, com `html[lang]` certo e `noindex`.

## 002 · Textos como objetos puros, com pendências achadas por percurso

**Contexto.** Cada texto é `{ pt, en?, pendente? }`, lido por `t()`. O plano previa um `registrar(modulo, textos)` chamado em cada módulo de `src/conteudo/` e um `pendencias()` sobre esse registro global.

**Decisão.**
- O modelo `{ pt, en?, pendente? }` fica. Ele é do tamanho certo e dispensa uma biblioteca de i18n.
- O `registrar()` sai:
  - cada módulo exporta um objeto (`export const casca = { … } satisfies Textos`, com aninhamento livre);
  - um `src/conteudo/index.ts` junta todos;
  - `pendencias(arvore)` percorre a árvore e devolve caminhos como `'casca.menu.contato (en)'`.
- A trava confere, com `import.meta.glob`, que todo `src/conteudo/*.ts` está no índice.
- Opcional: um `useIdioma()`, num contexto montado na `Casca`, evita passar `idioma` por todas as seções.

**Motivo.**
1. O tipo do plano (`Record<string, Texto | Texto[]>`) não aceita o aninhamento que o próprio `casca.ts` usa (`menu.trabalhos`) e não compila.
2. Um registro por efeito de import só vê o que foi importado: um módulo esquecido passa pela trava em silêncio.
3. O efeito colateral também iria para o bundle do cliente.

Uma função pura sobre objetos é mais fácil de testar e não depende da ordem dos imports.

**O que se perde.** É preciso lembrar de acrescentar cada módulo novo ao índice. O teste com `import.meta.glob` cobre isso.

## 003 · Trava de publicação no build de produção, fora do CI

**Contexto.** A spec manda que a trava falhe o build de publicação se houver texto pendente ou marcador de construção (seção 5). O plano cria `test:publicacao`, fora do CI, porque ela falha de propósito até C2. Um comando que ninguém roda não trava nada.

**Decisão.**
- Agora: `test:publicacao` existe fora do CI, como no plano.
- Na publicação (C5, execução do DevOps): o comando de build de produção roda a trava antes do `next build` quando `VERCEL_ENV=production`. As prévias e o CI não rodam a trava.

**Motivo.** É assim que a trava cumpre a spec (falhar o build publicado) sem deixar o CI e as prévias vermelhos durante a construção.

**O que se perde.** O gatilho depende de uma variável da hospedagem. Se a hospedagem mudar em C5, a condição muda junto. Fica anotado na lista de C5.

## 004 · Amostragem do símbolo por faixas de linha

**Contexto.**
- A esfera forma o F a partir dos paths de `assets/brand/floway-simbolo-fundo-claro.svg`: 3 paths, só com os comandos `M`, `C` e `Z` absolutos, num total de 182 curvas.
- O plano amostrava por rejeição: sorteia um ponto na caixa e testa `dentro()` contra todos os polígonos.
- A seção de contato monta junto com a Início.

**Decisão.**
- **Achatar:** `achatar()` continua.
- **Amostrar por faixas de linha:**
  - para cada linha y, os cruzamentos par-ímpar com as arestas são calculados uma vez e ordenados, o que dá as faixas dentro do símbolo;
  - cada ponto sorteia uma faixa, com peso pelo comprimento, e um x dentro dela;
  - não há tremor em y que saia da faixa.
- **Oráculo:** `dentro()` fica como oráculo do teste.
- **Quando calcular:**
  - o resultado fica em cache no módulo, uma vez por sessão;
  - o cálculo só acontece quando o contato se aproxima da tela (`IntersectionObserver` ou `requestIdleCallback`).
- **Teste da silhueta:** segue a spec. Cada borda da caixa dos pontos fica a menos de 2% da altura da caixa do SVG; a tolerância de 3% na proporção sai.

**Motivo.** Medido em Node num Apple M5 (script fora do repositório; detalhes nas referências):

| Método | 20 mil pontos | 8 mil pontos |
|---|---|---|
| Rejeição, `passos=8` (1462 arestas) | 336 ms | 119 ms |
| Rejeição, `passos=3` (552 arestas) | 114 ms | 46 ms |
| Faixas de linha, `passos=8`, 1024 linhas | 39 ms (incluindo 2.000 conferências com `dentro()`) | — |

Num celular médio, a rejeição ocuparia a thread principal por meio segundo ou mais durante o carregamento. As faixas continuam em TypeScript puro e testável no Vitest.

**O que se perde.** O código fica um pouco mais longo que a rejeição, por cerca de 40 linhas.

## 005 · Esfera de letras como `THREE.Points` com tudo no shader

**Contexto.** São 20 mil letras no desktop e 8 mil no celular, no canvas global do R3F, com morfose esfera ↔ F (e, em E14, ↔ "404"), buracos de ruído, giro e empurrão do cursor. O componente é compartilhado entre o contato da Início, `/contato` e a 404.

**Decisão.**
- **Geometria:** "pontos instanciados" quer dizer `THREE.Points` com `ShaderMaterial`: um vértice por letra, sempre de frente para a câmera, que é o que o F sem girar pede.
- **Material:**
  - `discard` pelo atlas;
  - sem transparência ordenada;
  - `gl_PointSize` vezes o dpr, com um teto, porque há Android com limite de 64 px.
- **Tamanho da letra:** ligado à quantidade (proporcional a 1/√n), para que cortar a quantidade em E4 não quebre o visual.
- **No vertex shader, por uniformes:** empurrão do cursor, buracos de ruído, giro e morfose. Nenhum atributo é atualizado por quadro.
- **Cor:** `aAzul` vira `vec2`, com o azul na esfera (cerca de 4%, sorteado) e o azul no alvo (o braço do F).
- **Alvo pronto:** o componente recebe o alvo já amostrado (`{ posicoes, azul }`), e não `alvo="simbolo"`, para que o "404" entre sem mexer no shader.
- **Fonte:** o atlas espera `document.fonts.load('800 64px ' + família)`, com a família lida da variável `--sans`. Só `document.fonts.ready` não basta: com o `next/font`, o peso 800 só baixa quando algo o usa.
- **Desempenho na tela:**
  - a cena fica dentro de um `ScrollScene` com `hideOffscreen`, sem atualizar uniformes fora da tela;
  - o shader é compilado na montagem (`gl.compileAsync`), para não engasgar quando o contato aparece.
- **Aceite:** "20 mil" é o número de pontos. Os buracos escondem parte deles na esfera, e todos aparecem no F.

**Motivo.**
- 20 mil vértices com uniformes custam pouco para a GPU. O custo real é o preenchimento, com as letras sobrepostas no F denso, e é ele que se mede no celular.
- Nada na CPU por quadro mantém a thread principal livre para o Lenis e o GSAP.

**O que se perde.**
- Pontos não giram no próprio plano e têm tamanho máximo, o que não atrapalha aqui.
- Sem ordenação de transparência, as bordas das letras são duras (`discard`).

## 006 · Avisos do `npm audit`: aceitar com registro

**Estado:** aceita pela pessoa em 2026-10-31, pelo portão da integradora.

**Contexto.** `npm audit --package-lock-only` na raiz em 2026-10-31 mostrou 22 avisos: 2 críticos, 4 altos e 16 moderados. A pilha decidida não muda, e não se roda `audit fix`: todas as correções oferecidas são versões maiores ou quebram.

| Grupo | Avisos | Alcance | Explorabilidade aqui | Proposta |
|---|---|---|---|---|
| `vitest` 3.2.7 → `tinypool` 1.1.1, `@vitest/mocker` | 2 críticos, 1 moderado | Só dev: teste local e CI; não vai ao bundle | As RCE do `tinypool` (GHSA-5gmw-xhrv-c9v3, GHSA-85c8-ppgw-ccpr) exigem código hostil já no processo de teste. O path traversal do mocker exige o servidor do vitest exposto (modo navegador, UI ou `--api`); usamos `vitest run` com jsdom. Praticamente nula | Aceitar. Fazer o upgrade para vitest ≥ 4.1.12 numa tarefa própria, depois do PR 3 do plano. A 3.2.7 é a última 3.x e fixa `tinypool ^1.1.1`. Sem override de `tinypool` 2, que tem outra API |
| `eslint`, `eslint-config-next` e a cadeia `minimatch` | 14 moderados | Só dev | ReDoS em padrões de glob da nossa própria configuração, sem entrada externa | Aceitar. Some no próximo upgrade do `eslint-config-next` |
| `@14islands/r3f-scroll-rig` 8.15.0 → `query-string` 6.14.1 → `decode-uri-component` 0.2.2 | 3 altos | Produção, **no cliente**: o scroll-rig chama `parse(window.location.search)` ao montar o `GlobalCanvas` (conferido no `dist`); no servidor não roda | Um link com `?%…` malicioso trava a aba de quem clica nele. Sem servidor afetado, sem dado vazado, sem efeito em mais ninguém. Baixa | Aceitar e reavaliar a cada versão do scroll-rig. A 8.15.0 é a mais nova e pede `query-string ^6`. O `decode-uri-component` corrigido (0.5.1) é só ESM, e um override quebraria o `require` do `query-string` 6. A alternativa, um patch local trocando o `parse` por `URLSearchParams`, é peça nova e precisa de portão |
| `next` 15.5.28 → `postcss` 8.4.31 | 1 alto, 1 moderado | Produção, mas **só no build** | A leitura de arquivo pelo `sourceMappingURL` e o XSS no stringify exigem CSS controlado por quem ataca entrando no build. Só entra CSS nosso e do scroll-rig. Baixa | Aceitar. O Next fixa `postcss` 8.4.31 exato, e a 15.5.28 é a última 15.x; a correção do audit é o Next 16. O override para 8.5.32 é possível, mas tira o Next da versão que ele testou, para um ganho quase nulo |

**Decisão.** A pessoa aceitou os quatro grupos com este registro.

**Tarefa futura "vitest 4".**
- **O quê:** subir o `vitest` de 3.2.7 para ≥ 4.1.12, o que traz o `tinypool` ≥ 2.1.2 e o `@vitest/mocker` corrigido.
- **Quando:** depois do PR 3 do plano da base e da Início, numa issue e num PR próprios, sem misturar com as tarefas 1 a 14.
- **Aceite:** `npm test`, `npm run check` e `npm run test:build` verdes, e o `npm audit` sem os avisos do grupo vitest.

**Gatilhos de revisão** (qualquer um reabre este registro):
- Sai uma versão nova do `@14islands/r3f-scroll-rig` que troca ou atualiza o `query-string`.
- Sai uma versão 15.x do Next que muda o `postcss`, ou a pilha passa a admitir o Next 16.
- Sai uma versão 3.x do vitest que corrige o `tinypool`, ou a tarefa "vitest 4" é feita.
- Um aviso novo, ou um aviso destes que sobe de gravidade, aparece no `npm audit` do CI ou da Segurança.
- O vitest passa a rodar com servidor exposto (modo navegador, UI ou `--api`).
- Entra CSS de fora (de usuário, de CMS ou de pacote novo) no build.
- Antes da publicação (C5), na revisão da Arquitetura com o DevOps e a Segurança.

**O que se perde.** O audit continua mostrando os avisos até os upgrades.

## 007 · Contato B: proposta de contrato para o portão da pessoa

**PROPOSTA NÃO APROVADA — revisão `contato-b/2026-11-04.1`, issue #39.** A pessoa autorizou construir em 2026-11-04, conforme o despacho da integradora; interface nova, modelo, fornecedor, custo e privacidade continuam pendentes. O [contrato observado](contrato-api.md) fica intacto. Só depois do portão e das revisões de Back e Dados, Front e Segurança esta proposta pode virar contrato normativo e código.

**Fontes locais:** [spec base 4.6](superpowers/specs/2026-10-31-estrutura-site-design.md#46-contato-12), [reconciliação B](superpowers/specs/2026-11-02-contato-b-correcao-design.md), [protótipo B](superpowers/specs/prototipos-correcao/contato-b.html), contrato e [Segurança](seguranca.md). Plano consultado somente para leitura: `/Users/ivygabriel/orca/workspaces/siteOficialFloway/planejamento-mobile/docs/superpowers/plans/2026-11-04-contato-b-execucao.md`. O despacho supera o aviso anterior do plano sobre autorização, sem aprovar suas dependências por inferência.

### Recomendação e limites

Reaproveitar Next e o formulário; acrescentar **somente `POST /api/contato/conversa`** e propor evolução de **`POST /api/contato`** para o envio confirmado. Gemini pergunta/sugere; front prepara resumo editável dos quatro campos; visitante confirma; servidor valida novamente e entrega. Sem streaming: uma resposta completa permite validar antes de exibir; a digitação visual respeita movimento reduzido. Sem banco, fila, sessão persistente, snapshot cifrado, consulta histórica, polling, webhook, ferramentas do modelo ou novo serviço escolhido.

| Alternativa | Consequência | Proposta |
|---|---|---|
| Deduplicar só no `Map` do processo | Reinício e múltiplas instâncias permitem duplicação | Não usar como garantia de envio único |
| Corpo confirmado pelo visitante + mesma chave no provedor, com prazo limitado | Resolve repetição desse envio, sem guardar pedido no site | Recomendada, condicionada às garantias do fornecedor aprovado |
| Registro compartilhado/histórico | Permite retomada e operação sem a aba, mas acrescenta dependência/dados/custo | Só propor depois de necessidade concreta; não é requisito inferido do contato |

**Sucesso proposto:** o provedor realmente aceitou o envio para o destino configurado e devolveu identificador verificável ao servidor. Isso autoriza `estado:"aceito"`, confirmação textual de envio ao serviço e F; não promete recebimento SMTP, caixa de entrada, leitura ou resposta humana. Resposta Gemini, confirmação local, isca e 2xx genérico não bastam. Essa fronteira e sua copy precisam do portão.

**Garantia limitada:** uma intenção reutiliza chave e corpo externo por até **23 h desde sua emissão**, dentro da janela de deduplicação comprovada do provedor. Não é deduplicação por pessoa ou garantia ilimitada. O raciocínio de repetir a mesma operação vem da [Stripe](https://stripe.com/blog/idempotency). O candidato [Resend documenta 24 h, replay e conflitos de corpo/concorrência](https://resend.com/docs/dashboard/emails/idempotency-keys); isso demonstra viabilidade, **não escolhe Resend**. Outro fornecedor precisa comprovar equivalente antes de implementação. Após resultado incerto, texto/chave permanecem e não se cria outra intenção automaticamente.

### Estrutura, intenção e dados

Página PT/EN controla composição B, cópia local, revisão e confirmação; esfera apenas recebe o estado, preservando Início/404. Handler de conversa chama Gemini; handler de contato valida/confirma e chama adaptador de entrega. Destino/remetente/credenciais/template são exclusivamente do servidor. Não há transação ou migração persistente no site.

A página emite um token de **intenção sem dados pessoais**, necessário apenas para limitar reenvio: `{v:1,id:UUID,idioma:"pt"|"en",emitidaEm:ISO,expiraEm:ISO,canal:string}`; expiração fixa em emissão + 23 h. `canal` é versão opaca da conta/configuração/template de entrega. Formato `v1.<payload base64url>.<HMAC-SHA256>`, até 1024 caracteres; chave só no servidor, assinatura em tempo constante, parsing/tipos/horários validados. `node:crypto` já oferece [HMAC e comparação segura](https://nodejs.org/api/crypto.html); não instalar biblioteca. Manter chaves/canal por toda a validade. Não trocar provedor/conta/template ao repetir: reconstruir o mesmo payload pela versão assinada, sem timestamps ou IDs novos na mensagem externa.

**Necessidade da assinatura, em concreto:** se o cliente pudesse renovar a data mantendo a chave, repetiria depois das 24 h do provedor e poderia enviar de novo. A intenção assinada impede estender essa autorização; a chave é derivada no servidor como `contato/<UUID da intenção>`. Não precisa conter/cifrar os quatro campos: provedor recusa corpo diferente para a mesma chave já usada.

Token fica em campo oculto/estado da página e no corpo do POST, nunca URL, cookie, storage persistente, log ou captura. Páginas que o emitem precisam renderização por requisição e `Cache-Control: private, no-store`, sem token compartilhado em HTML estático/CDN. Nova aba/novo GET pode criar nova intenção: não há deduplicação entre intenções. Resumo é a cópia do próprio visitante; `confirmar=true` é a manifestação explícita, não prova criptográfica de leitura. O servidor não afirma revogar resumo antigo nem controlar revisão global sem estado.

Antes do efeito, o cliente fixa uma cópia do corpo confirmado. Resultado incerto bloqueia sua substituição por dados editados e conserva a mesma intenção/chave; servidor também recusa chave diferente da derivada. Retentar com corpo válido diferente devolve conflito do provedor, não outro envio. Para outro projeto, nova intenção é ação deliberada, nunca alternativa sugerida para contornar incerteza.

### Contrato proposto, separado do observado

Clientes: somente site PT/EN com JS e formulário nativo, publicados junto com o back; sem integração de terceiros ou app móvel. Sem versão no caminho. Na rota existente, o campo `versao=contato-b.1` seleciona o novo fluxo; ausência continua no fluxo observado (valor de versão diferente do proposto é 422), com respostas `{ok}`/303 e entrega deliberadamente indisponível até migração autorizada. Isso impede cliente antigo que usa só `Response.ok` de confundir novo 202 com sucesso. A versão de entrada identifica o protocolo; esta revisão documental não é versão de fornecedor.

**Regras comuns novas:** HTTPS e `Origin` igual à origem fixa de configuração nos POST; ausência/divergência é 403, sem CORS de terceiros. Limite de **64 KiB efetivamente recebidos antes do parsing**, inclusive corpo em partes; 413 por excesso, 400 por sintaxe ilegível, 415 por tipo não suportado. Rejeitar tipo errado, arquivo, campo duplicado/desconhecido com 422; não transformar objeto/arquivo em string. Não refletir `Host`, `Origin` ou `returnTo` como destino. Respostas privadas sem cache, sem corpo/token/resposta bruta de provedor nos logs.

| Método/caminho | Entrada e limites | Resposta/efeito |
|---|---|---|
| `POST /api/contato/conversa` | JSON `{idioma,turnoId:UUID,historico,mensagem}` e `Accept: application/json`; idioma `pt/en`; mensagem 1–2000 após trim; histórico até 9 pares completos `{papel,texto}`, alternados; papel `usuario` ou `assistente` e texto string; usuário até 2000, assistente até 1500; texto total até 10.000 unidades UTF-16 | 200 `{turnoId,resposta,mensagemSugerida}`; resposta 1–1500, sugestão até 5000 ou null. Histórico é entrada não confiável, não autoridade. Não confirma/entrega |
| `POST /api/contato`, revisão nativa | FormData ou URL-encoded: campos existentes `nome,empresa,contato,mensagem,idioma,site`, mais `versao=contato-b.1,intencao,acao=revisar` | 200 HTML com resumo dos quatro campos e botão Confirmar e enviar; Ajustar reabre campos preenchidos. Sem chamada Gemini/provedor. Também pode responder JSON `{ok:true,estado:"revisao",pedido}` se solicitado |
| `POST /api/contato`, envio | Mesmo formato/campos, `acao=enviar`, `confirmar=true` literal e chave derivada em `Idempotency-Key` (JS) ou campo oculto `chave` (nativo); se ambos presentes, devem coincidir | Validar novamente; enviar só o corpo confirmado ao canal assinado. 200 `{ok:true,estado:"aceito",repetirAte,requestId}` apenas com aceitação verificável; 202 `{ok:false,estado:"incerto",codigo:"RESULTADO_INCERTO",repetirAte,requestId}` se desconhecido |

Na conversa, outros formatos/Accept são 415/406; métodos não listados são 405 com `Allow`. A rota de contato **não ganha entrada JSON**: mantém FormData/URL-encoded; `Accept: application/json` seleciona resposta JSON, demais retornam HTML no fluxo novo. Nenhuma listagem/paginação ou endpoint de confirmação/estado separado.

`Pedido = {nome:string,empresa:string,contato:string,mensagem:string}`. Após `trim()`: nome/contato obrigatórios até 200 unidades UTF-16 cada; empresa opcional/ausente vira `""`, até 200; mensagem obrigatória até 5000. Preservar quebras internas. Contato é livre e nunca vira `Reply-To`, destinatário, cabeçalho ou URL. Idioma novo deve ser `pt/en` e coincidir com a intenção. `site` preenchido, inclusive só com espaços, descarta sem chamada externa: no fluxo novo retorna 202 `{ok:true,estado:"recebido",requestId}`, sem evidência/F. Fluxo legado não muda por essa proposta.

Erros de conversa: `{erro:{codigo,mensagem,repetivel},requestId}`. Erros do contato novo: `{ok:false,estado:"falha",codigo,campos?,repetivel,requestId}`; `campos` associa campo a código estável. `requestId` é UUID aleatório; `repetirAte` é ISO UTC da intenção. Cliente ignora campo novo e trata estado desconhecido sem confirmar sucesso. Remover/mudar tipo/semântica exige portão. Nenhum ID/dado do provedor precisa ser exposto. Falha antes de identificar a versão pode usar o erro legado `{ok:false}`; o cliente novo trata ausência de código/estado como erro e mantém sua cópia.

### Roteiro, prazos e limites de uso

Roteiro técnico mínimo, ainda proposto: entender o projeto, perguntar uma lacuna de objetivo/contexto por turno, sugerir descrição fiel e oferecer revisão. Nome, empresa e contato são conferidos nos campos; IA não os inventa. Não pedir senha, documento, dado financeiro/sensível nem prometer preço, prazo, disponibilidade ou resultado. Instrução fixa do servidor fica fora do histórico do visitante; não aceitar papel `system`, ferramentas ou chamada de entrega. Texto livre pode conter dado pessoal espontâneo; não prometer anonimização.

Gemini retorna `{resposta:string,mensagemSugerida:string|null}`. Servidor valida tamanho/tipo/conteúdo antes de exibir; resposta vazia, bloqueada, truncada, inválida ou promessa detectada vira 502 `IA_RESPOSTA_INVALIDA`. [Saída estruturada Google](https://aistudio.google.com/docs/structured-output) não dispensa validação. Filtro não garante veracidade nem captura toda promessa: roteiro/ensaios são necessários. O resumo local copia sugestão/última edição para campos editáveis e não dispara envio; a edição da alternativa, inclusive apagamento, prevalece ao ir e voltar.

| Trabalho | Prazo proposto | Depois do prazo |
|---|---|---|
| Conversa Gemini | Uma chamada até 15 s; HTTP até 20 s; JS até 25 s | 504 `IA_TIMEOUT`, conservar entrada/histórico e oferecer formulário; sem resposta parcial/simulada |
| Entrega | Uma tentativa até 8 s; HTTP até 12 s; JS até 15 s | Aceitação desconhecida é 202 `incerto`, nunca falha conclusiva nem F |
| Cancelamento/rede perdida | Abortar espera no cliente | Não cancela envio já iniciado; conservar corpo/chave para repetir com segurança |

Teto de entrada proposto de 8192 tokens, verificado pelo mecanismo oficial do modelo escolhido, e até 2048 tokens gerados incluindo raciocínio se aplicável. Contagem separada tem prazo de 3 s dentro dos 20 s e entra no custo. Modelo/API precisam demonstrar suporte; nada foi escolhido. Limite de histórico é por requisição, **não cota por pessoa**: não impede replay/computação adicional.

Preservar 5 tentativas válidas de envio/origem/10 min como contenção local; revisão não chama entrega/não consome essa cota. Propor 10 chamadas Gemini/origem/10 min; 429 com segundos restantes em `Retry-After`. Repetição de envio pode consumir a proteção de frequência, mas mantém a chave externa. O `Map` atual é por instância; não garante cota global. Proxy deve impor origem confiável, não aceitar livremente o primeiro `x-forwarded-for`.

**Ativação pública depende de controle efetivo de abuso/custo na infraestrutura/provedor aprovados**, orçamento mensal e limite diário medidos/ensaiados. Sem isso ou sem configuração, Gemini responde 503 e alternativa não usa IA. Não escolher Redis/CAPTCHA/banco para completar a lacuna. Se a infraestrutura escolhida não resolver, levar necessidade/custo ao portão. [Cotas Gemini](https://aistudio.google.com/docs/rate-limits) dependem de modelo/projeto, não equivalem automaticamente a orçamento; não há custo mensal fundamentado sem modelo, preços, histórico reenviado, contagem/raciocínio e plano de e-mail.

Os [termos Gemini](https://aistudio.google.com/docs/terms) distinguem modalidade paga/não paga e restringem informação pessoal/confidencial/sensível nos serviços não pagos. Escolher modalidade apropriada e aprovar privacidade antes de conversas reais; pago não significa retenção zero. Modelo/API/versão e fornecedor permanecem decisões separadas.

### Repetição, falha recuperável e retorno sem JS

- Validar assinatura, idioma, campos e prazo antes do envio; chave diferente da derivada é 422 `CHAVE_INVALIDA`. Não iniciar chamada externa nos últimos 30 s da intenção. Repetir só enquanto válida, com os mesmos campos normalizados, `canal`, chave e bytes de payload. A versão de template não introduz valor volátil entre tentativas.
- Repetição da mesma chave/corpo devolve o resultado externo original/mesmo ID dentro da janela do provedor; resposta HTTP local pode ter outro requestId. Concorrência em andamento: 409 `ENVIO_EM_ANDAMENTO`, `Retry-After: 2`; chave com outro corpo válido: 409 `INTENCAO_JA_UTILIZADA`, sem criar chave nova. Queda/reinício é resolvida pelo provedor, não por memória da instância.
- Aceitação incerta preserva a cópia confirmada. Cliente pode repetir envio duas vezes, após 2 s e 4 s com variação de até 500 ms, respeitando `Retry-After`; depois, ação explícita ainda na janela. Não repetir automaticamente computação Gemini: timeout pode ter sido cobrado; `turnoId` só evita inserir mensagem duplicada no DOM.
- Expiração: 410 `INTENCAO_EXPIRADA`, sem efeito externo nem renovação automática. Se já houve incerteza, não orientar reenviar por outra intenção/formulário. Expiração não prova falha; integradora define conferência manual com o fornecedor aprovado. Sem tokens/texto preservados não existe recuperação garantida; não há consulta histórica/alerta por pedido com aba fechada.

**Nativo:** o primeiro POST `acao=revisar` devolve HTML completo do contato, idioma da intenção, valores normalizados escapados e ação de confirmar. A segunda submissão inclui os quatro campos, intenção original, chave e `confirmar=true`; o servidor não confia nos campos ocultos: valida tudo novamente. Esta revisão adicional não é endpoint nem snapshot persistido. A alternativa com JS pode fazer a revisão local e enviar diretamente a cópia explicitamente confirmada.

Erro tratado no fluxo novo devolve **HTML no próprio POST com status real**, campos/tokens preservados, erro por campo e resumo de erros/foco. Não usar 303 de erro ou dado pessoal em URL/cookie. Página sob `/api/contato` precisa casca/formulário reutilizados, links de navegação/assets absolutos e idioma certo. Os [Route Handlers Next 15](https://nextjs.org/docs/15/app/api-reference/file-conventions/route) aceitam `Request`/`Response` e FormData; a construção deve comprovar a renderização compartilhada sem importar internals do framework.

Respostas privadas: `Cache-Control: private, no-store`, `Referrer-Policy: no-referrer`, `X-Robots-Tag: noindex`, texto/atributos escapados e nenhum analytics/recurso terceiro. Não interpretar `<b>` como HTML. Servidor retém entrada só durante a requisição; texto/token vivem no DOM/memória enquanto a página existir. Expiração invalida token, não apaga dispositivo/histórico. `no-store` não garante apagar formulário do navegador. Corpo ilegível/excessivo, queda antes do HTML, fechamento/recarregamento, troca de idioma e expiração não garantem restauração sem JS; explicar o limite, sem afirmar que há rascunho salvo. JS só remove sua cópia após `aceito` ou descarte explícito.

Depois de aceitação, provedor e caixa da equipe têm retenção externa própria. Gemini também trata/retém dados conforme modalidade. Finalidade, local, prazo e exclusão dependem de privacidade/Segurança; expirar intenção não apaga essas cópias. Proposta de logs técnicos por 7 dias, a validar em C5: só requestId, etapa, código, HTTP, duração e contagens agregadas de uso/erro. Nunca texto, nome, empresa, contato, token, chave, IP bruto, destino ou resposta bruta. Proxy/APM precisam suprimir corpos e cabeçalhos privados; não há armazenamento local de pedidos para observabilidade.

### Exemplos precisos para construir depois do portão

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

HTTP 200 apenas com resposta verificável do provedor, suficiente para confirmação/F na fronteira proposta. **Timeout desconhecido** do mesmo envio: HTTP 202, sem F:

```json
{"ok":false,"estado":"incerto","codigo":"RESULTADO_INCERTO","repetirAte":"2026-11-05T14:00:00Z","requestId":"20000000-0000-4000-8000-000000000002"}
```

Repetir usa exatamente o corpo/intenção/chave acima, inclusive após perder a resposta. O provedor retorna o mesmo resultado/ID, sem outro efeito dentro da janela; servidor pode então responder 200 aceito. Se alterar mensagem mantendo chave já usada: 409 `INTENCAO_JA_UTILIZADA`; se mudar chave: 422 `CHAVE_INVALIDA` antes da chamada. Nenhuma das duas falhas orienta criar outra intenção para contornar o resultado.

| Caso | HTTP/cabeçalho | Corpo JSON completo |
|---|---|---|
| Contato vazio | 422 | `{"ok":false,"estado":"falha","codigo":"VALIDACAO","campos":{"contato":"OBRIGATORIO"},"repetivel":false,"requestId":"20000000-0000-4000-8000-000000000003"}` |
| Frequência atingida antes da chamada | 429, `Retry-After: 120` | `{"ok":false,"estado":"falha","codigo":"LIMITE_ATINGIDO","repetivel":true,"requestId":"20000000-0000-4000-8000-000000000004"}` |
| Entrega indisponível, certeza de não aceitação | 503, `Retry-After: 30` | `{"ok":false,"estado":"falha","codigo":"ENTREGA_INDISPONIVEL","repetivel":true,"requestId":"20000000-0000-4000-8000-000000000005"}` |
| IA desabilitada/configuração ausente | 503 | `{"erro":{"codigo":"IA_INDISPONIVEL","mensagem":"Use o formulário simples.","repetivel":false},"requestId":"20000000-0000-4000-8000-000000000006"}` |
| IA sem resposta em 15 s | 504 | `{"erro":{"codigo":"IA_TIMEOUT","mensagem":"A resposta demorou. Texto preservado.","repetivel":false},"requestId":"20000000-0000-4000-8000-000000000007"}` |
| Provedor processando mesma chave | 409, `Retry-After: 2` | `{"ok":false,"estado":"falha","codigo":"ENVIO_EM_ANDAMENTO","repetivel":true,"requestId":"20000000-0000-4000-8000-000000000008"}` |

Outros códigos no formato da rota: 400 `CORPO_INVALIDO`; 401 `INTENCAO_INVALIDA`; 403 `ORIGEM_INVALIDA`; 406 `RESPOSTA_NAO_SUPORTADA`; 410 `INTENCAO_EXPIRADA`; 413 `CORPO_EXCESSIVO`; 415 `TIPO_NAO_SUPORTADO`; 422 `VALIDACAO`/`CHAVE_INVALIDA`; 409 `INTENCAO_JA_UTILIZADA`; 502 `IA_RESPOSTA_INVALIDA` ou `ENTREGA_RECUSADA` (recusa permanente conclusiva, `repetivel:false`). `confirmar` ausente/falso no envio é 422. Erro inesperado antes de efeito: 500 `ERRO_INTERNO`; depois de possível envio, manter incerteza mesmo se a conexão cair sem envelope. Erro genérico de rede/5xx não prova recusa; o adaptador deve distinguir os casos.

**Sem JS, EN:** `POST /api/contato` URL-encoded, sem Accept JSON, corpo `versao=contato-b.1&acao=revisar&intencao=INTENCAO_EN_FICTICIA&nome=Example+Person&empresa=&contato=&mensagem=Company+website&idioma=en&site=` retorna **422 HTML**, `lang="en"`, campos escapados/erro de contato e intenção original, sem `Location`. Corrigir contato retorna 200 HTML com resumo; confirmar usa `acao=enviar&confirmar=true&chave=contato%2F30000000-0000-4000-8000-000000000001`, além dos mesmos quatro campos/intenção/idioma/isca/versão. Resultado incerto é 202 HTML com a cópia confirmada e botão de repetir o mesmo envio; recusa/503 mantém campos; aceitação real é 200 HTML com confirmação. PT usa intenção PT/`lang="pt"`. Nome, contato, mensagem e token nunca vão à URL.

### Falhas, impacto e revisão

| Fluxo/dependência | Criticidade / chance estimada sem medição | Mitigação e detecção |
|---|---|---|
| Conversa/Gemini lento, fora do ar, quota ou saída inválida | Conveniência / média, externo | Prazo, erro claro e alternativa sem Gemini; métricas agregadas de duração/código/tokens |
| Envio/configuração recusada | Crítico / média | Sem sucesso falso ou troca de canal; código de recusa e alerta operacional agregado |
| Envio/rede/resposta perdida | Crítico / média | Mesmo corpo/chave dentro da janela; incerteza preserva dados; contagem agregada de incerteza/repetição |
| Proxy/abuso/custo | Crítico / alta em rota pública | Não ativar IA sem controle aprovado; limite local não basta; cotas/429/consumo |
| Retorno/servidor/navegador sem rede | Crítico / média | Preservação HTML só quando há resposta; cópia local com JS; disponibilidade sem corpo em logs |
| WebGL/movimento | Fraco / média em dispositivos limitados | Texto/formulário independentes; explorar modos alternativos |

Quadro adapta a [análise de falhas Azure](https://learn.microsoft.com/en-us/azure/well-architected/reliability/failure-mode-analysis), sem importar infraestrutura de grande escala. Prazos/cotas são propostas, não medição. Sem disjuntor distribuído/redundância novos; prazo, limitação, alternativa e desligamento operacional são proporcionais aqui.

Front implementa estado B, resumo/ajuste, cópia confirmada, falhas e retorno nativo; Back implementa os dois caminhos/adaptador conforme futuro contrato; Segurança revisa entrada, tokens, dados e abuso; DevOps confirma proxy, duração das funções, chaves/canal e orçamento. `entregarPedido(): Promise<boolean>` atual não expressa incerteza: mudar sua interface será despacho próprio, não esta tarefa. C2 fecha copy/privacidade/PT/EN. Não alterar marca/hero/galeria/dependências ou transferir conversa para a Início.

Migração: publicar consumidor que envia versão explícita e lê `estado`, sem transformar `Response.ok` em sucesso. Não espelhar envio nos fluxos antigo/novo. Reversão desabilita novas intenções/IA, preservando processamento idempotente de intenções já emitidas e suas chaves/canal até expiração; não levar pedido incerto à rota antiga. Revogar chave em emergência impede repetição e exige decisão operacional; não prova cancelamento externo. Sem migração de dados.

Na construção, TDD e revisão independente devem provar: IA não envia/confirma; resumo ajustável; mesma chave/corpo concorrente e após reinício/perda de resposta gera um efeito no provedor; payload diferente conflita; expiração/adulteração não chama serviço; isca/202/IA não formam F; só aceitação real confirma. Cobrir 429, recusa, timeout, resposta inválida, cancelamento, HTML PT/EN, `<b>` literal, duplicados/arquivos/excesso de corpo e edição/apagamento na alternativa. Fixture/mocks só nos testes; resposta interceptada não demonstra envio externo. Comprovar adaptador, configuração e controles de produção em ambiente autorizado.

**Verificação documental desta tarefa:** fontes/links, parsing dos exemplos JSON, coerência de tipos/estados/prazos e `git diff --check`; sem testes de busca de texto. Sem código: suíte/tipos/build/navegador, TDD e chamadas reais de IA/e-mail não foram executados nesta entrega. Revisão independente e portão seguem com a integradora.

### Decisões ainda necessárias

| Responsável | Proposta/lacuna a levar ao portão | Bloqueia |
|---|---|---|
| Pessoa, pela integradora | Aprovar dois caminhos, versão de entrada, revisão/confirmar, token de 23 h e garantia limitada | Contrato normativo e construção consumidora |
| Pessoa, pergunta pendente | Fornecedor (Resend só candidato), conta/domínio, destino/remetente privados e custo | Deduplicação comprovada e entrega real |
| Pessoa + Design e Front/C2 | Fronteira de aceitação pelo provedor, copy de sucesso/pendência, roteiro/privacidade/PT/EN e composição móvel/baixa | F, promessas e aceite visual/textual |
| Pessoa + Segurança | Modelo/API/modalidade Gemini, retenção externa e orçamento fundamentado | IA pública; nenhuma escolha por inferência |
| Segurança/Back/DevOps; pessoa para novo custo/serviço | Proxy, limite efetivo de abuso/custo, instrumentação, manutenção de chaves/canal e conferência manual após incerteza/expiração | Publicação; `Map` local não comprova proteção global |

Valores de timeout/tamanho/TTL, intenção assinada e ausência de persistência são escolhas **da proposta**, não aprovações anteriores. Retomada sem token, revogação de resumo, deduplicação além da janela ou operação com aba fechada exigiriam necessidade nova explícita, avaliada antes de escolher serviço. Nenhum push, PR, comentário externo, merge ou deploy é consequência desta entrega.
