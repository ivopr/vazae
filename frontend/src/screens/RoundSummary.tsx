import { useEffect, useRef } from "react"

import type { PlayerView } from "../../bindings/vazae/game/models"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type Props = {
  view: PlayerView
  open: boolean
  busy: boolean
  onClose: () => void
  onNext: () => void
}

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

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Jogador</TableHead>
              <TableHead className="text-right">Palpite</TableHead>
              <TableHead className="text-right">Fez</TableHead>
              <TableHead className="text-right">Perdeu</TableHead>
              <TableHead className="text-right">Vidas</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {losses.map((l) => {
              const p = players[l.player]
              return (
                <TableRow key={l.player} className={l.player === view.me ? "font-bold" : undefined}>
                  <TableCell className="max-w-28 truncate">{p?.name}</TableCell>
                  <TableCell className="text-right font-slab">{l.bid}</TableCell>
                  <TableCell className="text-right font-slab">{l.won}</TableCell>
                  <TableCell className="text-right font-slab">{l.lost === 0 ? "0" : `-${l.lost}`}</TableCell>
                  <TableCell className="text-right font-slab">{p && p.lives > 0 ? p.lives : "fora"}</TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Ver a mesa
          </Button>
          <Button ref={next} onClick={onNext} disabled={busy}>
            Próxima rodada
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
