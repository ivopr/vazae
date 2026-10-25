import type { CSSProperties } from "react"

import type { PlayerView } from "../../bindings/vazae/game/models"
import { Phase } from "../../bindings/vazae/game/models"
import { manilhaLabel } from "@/lib/cards"
import type { Pt } from "@/lib/seating"
import { cn } from "@/lib/utils"
import { PlayingCard } from "./PlayingCard"
import { WithSuits } from "./SuitIcon"

/** The vira and this round's manilha, in a box printed on the felt. */
export function Vira({ view, at, flat }: { view: PlayerView; at: Pt; flat?: boolean }) {
  const manilha = manilhaLabel(view.manilhas)
  return (
    <div
      className={cn(
        "absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-sm border border-[color-mix(in_oklch,var(--felt-print),transparent_45%)] bg-felt-deep/85 text-center",
        flat ? "w-27 flex-row gap-1.5 p-1.5 text-left" : "w-17 flex-col px-1 pt-1 pb-1.5",
      )}
      style={{ left: at.x, top: at.y }}
    >
      {!flat && view.vira && <span className="felt-print text-[10px] leading-none">vira</span>}
      {view.vira && <PlayingCard card={view.vira} size="sm" className="-rotate-3" />}
      <span className={cn(flat && "flex flex-col gap-1")}>
        {flat && view.vira && <span className="felt-print text-[10px] leading-none">vira</span>}
        {/* Lying flat the box is narrow, so the label and the value stack. */}
        <span className={cn("text-[11px] leading-tight text-felt-muted", flat && "flex min-w-0 flex-col")}>
          {manilha.prefix}
          <b className="text-[13px] text-felt-foreground" aria-hidden>
            <WithSuits text={manilha.short} />
          </b>
          <span className="sr-only">{manilha.spoken}</span>
        </span>
      </span>
    </div>
  )
}

/** What the table says about the trick: who opens it, or who took the last one. */
export function trickCaption(view: PlayerView): string {
  const players = view.players ?? []
  const nameOf = (i: number) => (i === view.me ? "Você" : players[i]?.name ?? "")
  const showingLast = (view.trick ?? []).length === 0 && (view.lastTrick ?? []).length > 0
  if (showingLast) {
    if (view.lastTrickWinner < 0) return "Tudo anulado, ninguém levou."
    return view.lastTrickWinner === view.me ? "Você levou a vaza." : `${nameOf(view.lastTrickWinner)} levou a vaza.`
  }
  if ((view.trick ?? []).length === 0 && view.phase === Phase.PhasePlaying) {
    return view.turn === view.me ? "Você abre a vaza." : `${nameOf(view.turn)} abre a vaza.`
  }
  return ""
}

type Props = {
  view: PlayerView
  /** Where a player's card lands on the felt. */
  land: (player: number) => Pt
  /** Where a player sits, so their card slides in from there. */
  seat: (player: number) => Pt
  cardSize?: "sm" | "md" | "lg"
}

/** Height of the name label under each trick card; the card sits half of it above its point. */
export const LABEL = 30

// A card dropped on the felt never lies quite square.
const tilt = (p: number) => ((p * 37) % 9) - 4

export function TrickArea({ view, land, seat, cardSize = "md" }: Props) {
  const players = view.players ?? []
  const trick = view.trick ?? []
  const last = view.lastTrick ?? []
  // Between tricks, keep the finished one on the table until someone leads.
  const showingLast = trick.length === 0 && last.length > 0
  const cards = showingLast ? last : trick
  const nameOf = (i: number) => (i === view.me ? "Você" : players[i]?.name ?? "")
  const winner = showingLast && view.lastTrickWinner >= 0 ? seat(view.lastTrickWinner) : null

  return (
    <section aria-label="Mesa" className="absolute inset-0">
      <ol aria-label="Cartas na vaza">
        {cards.map((p) => {
          const won = showingLast && p.player === view.lastTrickWinner
          const dead = p.cancelled
          const at = land(p.player)
          const from = seat(p.player)
          // The finished trick leans toward whoever took it.
          let lean = { x: 0, y: 0 }
          if (winner) {
            const dx = winner.x - at.x
            const dy = winner.y - at.y
            const d = Math.hypot(dx, dy) || 1
            lean = { x: (dx / d) * 4, y: (dy / d) * 4 }
          }
          const style = {
            left: at.x + lean.x,
            top: at.y + lean.y - LABEL / 2,
            "--from-x": `calc(-50% + ${from.x - at.x}px)`,
            "--from-y": `calc(-50% + ${from.y - at.y}px)`,
            "--from-r": `${tilt(p.player) * 4}deg`,
            "--rest-r": `${tilt(p.player)}deg`,
            transform: `translate(-50%, -50%) rotate(${tilt(p.player)}deg)`,
          } as CSSProperties
          return (
            <li
              key={`${p.player}-${p.card.rank}-${p.card.suit}`}
              className="absolute flex flex-col items-center gap-0.5 transition-[left,top] duration-300 ease-out motion-safe:animate-[card-in_340ms_cubic-bezier(.2,.8,.2,1)_backwards]"
              style={style}
            >
              <PlayingCard
                card={p.card}
                manilhas={view.manilhas}
                size={cardSize}
                className={cn(won && "ring-3 ring-brass", dead && "brightness-[.7] saturate-50")}
              />
              <span className="absolute top-full mt-0.5 flex max-w-20 flex-col items-center rounded-sm bg-felt-deep/85 px-1 text-[11px] leading-tight text-felt-foreground">
                <span className="max-w-full truncate">{nameOf(p.player)}</span>
                {won && <b className="text-brass">levou</b>}
                {dead && <b className="text-felt-muted">anulada</b>}
              </span>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
