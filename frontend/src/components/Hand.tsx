import { useRef, useState, type KeyboardEvent } from "react"

import type { Card } from "../../bindings/vazae/game/models"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { cardLabel, cardName, sameCard } from "@/lib/cards"
import { PlayingCard } from "./PlayingCard"

type Props = {
  /** Weakest first, as the engine sorts it under this match's rules. */
  hand: Card[]
  manilhas: Card[] | null
  /** Cards the rules allow right now (e.g. following suit). */
  playable: Card[] | null
  canPlay: boolean
  busy: boolean
  onPlay: (c: Card) => void
}

/** Tap a card to lift it, then confirm. Arrow keys move between playable cards. */
export function Hand({ hand, manilhas, playable, canPlay, busy, onPlay }: Props) {
  const [picked, setPicked] = useState<Card | null>(null)
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const sorted = hand
  const allowed = (c: Card) => canPlay && !!playable?.some((p) => sameCard(p, c))
  const selected = picked && sorted.some((c) => sameCard(c, picked) && allowed(c)) ? picked : null
  const restricted = canPlay && sorted.some((c) => !allowed(c))

  const onKey = (e: KeyboardEvent, i: number) => {
    const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0
    if (!step) return
    e.preventDefault()
    for (let k = 1; k <= sorted.length; k++) {
      const j = (i + k * step + k * sorted.length) % sorted.length
      if (allowed(sorted[j])) return refs.current[j]?.focus()
    }
  }

  const press = (c: Card) => {
    if (!allowed(c)) return
    if (selected && sameCard(selected, c)) onPlay(c)
    else setPicked(c)
  }

  // How much of each card shows: overlap more as the hand grows. Every card but the
  // last can shrink further, down to a sliver, so even a 19-card hand fits the width.
  // At 360px a 76px card leaves ~28px (8+ cards) or ~44px (5-7 cards) showing.
  const step =
    sorted.length > 7 ? "basis-7 stage-sm:basis-14" : sorted.length > 4 ? "basis-11 stage-sm:basis-18" : "basis-20 stage-sm:basis-22"

  return (
    <div className="flex max-w-full flex-col items-center gap-3">
      <ul className="flex max-w-full items-end justify-center px-2 pt-4" aria-label="Sua mão">
        {sorted.map((c, i) => {
          const isSel = selected !== null && sameCard(selected, c)
          const ok = allowed(c)
          return (
            <li key={`${c.rank}-${c.suit}`} className={i < sorted.length - 1 ? cn("min-w-4 shrink", step) : "shrink-0"}>
              <button
                ref={(el) => {
                  refs.current[i] = el
                }}
                type="button"
                disabled={!ok || busy}
                aria-pressed={isSel}
                aria-label={isSel ? `${cardName(c)}, escolhida. Aperte de novo para jogar` : cardName(c)}
                onClick={() => press(c)}
                onKeyDown={(e) => onKey(e, i)}
                className={cn(
                  "block rounded-md transition-transform duration-150 disabled:cursor-default",
                  ok && "hover:-translate-y-2",
                  isSel && "-translate-y-4 hover:-translate-y-4",
                  "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-8 motion-safe:duration-300",
                )}
                style={{ animationDelay: `${i * 50}ms`, animationFillMode: "backwards" }}
              >
                <PlayingCard
                  card={c}
                  manilhas={manilhas}
                  size="lg"
                  className={cn(isSel && "ring-3 ring-turn", canPlay && !ok && "brightness-75 saturate-50")}
                />
              </button>
            </li>
          )
        })}
      </ul>
      {restricted && <p className="-mt-1 text-sm text-felt-muted">Siga o naipe de quem abriu a vaza.</p>}
      {canPlay && (
        <Button disabled={!selected || busy} onClick={() => selected && onPlay(selected)}>
          {selected ? `Jogar ${cardLabel(selected)}` : "Escolha uma carta"}
        </Button>
      )}
    </div>
  )
}

/** One-card round: the card is yours but hidden from you. */
export function HiddenHand({ canPlay, busy, onPlay }: { canPlay: boolean; busy: boolean; onPlay: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <PlayingCard unknown size="lg" />
      <p className="max-w-xs text-center text-sm text-felt-muted">
        Rodada de 1 carta: você vê a carta dos outros, mas não a sua.
      </p>
      {canPlay && (
        <Button disabled={busy} onClick={onPlay}>
          Jogar minha carta
        </Button>
      )}
    </div>
  )
}
