import { Rank, Suit, type Card } from "../../bindings/vazae/game/models"

export const RANK_LABEL: Record<number, string> = {
  [Rank.Four]: "4",
  [Rank.Five]: "5",
  [Rank.Six]: "6",
  [Rank.Seven]: "7",
  [Rank.Queen]: "Q",
  [Rank.Jack]: "J",
  [Rank.King]: "K",
  [Rank.Ace]: "A",
  [Rank.Two]: "2",
  [Rank.Three]: "3",
}

export const SUIT_GLYPH: Record<number, string> = {
  [Suit.Diamonds]: "♦",
  [Suit.Spades]: "♠",
  [Suit.Hearts]: "♥",
  [Suit.Clubs]: "♣",
}

export const SUIT_NAME: Record<number, string> = {
  [Suit.Diamonds]: "ouros",
  [Suit.Spades]: "espadas",
  [Suit.Hearts]: "copas",
  [Suit.Clubs]: "paus",
}

const RANK_NAME: Record<number, string> = {
  [Rank.Four]: "4",
  [Rank.Five]: "5",
  [Rank.Six]: "6",
  [Rank.Seven]: "7",
  [Rank.Queen]: "dama",
  [Rank.Jack]: "valete",
  [Rank.King]: "rei",
  [Rank.Ace]: "ás",
  [Rank.Two]: "2",
  [Rank.Three]: "3",
}

export const isRed = (s: Suit) => s === Suit.Diamonds || s === Suit.Hearts

export const cardLabel = (c: Card) => `${RANK_LABEL[c.rank]}${SUIT_GLYPH[c.suit]}`

/** Spoken name for screen readers, e.g. "7 de paus". */
export const cardName = (c: Card) => `${RANK_NAME[c.rank]} de ${SUIT_NAME[c.suit]}`

export const rankName = (r: Rank) => RANK_NAME[r]

export const sameCard = (a: Card, b: Card) => a.rank === b.rank && a.suit === b.suit

/** Card strength comes from the engine (hands arrive sorted); this only answers "is it a manilha?". */
export const isManilha = (manilhas: Card[] | null | undefined, c: Card) => !!manilhas?.some((m) => sameCard(m, c))

/** How the table names this round's manilhas, strongest first. */
export function manilhaLabel(manilhas: Card[] | null | undefined): { prefix: string; short: string; spoken: string } {
  if (!manilhas?.length) return { prefix: "", short: "sem manilha", spoken: "sem manilha" }
  if (manilhas.every((m) => m.rank === manilhas[0].rank)) {
    const r = manilhas[0].rank
    return { prefix: "manilha: ", short: RANK_LABEL[r], spoken: rankName(r) }
  }
  const strongest = [...manilhas].reverse()
  return { prefix: "manilhas: ", short: strongest.map(cardLabel).join(" "), spoken: strongest.map(cardName).join(", ") }
}
