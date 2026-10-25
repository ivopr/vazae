import { useEffect, useRef } from "react"

import type { PlayerView } from "../../bindings/vazae/game/models"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Chips } from "@/components/Chip"
import { cn } from "@/lib/utils"

type Props = {
  view: PlayerView
  open: boolean
  busy: boolean
  onClose: () => void
  onNext: () => void
}

/** The croupier's tally for the round: one ruled line per player, laid out the same every round. */
export function RoundSummary({ view, open, busy, onClose, onNext }: Props) {
  const next = useRef<HTMLButtonElement>(null)
  // The dialog can open while the last play is still in flight (button disabled),
  // so focus the action once it becomes usable.
  useEffect(() => {
    if (open && !busy) next.current?.focus()
  }, [open, busy])
  const players = view.players ?? []
  const losses = view.lastLoss ?? []
  const mine = losses.find((l) => l.player === view.me)
  const meOut = (players[view.me]?.lives ?? 0) <= 0
  const total = view.rules.players.lives

  let headline = "Rodada encerrada"
  if (mine) {
    headline = mine.lost === 0 ? "Na mosca!" : mine.lost === 1 ? "Perdeu 1 vida" : `Perdeu ${mine.lost} vidas`
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="stage-sm:max-w-lg"
        // Radix ignores autoFocus; land on the action that moves the game on.
        onOpenAutoFocus={(e) => {
          e.preventDefault()
          next.current?.focus()
        }}
      >
        <DialogHeader>
          <DialogTitle>{headline}</DialogTitle>
          <DialogDescription>
            {mine
              ? `Você palpitou ${mine.bid} e fez ${mine.won}.`
              : "Você já estava fora; os robôs seguem jogando."}
            {mine && meOut && " Suas vidas acabaram, mas dá para assistir até o fim."}
          </DialogDescription>
        </DialogHeader>

        <ol className="flex flex-col border-t border-dashed border-border" aria-label="Placar da rodada">
          {losses.map((l) => {
            const p = players[l.player]
            const lives = p?.lives ?? 0
            return (
              <li
                key={l.player}
                className={cn("flex flex-col gap-1 border-b border-dashed border-border py-2.5", l.player === view.me && "font-bold")}
              >
                <div className="flex items-center gap-3">
                  <span className="min-w-0 flex-1 truncate">{p?.name}</span>
                  {/* The chips lost this round slide off as the tally lands. */}
                  <Chips lives={lives} total={total} from={lives + l.lost} />
                </div>
                <dl className="flex gap-4 text-sm font-normal text-muted-foreground">
                  <Stat label="Palpite" value={l.bid} />
                  <Stat label="Fez" value={l.won} />
                  <Stat label="Perdeu" value={l.lost} strong={l.lost > 0} />
                  <Stat label="Vidas" value={lives > 0 ? lives : "fora"} />
                </dl>
              </li>
            )
          })}
        </ol>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Ver a mesa
          </Button>
          <Button ref={next} size="lg" onClick={onNext} disabled={busy}>
            Próxima rodada
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Stat({ label, value, strong }: { label: string; value: number | string; strong?: boolean }) {
  return (
    <div className="flex items-baseline gap-1">
      <dt>{label}</dt>
      <dd className={cn("text-lg leading-none text-card-foreground", strong && "font-bold")}>{value}</dd>
    </div>
  )
}
