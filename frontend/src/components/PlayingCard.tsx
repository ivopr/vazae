import type { CSSProperties } from "react"

import { Suit, type Card } from "../../bindings/vazae/game/models"
import { cn } from "@/lib/utils"
import { RANK_LABEL, cardName, isManilha as inManilhas, isRed } from "@/lib/cards"
import { SuitIcon } from "./SuitIcon"

type Size = "sm" | "md" | "lg"

const SIZE: Record<Size, string> = {
  sm: "w-11 h-16 text-[15px]",
  md: "w-16 h-24 text-xl",
  lg: "w-[4.75rem] h-[7rem] text-[1.375rem] stage-lg:w-20 stage-lg:h-[7.5rem]",
}

const PIP: Record<Size, string> = {
  sm: "text-xl",
  md: "text-4xl",
  lg: "text-5xl",
}

// Paper lying on the baize: cards and chips are the only things that cast a shadow.
const FACE =
  "relative shrink-0 select-none rounded-md border border-ink/20 bg-paper shadow-[0_1px_0_rgba(0,0,0,.2),0_6px_12px_-4px_rgba(0,0,0,.4)]"

type Props = {
  card?: Card
  /** Face down, e.g. an opponent's hand. */
  back?: boolean
  /** Your own card in a one-card round: you hold it but can't see it. */
  unknown?: boolean
  /** This round's manilhas, to label the card if it is one. */
  manilhas?: Card[] | null
  size?: Size
  className?: string
  style?: CSSProperties
}

const BACK_SUITS = [Suit.Diamonds, Suit.Spades, Suit.Clubs, Suit.Hearts]

export function PlayingCard({ card, back, unknown, manilhas, size = "md", className, style }: Props) {
  if (back || unknown || !card) {
    return (
      <div
        className={cn(FACE, SIZE[size], "grid place-items-center border-rail-deep bg-rail p-1", className)}
        style={style}
        role="img"
        aria-label={unknown ? "Sua carta, virada para baixo" : "Carta virada para baixo"}
      >
        {/* The house back: burgundy lacquer under a brass lattice. */}
        <div className="grid h-full w-full place-items-center rounded-sm border border-piping [background:repeating-linear-gradient(45deg,transparent_0_5px,color-mix(in_oklch,var(--piping),transparent_55%)_5px_6px),repeating-linear-gradient(-45deg,transparent_0_5px,color-mix(in_oklch,var(--piping),transparent_55%)_5px_6px)]">
          {unknown ? (
            <span className="grid size-10 place-items-center rounded-full border border-piping bg-rail font-display text-3xl leading-none text-brass" aria-hidden>
              ?
            </span>
          ) : (
            <span className="grid grid-cols-2 gap-0.5 rounded-sm bg-rail p-0.5 text-[10px] text-piping" aria-hidden>
              {BACK_SUITS.map((s) => (
                <SuitIcon key={s} suit={s} />
              ))}
            </span>
          )}
        </div>
      </div>
    )
  }

  const red = isRed(card.suit)
  const isManilha = inManilhas(manilhas, card)
  const index = (
    <span className="flex flex-col items-center leading-[0.9]">
      {/* Atkinson's Q keeps its tail at index size; the condensed face's Q reads as a 0. */}
      <span className="font-sans font-bold tracking-tight">{RANK_LABEL[card.rank]}</span>
      <SuitIcon suit={card.suit} className="mt-0.5 size-[0.6em]" />
    </span>
  )

  return (
    <div
      className={cn(FACE, SIZE[size], red ? "text-suit-red" : "text-ink", className)}
      style={style}
      role="img"
      aria-label={cardName(card) + (isManilha ? ", manilha" : "")}
    >
      <span className="absolute top-1 left-1.5" aria-hidden>
        {index}
      </span>
      {size !== "sm" && (
        <span className="absolute right-1.5 bottom-1 rotate-180" aria-hidden>
          {index}
        </span>
      )}
      {size !== "sm" && (
        // A manilha's stamp sits under the pip, between the two corner indices.
        // On the mid size there is no room for both between the indices, so the stamp takes the pip's place.
        <span
          className={cn("absolute inset-0 flex flex-col items-center justify-center gap-1", PIP[size], isManilha && size === "lg" && "pb-5")}
          aria-hidden
        >
          {!(isManilha && size === "md") && <SuitIcon suit={card.suit} className={cn(isManilha && "size-[0.7em]")} />}
          {isManilha && (
            <span className="rounded-sm bg-ink px-1 font-sans text-[9px] leading-tight font-bold text-paper">manilha</span>
          )}
        </span>
      )}
      {size === "sm" && isManilha && (
        <span
          className="absolute inset-x-0.5 bottom-0.5 rounded-sm bg-ink text-center font-sans text-[9px] leading-tight font-bold text-paper"
          aria-hidden
        >
          manilha
        </span>
      )}
    </div>
  )
}
