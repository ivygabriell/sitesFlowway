# Hero · F de vidro menor e inteiro

Estado: **proposta visual de fase 1, aguardando conferência da pessoa**. Issue #22, coordenada pela #30. Nenhuma escala final foi fixada; não autoriza implementação nem fase 2.

## Intenção e limite

Preservar o F de vidro e torná-lo reconhecível, inteiro, com FLOWAY legível. A direção confirmada em 2026-11-02 substitui a cobertura obrigatória da palavra inteira por três lâminas da redação antiga da #22. Fonte: issues #22 e #30 lidas integralmente, memória, harness Design e Front, spec aprovada de 2026-10-31 (4.3) e protótipo local `prototipos-estrutura/02-hero.html`. Execução conforme tarefa 1 do plano da coordenação `docs/superpowers/plans/2026-11-02-correcoes-inicio.md`, lido na worktree `design-e-front-correcao`.

[Abra o protótipo interativo](prototipos-correcao/hero-f.html). Ele compara duas escalas em três telas, permite mostrar caixas, parar o movimento e representar o fallback. Funciona localmente, sem fonte, biblioteca, imagem ou referência externa. A palavra vem do vetor próprio; textos auxiliares usam fontes de sistema nesta maquete e não aprovam tipografia/copy novas.

## Trabalho anterior preservado

Lida somente para inspeção: `/Users/ivygabriel/orca/workspaces/siteOficialFloway/front-22-hero-efeito`, HEAD `10d6265`, com alterações não integradas em CenaHero, disposicao, laminas, refracao, testes unitários e dois arquivos novos de iteração/E2E. Nenhum arquivo ali foi alterado, movido ou descartado.

O trabalho amplia a principal (2,8 × 0,8 unidades; escala de celular 2,1), sobe a laje menor para cruzar a palavra e introduz arrasto por mouse, estrias, peso da amostra central e mistura da raiz da cor no shader. A leitura é útil para futura investigação do arrasto e da preservação do miolo escuro. A cobertura integral e a ampliação não são transplantadas: pertencem ao alvo anterior. Nenhum resultado de teste antigo foi tomado como evidência desta proposta e nenhum shader foi copiado para o mockup.

## Alternativas para conferir

**A · presença:** F frontal, no centro horizontal, abaixo do topo do nome, atravessando só parte da palavra. Preserva os vãos entre os três paths e evita inclinação/perspectiva que achatem a haste. Serve como ponto inicial de conversa, não como escolha aprovada.

**B · respiro:** mesmo centro, 88% da largura/altura de A. Dá mais espaço para o nome e menos presença ao símbolo. O botão troca as três telas juntas; nenhuma opção se grava como decisão da pessoa.

Descartada no desenho: cobertura integral antiga, por competir com o pedido de F menor. As faixas ficam abaixo do F com vão, em vez de atravessarem sua silhueta. **Essa mudança de composição também precisa da conferência da pessoa**: não foi aplicada ao produto nem substitui o comportamento aprovado das faixas.

Vidro representado por face translúcida, borda clara, espessura deslocada 4 × 6 px e repetição da palavra recortada pelos paths do F, deslocada 5 px e desfocada horizontalmente. Trata-se de aproximação SVG, não refração física, Fresnel, shader ou WebGL real. Não reintroduz braço azul sólido: a geometria oficial recebe material de vidro, sem alterar o arquivo de marca.

## Medidas propostas

Coordenadas em pixels de tela, origem (0,0) no canto superior esquerdo. Caixas nominais do viewBox, antes da espessura visual e da flutuação; dimensões iguais em x/y por escala uniforme. A flutuação soma de (0,0) a (+4,−5) px; profundidade soma (+4,+6) px. Esses envelopes continuam dentro da tela e antes das faixas em A e B.

| Tela | FLOWAY: x, y, largura × altura | F A: x, y, largura × altura | F B: x, y, largura × altura | Margem lateral A / B | Faixas y / intro y |
|---|---|---|---|---|---|
| 1440 × 900 | 101; 157; 1238 × 265,8 | 465; 235; 510 × 357,7 | 495,6; 256,5; 448,8 × 314,8 | 465 / 495,6 | 630 e 650 / 710 |
| 1883 × 703 | 132; 105; 1619 × 347,6 | 741,5; 210; 400 × 280,5 | 765,5; 226,8; 352 × 246,9 | 741,5 / 765,5 | 527 e 547 / 595 |
| 390 × 844 | 18; 205; 354 × 76,0 | 65; 245; 260 × 182,4 | 80,6; 255,9; 228,8 × 160,5 | 65 / 80,6 | 468 e 488 / 550 |

Em A, espaço da caixa do F até a primeira faixa: 37,3 / 36,5 / 40,6 px respectivamente (mínimo 25,5 px contando profundidade e flutuação conservadoramente). A lateral, topo e base inteiros ficam visíveis inclusive em 1883 × 703. Altura do F representa 39,7% / 39,9% / 21,6% da tela. No celular não amplia para cobrir o nome todo.

FLOWAY mantém viewBox 850 110 1360 292, proporção 1360:292 e translação (843,568; 384) do path da assinatura. O desktop 1440 retoma a caixa x101/y157 da medição local do hero; larga e celular são sugestões novas e exigem conferência. Cabeçalho, faixas e intro servem só para avaliar ocupação; este protótipo não aprova copy de C2 nem muda outras seções.

## Origem auditável dos paths

- F: `assets/brand/floway-simbolo-fundo-claro.svg`, viewBox **0 0 730 512**, três paths na ordem lâmina, braço, haste; grupo de origem sem transform. Razão nominal **1,42578125**. Transformações do mockup usam apenas translação e escala uniforme, sem alterar `d` nem a relação entre peças.
- FLOWAY: quarto path de `assets/brand/floway-assinatura-horizontal-fundo-claro.svg`, arquivo viewBox 0 0 2200.33 512. O path já traz `translate(843.568 384.000)`; o mockup conserva essa translação e usa o recorte da palavra do módulo local `src/marca/palavra.ts` e do protótipo02.
- Conteúdo de `d` copiado diretamente dos SVGs em disco e embutido no HTML; não depende de exportação ou de rede. Os SVGs e os módulos de marca não foram editados.

| Geometria | Caracteres de d | SHA-256 de d |
|---|---|---|
| F, path 1 | 3459 | `cbbff258b23da4c8240bfa5d3cd0cab4fa055e3426e6fca66174e4538ff418c4` |
| F, path 2 | 2966 | `fb8de5140accc9c5ff6a8f890e5a2f9b70e13fbb0fbf0dc24093849e9a44c907` |
| F, path 3 | 2340 | `72a6f9878206cbd9de925dc6b70e0cb519d760741353ffd9135de5ee0c4d2e18` |
| FLOWAY, quarto path | 3031 | `24bd93ec41784384ab2db2b80c1f28e103ce6c0e53eaac32f16fff3378bbde1d` |

SHA-256 dos arquivos SVG de origem: F `3a93a07831e2c4c403963518dee47862db613f2d92ae6aabc5072ea2f5780253`; assinatura `c76c3e0aef0784d4b053e238eeec8b990e7aee7b53e383ff6bf2228cd2d44016`.

### Caixas reais dos paths (Chrome, `getBBox`, 2026-11-03)

Unidades do SVG de origem, sem stroke, profundidade ou animação. A origem do F é (0; 0); não foi recentrado nem normalizado por peça.

| Path | x; y | largura × altura |
|---|---|---|
| F, lâmina | 71,3399; 0 | 657,6850 × 165,9416 |
| F, braço | 252,4480; 203,0020 | 320,5826 × 241,5260 |
| F, haste | 0; 240,5290 | 261,6870 × 271,3960 |
| União do F | 0; 0 | 729,0248 × 511,9250 |
| Palavra, antes da translação oficial | 14,4322; −259,4362 | 1342,3334 × 262,8725 |

Após `translate(843.568 384)`, a origem visível da palavra é aproximadamente (858,0002; 124,5638). O recorte nominal continua `850 110 1360 292`: não confundir a caixa dos traços com o viewBox. A união do F cabe no viewBox oficial 730 × 512 com a folga original. As caixas sugeridas acima usam esse viewBox, não esticam a união para preenchê-lo.

## Estados e aceite mantido

Normal: palavra pronta e F inteiro com flutuação discreta de maquete. Reduzido: palavra, vidro, faixas e intro presentes e parados; a preferência do sistema prevalece sobre o botão Movimento. Sem WebGL: palavra SVG e conteúdo, sem vidro. As três prévias são imagens SVG acessíveis com descrição; controles são botões nativos com foco visível e `aria-pressed`.

O critério continua **≥25% de pixels com luminância <0,35 e p10 ≤0,25**, sem redução. No produto, repetir o recorte legado 1440 × 900 (x100, y150, 1240 × 280), mais a caixa da palavra nos demais tamanhos, com entrada concluída, abertura pulada, mouse e tempos controlados. Não adaptar o recorte para fabricar aprovação. Os antigos ≥8% de tons médios nas duas metades dependem de reconciliação explícita com o F menor: não foram declarados cumpridos nem afrouxados silenciosamente.

A fase 1 verifica desenho, caixas, paths e representação visual. A medição de pixels do SVG é apenas diagnóstico do mockup, nunca prova do shader de produção. Ficam pendentes no produto: efeito real, interação com mouse, glitch, saída em rolagem, quadros lentos, idiomas e desempenho.

## Verificação desta entrega

Conferência em 2026-11-03, após liberação explícita do slot3100 pela integradora: servidor estático Python na porta3100 e Chrome via Playwright, sem build de produto. Inspecionadas capturas em tamanho nativo de A/B em 1440 × 900, 1883 × 703 e 390 × 844: F inteiro, sem interseção com as faixas, palavra reconhecível e vidro representado. A opção B abre mais espaço; nenhuma foi eleita como escala final. O reconhecimento e a composição continuam sujeitos à conferência da pessoa.

Paths comparados literalmente aos SVGs locais e hashes confirmados. `getBBox()` mediu as caixas de origem acima; as transformações das faces confirmaram translação e escala uniforme. Nos três formatos, margens e envelope de flutuação/profundidade permanecem internos. As imagens foram capturadas com preferência de movimento reduzido, origem de rolagem zerada e dois quadros de assentamento após cada redimensionamento.

Diagnóstico de pixels **somente do mockup**, usando luminância `(0,2126 R + 0,7152 G + 0,0722 B)/255`, mesma fórmula do teste existente e DPR1:

| Tela / recorte (x; y; largura × altura) | Escuros A | Escuros B | p10 A / B |
|---|---|---|---|
| 1440 × 900 / 100; 150; 1240 × 280, legado intacto | 36,84% | 38,74% | 0,0706 / 0,0706 |
| 1883 × 703 / 132; 105; 1619 × 348, caixa nominal da palavra arredondada | 44,11% | 45,01% | 0,0706 / 0,0706 |
| 390 × 844 / 18; 205; 354 × 76, caixa nominal da palavra arredondada | 36,50% | 42,57% | 0,0706 / 0,0706 |

Controles A/B e Mostrar caixas funcionaram; teclado Tab/Enter acionou a alternativa B; não houve rolagem lateral na página de conferência a390px nem erro JavaScript. Reduzido via botão e via preferência do sistema resultou em `animation-name: none`; normal sem preferência resultou em `flutuar`. O fallback ocultou o vidro e manteve a palavra visível; é representação manual do estado sem WebGL, não detecção nem teste real de perda do contexto WebGL.

Evidências temporárias encaminhadas à coordenação: `/tmp/hero-f-evidencias.json`, `/tmp/hero-f-inspecao.cjs`, `/tmp/hero-f-inspecao.log`, seis capturas `/tmp/hero-f-{A,B}-{1440x900,1883x703,390x844}.png` e `/tmp/hero-f-fallback-390.png`. Os valores e o método estão registrados aqui para não depender da duração de `/tmp`. Verificação final: `git diff --check`, escopo dos dois arquivos e comparação dos hashes dos sete arquivos alterados/novos na worktree antiga. Nenhum teste de busca de texto foi criado. TDD, suíte, tipos e build de produto não foram executados nesta fase visual; a proposta não certifica produção.

## Decisões para a pessoa / próxima etapa

Conferir A versus B, posição vertical e o vão até as faixas nos três formatos; ajustar até reconhecer o F inteiro sem competir com FLOWAY. Só depois dessa conferência um novo despacho pode definir a escala final e autorizar produto. Não iniciar fase 2 nesta entrega.

## Descrição de PR preparada localmente

Título: `docs(hero): propor F de vidro inteiro — fase 1, escala pendente`

### O que mudou

Protótipo visual A/B e medidas sugeridas nos três formatos, com paths oficiais auditáveis. Fase 1 somente; escala final e implementação aguardam conferência da pessoa.

### Por quê

Refs #22 (**fase 1 somente; não encerra a correção de produto**). Coordenação #30 e direção confirmada de preservar o F menor.

### Como testei / macro

Inspeção do HTML, comparação dos paths e caixas geométricas, `git diff --check`. TDD, suíte, tipos e build de produto não foram executados no escopo documental desta fase; validação independente permanece pendente. Evidências abaixo; não marcar os checkboxes de produto como cumpridos.

### Riscos e pendências

A/B não aprovados; vidro SVG não certifica WebGL; composição das faixas depende de conferência; nenhuma mudança na marca ou produto. Sem push ou PR durante esta execução, conforme follow-up da coordenação que retirou a autorização externa inicial.

### Validação da integradora

Pendente: revisar os dois arquivos, conferir o protótipo com a pessoa e decidir entrega externa. Não integrar produto nem encerrar a correção de produção com esta proposta.
