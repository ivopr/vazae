import type { Card } from "../../bindings/vazae/game/models"
import { cn } from "@/lib/utils"
import { RANK_LABEL, SUIT_GLYPH, cardName, isManilha as inManilhas, isRed } from "@/lib/cards"

type Size = "sm" | "md" | "lg"

const SIZE: Record<Size, string> = {
  sm: "w-11 h-16 text-[13px]",
  md: "w-16 h-24 text-base",
  lg: "w-[4.75rem] h-[7rem] text-lg stage-sm:w-20 stage-sm:h-[7.5rem]",
}

const PIP: Record<Size, string> = {
  sm: "text-xl",
  md: "text-4xl",
  lg: "text-5xl",
}

// Paper lifted off the felt: the only element in the app that casts a shadow.
const FACE =
  "relative shrink-0 select-none rounded-md border border-ink/25 bg-paper shadow-[0_1px_0_rgba(0,0,0,.25),0_6px_14px_-4px_rgba(0,0,0,.45)]"

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
}

export function PlayingCard({ card, back, unknown, manilhas, size = "md", className }: Props) {
  if (back || unknown || !card) {
    return (
      <div
        className={cn(FACE, SIZE[size], "grid place-items-center bg-felt-deep p-1", className)}
        role="img"
        aria-label={unknown ? "Sua carta, virada para baixo" : "Carta virada para baixo"}
      >
        <div className="grid h-full w-full place-items-center rounded-sm border border-paper/60">
          {unknown ? (
            <span className="font-slab text-3xl font-bold text-paper" aria-hidden>
              ?
            </span>
          ) : (
            <span className="grid grid-cols-2 gap-0.5 text-[10px] leading-none text-paper/80" aria-hidden>
              <span>♦</span>
              <span>♠</span>
              <span>♣</span>
              <span>♥</span>
            </span>
          )}
        </div>
      </div>
    )
  }

  const red = isRed(card.suit)
  const isManilha = inManilhas(manilhas, card)
  const index = (
    <span className="flex flex-col items-center font-slab leading-[0.95] font-bold">
      <span>{RANK_LABEL[card.rank]}</span>
      <span className="text-[0.85em]">{SUIT_GLYPH[card.suit]}</span>
    </span>
  )

  return (
    <div
      className={cn(FACE, SIZE[size], red ? "text-suit-red" : "text-ink", className)}
      role="img"
      aria-label={cardName(card) + (isManilha ? ", manilha" : "")}
    >
      <span className="absolute top-1 left-1" aria-hidden>
        {index}
      </span>
      {size !== "sm" && (
        <span className="absolute right-1 bottom-1 rotate-180" aria-hidden>
          {index}
        </span>
      )}
      {size !== "sm" && (
        <span className={cn("absolute inset-0 grid place-items-center leading-none", PIP[size])} aria-hidden>
          {SUIT_GLYPH[card.suit]}
        </span>
      )}
      {size !== "sm" && isManilha && (
        // Top edge, right of the index: the only spot clear of both corner indices.
        <span className="absolute top-1 right-1 left-4 text-center font-sans text-[10px] font-bold text-ink" aria-hidden>
          manilha
        </span>
      )}
      {size === "sm" && isManilha && (
        <span className="absolute inset-x-0 bottom-0.5 text-center font-sans text-[9px] font-bold text-ink" aria-hidden>
          manilha
        </span>
      )}
    </div>
  )
}
