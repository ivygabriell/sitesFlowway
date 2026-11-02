# Bugs, "Iniciar projeto" e celular

Estado: 2026-11-01. Parte de `42b28e7`. Só entra bug reproduzido; relatórios completos das três auditorias ficam nas notas da sessão, fora do repositório. Testes em `tests/e2e/pagina-contato.spec.ts`, `tests/e2e/responsivo.spec.ts`, `tests/e2e/rolagem.spec.ts`, `tests/unit/pagina-contato.test.tsx` e `tests/unit/rota-contato.test.ts`.

## 1. Iniciar projeto

**Reprodução:** clicar no selo ou em "Iniciar um projeto →" leva a uma 404 vazia. Nenhuma branch da Ivy tem essa página; o plano dela para na Início.

**Decisão:** só o formulário simples (spec 4.6: quem visita nunca vê a conversa simulada). Na disposição B aberta do protótipo 12: frase, formulário à esquerda, esfera à direita, rodapé.

**Critérios:**
- `/contato`, `/en/contact`, `/privacidade` e `/en/privacy` respondem 200, com `noindex`.
- Formulário com nome, empresa, contato e mensagem; funciona sem JavaScript.
- Campo-isca descarta; acima de 5 envios em 10 min por endereço recebe falha.
- Falha mostra "Tentar de novo" sem perder o texto (com JavaScript).
- **Sem serviço de e-mail escolhido, `entregarPedido` responde falha.** O site nunca diz que enviou sem ter enviado.
- O globo é redondo em qualquer posição (razão entre 0,93 e 1,07).

## 2. Bugs, por prioridade

| # | Bug | Reprodução | Critério | Estado |
|---|---|---|---|---|
| 1 | Círculo do contato alarga a página (causa de 360 arrastando, selo fora da tela, 844×390 em modo desktop, esfera sobre o CTA) | Abrir `/` em 360×640, 375×667, 768×1024 ou 844×390: `innerWidth` cresce 15% | `innerWidth` igual à tela, modo celular | Resolvido |
| 2 | Recarregar ou voltar perde o lugar | Rolar a 3840 e recarregar: cai em 994. Voltar de `/contato`: 8294 vira 5868 | Volta a menos de 150 px | Ver `rolagem.spec.ts` |
| 3 | Selo cobre o manifesto e "(O que é único)" | 390×844 | Texto termina antes do selo | Resolvido |
| 4 | "EN" não responde ao toque; alvos de 14 px no cabeçalho | 390×844 | Toque troca a língua; alvos de 44 px | Resolvido |
| 5 | Cartões passam 36 px da margem | 390×844 | Dentro da margem | Resolvido |
| 6 | Digitação das frases empurra a lista | Celular | Altura reservada | Resolvido, sem teste próprio |
| 7 | Cabeçalho quebra fora da Início | 360×640 | Uma linha; o nome sai porque "Voltar ao início" faz o mesmo | Resolvido |
| 8 | 404 vazia | `/qualquer` | "(404)", título e dois links | Parcial: falta a esfera formando 404 |
| 9 | Sem JavaScript, nenhum caminho até o contato na Início | `/` sem JS | Rodapé com CTA visível | Resolvido |
| 10 | Esfera deformada fora do eixo da câmera | `/contato` em 1883×703: razão 1,30 | Ver seção 1 | Resolvido |

## 3. Não resolvidos

| Bug | Motivo |
|---|---|
| Faixa e "Role para baixo" somem ao recarregar no meio (`hero/CenaHero.tsx`) | O hero está com a sessão de origem, em paralelo |
| Faixa corta a base de FLOWAY em 1883×703 (`hero/disposicao.ts`) | Idem |
| Trabalhos prende rolagem sem a fileira andar em tela larga e baixa; rótulo desalinhado | Efeito do vão de 3vw, que não pode ser desfeito; espaçamento está com a sessão de origem |
| Exceção `isReady` ao sair da Início pelo fundo (`compileAsync` do three segue após desmontar) | Vem de dentro da biblioteca; trocar por compilação síncrona traria engasgo. Precisa de decisão técnica própria |
| Rolar no início da abertura move a página por trás | Intermitente, em 1883×703; sem reprodução estável para testar |
| Selo e cabeçalho `inert` sem JavaScript | Só o CTA do rodapé ficou como caminho sem JS |
| Selo com 34 px de largura | Medida fixada pela spec 4.2 |

## 4. Decisões que dependem da pessoa

- **Serviço de e-mail e endereço de destino:** até lá, todo envio real mostra falha. Bloqueia publicar.
- **Texto de privacidade (C2):** segue `[pendente: ...]`.
- **`/trabalhos`:** continua 404, porque o plano o deixa para depois. O menu aponta para lá.

## 5. Textos

Sem texto inventado: rótulos vêm da spec 4.6; envio, falha, "Tentar de novo" e aviso vêm do protótipo 12, inclusive o "Ao conversar", que fala de conversa num formulário. A confirmar em C2, junto com o inglês do formulário.
