import type { PlayerView } from "../../bindings/vazae/game/models"
import { Phase } from "../../bindings/vazae/game/models"
import { cn } from "@/lib/utils"
import { manilhaLabel } from "@/lib/cards"
import { PlayingCard } from "./PlayingCard"

export function TrickArea({ view }: { view: PlayerView }) {
  const players = view.players ?? []
  const trick = view.trick ?? []
  const last = view.lastTrick ?? []
  // Between tricks, keep the finished one on the table until someone leads.
  const showingLast = trick.length === 0 && last.length > 0
  const cards = showingLast ? last : trick
  const manilha = manilhaLabel(view.manilhas)
  const nameOf = (i: number) => (i === view.me ? "Você" : players[i]?.name ?? "")

  let caption = ""
  if (showingLast) {
    caption =
      view.lastTrickWinner < 0
        ? "Tudo anulado, ninguém levou."
        : view.lastTrickWinner === view.me
          ? "Você levou a vaza."
          : `${nameOf(view.lastTrickWinner)} levou a vaza.`
  } else if (trick.length === 0 && view.phase === Phase.PhasePlaying) {
    caption = view.turn === view.me ? "Você abre a vaza." : `${nameOf(view.turn)} abre a vaza.`
  }

  return (
    <section aria-label="Mesa" className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-3">
        {view.vira && <PlayingCard card={view.vira} size="sm" />}
        <div className="text-sm leading-tight">
          {view.vira && <div className="text-felt-muted">vira</div>}
          <div>
            {manilha.prefix}
            <b className="font-slab text-lg" aria-hidden>
              {manilha.short}
            </b>
            <span className="sr-only">{manilha.spoken}</span>
          </div>
        </div>
      </div>

      {/* Room for the trick is held only once play starts, so the vira sits mid-table while bidding. */}
      <ol
        className={cn(
          "flex flex-wrap items-end justify-center gap-2 stage-sm:gap-3",
          view.phase !== Phase.PhaseBidding && "min-h-[8.5rem]",
        )}
        aria-label="Cartas na vaza"
      >
        {cards.map((p) => {
          const won = showingLast && p.player === view.lastTrickWinner
          const dead = p.cancelled
          return (
            <li
              key={`${p.player}-${p.card.rank}-${p.card.suit}`}
              className={cn(
                "flex flex-col items-center gap-1 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-6 motion-safe:duration-300",
                showingLast && !won && "opacity-70",
              )}
            >
              <PlayingCard card={p.card} manilhas={view.manilhas} className={cn(won && "-translate-y-2 ring-3 ring-felt-foreground")} />
              <span className="max-w-20 truncate text-xs">{nameOf(p.player)}</span>
              {dead && <span className="text-xs font-bold text-felt-muted">anulada</span>}
              {won && <span className="text-xs font-bold">levou</span>}
            </li>
          )
        })}
      </ol>

      <p className="min-h-6 text-center text-sm text-felt-muted" aria-live="polite">
        {caption}
      </p>
    </section>
  )
}
