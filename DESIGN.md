---
name: Vazaê
description: O jogo de vazas no seu lugar de uma mesa oval de feltro, num salão de cassino carioca dos anos 1940.
colors:
  # Noite (padrão; seletor .dark em frontend/src/index.css)
  room: "#1C0F12"
  room-deep: "#2B161A"
  room-foreground: "#F1E6CF"
  room-muted: "#C9B391"
  room-border: "#9C7D55"
  danger-on-room: "#F08A7A"
  felt: "#0E4733"
  felt-deep: "#0A3726"
  felt-lamp: "#16614A"
  felt-print: "#D2B97E"
  felt-muted: "#B9CCB2"
  rail: "#3E1219"
  rail-deep: "#2A0B10"
  rail-hi: "#6A2430"
  rail-muted: "#CDB592"
  brass: "#E8BC4F"
  brass-foreground: "#1C0F12"
  piping: "#A8843F"
  marquee: "#E8BC4F"
  card: "#2B161A"
  card-foreground: "#F1E6CF"
  muted: "#3A1F24"
  muted-foreground: "#C9B391"
  border: "#9C7D55"
  # Matinê (claro; :root em frontend/src/index.css)
  matine-room: "#E9DFCB"
  matine-room-deep: "#DDD0B6"
  matine-room-foreground: "#23140F"
  matine-room-muted: "#5E4A3C"
  matine-room-border: "#8A6E4C"
  matine-danger-on-room: "#A3202C"
  matine-felt: "#145C42"
  matine-felt-deep: "#0E4A35"
  matine-felt-lamp: "#1D7553"
  matine-felt-print: "#DEC793"
  matine-felt-muted: "#BFD2B8"
  matine-rail: "#6A1A25"
  matine-rail-deep: "#45101A"
  matine-rail-hi: "#93303D"
  matine-rail-muted: "#D3BD9B"
  matine-brass: "#EFC659"
  matine-brass-foreground: "#23140F"
  matine-piping: "#B8924A"
  matine-marquee: "#6A1A25"
  matine-card: "#FBF6EA"
  matine-card-foreground: "#23140F"
  matine-muted: "#F1E8D4"
  matine-muted-foreground: "#5E4A3C"
  matine-border: "#9A7E58"
  # Iguais nos dois temas
  felt-foreground: "#F3EAD3"
  rail-foreground: "#F1E6CF"
  danger-on-felt: "#F08A7A"
  paper: "#F6EEDC"
  ink: "#1C0F12"
  suit-red: "#B3261E"
  chip: "#A3202C"
  chip-inlay: "#F6EEDC"
  chip-rim: "#5E1018"
typography:
  display:
    fontFamily: "Limelight, Atkinson Hyperlegible, serif"
    fontSize: "4.5rem"
    fontWeight: 400
    lineHeight: 0.85
  headline:
    fontFamily: "Limelight, Atkinson Hyperlegible, serif"
    fontSize: "3rem"
    fontWeight: 400
    lineHeight: 0.95
  title:
    fontFamily: "Limelight, Atkinson Hyperlegible, serif"
    fontSize: "1.75rem"
    fontWeight: 400
    lineHeight: 1
  turn:
    fontFamily: "Limelight, Atkinson Hyperlegible, serif"
    fontSize: "1.5rem"
    fontWeight: 400
    lineHeight: 1
  body:
    fontFamily: "Atkinson Hyperlegible, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    fontFeature: "tnum"
  label:
    fontFamily: "Atkinson Hyperlegible, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.25
  plaque-name:
    fontFamily: "Atkinson Hyperlegible, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 700
    lineHeight: 1.25
  felt-print:
    fontFamily: "Atkinson Hyperlegible, system-ui, sans-serif"
    fontSize: "9.5px"
    fontWeight: 700
    lineHeight: 1.375
    letterSpacing: "0.1em"
  card-index:
    fontFamily: "Atkinson Hyperlegible, system-ui, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 700
    lineHeight: 0.9
    letterSpacing: "-0.025em"
rounded:
  sm: "3px"
  md: "5px"
  lg: "8px"
  xl: "12px"
  full: "9999px"
spacing:
  gutter: "16px"
  gutter-wide: "32px"
  dock-gap: "12px"
  panel-pad: "20px"
  panel-pad-wide: "24px"
  touch: "44px"
  fan-rise: "72px"
components:
  button-primary:
    backgroundColor: "{colors.brass}"
    textColor: "{colors.brass-foreground}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "44px"
  button-primary-lg:
    backgroundColor: "{colors.brass}"
    textColor: "{colors.brass-foreground}"
    rounded: "{rounded.md}"
    padding: "0 24px"
    height: "52px"
  button-primary-disabled:
    backgroundColor: "{colors.muted}"
    textColor: "{colors.muted-foreground}"
    rounded: "{rounded.md}"
    height: "44px"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.room-foreground}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "44px"
  panel:
    backgroundColor: "{colors.card}"
    textColor: "{colors.card-foreground}"
    rounded: "{rounded.lg}"
    padding: "{spacing.panel-pad}"
  dialog-sheet:
    backgroundColor: "{colors.card}"
    textColor: "{colors.card-foreground}"
    rounded: "{rounded.xl}"
    padding: "{spacing.panel-pad}"
  plaque:
    backgroundColor: "{colors.rail-deep}"
    textColor: "{colors.rail-foreground}"
    rounded: "{rounded.sm}"
    width: "96px"
    height: "64px"
  plaque-wide:
    backgroundColor: "{colors.rail-deep}"
    textColor: "{colors.rail-foreground}"
    rounded: "{rounded.sm}"
    width: "148px"
    height: "72px"
  plaque-mine:
    backgroundColor: "{colors.rail}"
    textColor: "{colors.rail-foreground}"
    rounded: "{rounded.md}"
    padding: "8px 14px"
  bid-chip:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    size: "48px"
  bid-chip-selected:
    backgroundColor: "{colors.chip}"
    textColor: "{colors.chip-inlay}"
    rounded: "{rounded.full}"
    size: "48px"
  toggle-outline-on:
    backgroundColor: "{colors.rail-hi}"
    textColor: "{colors.rail-foreground}"
    rounded: "{rounded.md}"
    height: "44px"
  playing-card-sm:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    width: "44px"
    height: "64px"
  playing-card-md:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    width: "64px"
    height: "96px"
  playing-card-lg:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    width: "76px"
    height: "112px"
  playing-card-back:
    backgroundColor: "{colors.rail}"
    textColor: "{colors.piping}"
    rounded: "{rounded.md}"
  vira-box:
    backgroundColor: "transparent"
    textColor: "{colors.felt-print}"
    rounded: "{rounded.sm}"
    width: "108px"
    height: "84px"
  input:
    backgroundColor: "transparent"
    textColor: "{colors.card-foreground}"
    rounded: "{rounded.md}"
    padding: "4px 12px"
    height: "44px"
---

# Design System: Vazaê

## Overview

**Creative North Star: "O salão da Urca"**

O celular é o seu lugar numa mesa oval de feltro verde, num salão de cassino carioca dos anos 1940. A mesa é vista do seu assento, não de cima: o trilho de laca bordô com filete de latão corre em volta, os adversários sentam em plaquinhas de laca ao longo da elipse, o estado da rodada vem impresso em ouro velho no feltro como as legendas de uma mesa de cassino, e a sua mão se abre sobre o trilho perto de você. Painéis, diálogos e menus são cartões da casa, marfim de dia e laca à noite, presos numa moldura deco de filete duplo com degrau nos cantos. As vidas são fichas de barro.

O salão abre à noite: sala bordô quase preta, uma lâmpada pendente acesa sobre o feltro. A matinê é a mesma mesa num salão claro de dia; o feltro continua feltro, as cartas continuam papel, só a sala e os painéis clareiam. Um só acento, o latão aceso, diz de quem é a vez e qual é a ação. Densidade baixa, leitura de relance: quem está agindo, quantas fichas cada um tem e o que está no feltro.

O mundo recusa o tampo visto de cima, a grade de painel com os lugares em caixas e a pele genérica de Las Vegas ou de pôquer de TV.

**Key Characteristics:**
- Mesa oval vista do seu lugar: trilho de laca, filete de latão, feltro sob uma lâmpada.
- Estado impresso no feltro em ouro velho: arco de legenda, caixa VIRA, ficha PÉ.
- Moldura deco de filete duplo com degrau nos cantos em todo painel e plaquinha.
- Vidas como fichas de barro; a perdida desliza para a banca e deixa um anel tracejado.
- Um acento só, latão aceso, para a vez, a escolha e a ação principal.
- Limelight para letreiro, Atkinson Hyperlegible para todo o resto.
- Noite é o tema padrão; matinê é escolha no menu.

## Colors

Laca bordô, feltro verde, ouro velho impresso, papel creme e um latão aceso. A noite é o padrão; os tokens `matine-*` são o mesmo papel no salão de dia. Os nomes dos tokens são as variáveis CSS de `frontend/src/index.css` (`--room`, `--felt-print`, `--card`...), sem o prefixo `matine-`, que corresponde ao bloco `:root`.

### Primary
- **Latão aceso** (brass): o único acento. Preenche o botão de ação principal, acende a borda e o halo da plaquinha de quem está agindo, escreve "Sua vez de jogar.", "Quantas vazas você faz?" e "jogando…" / "palpitando…", contorna a carta erguida na mão, a ficha de palpite escolhida e a carta que levou a vaza ("levou"). Também é a seleção de texto e o cursor de digitação.

### Secondary
- **Laca bordô** (rail, rail-deep, rail-hi): o trilho da mesa, as plaquinhas (rail-deep), a sua plaquinha e o dock (rail descendo para rail-deep em 3.5rem), o verso das cartas e o toggle escolhido (rail de dia, rail-hi à noite).
- **Feltro** (felt, felt-deep, felt-lamp): o pano da mesa, em gradiente radial de felt-lamp no centro a felt-deep na borda, com uma textura de ruído fino a 22%. Por trás do nome das cartas na vaza, felt-deep a 85%.

### Tertiary
- **Ouro velho impresso** (felt-print): as legendas do feltro, os dois anéis finos da legenda, o rótulo "vira" e a borda da caixa VIRA (a 55%).
- **Filete de latão** (piping): o filete onde o trilho encontra o feltro, a borda de 2px no topo do dock, a moldura deco, a treliça do verso das cartas, a barra de rolagem. Decorativo; nunca carrega texto.
- **Letreiro** (marquee): letra de display sobre a sala e dentro dos painéis. Bordô de dia, latão à noite.

### Neutral
- **Sala** (room, room-deep): o chão de toda tela. Noite bordô quase preta, matinê marfim.
- **Texto da sala** (room-foreground, room-muted, room-border): texto, texto suave e borda de controle direto no chão da sala (escopo `.on-room`).
- **Cartão da casa** (card, muted, border): painéis, diálogos, menus. Marfim de dia, laca escura à noite.
- **Papel e tinta** (paper, ink, suit-red): as cartas, iguais nos dois temas; a ficha PÉ e o carimbo "manilha".
- **Barro** (chip, chip-inlay, chip-rim): as fichas de vida e a ficha de palpite escolhida.
- **Erro** (danger-on-room, danger-on-felt): erro na sala e no feltro/trilho. Nos painéis o erro usa o mesmo valor de danger-on-room do tema.

### Contraste (WCAG 2.x, calculado dos tokens)

| Par | Noite | Matinê |
|---|---|---|
| texto da sala / sala | 15.06 | 13.48 |
| texto suave / sala | 9.18 | 6.30 |
| texto suave / room-deep | 8.39 | 5.46 |
| borda de controle / sala | 4.86 | 3.60 |
| erro / sala | 7.65 | 5.67 |
| letreiro / sala | 10.42 | 8.89 |
| letreiro / cartão | 9.52 | 10.89 |
| latão / sala de dia (por isso o letreiro existe) | | 1.23 |
| texto / cartão | 13.76 | 16.52 |
| texto suave / cartão | 8.39 | 7.72 |
| borda / cartão | 4.45 | 3.54 |
| erro / cartão | 7.00 | 6.95 |
| texto do feltro / feltro | 8.90 | 6.64 |
| texto do feltro / centro da lâmpada | 6.16 | 4.71 |
| ouro impresso / feltro | 5.58 | 4.81 |
| ouro impresso / caixa da vira (felt-deep) | 6.92 | 6.19 |
| felt-muted / feltro | 6.27 | 4.97 |
| felt-muted / caixa da vira (felt-deep) | 7.78 | 6.40 |
| latão / feltro | 5.96 | 4.88 |
| texto do trilho / rail | 12.99 | 9.49 |
| texto do trilho / rail-deep | 14.70 | 12.64 |
| rail-muted / rail | 8.14 | 6.45 |
| rail-muted / rail-deep | 9.20 | 8.59 |
| latão / rail-deep | 10.17 | 9.61 |
| erro no feltro / rail | 6.60 | 4.82 |
| tinta / latão (botão principal) | 10.42 | 10.94 |
| texto do trilho / toggle escolhido | 8.89 | 9.49 |
| tinta / papel (carta) | 16.14 | 16.14 |
| naipe vermelho / papel | 5.66 | 5.66 |
| chip-inlay / barro (ficha escolhida) | 6.49 | 6.49 |

No centro da lâmpada o feltro clareia, então a caixa da vira, que fica bem ali, é impressa sobre um fundo `felt-deep` a 85%: o ouro impresso e o felt-muted dentro dela passam de 6:1 nos dois temas. Texto pequeno impresso nunca fica direto no miolo aceso.

### Named Rules
**The Latão Aceso Rule.** Latão só para a vez de quem está agindo, a sua escolha do momento (carta erguida, ficha de palpite), a vaza levada e o botão de ação principal. Nada decorativo é preenchido de latão.

**The Letreiro Rule.** Letra de display sobre a sala ou dentro de um painel usa `marquee`, nunca `brass`: latão sobre a sala de dia dá 1.23:1. Sobre o feltro e sobre o trilho, que são escuros nos dois temas, o display é latão.

**The Feltro é Feltro Rule.** O feltro continua verde e as cartas continuam papel nos dois temas. A matinê clareia a sala e os painéis e abre um pouco o feltro e o trilho; nunca troca o material.

## Typography

**Display Font:** Limelight (com Atkinson Hyperlegible, serif)
**Body Font:** Atkinson Hyperlegible (com system-ui, sans-serif)

**Character:** Limelight é o letreiro do salão, de peso único; Atkinson é a leitura de relance no celular. As duas vêm locais por `@fontsource` (Limelight 400, Atkinson 400 e 700), o jogo funciona offline. Algarismos tabulares no corpo inteiro, e `font-synthesis-weight: none` para o navegador nunca inventar um negrito de Limelight.

### Hierarchy
- **Display** (Limelight 400, 3.5rem no celular e 4.5rem a partir de 48rem, 0.85): o wordmark "Vazaê" no centro do feltro da tela inicial, em latão.
- **Headline** (Limelight 400, 2.25rem a 3.75rem, 0.95 a 1): manchete do resultado ("Você ganhou a mesa.", 3rem e 3.75rem a partir de 40rem) e títulos de painel ("Mesa contra robôs", "Regras da partida", 2.25rem), em `marquee`.
- **Title** (Limelight 400, 1.75rem, 1): o wordmark do cabeçalho da mesa, em `marquee`, e o título dos diálogos. Seções do "Como se joga" a 1.25rem.
- **Turn** (Limelight 400, 1.5rem, 1): "Sua vez de jogar." e "Quantas vazas você faz?" no dock, em latão.
- **Body** (Atkinson 400/700, 1rem, 1.5): nomes, status, textos de regra, botões (700 nos botões de contorno e no principal; o grande a 1.125rem). Texto das regras a 15px, 1.625.
- **Label** (Atkinson 400, 0.75rem a 0.875rem): legendas, dicas, "Siga o naipe", contagens.
- **Plaque** (Atkinson 700 13px para nome e números; 400 a 11px para "fez N de N" e 10px para o nível do robô).
- **Felt print** (Atkinson 700, 9.5px a 10px, caixa alta, 0.06em a 0.14em): as legendas no feltro e o rótulo "vira". O "jogando…" sob a plaquinha usa o mesmo desenho em latão a 11px.
- **Card index** (Atkinson 700, 15px / 1.25rem / 1.375rem conforme o tamanho da carta, 0.9, -0.025em): o posto no canto da carta; o carimbo "manilha" a 9px.

### Named Rules
**The Duas Faces Rule.** Limelight só para wordmark, títulos e a linha da vez; Atkinson para todo o resto, inclusive números de palpite, contagem de fichas, posição no resultado e índice de carta. Nenhuma terceira face, e Limelight nunca em negrito.

**The Q com Rabo Rule.** Índice de carta é sempre Atkinson 700: o Q mantém o rabo e o zero tem traço, legíveis no tamanho do canto.

## Layout

Celular em retrato primeiro; o desktop é o mesmo mundo numa tela escalada.

**Celular (390x844 de referência).** Cabeçalho fino: wordmark em `marquee` à esquerda, botão "Menu" de contorno à direita. Abaixo, o feltro ocupa o resto (no mínimo 21rem) e a elipse é aberta: o centro fica baixo e o trilho de perto corre por trás do dock, que vira o trilho perto de você. Os adversários sentam na linha central do trilho em ordem de jogo, da sua esquerda, por cima, até a sua direita: um adversário a 270°, dois de 228° a 312°, três de 220° a 320°, quatro de 190° a 350°, cinco ou mais de 164° a 376°. Plaquinha de 96x64 (84x64 com 5 ou mais adversários). A caixa VIRA fica deitada (carta ao lado do rótulo) no meio do feltro, 12px abaixo do centro. Cartas da vaza médias (pequenas com mais de 4 jogadores); a mão grande, média quando você palpita, com mais de 4 jogadores ou mais de 6 cartas.

**O dock.** Grudado embaixo, acima da área segura: borda de 2px de filete no topo, laca descendo de rail para rail-deep, um friso rail-hi por dentro. A sua mão se abre 72px (fan-rise) acima da borda do dock, por cima do feltro; entre o leque e o botão ficam o status e a sua plaquinha; depois a fileira de palpite ou o botão "Jogar". Na sua vez, se a mão empurra o feltro para trás do dock, a tela rola só o necessário.

**A legenda.** "Rodada N · X cartas" e "Palpites somam S de X" vão impressas nos quartos de perto do anel de legenda, abaixo das plaquinhas laterais e acima da sua mão, com o texto na ponta baixa de cada arco. Quando um dos arcos fica com menos de 150px, ou quando o arco empurraria uma carta para fora do próprio caminho, a legenda é impressa reta, em duas linhas, logo abaixo da caixa VIRA. A legenda cede antes da carta.

**Onde a carta cai.** Cada carta jogada procura o primeiro lugar livre na linha do assento em direção ao meio (perto do alcance usual primeiro), depois encostada sob a plaquinha pelo lado de dentro, e por fim o lugar livre mais próximo numa grade de 12px no feltro. Livre quer dizer: longe das plaquinhas (8px), da caixa VIRA, da legenda (arco ou reta) e das outras cartas. A sua carta cai bem à sua frente, acima da mão. A vaza fechada fica no feltro, inclinada 4px na direção de quem levou.

**Desktop.** Com ponteiro fino o app vira um Stage de 1024x720 escalado para a janela (de menos de 1 até 1.3) e nunca rola. A partir de 1024px de largura a elipse fica deitada (paisagem), as plaquinhas sobem para 148x72, a caixa VIRA fica de pé à esquerda do meio, as cartas da vaza ficam grandes (médias com mais de 5 jogadores), e o dock vira duas colunas de altura fixa (11rem, igual em toda fase): 17rem com o status e a sua plaquinha; no resto, o leque sobe sobre o trilho e ao lado dele ficam a fileira de palpite em linha (pergunta e notas em cima, fichas menores e o botão numa fileira só, as fichas rolando de lado se forem muitas) ou o botão "Ver placar da rodada". Nada empilha, então o dock nunca cresce. Os breakpoints seguem a largura do Stage, não da janela (40rem, 48rem, 64rem).

**Telas de operar.** Início, setup, editor de regras e resultado ficam no chão da sala, numa coluna (max 28rem a 48rem) com um painel em moldura deco. A tela inicial mostra a mesa vazia sob a lâmpada (sem adversários, legenda no arco de cima e no de baixo) com o wordmark em latão no meio.

**Ritmo.** Margem lateral de 16px no celular e 32px no desktop, 12px entre blocos do dock, painéis com 20px de respiro (24px a partir de 40rem), linhas de painel com 10px a 16px de altura interna. Alvos de toque de 44px no mínimo.

## Elevation & Depth

Profundidade vem do material: laca com brilho em cima e sombra em baixo, feltro com a lâmpada no meio, filetes de latão nas emendas. Painéis, menus e diálogos são chapados; o que tem sombra é o que está solto sobre a mesa (cartas, fichas, a ficha PÉ) e o latão aceso. O overlay de diálogo escurece a sala com bordô quase preto a 72%.

### Shadow Vocabulary
- **Carta no feltro** (`box-shadow: 0 1px 0 rgba(0,0,0,.2), 0 6px 12px -4px rgba(0,0,0,.4)`): toda carta, em todo tamanho.
- **Ficha de palpite** (`box-shadow: 0 3px 6px -2px rgba(0,0,0,.5)`; escolhida, `0 0 0 3px var(--brass), 0 4px 8px -2px rgba(0,0,0,.5)`).
- **Ficha PÉ** (`box-shadow: 0 2px 4px rgba(0,0,0,.45)`).
- **Lâmpada sobre quem age** (`box-shadow: 0 0 0 3px color-mix(in oklch, var(--brass), transparent 70%), 0 0 22px 6px color-mix(in oklch, var(--brass), transparent 72%)`): a plaquinha do adversário que está agindo, com borda de latão de 2px.
- **Latão batido** (`box-shadow: inset 0 1px 0 rgba(255,255,255,.45), inset 0 -2px 0 rgba(0,0,0,.2)`): o botão principal.
- **Friso do trilho** (`box-shadow: inset 0 1px 0 var(--rail-hi)`): o topo do dock.

### Named Rules
**The Solto Sobre a Mesa Rule.** Só cartas, fichas e a ficha PÉ projetam sombra; o halo de latão é luz, não sombra. Painel, menu e diálogo flutuando com sombra está errado.

## Shapes

- **A mesa:** elipse. Trilho de 22px de laca em gradiente vertical (rail-hi, rail, rail-deep) sobre uma faixa de 26px de rail-deep, um friso rail-hi de 1px por fora, filete de latão de 1.5px onde o trilho encontra o feltro, e dois anéis de legenda em ouro velho (0.9px a 55%, 0.6px a 40%).
- **Moldura deco:** filete externo de 1px e filete interno de 1px afastado 5px (4px nas plaquinhas), com um degrau sólido de 7px (5px nas plaquinhas e na sua plaquinha) em cada canto de dentro, tudo em `piping`. Pintada na própria caixa, fica parada quando o painel rola.
- **Cantos:** plaquinhas e caixa VIRA 3px; cartas, botões, toggles, campos e menus 5px; painéis e diálogo no desktop 8px; folha de diálogo no celular 12px só em cima.
- **Redondos:** fichas de vida, fichas de palpite e a ficha PÉ são círculos. Nada mais é pílula.
- **Divisórias de painel:** filetes tracejados de 1px entre as linhas do placar, do resultado e do editor de regras, como um livro de caixa.

## Components

### Buttons
Latão para agir, contorno para o resto, sempre com o nome da ação.
- **Shape:** 5px, altura 44px (52px no grande, com texto a 1.125rem).
- **Primary:** latão com tinta, Atkinson 700, borda de latão misturada a 35% de tinta, brilho batido em cima e lábio escuro embaixo. Hover clareia 14% para o branco. Pressionado desce 1px.
- **Disabled:** perde o latão por inteiro: placa `muted` chapada, borda do contexto e texto suave, sem sombra, para latão apagado nunca parecer outra cor.
- **Outline:** contorno de 2px na borda do contexto (room-border na sala, felt-print no feltro e no dock), fundo transparente, Atkinson 700; hover pega `muted`.
- **Ghost:** sem fundo, para "Voltar" e fechar o diálogo; na sala o hover pega room-deep.
- **Focus:** anel de 3px na cor do texto do contexto, afastado 2px.

### Chips (fichas)
- **Ficha de vida:** barro `chip` visto de cima, borda `chip-rim`, seis embutidos marfim na borda, um anel e um losango no meio. Pequena 16px nas plaquinhas, média 20px na sua plaquinha e nos placares. Fileiras de 5; a segunda entra meio escondida sob a primeira. Passando de uma fileira, um numeral Atkinson 700 diz quantas restam; fora, a palavra "Fora".
- **Vida perdida:** um anel tracejado (1.4px, traço 2.4 e espaço 2) com um ponto no meio, em texto suave. Ao perder, a ficha sobe 0.2rem, cresce 8% e desliza 3.5rem em direção à banca no trilho de longe, sumindo em 520ms; o anel aparece por baixo depois de 60% do tempo. Escalonada 140ms entre fichas. Plaquinha de uma linha com mais de 5 vidas: uma ficha com as restantes e um anel com as perdidas.
- **Ficha de palpite:** círculo de 48px, marfim `paper` com tinta, número Atkinson 700 a 1.25rem, borda sólida de 3px em `chip-rim`, sombra de ficha; hover sobe 2px. Escolhida: barro com número marfim e um anel de latão de 3px. Proibida: laca `rail` com borda sólida de latão, texto suave e riscada.

### Cards / Containers (cartão da casa)
- **Corner Style:** 8px.
- **Background:** `card` (marfim de dia, laca escura à noite).
- **Shadow Strategy:** nenhuma; ver Elevation & Depth.
- **Border:** moldura deco em `piping`; divisórias internas tracejadas em `border`.
- **Internal Padding:** 20px, 24px a partir de 40rem. Usado no setup, no editor de regras, no resultado, nos diálogos, no menu suspenso e nos avisos.

### Inputs / Fields
- **Style:** 44px de altura, borda de 1px em `input` (a borda do contexto), fundo transparente, cantos de 5px, texto 1rem.
- **Focus:** a borda vira a cor do texto, com anel de 3px.
- **Toggles de opção:** contorno de 1px, cantos de 5px; escolhido vira laca (rail de dia, rail-hi à noite) com borda de latão e texto do trilho em negrito.
- **Error / Disabled:** erro em `destructive` do contexto, com texto dizendo o problema; desabilitado a 50%.

### Navigation
Sem barra de navegação. Na mesa, um botão "Menu" de contorno no cabeçalho abre um diálogo com "Como se joga", tema, som e vibração, e "Sair da partida" com confirmação. Nas outras telas, "Voltar" fantasma no canto. Diálogos sobem de baixo no celular como folha (300ms na subida, 150ms na descida) e aparecem centrados até 28rem no desktop.

### Plaquinha (lugar à mesa)
Uma placa de laca rail-deep presa ao trilho, na moldura deco, três linhas curtas centradas: nome em negrito, as fichas, "fez **N** de **N**" (ou "sem palpite"). O nível do robô aparece numa linha de 10px só numa mesa mista. Quem está agindo ganha borda de latão de 2px, o halo de lâmpada e "jogando…" / "palpitando…" em latão caixa alta logo abaixo. Fora do jogo, 60% de opacidade. A sua plaquinha é laca `rail`, horizontal, com "palpite N, fez N"; na sua vez ganha a borda de latão.

### Ficha PÉ
Disco de papel de 28px com borda de tinta a 70%, "PÉ" em Atkinson 700 a 10px, sombra curta, no canto de cima à direita da plaquinha de quem deu as cartas.

### Caixa VIRA
Impressa no feltro: borda de 1px em ouro velho a 55%, cantos de 3px. No celular deitada (108x84 reservados: carta pequena inclinada -3° ao lado de "vira" e "manilha: N"); no desktop de pé (76x114). O valor da manilha usa os naipes desenhados.

### Carta
Papel com borda de tinta a 20%, cantos de 5px, sombra de carta. Pequena 44x64, média 64x96, grande 76x112 (80x120 a partir de 64rem). Índice no canto de cima e repetido girado embaixo (exceto na pequena); pip central desenhado. A manilha leva um carimbo "manilha" papel sobre tinta; na média ele toma o lugar do pip. Verso: laca `rail` com treliça de latão a 45° e os quatro naipes em `piping` no meio; a sua carta escondida da rodada às cegas mostra um "?" em Limelight latão. Na mão, o leque abre com giro de até 4° por carta e curva; hover sobe 8px, tocar ergue 20px com anel de latão de 3px, tocar de novo joga. Cartas que não podem ser jogadas escurecem a 60%. Na vaza, a carta anulada escurece a 70% e diz "anulada"; a que levou ganha anel de latão e "levou".

### Naipes
Desenhados em SVG (ouros, espadas, copas, paus) para todo aparelho imprimir a mesma forma. Todo texto que cita naipe (regras, "Jogar K♥", manilha) troca o caractere pelo naipe desenhado, vermelho para ouros e copas, e o leitor de tela ouve o nome do naipe.

### Movimento, som e vibração
- Carta jogada desliza de onde o jogador senta até o lugar dela no feltro (340ms, `cubic-bezier(.2,.8,.2,1)`), com giro de 4 vezes a inclinação final.
- A mão entra carta a carta (300ms, 50ms de escalonamento); erguer e baixar uma carta leva 200ms.
- A ficha perdida desliza para a banca (520ms, `cubic-bezier(.3,.7,.2,1)`, 140ms entre fichas).
- A lâmpada passa de plaquinha em 300ms.
- Som sintetizado: um estalo de pano por carta, uma rajada de estalos na distribuição, duas fichas batendo por vida perdida (no ritmo do deslize), um sino de duas notas quando a vez chega a você. Vibração de 25ms na sua vez e 60ms ao perder vida. Um botão só no menu liga e desliga som e vibração.
- `prefers-reduced-motion: reduce` troca tudo por mudança instantânea. Nenhuma animação em loop.

### Ícone do app
A ficha de vida do jogo vista de cima, sobre o feltro: barro `chip` com seis incrustações marfim, anel tracejado, miolo marfim e um V art déco em `rail` (traço grosso à esquerda, fino à direita, serifas retas). O desenho mestre é `build/appicon.svg`; dele saem `build/appicon.png` (1024, cantos transparentes, filete de latão), o `.ico` do Windows e o `.icns` (via `wails3 generate icons`), o `build/ios/icon.png` (feltro até a borda, opaco), os PNGs `mipmap-*` do Android e o ícone adaptativo (fundo de feltro, ficha dentro do círculo seguro, camada monocromática para o tema do Android 13), o `favicon.svg` e a camada do Icon Composer em `build/appicon.icon`. Lê a partir de 16px.

## Do's and Don'ts

### Do:
- **Do** pôr toda tela no chão da sala (`room`) e começar no tema da noite.
- **Do** mostrar a mesa como elipse vista do seu lugar, com o trilho de perto correndo por trás do dock e a mão aberta 72px sobre o feltro.
- **Do** imprimir o estado da rodada no feltro em `felt-print` (arco de legenda, caixa VIRA), Atkinson 700 caixa alta, e deixar a legenda ceder para o texto reto antes de empurrar uma carta.
- **Do** colocar todo painel, diálogo, menu e plaquinha na moldura deco de filete duplo com degrau nos cantos.
- **Do** reservar o latão para a vez de quem age, a escolha do momento, a vaza levada e a ação principal.
- **Do** usar `marquee` para letra de display na sala e nos painéis.
- **Do** mostrar vidas como fichas de barro; a perdida desliza para a banca e deixa o anel tracejado.
- **Do** marcar estado pela forma além da cor: borda e palavra na vez, anel na escolha, risco no palpite proibido, anel tracejado na vida perdida, placa apagada no botão desabilitado.
- **Do** medir o texto impresso contra o feltro e manter texto pequeno fora do miolo aceso da lâmpada, ou subir o tom dele.

### Don't:
- **Don't** usar `brass` como cor de texto sobre a sala de dia (1.23:1).
- **Don't** usar anel ou contorno tracejado para nada além da vida perdida; escolha nunca é tracejada.
- **Don't** pintar sombra em painel, menu ou diálogo.
- **Don't** escurecer as cartas nem trocar o feltro de cor no tema claro.
- **Don't** pôr Limelight em negrito, em texto corrido, em número ou em índice de carta.
- **Don't** sumir com a vida perdida nem trocá-la só por um número.
- **Don't** usar travessão nos textos.
- **Don't** fazer animação em loop.
