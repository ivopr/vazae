import { useLayoutEffect, useRef, useState } from "react"

import type { PlayerView, Rules } from "../../bindings/vazae/game/models"
import { Phase } from "../../bindings/vazae/game/models"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { BidPicker } from "@/components/BidPicker"
import { Hand, HiddenHand } from "@/components/Hand"
import { LivesChips } from "@/components/LivesChips"
import { RulesDialog } from "@/components/RulesDialog"
import { Seat } from "@/components/Seat"
import { ThemeToggle } from "@/components/ThemeToggle"
import { TrickArea } from "@/components/TrickArea"
import { LEVEL_LABEL, type SoloGame } from "@/game/useSolo"
import { seatPositions } from "@/lib/seats"
import { cn } from "@/lib/utils"
import { RoundSummary } from "./RoundSummary"

/** An element's layout size (unscaled by the stage), kept current on resize. */
function useSize<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, size] as const
}

type Props = { game: SoloGame & { view: PlayerView }; onLeave: () => void }

export function Table({ game, onLeave }: Props) {
  const { view, busy } = game
  const players = view.players ?? []
  const me = players[view.me]
  const meOut = me.lives <= 0
  const myTurn = view.turn === view.me && !meOut
  const bidding = myTurn && view.phase === Phase.PhaseBidding
  // One-card round played "on the forehead": your own card stays hidden.
  const blind = view.cards === 1 && view.rules.oneCard.blind
  const opponents = players.map((p, i) => ({ p, i })).filter(({ i }) => i !== view.me)
  const [summaryClosedRound, setSummaryClosedRound] = useState(-1)
  const summaryOpen = view.phase === Phase.PhaseRoundEnd && summaryClosedRound !== view.round
  const [ovalRef, oval] = useSize<HTMLDivElement>()
  const positions = seatPositions(opponents.length, oval.w, oval.h)

  const seat = (p: (typeof players)[number], i: number, className?: string) => (
    <Seat
      key={i}
      player={p}
      active={view.turn === i && (view.phase === Phase.PhaseBidding || view.phase === Phase.PhasePlaying)}
      phase={view.phase}
      dealer={view.dealer === i}
      shown={view.others?.[`${i}`]?.[0] ?? undefined}
      level={game.levels?.[i] ? LEVEL_LABEL[game.levels[i]] : undefined}
      manilhas={view.manilhas}
      className={className}
    />
  )

  return (
    // Desktop: held to the stage height so the table never scrolls; the oval gives way first.
    <div className="on-felt flex min-h-full flex-col pb-[env(safe-area-inset-bottom)] stage-lg:h-full">
      <header className="flex items-center gap-3 border-b border-felt-border/50 px-4 pt-[max(0.5rem,env(safe-area-inset-top))] pb-2">
        <span className="font-slab text-xl font-bold">Vazaê</span>
        <span className="text-sm text-felt-muted">
          Rodada {view.round + 1}, {view.cards === 1 ? "1 carta" : `${view.cards} cartas`}
        </span>
        <TableMenu onLeave={onLeave} rules={view.rules} />
      </header>

      {/* Phones and tablets: opponents in a strip that scrolls on its own. */}
      <ul className="flex gap-2 overflow-x-auto px-4 py-3 stage-md:flex-wrap stage-md:justify-center stage-lg:hidden" aria-label="Adversários">
        {opponents.map(({ p, i }) => (
          <li key={i}>{seat(p, i)}</li>
        ))}
      </ul>

      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-2 stage-lg:min-h-0">
        {/* Desktop: seats around an oval table. */}
        <div ref={ovalRef} className="relative hidden h-full max-h-[32rem] w-full max-w-5xl stage-lg:block">
          <div className="absolute inset-x-[8%] top-[14%] bottom-[2%] rounded-[50%] border-2 border-felt-border/60 bg-felt-deep/40" aria-hidden />
          <ul aria-label="Adversários">
            {opponents.map(({ p, i }, k) => (
              <li
                key={i}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: positions[k]?.x ?? 0, top: positions[k]?.y ?? 0 }}
              >
                {seat(p, i)}
              </li>
            ))}
          </ul>
          {/* Centred in the space under the top seat (its centre plus half its height),
              so a short oval never pushes the vira into that seat. */}
          <div className="absolute inset-x-0 top-[calc(max(3.5rem,14%)+3rem)] bottom-[2%] flex items-center justify-center">
            <TrickArea view={view} />
          </div>
        </div>
        <div className="stage-lg:hidden">
          <TrickArea view={view} />
        </div>
      </main>

      {/* Desktop keeps every row short so the oval keeps its height: the status sits beside
          your name, and the bid picker beside your hand instead of above it. */}
      <section
        aria-label="Você"
        className={cn(
          "flex flex-col items-center gap-3 px-4 pb-4",
          bidding &&
            "stage-lg:grid stage-lg:grid-cols-[minmax(0,auto)_auto] stage-lg:items-center stage-lg:justify-center stage-lg:justify-items-center stage-lg:gap-x-6",
        )}
      >
        <div className="contents stage-lg:flex stage-lg:flex-wrap stage-lg:items-center stage-lg:justify-center stage-lg:gap-x-4">
          <Status view={view} meOut={meOut} onSummary={() => setSummaryClosedRound(-1)} />

          <div
            className={cn(
              "flex flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-lg border-2 px-3 py-1.5",
              myTurn ? "border-turn" : "border-transparent",
            )}
          >
            <span className="font-bold">{me.name}</span>
            {view.dealer === view.me && !meOut && <span className="text-sm text-felt-muted">pé</span>}
            <LivesChips lives={me.lives} />
            {me.bidded && (
              <span className="text-sm text-felt-muted">
                palpite <b className="font-slab text-felt-foreground">{me.bid}</b>, fez{" "}
                <b className="font-slab text-felt-foreground">{me.won}</b>
              </span>
            )}
          </div>
        </div>

        {bidding && (
          // Spans your name row and your hand; a blind one-card round shows no hand while bidding.
          <div
            className={cn(
              "flex w-full max-w-md justify-center stage-lg:col-start-2 stage-lg:row-start-1 stage-lg:w-md",
              !blind && "stage-lg:row-span-2",
            )}
          >
            {/* Keyed by round so a stale choice from last round never carries over. */}
            <BidPicker key={view.round} view={view} busy={busy} onBid={game.bid} />
          </div>
        )}

        {!meOut &&
          (blind ? (
            // While bidding, the hidden card adds nothing; BidPicker explains the round.
            me.left > 0 &&
            view.phase === Phase.PhasePlaying && (
              <HiddenHand canPlay={myTurn && view.phase === Phase.PhasePlaying} busy={busy} onPlay={game.playHidden} />
            )
          ) : (
            <Hand
              hand={view.hand ?? []}
              manilhas={view.manilhas}
              playable={view.playable}
              canPlay={myTurn && view.phase === Phase.PhasePlaying}
              busy={busy}
              onPlay={game.play}
            />
          ))}
      </section>

      <RoundSummary
        view={view}
        open={summaryOpen}
        busy={busy}
        onClose={() => setSummaryClosedRound(view.round)}
        onNext={game.nextRound}
      />
    </div>
  )
}

function Status({ view, meOut, onSummary }: { view: PlayerView; meOut: boolean; onSummary: () => void }) {
  const players = view.players ?? []
  const who = players[view.turn]?.name ?? ""
  const mine = view.turn === view.me && !meOut
  let text: string
  switch (view.phase) {
    case Phase.PhaseBidding:
      text = mine ? "Sua vez de palpitar." : `${who} está palpitando.`
      break
    case Phase.PhasePlaying:
      text = mine ? "Sua vez de jogar." : `${who} está jogando.`
      break
    default:
      text = "Rodada encerrada."
  }
  if (meOut && view.phase !== Phase.PhaseRoundEnd) text = `Você está fora. ${text}`

  return (
    <div className="flex min-h-11 flex-wrap items-center justify-center gap-3">
      <p role="status" className={cn("text-center", mine && "font-bold")}>
        {text}
      </p>
      {view.phase === Phase.PhaseRoundEnd && (
        <Button onClick={onSummary}>Ver placar da rodada</Button>
      )}
    </div>
  )
}

function TableMenu({ onLeave, rules }: { onLeave: () => void; rules: Rules }) {
  const [open, setOpen] = useState(false)
  const [confirming, setConfirming] = useState(false)
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) setConfirming(false)
      }}
    >
      <Button variant="outline" className="ml-auto" onClick={() => setOpen(true)}>
        Menu
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Menu</DialogTitle>
          <DialogDescription>A partida continua de onde parou quando você fechar.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <RulesDialog trigger={<Button variant="outline">Como se joga</Button>} rules={rules} />
          <ThemeToggle />
          {confirming ? (
            <div className="flex flex-col gap-2 rounded-md border border-border p-3">
              <p>Sair agora encerra a partida. Os robôs não guardam lugar.</p>
              <div className="flex flex-wrap gap-2">
                <Button onClick={onLeave}>Sair e encerrar</Button>
                <Button variant="outline" onClick={() => setConfirming(false)}>
                  Continuar jogando
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" onClick={() => setConfirming(true)}>
              Sair da partida
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
