# Contato B — reconciliação documental

Data: 2026-11-03. Refs #27; coordenação #30. Entrega local para revisão de Design e Front, sem autorização de produto ou publicação.

## Origem e limite

Fonte normativa: [estrutura aprovada, seção 4.6](2026-10-31-estrutura-site-design.md#46-contato-12). Fonte visual e dos quatro atalhos: [protótipo12](prototipos-estrutura/12-pagina-contato.html), somente leitura. A tarefa 3 e a tabela de diferenças do plano `docs/superpowers/plans/2026-11-02-correcoes-inicio.md` na worktree `design-e-front-correcao` orientam a reconciliação. A ampliação da integradora autoriza somente este documento e o [HTML demonstrativo](prototipos-correcao/contato-b.html).

O alvo B já foi aprovado: esfera central, linha “Conte o que você quer construir…” e quatro atalhos; primeira mensagem abre a conversa à esquerda e desloca a esfera à direita. O HTML exibe estados por controles locais ostensivamente identificados. Não gera respostas, não contém roteiro, não usa IA, armazenamento, formulário submetível ou chamadas de rede. A política CSP bloqueia conexões e submissões. A mensagem digitada serve apenas à inspeção local e permanece no DOM até recarregar/recomeçar; não inserir dados pessoais. Não se destina a visitantes.

A frase superior, atalhos e rodapé vêm do protótipo12. Rótulos de demonstração e pendência são notas editoriais do desenho, não copy comercial ou conteúdo para publicar. O aviso antigo “Ao conversar, você concorda…” não é reproduzido como regra legal: texto completo e base legal continuam pendentes. O link “Política de Privacidade” leva à nota interna, sem rede e sem fingir política concluída. PT apenas; não inventa tradução EN.

## Diferenças e reconciliação

Leitura direta de `apps/site/src/paginas/PaginaContato.tsx`, `componentes/contato/Formulario.tsx`, `componentes/contato/estilo.css` e `conteudo/contato.ts`, sem alterações, confirma o plano:

| Tema | Situação atual | Alvo documental e origem |
|---|---|---|
| Entrada | Formulário à esquerda e esfera à direita desde o início | Vazio B central sem quatro campos; spec4.6 / protótipo12 CSS B |
| Primeira mensagem | Envio de FormData, sem histórico | Texto local abre histórico à esquerda e esfera à direita; protótipo12 B.aberta |
| Respondendo | Formulário desabilita envio; não tem conversa | Ponto azul, cursor e esfera com movimento esquemático; resposta/roteiro pendentes; spec4.6 |
| Resumo/ajuste/confirmação | Ausentes no formulário temporário | Resumo espelha somente o digitado; ajustar mantém a entrada; confirmar exibe sucesso demonstrativo; spec4.6 |
| Enviado | Formulário mostra sucesso; esfera não recebe esse estado | F somente no estado enviado selecionado; não comprova entrega; spec4.6 |
| Falha | Formulário JS permanece montado | Nota curta, tentar novamente e alternativa simples; texto preservado em ambos os campos locais; spec4.6 |
| Sem IA/JS | Formulário real temporário | Desenho de nome, empresa, contato e mensagem; envio desativado neste artefato; spec4.6 |
| Privacidade | Aviso atual diz “Ao conversar” também no formulário | Nota ostensiva de pendência, sem consentimento/base legal novos; pendências da spec4.6 |

A análise de retorno sem JS/303 é herdada da tabela do plano: a preservação após requisição real exige estratégia própria de Arquitetura, sem dados pessoais na URL. Este HTML não faz requisição nem resolve esse contrato. A Início mantém CTA para a página; nenhum desenho de conversa no rodapé foi introduzido.

## Composição e medidas sugeridas

Paleta do protótipo12: claro `#F7F7F5`, escuro `#121212`, azul `#002FA7`, linha `#DCDCD8`. Famílias aprovadas declaradas: Inter Tight, Azeret Mono e Instrument Serif. Sem baixar fontes: este HTML usa Arial, monospace e Georgia quando as famílias não estão instaladas; portanto a captura não certifica métricas tipográficas finais.

| Elemento | Origem em 1440×900 | Adaptação sugerida no HTML |
|---|---|---|
| Frase | 44,6px / 40,3px; margem lateral 30px | 3,1vw / .95, limitada a 51px; 30px de margem; fluxo real |
| Vazio | Esfera 400×330, linha 900px abaixo, centradas | Área SVG 400×300; conversa até 900px; sem escala global do documento |
| Aberta | Conversa 900×530 à esquerda; esfera 360×300 à direita | Colunas até 900px e 360px; intervalo 20px; bordas internas 5vw; histórico local rolável |
| Tela larga/baixa 1883×703 | Protótipo12 fixa altura de 900px | Frase 2,5vw; esfera 200px de altura; corpo mínimo 340px; rolagem vertical natural se necessário |
| Celular 390×844 | Fonte original não define composição móvel de produto | Margens 18px; frase 24px; vazio com esfera 280×220; aberta: conversa antes da esfera 240×180; campos em uma coluna; entrada mínima 72px para convite completo |
| Controles/foco | Adaptação para revisão documental | Alvos de 44px; foco azul 3px com afastamento 4px; textarea com rótulo visível; atalhos quebram linha |

As medidas são sugestões para revisão, não mudança da identidade nem aprovação de produto. Cabeçalho textual apenas referencia o desenho, sem links falsos de navegação. A faixa de demonstração e as notas têm altura própria e ficam fora da composição do site. Não há altura fixa nem bloqueio de rolagem vertical para encaixar artificialmente em 900px.

A esfera usa glifos FLOWAY em SVG esquemático gerado localmente, sem WebGL. No enviado, carrega em leitura o símbolo oficial `assets/brand/floway-simbolo-fundo-claro.svg`, sem editar ou reconstruir o vetor. Não certifica morfose de partículas, física, shader, aceleração 3D ou efeito de cursor do produto. O movimento esquemático do respondendo não é velocidade final de rotação. Círculo de entrada e digitação de resposta real ficam documentados pela fonte; não há resposta inventada para animar neste artefato.

## Estados e interação demonstrativa

| Estado | O que se vê / como revisar | Preservação e acessibilidade |
|---|---|---|
| Vazio B | Esfera central, convite e os quatro atalhos originais | Histórico oculto; nenhum dado exigido |
| Aberta | Digitar e acionar Enviar → ou tocar atalho abre a coluna esquerda | Mensagem é mostrada com `textContent`, sem interpretar HTML; textarea mantém texto e foco |
| Respondendo | Selecionar no controle; ponto azul e cursor; nenhuma resposta gerada | `role=status`; sem espera ou porcentagem inventada; trocar estado cancela a demonstração |
| Resumo/confirmar | Selecionar Resumo; apenas texto informado e nota “sem IA” | Não inventa empresa/objetivo/contato nem interpretação |
| Ajuste | Botão Ajustar devolve foco à textarea; editar e selecionar Resumo novamente | Texto atualizado é reaproveitado, sem pedir novamente |
| Enviado (F) | Confirmar e enviar ou selecionar Enviado troca esfera pelo F | `role=status` diz explicitamente “somente demonstração, sem entrega real” |
| Falha | Selecionar Falha mostra texto curto e tentar de novo | `role=alert`; digitado preservado; tentar volta ao estado demonstrativo respondendo |
| Alternativa | Botão Usar formulário simples transfere a mensagem e foca Nome; seletor também abre | Nome/empresa/contato/mensagem com rótulos; envio desativado |
| Sem JS | HTML inicial entrega diretamente os quatro campos; controles JS ausentes | Nenhum form/action, submit ou redirecionamento; envio desativado e nota explícita |
| Sem WebGL | Não há dependência de canvas/WebGL; controle oculta a representação | Texto, controles e formulário permanecem; estado enviado também é anunciado em texto |
| Reduzido | CSS desliga animações, cursor e movimento esquemático | Todos os estados permanecem selecionáveis e legíveis |

A primeira ida à alternativa reaproveita a mensagem; após edição nesse campo, inclusive apagamento deliberado, novas idas preservam a edição local. Recomeçar limpa só a mensagem da conversa da demonstração; não apaga os quatro campos da alternativa. Após confirmar, o foco vai ao anúncio do estado enviado; o botão oculto não retém foco. O seletor permanece com foco ao trocar estados para facilitar comparação por teclado. Tab segue os controles de revisão, atalhos/entrada, ações, aviso e nota; atalhos e ações são botões nativos. Enter na textarea cria nova linha; enviar exige botão, evitando disparo acidental. Não há gesto exclusivo de mouse.

Aplicação de `metodo:estados-da-tela`: vazio, aberta/com dados, respondendo, sucesso e falha separados; falha não é erro de campo; anúncios de estado fora da animação. Aplicação de `metodo:formularios-e-erros`: rótulos e texto preservado; não há validação fictícia no protótipo inerte. Na futura construção, validação somente ao avançar/enviar, resumo de erros com foco e links, mensagens por campo/`aria-describedby`/`aria-invalid`, título com “Erro:”, e validação no servidor dependem do contrato e despacho próprios. Não criar testes ou regra nova de obrigatoriedade nesta fase documental.

## Dependências e limitações para produto

Roteiro, IA real, limites e proteção contra abuso, destino/serviço de entrega, contrato da conversa/envio, retenção segura sem JS, privacidade e traduções continuam pendentes com os responsáveis. Não há promessa de prazo, preço ou resultado. Nenhum estado local é evidência de serviço disponível. Até a etapa própria, o produto continua com o formulário real temporário; este artefato não o substitui.

Construção futura exige autorização, lista de arquivos, contrato e TDD próprios. Não há alteração de app, API, esfera compartilhada, marca, dependências, CI, memória, instruções ou protótipos antigos. A revisão independente e a aprovação da pessoa continuam com a coordenação.

## Verificação desta entrega

Inspeção realizada em 2026-11-03, após liberação explícita da integradora transmitida por Design e Front (`msg_3c9924c184bb`, 16:47:45 UTC). Chrome/Playwright via `file://`, sem servidor/build, com WebGL desativado. Navegadores desta inspeção encerrados e slot devolvido à coordenação. Aplicada `superpowers:verification-before-completion`.

- Oito estados em 1440×900, 1883×703 e 390×844: 24 combinações sem rolagem horizontal; larguras de documento exatamente 1440, 1883 e 390px.
- Teclado: Tab chega ao seletor; primeira mensagem por botão/Enter abre B; foco retorna à entrada; Ajustar reaproveita texto; confirmar move foco ao anúncio enviado. Texto com `<b>` aparece literalmente, sem HTML interpretado.
- Falha/tentar mantêm texto; nome/empresa/contato/mensagem da alternativa continuam editáveis. Percurso conversa → falha → formulário → editar mensagem → falha → formulário reproduziu perda antes da correção, tanto com texto editado quanto com apagamento deliberado. Após condicionar a transferência à ausência de edição na alternativa, ambos foram preservados. Evidência de inspeção do protótipo, não TDD de produto.
- Em movimento reduzido, animação computada da esfera e do cursor é `none`; textos/controles permanecem. Sem WebGL, toda a matriz funcionou; ocultar esfera não remove entrada. Sem JS em 390×844, quatro campos editáveis, controles JS ocultos, envio desativado e largura de documento 390px.
- Zero erros de página/console e zero requisições HTTP(S) durante a matriz. Apenas arquivo HTML e símbolo local. Inspeção estática confirmou IDs únicos, rótulos resolvidos, links internos existentes, nenhum form/iframe/recurso externo e sintaxe do script aceita.
- As capturas foram abertas e inspecionadas. O convite estava cortado na textarea móvel; altura mínima de 72px corrigiu a leitura. Repetidos os oito estados móveis: sem rolagem lateral; textarea com `clientHeight=scrollHeight=71px` em vazio/aberta/respondendo/ajuste/falha. Convite completo confirmado visualmente na captura final.

| Viewport | Esfera vazia: x / caixa | Esfera aberta: x / caixa | Entrada vazia / aberta: largura | Documento final vazio / aberto: altura |
|---|---|---|---|---|
| 1440×900 | 520 / 400×300 | 978 / 360×300 | 900 / 856px | 1082 / 1019px |
| 1883×703 | 742 / 400×200 | 1399 / 360×200 | 900 / 900px | 906 / 833px |
| 390×844 | 55 / 280×220 | 75 / 240×180 | 354 / 354px | 1494 / 1410px |

Medidas em CSS px; alturas finais também conferidas nas dimensões PNG. A área visível dos glifos é menor que a caixa SVG. A faixa de demonstração, as notas e as fontes substitutas aumentam a altura: há rolagem vertical inclusive no desktop do artefato. Isso não certifica a composição de produto em uma única tela; seu encaixe com fontes reais continua dependência da construção futura. Não há sobreposição dos campos, frase, esfera ou rodapé nas capturas inspecionadas.

Evidências locais temporárias: `/tmp/floway-contato-b-20261103/medidas.json`, `celular-ajuste.json`, capturas `1440-vazio.png`, `1440-aberta.png`, `1440-resumo.png`, `1883-aberta.png`, `390-vazio.png`, `390-enviado.png`, `390-formulario.png`, `390-sem-js.png`, `390-reduzido.png` e demais estados capturados. Não publicados nem adicionados ao Git. As medidas móveis do primeiro JSON antecedem o ajuste de 28px na entrada; `celular-ajuste.json` e PNGs móveis normais são a evidência final desse ajuste. A captura reduzida comprova o modo anterior ao ajuste de altura, que não altera as regras de movimento.

## Descrição local — modelo do projeto

### O que mudou

Documento de reconciliação e HTML local do contato B com estados demonstrativos e alternativa sem IA/JS.

### Por quê

Refs #27; coordenação #30. Reapresentar o alvo aprovado para revisão, sem construir produto ou encerrar issue de produto.

### Como testei / Testes macro executados

Inspeção visual autorizada concluída: 24 combinações de estado/dimensão, teclado/foco, reduzido, sem JS, sem WebGL e preservação de texto, com repetição dos oito estados móveis após ajuste. Sintaxe do script, integridade dos vínculos HTML e escopo conferidos. TDD e macro de produto não executados: somente desenho documental, sem mudança no app. CI não acionado; sem push/PR; sem sincronização/merge da main nesta entrega restrita aos dois arquivos.

### Capturas

Capturas locais em `/tmp/floway-contato-b-20261103/`, relacionadas na verificação acima; HTML versionado permite reabrir todos os estados sem serviço.

### Riscos e pendências

Fonte de sistema altera métricas; esfera é esquemática e F usa vetor local. IA, entrega, privacidade, contrato e traduções não concluídos. Sem dados pessoais de exemplo no conteúdo.

### Validação da integradora

Pendente de revisão independente; nenhuma integração ou publicação autorizada nesta entrega.
