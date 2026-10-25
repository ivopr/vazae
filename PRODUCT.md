# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

A mesma interface React roda em dois invólucros: Wails 3 no Windows (WebView2) e WebView no Android (arm64). O design segue a web, não a linguagem nativa de cada sistema; celular e desktop são alvos de primeira classe.

## Users

Jogadores brasileiros que já conhecem o jogo de palpitar vazas e as cartas do truco. Público aberto: chegam pelos Releases do GitHub e, mais tarde, por loja. Jogam sozinhos contra robôs quando não há mesa, e jogarão online com outras pessoas na próxima fase.

## Product Purpose

Jogar o jogo de vazas do jeito que a sua mesa joga. Cada jogador recebe cartas, palpita quantas vazas faz e perde vida quando erra; o último com vida vence. Sucesso é o jogador reconhecer as regras da própria mesa e ter adversários que valem a partida.

## Positioning

- **Regras da casa como produto.** Cada variante regional é uma regra numerada e editável (hoje, cerca de 40 regras em 7 grupos: baralho e manilha, jogadores, rodadas, palpites, vazas, rodada de 1 carta, fim da partida), com predefinições e conjuntos salvos. O motor em Go é dono da lógica; o frontend só nomeia e descreve.
- **Robôs bons.** Quatro níveis (Fácil, Médio, Difícil, Mestre), testados em torneios automáticos entre robôs (`go test` sem `-short`).
- Baralho e força do truco: vira, manilha (pela vira, fixa ou sem) e ordem das cartas configuráveis.

## Operating Context

- Partida solo: escolher nome, número de robôs, vidas, dificuldade e conjunto de regras; jogar rodadas; ver resumo da rodada e resultado final.
- Partidas de várias rodadas, olhadas de relance no celular: vidas, palpites, vez de jogar e a vaza na mesa precisam ser lidos rápido.
- Funciona offline; preferências e conjuntos de regras ficam no aparelho.

## Capabilities and Constraints

- Hoje: solo contra 1 ou mais robôs, editor de regras, diálogo "Como se joga", tema claro e escuro.
- **Online é compromisso da próxima fase:** salas via WebSocket. Trabalho futuro deve deixar espaço para sala, lobby e jogadores humanos na mesa; hoje o botão "Jogar online" aparece desativado com "Online chega em breve."
- Termos do jogo: vaza, palpite, vida, vira, manilha, rodada, partida, mão.
- Distribuição: `.exe` e instalador para Windows, APK Android. APK ainda assinado com chave de teste (sem atualização por cima, sem Play Store por enquanto).
- Aberto: modelo de salas online (código de sala, convite, contas ou não).

## Brand Commitments

- Nome **Vazaê**, ID `com.vazae.app`, autor Ivo Vieira.
- Todo texto em pt-BR, tom de mesa de bar sem gíria forçada, sem travessão. Botões dizem a ação.
- Nada que remeta a palavrão: o jogo não é chamado pelo apelido popular (que tem palavrão), e sim de "jogo de vazas" ou Vazaê.
- Sem anúncios, sem conta obrigatória no modo solo.

## Evidence on Hand

Nenhum depoimento, número de usuários, avaliação de loja ou imprensa. Não inventar.

## Product Principles

1. A mesa do jogador manda: nenhuma regra é "a certa"; o padrão é só um ponto de partida.
2. Ler o estado do jogo de relance vale mais que qualquer enfeite.
3. Robô tem que jogar como gente que sabe jogar; adversário fraco não vale a partida.
4. Offline primeiro: o jogo solo nunca depende de rede.
5. Online entra como mais uma mesa, não como outro produto.

## Accessibility & Inclusion

Leitura de relance em tela de celular. Naipe e erro nunca dependem só de cor. `prefers-reduced-motion` respeitado.
