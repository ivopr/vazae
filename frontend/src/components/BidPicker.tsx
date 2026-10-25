import { useState } from "react"

import { Restricted, type PlayerView } from "../../bindings/vazae/game/models"
import { Button } from "@/components/ui/button"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { cn } from "@/lib/utils"

type Props = {
  view: PlayerView
  busy: boolean
  onBid: (n: number) => void
  /**
   * A desktop dock that never grows: the chips and the confirm button share one row
   * (the chips scroll sideways if there are many), the notes share one small paragraph.
   */
  inline?: boolean
}

/** The bid row on the near rail: one round chip per number, the chosen one set down in clay. */
export function BidPicker({ view, busy, onBid, inline }: Props) {
  const [choice, setChoice] = useState<string>("")
  const players = view.players ?? []
  const sum = players.reduce((s, p) => s + (p.bidded ? p.bid : 0), 0)
  const forbidden = view.forbidden
  const options = Array.from({ length: view.cards - view.minBid + 1 }, (_, i) => view.minBid + i)
  const blind = view.cards === 1 && view.rules.oneCard.blind
  const restrictedWho =
    view.rules.bidding.restricted === Restricted.RestrictDealer ? "Você deu as cartas" : "Você é o pé e palpita por último"
  const n = choice === "" ? null : Number(choice)

  const hint = (
    <>
      {blind
        ? "Rodada de 1 carta: você vê a dos outros, não a sua"
        : view.cards === 1
          ? "1 carta na mão"
          : `${view.cards} cartas na mão`}
      . Palpites até agora somam <b className="text-base text-rail-foreground">{sum}</b>.
    </>
  )
  const restriction = forbidden >= 0 && (
    <>
      {restrictedWho}: <b className="text-rail-foreground">{forbidden}</b> fecharia a soma em {view.cards}, então não vale.
    </>
  )
  const chips = (
    <ToggleGroup
      type="single"
      variant="chip"
      size={inline ? "chipSm" : "chip"}
      value={choice}
      onValueChange={setChoice}
      className={cn("flex gap-2", inline ? "min-w-0 flex-nowrap overflow-x-auto p-1" : "w-full flex-wrap justify-center")}
      aria-label="Seu palpite"
    >
      {options.map((i) => (
        <ToggleGroupItem
          key={i}
          value={String(i)}
          disabled={i === forbidden}
          // A forbidden bid is struck through (the chip variant), so it reads as barred without colour.
          aria-label={i === forbidden ? `${i}, proibido` : String(i)}
        >
          {i}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
  const confirm = (
    <Button size="lg" disabled={n === null || busy} onClick={() => n !== null && onBid(n)} className={inline ? "shrink-0 px-5" : "w-full"}>
      {n === null ? "Escolha um número" : `Palpitar ${n}`}
    </Button>
  )

  if (inline) {
    return (
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div>
          <h2 className="font-display text-xl leading-none text-brass">Quantas vazas você faz?</h2>
          <p className="mt-1 text-xs leading-snug text-rail-muted">
            {hint} {restriction}
          </p>
        </div>
        <div className="flex min-w-0 items-center gap-3">
          {chips}
          {confirm}
        </div>
      </div>
    )
  }

  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <div className="text-center">
        <h2 className="font-display text-[1.5rem] leading-none text-brass">Quantas vazas você faz?</h2>
        <p className="mt-1.5 text-sm text-rail-muted">{hint}</p>
      </div>
      {chips}
      {restriction && <p className="text-center text-sm text-rail-muted">{restriction}</p>}
      {confirm}
    </div>
  )
}
