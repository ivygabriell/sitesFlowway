# Contato por chat com IA: desenho

**Data:** 2026-11-22 · **Aprovado pela pessoa:** 2026-11-22 ("pode realizar a implementação, aprovado"), sobre as telas do Penpot registradas em [`processo/telas/`](../../../processo/telas/README.md) (`contato-chat-ia/`).
**Substitui:** a disposição B da seção 4.6 da [estrutura](2026-10-31-estrutura-site-design.md) e o visual atual da página `/contato` (chat genérico em caixa escura, `ConversaGuiada`/`ConversaIA`). As regras de envio, validação, privacidade e IA que já estão no código continuam valendo.

## 1. Intenção

A pessoa quer que o contato seja **um chat com uma LLM**, como no ChatGPT, com a identidade premium da Floway e sem quebrar a cena do fim da Início. O globo de letras, que já forma o F no fim da página, passa a ser a presença da IA: ao "Iniciar um projeto", ele vai para o canto e continua com as animações dele. Referência de fluxo citada pela pessoa: um diagnóstico em conversa (boas-vindas, uma pergunta por vez, validação na hora, resumo antes de enviar). O que se copia é a ideia, nunca o visual.

**Objetivos:**
- quem chega ao fim da Início conversa com a IA ali mesmo, sem trocar de página;
- a conversa parece um chat de LLM: histórico rolando, campo de mensagem embaixo, resposta chegando em tempo real, respostas rápidas em pílula;
- nada é enviado à equipe sem a pessoa conferir o resumo e confirmar;
- o globo acompanha o estado da IA (online, pensando, resumo pronto, enviado, falha).

**Fora do escopo:** mudar o roteiro, o modelo ou as regras da IA (rota `/api/contato/conversa`), o envio (`/api/contato`, Resend) e o texto legal de privacidade (C2). Streaming de verdade no servidor também fica fora (ver 3).

**Antiobjetivos (falha mesmo funcionando):** perder o que a pessoa escreveu numa falha; enviar sem confirmação; o globo parar ou "pular" ao ir para o canto; um chat genérico que não pareça Floway; quebrar a rolagem e o ScrollTrigger da Início.

## 2. Telas e estados (registradas em `processo/telas/contato-chat-ia/`)

| Frame | O que é |
|---|---|
| 01 | Fim da Início hoje: frase, globo/F, "Iniciar um projeto", rodapé. Ponto de partida, não muda. |
| 02 | Chat vazio: o globo foi ao canto inferior direito (≈270 px) com o status "FLOWAY IA · ONLINE"; no centro, "COMO PODEMOS AJUDAR?", subtítulo, o campo com foco e 4 respostas rápidas iniciais. |
| 03 | Conversa: mensagens da IA em texto corrido com o rótulo "FLOWAY IA" (mono), mensagens da pessoa em balão #121212 à direita; respostas rápidas em pílula depois da última mensagem da IA; o topo esmaece ao rolar. |
| 04 | IA escrevendo: a resposta aparece palavra por palavra, com cursor azul; status "● PENSANDO…" em azul; o botão de enviar vira "parar". |
| 05 | Resumo: cartão branco com borda #121212 (nome, projeto, prazo, investimento, contato), "CONFIRMAR E ENVIAR" e "AJUSTAR ALGO". |
| 06 | Enviado: o cartão vira "✓ PEDIDO ENVIADO" (esmaecido), o globo forma o F no canto, a IA agradece e oferece "Ver trabalhos" / "Voltar ao início". |
| 07 | Falha: o cartão continua com "TENTAR DE NOVO"; aviso em azul de que as respostas continuam ali; status "NÃO FOI DESTA VEZ". |
| M02, M03 | Celular: o globo grande no vazio, que vira o ícone de 40 px na barra do chat ("Floway IA · online"); campo fixo embaixo. |
| 00 | Notas de movimento, comportamento, acessibilidade e identidade (valem como parte desta spec). |

Medidas e cores: `processo/telas/tokens.json`. Fontes e cores são as do site (`globals.css`, `src/fontes.ts`).

## 3. Abordagens consideradas

1. **Chat no próprio fim da Início, com o mesmo componente em `/contato` (escolhida).** O clique em "Iniciar um projeto" troca o estado da seção do contato (a cena fica presa na tela), leva o globo ao canto e monta o chat; `/contato` abre direto no estado 02. Atende ao pedido ("ao final da página… o globo vá para o canto") e mantém o menu "Contato".
2. Manter o link para `/contato` e animar a troca de página. Mais simples, mas a pessoa pediu a transição dentro da cena; a Início também não suporta remontar no cliente (lição de 2026-11-01).
3. Abrir o chat num painel sobreposto (modal). Rompe a cena e a identidade; descartada.

**Resposta "em tempo real":** a rota atual devolve a resposta inteira. O efeito de streaming é **feito no cliente** (a resposta recebida é revelada palavra por palavra); "parar" interrompe a revelação e, se o pedido ainda estiver no ar, aborta o `fetch` (`AbortController`, como hoje). Streaming real no servidor muda o contrato da API e fica para depois, se a pessoa pedir.

## 4. Comportamento

- **Globo ao canto:** encolhe de ≈570 px para ≈270 px e vai ao canto inferior direito em `tempo-cabecalho` (0,8 s) com `curva-suave`; segue girando e reagindo ao mouse. A frase e o rodapé saem; o chat entra de baixo (`tempo-lista`, intervalo `intervalo-lista`). "FECHAR ✕" desfaz: o globo volta ao centro e a seção volta ao estado 01, sem perder a conversa da sessão.
- **Estados do globo** (props que `EsferaDeLetras` já tem: `respondendo`, `formarAlvo`): online = giro normal; pensando = `respondendo` e o ponto do status azul piscando (`tempo-ponto-relogio`); enviado = `formarAlvo` (forma o F); falha = ponto azul fixo, sem F. O F só se forma depois do **sucesso real** do envio.
- **Fonte das perguntas:** com o Gemini configurado, a conversa é a da `ConversaIA` (rota `/api/contato/conversa`); sem ele, o roteiro da `ConversaGuiada`. As duas passam a usar o mesmo visual de chat. Respostas rápidas = `opcoes` da IA, os atalhos e as faixas que já existem; clicar numa pílula envia o texto dela.
- **Campo (composer):** Enter envia, Shift+Enter quebra linha, cresce até 5 linhas; desativado enquanto a IA responde (o botão vira "parar"). Embaixo, sempre, o aviso de IA (Google Gemini) e o link da Política de Privacidade.
- **Validação:** WhatsApp e e-mail continuam validados como hoje (`whatsappValido`, `emailValido`); o erro aparece como mensagem da IA em azul pedindo de novo, sem apagar o que foi digitado.
- **Resumo e envio:** o cartão mostra os campos que a fonte coletou (pela IA: nome, empresa, resumo, WhatsApp, e-mail; pelo roteiro: também necessidades e prazo). "AJUSTAR ALGO" torna as linhas do cartão editáveis no próprio cartão, reaproveitando a validação do resumo editável de hoje (decisão da Lead: sem nova volta à IA); "CONFIRMAR E ENVIAR" usa o envio que já existe (`Formulario`/`/api/contato`, com a trava contra duplo envio). Falha: cartão e respostas ficam, botão vira "TENTAR DE NOVO".
- **Celular:** o globo vira o ícone de 40 px da barra do chat; a conversa ocupa a tela; o campo fica fixo acima do teclado.

## 5. Acessibilidade, movimento reduzido e sem WebGL/JS

- A lista de mensagens é `aria-live="polite"` e anuncia só a mensagem terminada; o foco volta ao campo depois de cada resposta; tudo funciona pelo teclado (Tab passa pelas pílulas, pelo campo, por confirmar/ajustar).
- Movimento reduzido: sem revelação palavra por palavra (a mensagem aparece inteira), globo parado, sem deslocamento animado.
- Sem WebGL: o globo some (ou a imagem estática, como o resto do site faz) e o status continua em texto.
- Sem JavaScript: o formulário simples que já existe (`<noscript>`), sem mudança.

## 6. O que fica para quem constrói

- A estrutura dos componentes (um `ChatContato` comum aos dois lugares é o esperado), como prender a seção do contato da Início durante a conversa sem brigar com o ScrollTrigger e o Lenis, e o caminho do globo (o `UseCanvas` acompanha a `div.esfera`; animar a div costuma bastar).
- Textos de interface novos entram em `src/conteudo/contato.ts` nas duas línguas; o que ainda não tiver tradução fica marcado como pendente, como as outras chaves.

## 7. Critérios de aceite

1. No desktop, no fim da Início, clicar em "Iniciar um projeto" leva o globo ao canto inferior direito sem trocar de página e mostra o estado 02 igual à captura registrada; "FECHAR" volta ao estado 01.
2. `/contato` e `/en/contact` abrem no estado 02, com o globo no canto.
3. Enviar uma mensagem mostra o balão à direita; a resposta da IA aparece palavra por palavra com o cursor azul e o status "PENSANDO…"; "parar" interrompe.
4. As respostas rápidas aparecem só depois que a mensagem da IA termina e enviam o texto ao clicar.
5. O resumo aparece no cartão; nada é enviado antes de "CONFIRMAR E ENVIAR"; duplo clique não envia duas vezes.
6. Sucesso real: o cartão vira "✓ PEDIDO ENVIADO" e o globo forma o F. Falha: cartão e respostas ficam, "TENTAR DE NOVO" reenvia.
7. Celular (390×844): estados M02 e M03 iguais às capturas, campo visível com o teclado, sem rolagem lateral.
8. Movimento reduzido, sem WebGL e sem JavaScript funcionam como em 5.
9. A rolagem da Início acima do contato não muda (pins, galeria, lençol, voltar e recarregar).
10. `npm test`, `npm run check` e `npm run test:build` verdes; capturas do PR lado a lado com as do registro.
