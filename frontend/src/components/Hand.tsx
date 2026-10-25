import { useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react"

import type { Card } from "../../bindings/vazae/game/models"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { cardLabel, cardName, sameCard } from "@/lib/cards"
import { PlayingCard } from "./PlayingCard"
import { WithSuits } from "./SuitIcon"

type Props = {
  /** Weakest first, as the engine sorts it under this match's rules. */
  hand: Card[]
  manilhas: Card[] | null
  /** Cards the rules allow right now (e.g. following suit). */
  playable: Card[] | null
  canPlay: boolean
  busy: boolean
  onPlay: (c: Card) => void
  /** A crowded table or a big hand holds mid-size cards to leave room for the felt. */
  size?: "md" | "lg"
  /** Shown between the fan and its play button (your status and plaque, on a phone). */
  middle?: ReactNode
  /** Keep the play button's room even when it isn't your turn, so the dock doesn't jump between turns. */
  reserve?: boolean
}

const CARD_W = { md: 64, lg: 76 }

/** How wide a fan of n cards is at most (cards a little apart; a narrow dock overlaps them). */
export const fanWidth = (n: number, size: "md" | "lg") => (n > 0 ? CARD_W[size] + (n - 1) * (CARD_W[size] + 6) : 0)
export const CARD_H = { md: 96, lg: 112 }

/**
 * Your cards fanned over the near rail, weakest on the left. Tap a card to lift it,
 * then tap it again or confirm. Arrow keys move between playable cards.
 */
export function Hand({ hand, manilhas, playable, canPlay, busy, onPlay, size = "lg", middle, reserve }: Props) {
  const [picked, setPicked] = useState<Card | null>(null)
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const allowed = (c: Card) => canPlay && !!playable?.some((p) => sameCard(p, c))
  const selected = picked && hand.some((c) => sameCard(c, picked) && allowed(c)) ? picked : null
  const restricted = canPlay && hand.some((c) => !allowed(c))

  const onKey = (e: KeyboardEvent, i: number) => {
    const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0
    if (!step) return
    e.preventDefault()
    for (let k = 1; k <= hand.length; k++) {
      const j = (i + k * step + k * hand.length) % hand.length
      if (allowed(hand[j])) return refs.current[j]?.focus()
    }
  }

  const press = (c: Card) => {
    if (!allowed(c)) return
    if (selected && sameCard(selected, c)) onPlay(c)
    else setPicked(c)
  }

  const n = hand.length
  if (n === 0) return null
  const w = CARD_W[size]
  const mid = (n - 1) / 2
  // Cards spread a little apart when they fit, and overlap evenly when they don't.
  const step = n > 1 ? `min(${w + 6}px, (100% - ${w}px) / ${n - 1})` : "0px"
  const spread = Math.min(4, 28 / Math.max(n, 1))

  return (
    <div className="flex w-full flex-col items-center gap-2">
      <ul role="group" aria-label="Sua mão" className="relative w-full" style={{ height: CARD_H[size] + 20 }}>
        {hand.map((c, i) => {
          const isSel = selected !== null && sameCard(selected, c)
          const ok = allowed(c)
          const off = i - mid
          const style = {
            left: `calc(50% + ${off} * ${step} - ${w / 2}px)`,
            "--fan-r": `${off * spread}deg`,
            "--fan-y": `${Math.abs(off) ** 2 * 0.9 + 12}px`,
            animationDelay: `${i * 50}ms`,
            animationFillMode: "backwards",
          } as CSSProperties
          return (
            <li key={`${c.rank}-${c.suit}`} className="absolute top-0" style={style}>
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
                  "block origin-bottom rounded-md transition-transform duration-200 ease-out disabled:cursor-default",
                  "[transform:translateY(var(--fan-y))_rotate(var(--fan-r))]",
                  ok && !isSel && "can-hover:hover:[transform:translateY(calc(var(--fan-y)-8px))_rotate(var(--fan-r))]",
                  isSel && "[transform:translateY(calc(var(--fan-y)-20px))_rotate(var(--fan-r))]",
                  "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-10 motion-safe:duration-300",
                )}
              >
                <PlayingCard
                  card={c}
                  manilhas={manilhas}
                  size={size}
                  className={cn(isSel && "ring-3 ring-brass", canPlay && !ok && "brightness-[.6] saturate-50")}
                />
              </button>
            </li>
          )
        })}
      </ul>
      {middle}
      {restricted && <p className="text-sm text-rail-muted">Siga o naipe de quem abriu a vaza.</p>}
      {canPlay && (
        <Button size="lg" className="w-full max-w-xs" disabled={!selected || busy} onClick={() => selected && onPlay(selected)}>
          {selected ? (
            <span>
              Jogar <WithSuits text={cardLabel(selected)} />
            </span>
          ) : (
            "Escolha uma carta"
          )}
        </Button>
      )}
      {!canPlay && reserve && <div className="h-13 w-full max-w-xs" aria-hidden />}
    </div>
  )
}

/** One-card round: the card is yours but hidden from you. */
export function HiddenHand({ canPlay, busy, onPlay }: { canPlay: boolean; busy: boolean; onPlay: () => void }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <PlayingCard unknown size="md" />
      <p className="max-w-xs text-center text-sm text-rail-muted">Rodada de 1 carta: você vê a carta dos outros, mas não a sua.</p>
      {canPlay && (
        <Button size="lg" className="w-full max-w-xs" disabled={busy} onClick={onPlay}>
          Jogar minha carta
        </Button>
      )}
    </div>
  )
}
