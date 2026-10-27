import type { PublicInfo } from "../../bindings/vazae/game/models"
import { Phase } from "../../bindings/vazae/game/models"
import { cn } from "@/lib/utils"
import { Chips } from "./Chip"

type Props = {
  player: PublicInfo
  /** Lives everyone started with, so lost chips leave their ring on the plaque. */
  total: number
  active: boolean
  phase: Phase
  dealer: boolean
  /** The bot's level, shown only on a mixed table. */
  level?: string
  /** A crowded table's narrow plaque: the chips pile closer to fit. */
  narrow?: boolean
  /** A gallery's plaque, two short lines: the name, then lives and "fez N de N". */
  mini?: boolean
  className?: string
}

/**
 * An opponent's place at the table: a lacquer plaque set into the rail with a gold
 * hairline, three short lines tall. Whoever is acting has the lamp on them: a lit
 * brass edge and a word on a ribbon across its foot.
 */
export function Seat({ player, total, active, phase, dealer, level, narrow, mini, className }: Props) {
  const out = player.lives <= 0
  const doing = phase === Phase.PhaseBidding ? "palpitando" : "jogando"
  const score = player.bidded ? `palpite ${player.bid}, fez ${player.won}` : "sem palpite"

  return (
    <div
      className={cn(
        "deco-frame relative flex h-full w-full min-w-0 flex-col items-center justify-center rounded-sm bg-rail-deep px-2 text-rail-foreground transition-[border-color,box-shadow] duration-300 [--deco-inset:4px] [--deco-step:5px]",
        mini ? "gap-0" : "gap-0.5",
        active
          ? "border-2 border-brass shadow-[0_0_0_3px_color-mix(in_oklch,var(--brass),transparent_70%),0_0_22px_6px_color-mix(in_oklch,var(--brass),transparent_72%)]"
          : "",
        out && "opacity-60",
        className,
      )}
      role="group"
      aria-current={active ? "true" : undefined}
      aria-label={`${player.name}${dealer && !out ? ", pé" : ""}${level ? `, ${level}` : ""}${out ? ", fora" : `, ${score}`}${active ? `, ${doing}` : ""}`}
    >
      <span className="w-full truncate text-center text-[13px] leading-tight font-bold" title={level} aria-hidden>
        {player.name}
      </span>
      {level && !mini && (
        <span className="-mt-0.5 w-full truncate text-center text-[10px] leading-none text-rail-muted" aria-hidden>
          {level}
        </span>
      )}
      {mini ? (
        <span className="flex items-center gap-2">
          <Chips lives={player.lives} total={total} size="sm" tally className="text-[13px]" />
          {!out && <Score player={player} />}
        </span>
      ) : (
        <Chips lives={player.lives} total={total} size="sm" dense={narrow || total > 5} className="text-[13px]" />
      )}
      {!out && !mini && <Score player={player} />}
      {dealer && !out && (
        // The dealer puck rides on the plaque's corner; it moves round the table each round.
        <span className="absolute -top-2.5 -right-2.5 grid size-7 place-items-center rounded-full border-2 border-ink/70 bg-paper text-[10px] font-bold text-ink shadow-[0_2px_4px_rgba(0,0,0,.45)]" title="Quem dá as cartas palpita por último" aria-hidden>
          PÉ
        </span>
      )}
      {active && (
        // A brass ribbon across the plaque's bottom edge, so it hangs only a little onto the felt.
        <span className="absolute -bottom-2 rounded-sm bg-brass px-1.5 text-[10px] leading-tight font-bold tracking-[0.12em] whitespace-nowrap text-ink uppercase" aria-hidden>
          {doing}…
        </span>
      )}
    </div>
  )
}

function Score({ player }: { player: PublicInfo }) {
  return (
    <span className="text-[11px] leading-tight whitespace-nowrap text-rail-muted" aria-hidden>
      {player.bidded ? (
        // "fez 0 de 1": tricks taken out of the bid, short enough for a plaque.
        <>
          fez <b className="text-[13px] text-rail-foreground">{player.won}</b> de{" "}
          <b className="text-[13px] text-rail-foreground">{player.bid}</b>
        </>
      ) : (
        "sem palpite"
      )}
    </span>
  )
}
