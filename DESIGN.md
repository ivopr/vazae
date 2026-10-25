# Vazaê: direção visual

Fodinha entre amigos numa mesa de bar. O jogador já conhece truco ou fodinha; a tela tem que parecer a mesa, não um painel.

Dial: ENERGY 2 / RHYTHM 2 / MOTION 2

## Paleta

Duas cores-base e um acento. Contraste verificado com a fórmula WCAG 2.x.

| Token | Claro | Escuro | Papel |
|---|---|---|---|
| feltro (fundo da mesa) | `#25573F` | `#143326` | a mesa, onde tudo acontece |
| texto sobre feltro | `#F4ECD8` (7.1:1) | `#EDE3CC` (10.8:1) | nomes, status |
| texto suave sobre feltro | `#D3E0D6` (6.1:1) | `#A9C2B2` (7.2:1) | rótulos secundários |
| painel | papel `#F7F0DF` | madeira `#2A1F17` | dialogs, configuração, placar |
| texto sobre painel | `#1E1A16` (15.2:1) | `#EDE3CC` (12.6:1) | |
| texto suave sobre painel | `#5C5246` (6.7:1) | `#B8A98E` (7.0:1) | |
| borda de controle | `#8A7B60` (3.6:1) | `#7A6A55` (3.1:1) | inputs, toggles |
| carta | `#F7F0DF` | `#F2E9D3` | a carta é papel nos dois temas |
| acento mostarda | `#E0A526` | `#E8B13A` | só "sua vez" e o botão de ação principal; texto sobre ele é `#1E1A16` (7.9:1 / 8.9:1) |
| naipe vermelho / erro | `#B3261E` sobre carta (5.4:1+) | `#F08A80` sobre madeira (6.6:1) | ♥ ♦ e mensagens de erro, sempre com texto |
| naipe preto | `#1E1A16` | `#1E1A16` | ♠ ♣ |

- Feltro verde: é o que todo mundo associa a carteado.
- Papel creme: as cartas são o conteúdo; o creme as destaca do feltro sem o branco chapado.
- Mostarda: marca o momento de agir. Em nenhum outro lugar.
- Claro é o feltro de dia; escuro é o bar à noite, com painéis de madeira.

## Tipografia

- **Zilla Slab** (600/700): índice das cartas, wordmark, números de palpite e vidas. Lembra o índice impresso dos baralhos e o letreiro de boteco.
- **Atkinson Hyperlegible** (400/700): todo o resto. Vidas, palpites e nomes precisam ser lidos de relance num celular.
- Fontes locais (`@fontsource`), o jogo funciona offline.

## Motivo

Os quatro naipes ♦ ♠ ♥ ♣. Aparecem nas cartas, no separador do wordmark e nas fichas de vida. Nada de ícones genéricos; Lucide só na chrome interna do shadcn (fechar dialog, marcadores do toast).

## Forma e elevação

- Raio pequeno nas cartas (4 a 6 px, como baralho real), médio nos painéis (10 px), nada em pílula.
- Sombra só nas cartas: estão fisicamente acima do feltro. Painéis ficam chapados com borda.

## Movimento

- Carta sai da mão e desliza até o centro; vaza completa fica visível um instante e some na direção de quem ganhou. Mostra de onde a carta veio e para onde foi.
- Mão entra em leque ao distribuir.
- `prefers-reduced-motion: reduce` troca tudo por mudanças instantâneas.

## Texto

pt-BR, tom de mesa de bar sem gíria forçada. Sem travessão. Botões dizem a ação: "Sentar à mesa", "Palpitar 2", "Jogar 7♣", "Próxima rodada".
