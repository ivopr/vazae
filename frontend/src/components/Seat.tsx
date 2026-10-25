import type { Card, PublicInfo } from "../../bindings/vazae/game/models"
import { Phase } from "../../bindings/vazae/game/models"
import { cn } from "@/lib/utils"
import { LivesChips } from "./LivesChips"
import { PlayingCard } from "./PlayingCard"

type Props = {
  player: PublicInfo
  active: boolean
  phase: Phase
  dealer: boolean
  /** The card this opponent holds in a one-card round, visible to you. */
  shown?: Card
  manilhas: Card[] | null
  /** The bot's level, shown only on a mixed table. */
  level?: string
  className?: string
}

export function Seat({ player, active, phase, dealer, shown, manilhas, level, className }: Props) {
  const out = player.lives <= 0
  const doing = phase === Phase.PhaseBidding ? "palpitando" : "jogando"

  return (
    <div
      className={cn(
        "flex min-w-32 shrink-0 items-center gap-2 rounded-lg border-2 px-2.5 py-2",
        active ? "border-turn bg-felt-deep" : "border-transparent bg-felt-deep/60",
        out && "opacity-60",
        className,
      )}
      aria-current={active ? "true" : undefined}
    >
      {shown && <PlayingCard card={shown} manilhas={manilhas} size="sm" />}
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex items-baseline gap-1.5">
          <span className="truncate font-bold">{player.name}</span>
          {level && <span className="text-xs whitespace-nowrap text-felt-muted">{level}</span>}
          {dealer && !out && (
            <span className="text-xs text-felt-muted" title="Quem dá as cartas palpita por último">
              pé
            </span>
          )}
        </div>
        <LivesChips lives={player.lives} />
        {!out && (
          <span className="text-sm whitespace-nowrap text-felt-muted">
            {player.bidded ? (
              <>
                palpite <b className="font-slab text-felt-foreground">{player.bid}</b>, fez{" "}
                <b className="font-slab text-felt-foreground">{player.won}</b>
              </>
            ) : active ? null : (
              "sem palpite"
            )}
            {active && <span className="block font-bold text-felt-foreground">{doing}…</span>}
          </span>
        )}
      </div>
    </div>
  )
}
