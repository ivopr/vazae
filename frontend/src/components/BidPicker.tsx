import { useState } from "react"

import { Restricted, type PlayerView } from "../../bindings/vazae/game/models"
import { Button } from "@/components/ui/button"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

type Props = {
  view: PlayerView
  busy: boolean
  onBid: (n: number) => void
}

export function BidPicker({ view, busy, onBid }: Props) {
  const [choice, setChoice] = useState<string>("")
  const players = view.players ?? []
  const sum = players.reduce((s, p) => s + (p.bidded ? p.bid : 0), 0)
  const forbidden = view.forbidden
  const options = Array.from({ length: view.cards - view.minBid + 1 }, (_, i) => view.minBid + i)
  const blind = view.cards === 1 && view.rules.oneCard.blind
  const restrictedWho =
    view.rules.bidding.restricted === Restricted.RestrictDealer ? "Você deu as cartas" : "Você é o pé e palpita por último"
  const n = choice === "" ? null : Number(choice)

  return (
    <div className="panel flex w-full max-w-md flex-col gap-3 rounded-lg border border-border bg-card p-4 text-card-foreground">
      <div>
        <h2 className="font-slab text-xl font-bold">Quantas vazas você faz?</h2>
        <p className="text-sm text-muted-foreground">
          {blind
            ? "Rodada de 1 carta: você vê a dos outros, não a sua"
            : view.cards === 1
              ? "1 carta na mão"
              : `${view.cards} cartas na mão`}
          . Palpites até agora somam{" "}
          <b className="font-slab text-card-foreground">{sum}</b>.
        </p>
      </div>

      <ToggleGroup
        type="single"
        variant="outline"
        value={choice}
        onValueChange={setChoice}
        className="flex w-full flex-wrap gap-2"
        aria-label="Seu palpite"
      >
        {options.map((i) => (
          <ToggleGroupItem
            key={i}
            value={String(i)}
            disabled={i === forbidden}
            className="font-slab text-lg"
            aria-label={i === forbidden ? `${i}, proibido` : String(i)}
          >
            {i}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      {forbidden >= 0 && (
        <p className="text-sm text-muted-foreground">
          {restrictedWho}: <b className="text-card-foreground">{forbidden}</b> fecharia a soma em{" "}
          {view.cards}, então não vale.
        </p>
      )}

      <Button disabled={n === null || busy} onClick={() => n !== null && onBid(n)} className="self-start">
        {n === null ? "Escolha um número" : `Palpitar ${n}`}
      </Button>
    </div>
  )
}
