# Estrutura do site oficial da Floway e do monorepo

Estado: **aprovada em 2026-10-31** (portão da estrutura) · Cenário do método: site estático (testado em 1 projeto), método 2.12.0

Esta spec fecha a estrutura que ficou aberta no pedido: a oferta, as seções de cada página, o público, o modelo de case (rascunho) e a organização do repositório. Ela parte da [`02-site.md`](https://github.com/CreateHubAI/identidadeFloway/blob/2e0c5fa/docs/marca/02-site.md) do repositório de identidade (`CreateHubAI/identidadeFloway@2e0c5fa`) e diz, seção por seção, o que **entra, sai ou muda**. Quando esta spec não fala de um valor (token, medida, estado), vale o da `02-site.md`.

Os protótipos aprovados seção por seção estão em [`prototipos-estrutura/`](prototipos-estrutura/). Eles mostram estrutura, ritmo e comportamento e são desenhados em canvas 2D ou CSS, com menos partículas. Não são código do site.

## 1. Objetivo e restrições

**Objetivo.** Definir a estrutura do site oficial da Floway, uma empresa de tecnologia B2B que entrega landing pages, sites institucionais e automações, e cuja oferta vai crescer. A estrutura de "o que entregamos" precisa aceitar um produto novo sem refazer páginas. O próprio site é a prova: quem visita tem de pensar "esses caras são bons" logo de cara. A spec também define o monorepo que guarda o site e os sites de portfólio.

**Restrições decididas pela pessoa (não se rediscutem aqui):**
- Paleta `#F7F7F5`, `#DCDCD8`, `#787878`, `#121212`. O azul fica só em detalhes: `#002FA7` no claro e `#5B7BFF` no escuro. O `#FFFFFF` é só "papel". O `#787878` só aparece em texto a partir de 24 px e em linhas.
- Fontes: Inter Tight, Azeret Mono e Instrument Serif. A assinatura "FLOWAY" usa Inter Tight 800, caixa-alta, espaçamento −0,055em.
- Logotipo só pelos arquivos de `assets/brand/` do repositório de identidade.
- Na Início há um só trecho escuro, com passagem orgânica. A alternância claro/escuro entre seções está vetada.
- Pilha: Next.js 15.5, React 19, Three r180, R3F, r3f-scroll-rig com Lenis, GSAP 3.13 e cannon-es.
- Celular abaixo de 900 px. Movimento reduzido com todo o conteúdo visível. Fallback sem WebGL.
- Nada inventado: nem cliente, nem depoimento, nem número, nem prêmio, nem resultado. Todo trabalho sem cliente leva o rótulo "Conceito".
- Nenhum e-mail ou telefone no site.
- Português sem prefixo e inglês em `/en`.
- O `noindex` fica ligado até a publicação. Nada é postado em rede social.
- Referência: o RayRay Lab, como estrutura e valores medidos; nada dele entra no repositório. Exceção registrada no manual em 2026-10-31 (PR #20 do repositório de identidade): o auros.global, só para a esfera do contato e da 404.

**Fora de escopo desta spec:**
- Construção da página Trabalho e dos cases.
- Lista de conceitos do portfólio.
- Roteiro e integração da IA do contato (Gemini).
- Textos que ainda faltam e a versão em inglês (C2).
- Publicação (C5).
- Peças de redes sociais (C6).

## 2. Entendimento

O que a pessoa disse (2026-10-31):
- "Mas seguirá as animações, estrutura e etc. do site base, correto? Adaptado à nossa identidade."
- "Não será uma página de oferta, será o site oficial." → **sem página por oferta** (opção A).
- Sobre a faixa do hero: "vamos fazer o RayRay, bem clean, reforçando benefícios como eles".
- Sobre o manifesto: "preciso que seja menor e mais clean".
- "Esse formulário vai ser através de uma IA, o Gemini, então será montado depois."
- "Vamos deixar essa parte sem fazer ainda, criaremos quando os projetos existirem" (página Trabalho).

Decisões minhas depois da revisão de quem vai construir (conferir no portão):
- **Zero trabalhos.** Durante a construção (site com `noindex`, fora do ar), a galeria da Início e `/trabalhos` mostram cartões marcadores em cor estática, sem link, e o menu "Trabalhos" leva a `/trabalhos`. A trava de publicação falha se houver marcador. O que a Início e `/trabalhos` mostram se ainda não houver case na hora de publicar fica para C5.
- **Envio do contato nesta etapa.** O formulário simples envia por uma rota do Next no servidor (a Vercel é a recomendação da passagem). O e-mail que recebe a mensagem fica só na configuração do servidor, nunca no código. A proteção mínima vem já: campo-isca contra robôs e limite de envios por endereço de rede. Entra uma página **`/privacidade`** (`/en/privacy`) com o aviso de privacidade, cujo texto fica em C2. O serviço de e-mail é escolha do plano.
- **Conversa simulada.** Só existe nos testes. Quem visita vê o formulário simples até a IA entrar.
- **Inglês antes de C2.** As rotas `/en` existem desde o início. Chave sem tradução mostra o texto em português e é marcada como pendente. A trava de publicação falha se houver chave pendente.
- **Código de origem.** É copiado sem o histórico do git, e o primeiro commit registra `identidadeFloway@2e0c5fa`, como manda a passagem.

O que eu supus e marquei para conferir no portão:
- **Organização do monorepo (seção 4.8):** é proposta minha; a pessoa ainda não a viu.
- **Destino do "Iniciar um projeto →":** a pessoa não respondeu entre levar a `/contato` ou abrir na Início. Fiquei com `/contato`, como na `02-site.md`.

## 3. Referências

| Referência | Uso | Como foi conferida |
|---|---|---|
| RayRay Lab, https://www.rayraylab.com/ e `/work`, `/work/1`, `/contact` | Estrutura, seções, efeitos e tempos de todo o site | Auditoria do repositório de identidade (`docs/referencias/rayraylab.md`, seções 1 a 15), reconferida em 2026-10-31 com capturas no Playwright (1440×900 e 390×844) de abertura, hero, passagem, manifesto, cubo, galeria, lençol, contato e `/work` |
| auros.global, https://www.auros.global/ | **Só** a esfera de partículas do contato e da 404 | Capturas no tempo, com mouse e rolagem em 2026-10-31, e leitura de nomes no pacote publicado: cerca de 40.960 partículas de dígitos numa folha de sprites 10×10, esfera com buracos de ruído, morfose esfera ↔ fita, luz que segue o mouse, WebGPU com TSL. Nada copiado |

## 4. Desenho

### 4.1 Mapa de páginas

| Página | Endereço | Estado nesta etapa |
|---|---|---|
| Início | `/` · `/en` | Construída (seção 4.3) |
| Trabalhos | `/trabalhos` · `/en/work` | Construída, com capas em cor estática até existirem cases (seção 4.4) |
| Trabalho | `/trabalhos/<case>` · `/en/work/<case>` | **Só especificada.** Construída quando existir o primeiro projeto (seção 4.5) |
| Contato | `/contato` · `/en/contact` | Construída, com a conversa em modo simulado ou formulário simples até a IA entrar (seção 4.6) |
| Erro 404 | Qualquer endereço fora do mapa | Construída (seção 4.7) |
| Privacidade | `/privacidade` · `/en/privacy` | Construída, em tela clara de texto; o texto fica em C2 |

**Oferta (decidida: opção A).** Não há página por oferta. "O que entregamos" aparece em três lugares, todos alimentados por listas em `src/conteudo/`:
- a faixa (01) do hero;
- o lençol "(O que entregamos)", com as capacidades;
- a linha de cada cartão de trabalho, com a oferta e "Conceito" quando for o caso.

Um produto novo é uma linha a mais numa lista. O menu continua com dois links: "Trabalhos" e "Contato".

**Público (decidido).** Empresas em geral (B2B). Os três nichos da `02-site.md` deixam de ser foco: aparecem só como setor dentro dos conceitos do portfólio.

### 4.2 Elementos de todas as páginas

| Elemento | Decisão | Muda em relação à `02-site.md` |
|---|---|---|
| Cabeçalho | Como na `02-site.md`: "©FLOWAY" e descritor que recolhe, relógio REC com ponto azul fora da mistura, seletor PT/EN, menu "Trabalhos" e "Contato" com o item atual riscado; fora da Início, o relógio vira "Voltar ao início" | Não muda. O descritor (até 3 palavras) fica em C2 |
| Selo lateral | **Atalho fixo "INICIAR PROJETO"**, que leva a `/contato`. Faixa vertical de 34 px, `#121212`, Azeret Mono 11 px; só na Início | **Muda:** na referência é um selo de prêmio, e aqui seria prêmio inventado |
| Transição de página | Como na `02-site.md` | Não muda |

### 4.3 Início

Ordem: abertura → hero → passagem para o escuro → manifesto → cubo da marca → "(O que é único)" → trabalhos em destaque → lençol → contato → rodapé. O trecho escuro vai do manifesto ao lençol, e o círculo do contato devolve o claro.

| Seção | O que prova | Efeito (tokens da `02-site.md`) | Celular · reduzido · sem WebGL | Conteúdo | Muda |
|---|---|---|---|---|---|
| **Abertura** ([01](prototipos-estrutura/01-abertura.html)) | Cuidado desde o primeiro segundo; sem indicador girando | Filme em canvas 300×158: a palavra **FLOWAY** cortada em linhas que deslizam ("sintonizando"); 3 trechos em Azeret Mono 14 px; tempos da referência 3.1; até 6 s, uma vez por sessão | Não existe · não existe · igual (canvas 2D) | 3 trechos de até 6 palavras: **pendente (C2)** | Muda: o filme mostra FLOWAY no lugar de "IDENTIDADE" |
| **Hero** ([02](prototipos-estrutura/02-hero.html)) | "Esses caras são bons" logo de cara | **Palavra FLOWAY plana com glitch** (`tempo-glitch` após `intervalo-glitch`) sob **lâminas de vidro**: 3 lajes grandes, quase brancas, em paralelogramo com lados a 45° e vão entre elas, com refração, fresnel, flutuação, mouse e paralaxe da referência 3.2; duas faixas `#FFFFFF`; intro que pisca; "Role para baixo" | Uma lâmina só, maior · palavra pronta, lâminas e faixas paradas · palavra em SVG, sem lâminas | Faixa (01): Landing pages · Sites institucionais · Automações · Integrações · Interface · Desenvolvimento web · Tecnologia B2B · (01) · Feito para o seu negócio. Faixa (02): Branding · Autoridade · Posicionamento · Credibilidade · Presença digital · Percepção de valor · Diferenciação · (02) · Experiência premium · Confiança. Intro de até 30 palavras: **pendente (C2)** | **Muda:** sai o "F" 3D (pendência de identidade P9); as formas viram lâminas; as faixas falam de entrega e benefício, não de nicho |
| **Passagem** ([03](prototipos-estrutura/03-passagem-manifesto.html)) | Domínio de WebGL na segunda rolada | Igual à referência 3.3: escuro sobe de baixo como **névoa** de ruído desfocado (ruído ×0,2 em x·6, y·3), de 60% a mais 60% da altura da tela | Faixa de 60 px em degradê · corte direto · faixa de degradê | — | Não muda |
| **Manifesto** ([03](prototipos-estrutura/03-passagem-manifesto.html)) | Quem é a Floway, com peso | "(Quem somos)", texto gigante justificado (3,7vw/3,32vw), 3 vãos de 0 a 3% da largura | Vãos fechados · vãos fechados · igual | **Manifesto (23 palavras):** "A Floway transforma tecnologia em vantagem para o seu negócio. ‹vão› Estratégia, branding e inteligência artificial ‹vão› em soluções que simplificam processos ‹vão› e impulsionam negócios." **Apoio (39 palavras):** "Boas experiências digitais não acontecem por acaso. Cada interação é uma oportunidade de aproximar marcas e pessoas. Na Floway, exploramos novas possibilidades da tecnologia e da inteligência artificial para criar experiências intuitivas, marcantes e feitas para gerar impacto." | Muda: o limite do manifesto passa de 40–60 para **até 60 palavras** (aprovado com 23) |
| **Cubo da marca** ([04](prototipos-estrutura/04-cubo.html)) | Domínio técnico num detalhe | Como a referência 3.5: bloco 1000×600 gira −90° preso por 0,8 tela; frente com "FLOWAY" em contorno (3 linhas × 7 cópias); lateral com **foto desfocada**, 10 retângulos aninhados e legenda; retângulos seguem o mouse acima de 87% | Gira uma vez · já girado · igual (CSS 3D) | Legenda: "Experiências digitais que transformam a forma de conectar". Foto: "Silhueta Abstrata em Movimento" (gerada pela pessoa, 1622×970; vai em WebP de cerca de 120 KB) | Muda: a lateral usa a foto da pessoa no lugar do fundo gerado em canvas |
| **"(O que é único)"** | O jeito de trabalhar | Sem efeito próprio | Igual | P1 (37 palavras): "Cada marca carrega uma identidade, uma visão e uma história própria. Nosso trabalho é interpretar esses elementos sob diferentes perspectivas, explorando a criatividade para construir uma presença digital autêntica, capaz de despertar interesse e estabelecer conexões duradouras." P2 (38 palavras): "Para dar vida a essa visão, combinamos tecnologia, inteligência artificial e atenção aos detalhes. Cada escolha tem um propósito: tornar a navegação mais intuitiva, valorizar a comunicação e transformar cada ponto de contato em algo relevante e memorável." | Só texto |
| **Trabalhos em destaque** ([05](prototipos-estrutura/05-trabalhos-em-destaque.html)) | Trabalho de verdade | Como a referência 3.6: seção presa, fileira horizontal, cartões 50vh×74vh, barra de 29 tracinhos. **Cartão sem capa:** bloco liso `#DCDCD8` (estado apagado), sem ASCII. **Cartão com capa:** liga sozinho o ASCII com varredura, o hover (zoom 10%, escurece 30%) e a prévia em vídeo de 250 px que abre na vertical | Lista vertical · grade parada · imagens comuns | Linha do cartão: **mês e ano / oferta · Conceito** | Muda: oferta no lugar do nicho; cor estática até haver capa |
| **Lençol** ([06](prototipos-estrutura/06-lencol.html)) | O que a Floway entrega, numa lista que cresce | Como a referência 3.7: título partido "(O que" ——— "entregamos)" com linha que cresce; 2 frases digitadas; folha `#FFFFFF` tracejada que sobe e ondula | Lista em DOM sem ondular · tudo parado e à vista · lista em DOM | Lista: Estratégia digital · Design de interfaces · Desenvolvimento web · Inteligência artificial · Automações e integrações · Experiências digitais · Manutenção e evolução. Frases: "Do primeiro esboço à automação rodando, cuidamos de cada etapa." · "Cada entrega nasce para resolver um problema real do seu negócio." | Muda: título "(O que entregamos)" no lugar de "(Método & Entregas)" |
| **Contato** ([07](prototipos-estrutura/07-contato-esfera.html)) | O próximo passo é simples | Círculo escuro que encolhe (`tempo-circulo`, `curva-circulo`). **Esfera de letras** no lugar do cubo com física: letras F L O W A Y em Inter Tight 800, `#121212` com cerca de 4% em `#002FA7`, na superfície de uma esfera com buracos de ruído, girando; a cada 7 s se reorganizam no **F do logotipo** (desenho exato de `floway-simbolo-fundo-claro.svg`, braço `#002FA7`, de frente, sem girar) e voltam; o cursor empurra as letras | 8 mil letras, toque empurra, sem morfose automática · esfera formada e parada · só frase e rodapé | Frase (22 palavras): "Na Floway, estratégia e desenvolvimento caminham juntos. Unimos visão criativa, engenharia de software e inteligência artificial para transformar desafios em soluções inteligentes." | **Muda:** esfera no lugar do cubo com física (cannon-es deixa de ser usado no contato) |
| **Rodapé** | — | Instrument Serif, como a referência 3.8 | Bloco simples, sem rótulos em itálico | "Iniciar um projeto →" (leva a `/contato`) · *especialidades* Estratégia digital, desenvolvimento web, inteligência artificial, automações e experiências digitais · *localização* Brasil · *instagram* @floway · "© 2026 Floway. Todos os direitos reservados." | Muda: o convite ao formulário fica no lugar do e-mail da referência; sem LinkedIn |

**Esfera, técnica.** Three r180 em WebGL, dentro do canvas global do R3F: pontos instanciados com uma textura de glifos (6 letras em Inter Tight 800). São 20 mil partículas no desktop e 8 mil no celular. A morfose é feita no shader, entre dois atributos de posição: a esfera (Fibonacci) e o F (amostrado dos paths do SVG). Sem WebGPU.

### 4.4 Trabalhos ([10](prototipos-estrutura/10-pagina-trabalhos.html))

Como a referência 7 e a `02-site.md`:
- **Tela e pilha:** tela única com fundo escuro inteiro e pilha de planos presa por (n − 1) telas, com meia volta por trabalho, curva pela velocidade e assentar no mais próximo.
- **Entrada:** planos descendo em 2 s e curva de 0,8 s.
- **Textos:** contador `(01/0n)`, nome em Instrument Serif 3,4vw com "Ver trabalho", e informações digitadas (**setor / mês e ano / oferta · Conceito**).
- **Mídia:** prévia em vídeo e miniaturas com moldura.
- **Celular, reduzido e sem WebGL:** lista de cartões.

**O que muda:**
- capas em cor estática `#DCDCD8` até existirem;
- setor no lugar de nicho;
- com um trabalho só, a página não prende, e esconde contador e miniaturas;
- o link para um trabalho só existe quando a página Trabalho existir (4.5).

### 4.5 Trabalho: especificada, construída depois ([11](prototipos-estrutura/11-pagina-trabalho.html))

Estrutura da referência 8, sem mudança:
1. título com linha que cresce;
2. faixa presa a 50vh;
3. capa revelada por duas fitas;
4. descrição;
5. três colunas (Desafio, Decisões, Entrega);
6. galeria horizontal presa, com 4 imagens, 1 vídeo e camada de vídeo cheia;
7. celular de mostruário;
8. próximo trabalho que vai sozinho aos 99%.

Trabalho inexistente responde 404. **Nada desta página é construído agora**, e não haverá página vazia navegável: ela entra com o primeiro projeto. O modelo de case que a preenche está na seção 5.

### 4.6 Contato ([12](prototipos-estrutura/12-pagina-contato.html))

Uma tela só, como a referência 9: frase da Início, círculo que encolhe, esfera de letras e rodapé. No lugar do formulário entra uma **conversa**, cuja IA (Gemini) é montada depois.

**Disposição B (decidida):**
- a esfera fica no centro, com uma linha "Conte o que você quer construir…" e atalhos em pílula embaixo;
- na primeira mensagem, a conversa se abre e a esfera vai para a direita.

**Estados construídos agora:**
- **Vazio:** linha e atalhos.
- **IA respondendo:** ponto azul do relógio e cursor piscando; a resposta se digita; a esfera gira mais rápido.
- **Resumo para confirmar.**
- **Enviado:** a esfera forma o F.
- **Falha:** mensagem curta e "tentar de novo", sem perder o texto.
- **Sem IA ou sem JS:** formulário simples (nome, empresa, contato, mensagem) com o mesmo visual.

Abaixo da linha fica o aviso de privacidade com link.

**Fica para a etapa da IA:**
- roteiro, destino do pedido, proteção contra robôs e abuso, limite de mensagens;
- texto completo de privacidade (LGPD);
- regras que impedem a IA de prometer prazo, preço ou resultado.

Até lá, o envio usa o formulário simples.

### 4.7 Erro 404 ([13](prototipos-estrutura/13-pagina-404.html))

"(404)" em mono e "Página não encontrada", que se digita. Acima, as letras FLOWAY da esfera formam o número **404**, viram a esfera e voltam, em ciclo; o cursor empurra.

- **Links:** "Voltar ao início" e "Iniciar projeto". "Ver trabalhos" entra quando houver cases.
- **Resposta:** HTTP 404, também para `/trabalhos/<qualquer>`; sempre `noindex`.
- **Movimento reduzido:** tudo parado e à vista.

### 4.8 Monorepo (proposta para o portão)

```
siteOficialFloway/
  package.json            workspaces: apps/*, apps/conceitos/*, packages/*
  apps/site/              o site oficial (Next.js 15.5), código copiado de identidadeFloway@2e0c5fa
  apps/conceitos/<nome>/  um site ou automação por conceito, com package.json, testes e build próprios
  packages/config/        tsconfig, eslint, vitest e playwright de base, que cada app estende
  packages/testes/        utilitários de teste comuns (pixel, contraste, encerramento do GSAP)
  docs/                   método, memória, specs, planos
```

- **O que cada um publica:** `apps/site` publica o domínio da Floway, na publicação (C5). Cada conceito publica num endereço próprio, decidido em C5, sempre com `noindex` até lá. Os pacotes não publicam nada.
- **Isolamento:** o site nunca importa de `apps/conceitos/*`, e um teste-guarda confere isso. Cada conceito tem seus próprios `test`, `check` e `test:build`.
- **CI:** um job por app, disparado pelos caminhos que mudaram. O check exigido pela `main` ("Testes, tipos e build") roda o site sempre e os conceitos que mudaram. Um conceito quebrado não bloqueia uma mudança só do site.
- **Comandos da raiz:** `npm test`, `npm run check` e `npm run test:build` rodam em todos os workspaces. Para um app só, usa-se `-w apps/site`.
- **Build de teste:** um por vez, com pasta própria (`NEXT_DIST_DIR`) e porta própria por app (lições 3 e 7 da passagem).

## 5. Conteúdo

- **Textos aprovados:** os da seção 4.3 (faixas, manifesto, apoio, legenda, "O que é único", lista e frases do lençol, frase do contato, rodapé, selo) e os fixos da 404.
- **Pendentes (C2), em português e inglês:**
  - os 3 trechos da abertura;
  - a intro do hero;
  - o descritor do cabeçalho;
  - os títulos e descrições para buscadores (Início: algo como "Floway · Estratégia, desenvolvimento web e IA para empresas", sem nichos);
  - a versão inglesa de tudo.
- **Mídia aprovada:** a foto da lateral do cubo.
- **Modelo de case (rascunho, a revisar com o primeiro projeto):**

| Lugar | Case de site | Case de automação |
|---|---|---|
| Capa | Print da página principal | O fluxo desenhado (gatilho → etapas → resultado) |
| Prévia (hover) | Rolagem do site, 5 a 8 s | Automação rodando, 5 a 8 s |
| Galeria, 4 imagens | Telas internas | Telas das etapas |
| Galeria, vídeo | Navegação completa | Demonstração de ponta a ponta |
| Celular | Site no celular | O resultado chegando no celular |
| Colunas | 2 itens cada | 2 itens cada; Entrega com antes e depois **em palavras**, sem número inventado |

- **Conceitos:** a lista fica para depois. Regras: nome descritivo ("Imobiliária, conceito"), identidade visual própria, rótulo "Conceito" em todo lugar, descrição começando por "Projeto conceitual, sem cliente", sem fotos de pessoas reais. Um case só entra na lista com todas as peças, e um teste confere isso.
- **Marcadores de construção** (cartões "Conceito · …", colchetes): só em teste. Uma trava de publicação falha o build se algum existir no conteúdo publicado.

## 6. Critérios de aceite

Valem os da `02-site.md` para o que não mudou. Acrescentam-se:

### Estrutura e conteúdo
- [ ] A Início tem as 10 seções na ordem da seção 4.3 e um só trecho escuro.
- [ ] O menu tem 2 links. Não existe rota por oferta.
- [ ] Faixas, lençol e linha dos cartões leem as listas de `src/conteudo/`. Acrescentar um item a uma lista o mostra, sem tocar em componente (teste).
- [ ] Os textos aprovados aparecem exatamente como na seção 4.3, com as mesmas chaves em PT e EN.
- [ ] Nenhum e-mail ou telefone aparece em HTML, JS ou texto publicado (teste).
- [ ] Nenhum cartão, plano ou link aponta para `/trabalhos/<case>` enquanto não existir case pronto.

### Visual e movimento
- [ ] Hero: a palavra é desenhada a partir do arquivo da assinatura (sem o símbolo), com glitch nos tempos da `02-site.md`. São 3 lâminas no desktop e 1 no celular, com lados a 45° ± 1°.
- [ ] Passagem: começa a 60% e termina a 120% da altura da tela de rolagem, com borda de ruído e sem contorno nítido.
- [ ] Cartão sem capa: fundo `#DCDCD8`, sem ASCII. Cartão com capa: ASCII e varredura, zoom de 10% com escurecimento de 30% no hover e prévia de 250 px abrindo em `tempo-rapido` (teste com uma capa de teste).
- [ ] Esfera: 20 mil letras no desktop e 8 mil no celular, só F/L/O/W/A/Y. A morfose forma o F com as proporções do SVG (erro de silhueta < 2% da altura) e rotação zero. Azul só no braço do F e em ≤ 5% das letras da esfera.
- [ ] Selo "INICIAR PROJETO" leva a `/contato` e passa o contraste da `01-sistema-visual.md`.
- [ ] Movimento reduzido: sem abertura, sem nada preso, esfera e lâminas paradas, conversa sem digitação animada, todo o conteúdo visível.
- [ ] Sem WebGL: palavra do hero em SVG, sem lâminas nem esfera, com o resto legível.

### Contato
- [ ] Estados vazio, respondendo, resumo, enviado, falha e sem IA, cada um com teste de ponta a ponta usando uma IA falsa.
- [ ] Sem JavaScript, o formulário simples envia por uma rota do servidor. O e-mail de destino só existe em variável de ambiente; nenhum teste o encontra no código.
- [ ] Um envio com o campo-isca preenchido é descartado, e envios acima do limite por endereço recebem a mensagem de falha.
- [ ] `/privacidade` e `/en/privacy` existem e são linkadas pelo aviso do contato.
- [ ] Quem visita nunca vê a conversa simulada; ela só existe com a IA falsa dos testes.

### Monorepo e qualidade
- [ ] `npm test`, `npm run check` e `npm run test:build` verdes na raiz e no CI.
- [ ] Um conceito com teste quebrado não falha o check de uma mudança só em `apps/site`.
- [ ] O site não importa nada de `apps/conceitos` (teste-guarda).
- [ ] Página olhada no desktop (1440), no celular (390) e com movimento reduzido, sem rolagem horizontal.
- [ ] `noindex` ligado em todas as páginas.

### Fora de escopo
- A página Trabalho, os cases, os conceitos, a IA real, os textos pendentes, a publicação e as redes sociais.

## 7. Testes

- **Micro (Vitest):** listas de conteúdo (faixas, lençol, ofertas), paridade PT/EN, ausência de e-mail e telefone, trava de marcadores, estados da conversa com IA falsa, cartão com e sem capa, amostragem do F (proporção e cores), tokens.
- **Macro (Playwright sobre o build):** ordem das seções, passagem e trecho escuro (pixel), hero com e sem WebGL, esfera nos três modos, contato nos seis estados, 404 com HTTP 404, celular, reduzido, sem JS, `noindex`, isolamento do monorepo.
- **Explorar:** desktop, celular e movimento reduzido no navegador. Medir o tempo de quadro da esfera e das lâminas no celular, conforme a pendência "quanto de WebGL entra" da passagem.

## 8. Riscos e pendências

**Pendências de identidade: resolvidas em 2026-10-31.** Registradas no repositório `CreateHubAI/identidadeFloway` pelo PR #20, integrado na `main` em `ec93f7b` com o CI verde, com a autorização da pessoa. O código copiado continua sendo o de `2e0c5fa`, porque o PR #20 só mudou documentos. Eram:
1. **P9 alterada:** o hero mostra a palavra FLOWAY plana com glitch, sem o F 3D. ~~Bloqueia o hero.~~ Resolvida.
2. **Referência:** exceção à "referência única RayRay Lab" para o auros.global, só para a esfera. ~~Bloqueia o contato e a 404.~~ Resolvida.
3. **Logotipo em partículas:** o F formado por letras, com as cores da versão para fundo claro e sem girar, como um tratamento aprovado do símbolo (parecido com a exceção da P9). ~~Bloqueia o contato e a 404.~~ Resolvida.

**Riscos:**
- **Desempenho no celular:** a esfera (8 mil letras), as lâminas com refração e o canvas único. Mitigação: medir em E4 e cortar quantidade antes de cortar efeito.
- **IA no contato:** abuso, custo e dado pessoal. Mitigação: nada vai ao ar sem a etapa própria; até lá, formulário simples.
- **Fonte no build do CI:** `next/font` pode falhar de forma passageira (lição 6).

**Ficam para depois:** página Trabalho, modelo de case (revisar), lista de conceitos, roteiro da IA, textos de C2, desenho de C3 (agora restrito ao formulário simples e às regras da IA), publicação.

### Entregáveis E1 a E15 ajustados

Os caminhos ficam sob `apps/site/`.

| Entregável | Ajuste |
|---|---|
| E1 Tokens | Sem mudança |
| E2 Buscadores | Títulos e descrições sem nichos (texto em C2) |
| E3 Ícones | Sem mudança |
| E4 Casca | Selo vira atalho "INICIAR PROJETO" |
| E5 Compartilhados | Cartão ganha o estado "sem capa" (cor estática) e a linha mês e ano / oferta · Conceito; ganha a **esfera de letras** (`src/compartilhados/esfera/**`), usada pelo contato e pela 404 |
| E6 Conteúdo dos trabalhos | Vira só o esquema e a trava ("case só entra completo"); a lista começa vazia |
| E7 Abertura, hero, passagem | Filme com FLOWAY; palavra com glitch; lâminas no lugar das formas atuais (`formas.ts`); depende da pendência 1 |
| E8 Manifesto e cubo | Novos textos e foto da lateral |
| E9 Trabalhos em destaque | Cartões em cor estática; efeitos ligados pela capa |
| E10 Lençol | Título "(O que entregamos)"; lista e frases da seção 4.3 |
| E11 Contato | Esfera no lugar do cubo com física; conversa (disposição B) com estados e IA falsa; formulário simples como envio real; depende das pendências 2 e 3 |
| E12 Página Trabalhos | Cor estática; caso de um trabalho só |
| E13 Página Trabalho | **Adiado** até o primeiro projeto |
| E14 404 | Esfera que forma "404"; depende das pendências 2 e 3 |
| E15 Montagem da Início | Sem mudança de papel |

## 9. Aprovações

| O quê | Quem | Quando |
|---|---|---|
| Oferta A, Abertura A, Hero (palavra + lâminas, faixas), Passagem, Manifesto C e apoio, Cubo com foto e textos, Trabalhos em destaque (B, cor estática, efeitos mantidos), Lençol (lista e frases), Contato (frase A, esfera de letras com F, rodapé, selo), Página Trabalhos, estrutura da Página Trabalho (construção adiada), Página Contato (B), 404 (B), Público B2B, modelo de case e conceitos adiados | Pessoa, seção por seção, no navegador | 2026-10-31 |
| Esta spec escrita, a organização do monorepo, o destino do "Iniciar um projeto →" e as decisões depois da revisão | Pessoa ("aprovado, pode seguir") | 2026-10-31 |
