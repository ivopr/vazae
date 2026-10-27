import { useEffect, useLayoutEffect, useRef, useState } from "react"

import type { PlayerView, Rules } from "../../bindings/vazae/game/models"
import { Phase } from "../../bindings/vazae/game/models"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { BidPicker } from "@/components/BidPicker"
import { Chips } from "@/components/Chip"
import { Felt } from "@/components/Felt"
import { CARD_H, Hand, HiddenHand, fanWidth } from "@/components/Hand"
import { PlayingCard } from "@/components/PlayingCard"
import { RulesDialog } from "@/components/RulesDialog"
import { Seat } from "@/components/Seat"
import { useStage } from "@/components/Stage"
import { ThemeToggle } from "@/components/ThemeToggle"
import { LABEL, TrickArea, Vira, trickCaption } from "@/components/TrickArea"
import { LEVEL_LABEL, type SoloGame } from "@/game/useSolo"
import { isGallery, type Layout } from "@/lib/seating"
import { buzz, play, setSound, useSound } from "@/lib/sound"
import { cn } from "@/lib/utils"
import { RoundSummary } from "./RoundSummary"

// The stage-lg breakpoint, in px: from here the oval turns landscape with bigger plaques.
const WIDE = 1024

// Trick card sizes in px (PlayingCard's, at the stage-lg size for lg), with the name label under each.
// How far your fanned hand rises out of the dock over the felt's near edge.
const FAN_RISE = 72

// Each trick card, a little wider for its tilt. On a desktop the name label under it
// counts too, the pair placed by its centre (TrickArea lifts the card by half a label);
// a phone's trick has no labels.
const TRICK_CARD = { sm: { w: 52, h: 68 }, md: { w: 68, h: 96 }, lg: { w: 84, h: 120 } }
const trickBox = (s: keyof typeof TRICK_CARD, wide: boolean) => ({ w: TRICK_CARD[s].w, h: TRICK_CARD[s].h + (wide ? LABEL : 4) })

/** Whether the element is at least WIDE across, kept current on resize. */
function useWide<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [wide, setWide] = useState(false)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setWide(e.contentRect.width >= WIDE))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, wide] as const
}

/** The table's sounds and buzzes, fired on what changed since the last view. */
function useTableCues(view: PlayerView) {
  const prev = useRef<PlayerView | null>(null)
  useEffect(() => {
    const p = prev.current
    prev.current = view
    if (!p) return
    const me = view.players?.[view.me]
    const meBefore = p.players?.[view.me]
    const mine = view.turn === view.me && (me?.lives ?? 0) > 0
    const wasMine = p.turn === p.me && p.phase === view.phase
    const played = (view.trick?.length ?? 0) > (p.trick?.length ?? 0) || ((view.trick?.length ?? 0) === 0 && (view.lastTrick?.length ?? 0) > 0 && (p.trick?.length ?? 0) > 0)
    if (view.round !== p.round) play("deal", view.hand?.length ?? view.cards)
    else if (played) play("card")
    if (me && meBefore && me.lives < meBefore.lives) {
      play("chip", meBefore.lives - me.lives)
      buzz(60)
    }
    if (mine && !wasMine && (view.phase === Phase.PhaseBidding || view.phase === Phase.PhasePlaying)) {
      play("turn")
      buzz(25)
    }
  }, [view])
}

type Props = { game: SoloGame & { view: PlayerView }; onLeave: () => void }

export function Table({ game, onLeave }: Props) {
  const { view, busy } = game
  const players = view.players ?? []
  const me = players[view.me]
  const [rootRef, wide] = useWide<HTMLDivElement>()
  const [summaryClosedRound, setSummaryClosedRound] = useState(-1)
  const stage = useStage()
  const acting = !!me && me.lives > 0 && view.turn === view.me
  const feltRef = useRef<HTMLDivElement>(null)
  const dockRef = useRef<HTMLElement>(null)
  // Where your fanned cards actually lie, so the felt's legend stops short of them.
  const handRef = useRef<HTMLDivElement>(null)
  const [handSpan, setHandSpan] = useState<[number, number] | undefined>(undefined)
  useLayoutEffect(() => {
    const el = handRef.current
    // An empty hand keeps the last span, so the legend stays put between rounds.
    if (!el) return
    const measure = () => {
      const cards = [...el.querySelectorAll("[role=img]")].map((c) => c.getBoundingClientRect())
      if (cards.length === 0) return
      const span: [number, number] = [Math.min(...cards.map((r) => r.left)), Math.max(...cards.map((r) => r.right))]
      setHandSpan((old) => (old && Math.abs(old[0] - span[0]) < 1 && Math.abs(old[1] - span[1]) < 1 ? old : span))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [view.hand?.length, view.phase, wide])
  useTableCues(view)
  // On a phone a big hand can make the table taller than the screen. When it is your
  // turn, scroll only as far as needed to bring the felt out from behind the dock.
  useEffect(() => {
    if (!acting || wide || !stage || !feltRef.current || !dockRef.current) return
    const hidden = feltRef.current.getBoundingClientRect().bottom - dockRef.current.getBoundingClientRect().top
    if (hidden <= 0) return
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    stage.scrollBy({ top: hidden, behavior: smooth ? "smooth" : "auto" })
  }, [acting, view.phase, wide, stage])
  if (!me) return null

  const total = view.rules.players.lives
  const meOut = me.lives <= 0
  const myTurn = view.turn === view.me && !meOut
  const bidding = myTurn && view.phase === Phase.PhaseBidding
  const live = view.phase === Phase.PhaseBidding || view.phase === Phase.PhasePlaying
  // One-card round played "on the forehead": your own card stays hidden.
  const blind = view.cards === 1 && view.rules.oneCard.blind
  const n = players.length
  // Opponents in play order, starting at your left.
  const order = Array.from({ length: n - 1 }, (_, k) => (view.me + 1 + k) % n)
  const summaryOpen = view.phase === Phase.PhaseRoundEnd && summaryClosedRound !== view.round
  const sum = players.reduce((s, p) => s + (p.bidded ? p.bid : 0), 0)
  // Trick sizes to try, largest first: the bigger card whenever the felt has room for it;
  // a phone gallery's grid always holds small ones.
  const trickSizes: (keyof typeof TRICK_CARD)[] = wide ? (n > 5 ? ["md", "sm"] : ["lg"]) : isGallery(n - 1, wide) ? ["sm"] : ["md", "sm"]
  const legendRound = `Rodada ${view.round + 1} · ${view.cards === 1 ? "1 carta" : `${view.cards} cartas`}`
  const legendSum = `Palpites somam ${sum} de ${view.cards}`
  const roundText = `Rodada ${view.round + 1}, ${view.cards === 1 ? "1 carta" : `${view.cards} cartas`}`

  const seatOf = (l: Layout) => (p: number) => (p === view.me ? l.me : l.seats[order.indexOf(p)] ?? l.c)
  const landOf = (l: Layout) => (p: number) => (p === view.me ? l.meLand : l.land[order.indexOf(p)] ?? l.c)

  // Your status and plaque; on a phone they sit between your fanned hand and its play button.
  const mine = (
    <div className={cn("flex w-full flex-col items-center gap-2", wide && "items-start")}>
      {/* While you bid, the picker's own question says it is your turn. */}
      <Status view={view} meOut={meOut} hidden={bidding} summary={false} onSummary={() => setSummaryClosedRound(-1)} />
      <div
        className={cn(
          "deco-frame relative flex flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-md bg-rail px-3.5 py-2 [--deco-step:5px]",
          myTurn && "border-2 border-brass",
        )}
      >
        <span className="font-bold">{me.name}</span>
        {view.dealer === view.me && !meOut && (
          <span className="absolute -top-2.5 -right-2.5 grid size-7 place-items-center rounded-full border-2 border-ink/70 bg-paper text-[10px] font-bold text-ink shadow-[0_2px_4px_rgba(0,0,0,.45)]" title="Quem dá as cartas palpita por último">
            <span aria-hidden>PÉ</span>
            <span className="sr-only">pé</span>
          </span>
        )}
        <Chips lives={me.lives} total={total} />
        {me.bidded && (
          <span className="text-sm text-rail-muted">
            palpite <b className="text-base text-rail-foreground">{me.bid}</b>, fez{" "}
            <b className="text-base text-rail-foreground">{me.won}</b>
          </span>
        )}
      </div>
    </div>
  )
  const fan = !meOut && !blind && (view.hand?.length ?? 0) > 0
  const cardsOut = (view.trick?.length ?? 0) + (view.lastTrick?.length ?? 0) > 0 || (blind && Object.keys(view.others ?? {}).length > 0)
  // Sized by the round, not the cards left, so the hand doesn't change size as it empties.
  const handSize = !wide && (bidding || n > 4 || view.cards > 6) ? "md" : "lg"
  const hand = fan && (
    <Hand
      hand={view.hand ?? []}
      manilhas={view.manilhas}
      playable={view.playable}
      canPlay={myTurn && view.phase === Phase.PhasePlaying}
      busy={busy}
      onPlay={game.play}
      size={handSize}
      reserve={!bidding}
      middle={wide ? undefined : mine}
    />
  )
  // A one-card round "on the forehead": you hold a card you can't see.
  const hidden = !meOut && blind && me.left > 0 && view.phase === Phase.PhasePlaying && (
    <HiddenHand canPlay={myTurn} busy={busy} onPlay={game.playHidden} />
  )

  return (
    <div
      ref={rootRef}
      className={cn("on-room relative flex min-h-full flex-col bg-room text-room-foreground", wide && "h-full")}
    >
      <header className="relative z-10 flex items-center gap-3 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-1 stage-lg:px-8 stage-lg:pt-4">
        <span className="font-display text-[1.75rem] leading-none text-marquee">Vazaê</span>
        <span className="sr-only">{roundText}</span>
        {wide ? (
          <span className="text-sm text-room-muted" aria-hidden>
            {roundText}
          </span>
        ) : (
          // A phone's felt has no room for the house legend, so the header carries it.
          <span className="flex min-w-0 flex-1 flex-col items-center text-center text-xs leading-snug text-room-muted" aria-hidden>
            <span>{legendRound}</span>
            <span>
              Palpites: <b className="text-room-foreground">{sum}</b> de {view.cards}
            </span>
          </span>
        )}
        <div className="ml-auto">
          <TableMenu onLeave={onLeave} rules={view.rules} />
        </div>
      </header>

      <div ref={feltRef} className={cn("on-felt relative flex flex-1 flex-col px-1", wide ? "min-h-0 px-8 pt-2" : "min-h-[22rem] pt-1")}>
        <Felt
          className={cn("flex-1", !wide && "min-h-[21rem]")}
          opponents={order.length}
          wide={wide}
          cards={trickSizes.map((s) => trickBox(s, wide))}
          grow={!wide}
          open
          // Held for the whole match (unless you're out), so the felt doesn't relayout when your hand empties.
          near={meOut ? 0 : FAN_RISE}
          nearSpan={meOut ? undefined : handSpan}
          cardsOut={cardsOut}
          legend={wide ? { left: legendRound, right: legendSum } : undefined}
        >
          {(l, fit) => {
            const trickSize = trickSizes[fit]
            return (
              <>
                <Vira view={view} at={l.vira} flat={l.viraFlat} />
                {wide && !l.arcs && (
                  // No stretch of the ring is free for it: the legend printed straight, where no seat or card covers it.
                  <p
                    className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center text-[9.5px] leading-snug font-bold tracking-[0.06em] whitespace-nowrap text-felt-print uppercase"
                    style={{ left: l.legend.x, top: l.legend.y }}
                    aria-hidden
                  >
                    <span>{legendRound}</span>
                    <span>{legendSum}</span>
                  </p>
                )}
                <TrickArea view={view} seat={seatOf(l)} land={landOf(l)} cardSize={trickSize} compact={!wide} tags={l.gallery} />
                {order.map((p, k) => {
                  const shown = view.others?.[`${p}`]?.[0] ?? undefined
                  if (!shown || (view.trick ?? []).some((t) => t.player === p)) return null
                  // A blind round: each opponent's card lies face up where they will play it; only yours is hidden.
                  return (
                    <PlayingCard
                      key={`shown-${p}`}
                      card={shown}
                      manilhas={view.manilhas}
                      size={trickSize === "lg" ? "md" : trickSize}
                      className="absolute -translate-x-1/2 -translate-y-1/2 rotate-2"
                      style={{ left: l.land[k].x, top: l.land[k].y }}
                    />
                  )
                })}
                <ul role="group" aria-label="Adversários">
                  {order.map((p, k) => (
                    <li
                      key={p}
                      className="absolute -translate-x-1/2 -translate-y-1/2"
                      style={{ left: l.seats[k].x, top: l.seats[k].y, width: l.plaque.w, height: l.plaque.h }}
                    >
                      <Seat
                        player={players[p]}
                        total={total}
                        active={view.turn === p && live}
                        phase={view.phase}
                        dealer={view.dealer === p}
                        level={game.levels?.[p] ? LEVEL_LABEL[game.levels[p]] : undefined}
                        narrow={l.plaque.w < 90}
                        mini={l.gallery}
                      />
                    </li>
                  ))}
                </ul>
              </>
            )
          }}
        </Felt>
      </div>

      {/* Your side of the table: the near rail, always under the thumb, above the safe area.
          The oval runs on behind it, and your hand fans up over its edge onto the felt. */}
      <section
        ref={dockRef}
        aria-label="Você"
        className={cn(
          "on-felt relative z-10 border-t-2 border-piping bg-[linear-gradient(to_bottom,var(--rail)_0,var(--rail-deep)_3.5rem)] text-rail-foreground shadow-[inset_0_1px_0_var(--rail-hi)]",
          wide
            ? // One fixed height in every phase: hands and cards rise over the rail, the bids sit beside them.
              "grid h-44 grid-cols-[17rem_minmax(0,1fr)] items-center gap-8 px-8"
            : "sticky bottom-0 flex flex-col items-center gap-3 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]",
        )}
      >
        {wide ? (
          <>
            <div>{mine}</div>
            <div className="flex h-full min-w-0 items-center justify-center gap-6">
              {(fan || hidden) && (
                <div
                  ref={handRef}
                  className="self-start"
                  style={{ marginTop: -FAN_RISE, width: fan ? `clamp(16rem, ${fanWidth(view.hand?.length ?? 0, handSize) + 8}px, ${bidding ? 16 : 28}rem)` : undefined }}
                >
                  {hand}
                  {hidden}
                </div>
              )}
              {/* Keyed by round so a stale choice from last round never carries over. */}
              {bidding && <BidPicker key={view.round} view={view} busy={busy} onBid={game.bid} inline />}
              {view.phase === Phase.PhaseRoundEnd && (
                <Button size="lg" onClick={() => setSummaryClosedRound(-1)}>
                  Ver placar da rodada
                </Button>
              )}
            </div>
          </>
        ) : (
          <>
            {fan ? (
              <div ref={handRef} className="w-full" style={{ marginTop: -FAN_RISE }}>
                {hand}
              </div>
            ) : !meOut ? (
              // No fan (between your last card and the next deal, or a blind round): the
              // same shape as with a hand (the fan's room, your plaque, the action), so the
              // dock keeps its height. A blind round holds up your hidden card in the fan's room.
              <div className="flex w-full flex-col items-center gap-2" style={{ marginTop: -FAN_RISE }}>
                <div className="flex w-full justify-center" style={{ height: CARD_H[handSize] + 20 }}>
                  {hidden && <PlayingCard unknown size={handSize} className="mt-3" />}
                </div>
                {mine}
                {blind && !bidding && (
                  <p className="max-w-xs text-center text-sm text-rail-muted">Rodada de 1 carta: você vê a carta dos outros, mas não a sua.</p>
                )}
                {view.phase === Phase.PhaseRoundEnd ? (
                  <Button size="lg" className="w-full max-w-xs" onClick={() => setSummaryClosedRound(-1)}>
                    Ver placar da rodada
                  </Button>
                ) : hidden && myTurn ? (
                  <Button size="lg" className="w-full max-w-xs" disabled={busy} onClick={game.playHidden}>
                    Jogar minha carta
                  </Button>
                ) : (
                  !bidding && <div className="h-13 w-full max-w-xs" aria-hidden />
                )}
              </div>
            ) : (
              <div className="w-full pt-3">
                {mine}
                {view.phase === Phase.PhaseRoundEnd && (
                  <Button className="mx-auto mt-2 flex" onClick={() => setSummaryClosedRound(-1)}>
                    Ver placar da rodada
                  </Button>
                )}
              </div>
            )}
            {bidding && <BidPicker key={view.round} view={view} busy={busy} onBid={game.bid} />}
          </>
        )}
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

function Status({
  view,
  meOut,
  hidden,
  summary,
  onSummary,
}: {
  view: PlayerView
  meOut: boolean
  hidden?: boolean
  /** Show the summary button here (phones); a desktop dock puts it in the middle. */
  summary: boolean
  onSummary: () => void
}) {
  const players = view.players ?? []
  const who = players[view.turn]?.name ?? ""
  const mine = view.turn === view.me && !meOut && (view.phase === Phase.PhaseBidding || view.phase === Phase.PhasePlaying)
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

  const caption = trickCaption(view)

  return (
    <div className={cn("flex min-h-11 flex-wrap items-center justify-center gap-x-3 gap-y-1", hidden && "sr-only")}>
      <div className="flex flex-col items-center text-center">
        <p role="status" className={cn(mine && "font-display text-2xl leading-none text-brass")}>
          {text}
        </p>
        <p className="text-sm text-rail-muted empty:hidden" aria-live="polite">
          {caption}
        </p>
      </div>
      {summary && view.phase === Phase.PhaseRoundEnd && <Button onClick={onSummary}>Ver placar da rodada</Button>}
    </div>
  )
}

function TableMenu({ onLeave, rules }: { onLeave: () => void; rules: Rules }) {
  const [open, setOpen] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const sound = useSound()
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) setConfirming(false)
      }}
    >
      <Button variant="outline" onClick={() => setOpen(true)}>
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
          <Button variant="outline" onClick={() => setSound(!sound)}>
            {sound ? "Desligar som e vibração" : "Ligar som e vibração"}
          </Button>
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
