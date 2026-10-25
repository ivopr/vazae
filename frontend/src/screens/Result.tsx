import type { PlayerView } from "../../bindings/vazae/game/models"
import { Button } from "@/components/ui/button"
import { Chips } from "@/components/Chip"
import { cn } from "@/lib/utils"

type Props = {
  view: PlayerView
  busy: boolean
  onAgain: () => void
  onHome: () => void
}

export function Result({ view, busy, onAgain, onHome }: Props) {
  const players = view.players ?? []
  const winner = players[view.winner]
  const iWon = view.winner === view.me
  const winners = view.winners ?? []
  const total = view.rules.players.lives
  const top = (i: number) => (winners.includes(i) ? 1 : 0)
  const ranking = players
    .map((p, i) => ({ p, i }))
    .sort((a, b) => top(b.i) - top(a.i) || b.p.lives - a.p.lives)
  const nameOf = (i: number) => (i === view.me ? "você" : players[i]?.name ?? "")
  const headline =
    view.winner < 0 && winners.length > 1
      ? `Empate entre ${winners.slice(0, -1).map(nameOf).join(", ")} e ${nameOf(winners[winners.length - 1])}.`
      : iWon
        ? "Você ganhou a mesa."
        : `${winner?.name ?? "Ninguém"} ganhou.`

  return (
    <main className="on-room mx-auto flex min-h-full max-w-md flex-col justify-center gap-6 px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-5xl leading-[0.95] text-balance text-marquee stage-sm:text-6xl">{headline}</h1>
        <p className="text-room-muted">Fim de partida, {view.round + 1} rodadas</p>
      </div>

      {/* The croupier's final tally, in the house frame. */}
      <ol
        className="panel deco-frame flex flex-col rounded-lg bg-card px-5 py-1 text-card-foreground"
        aria-label="Classificação"
      >
        {ranking.map(({ p, i }, pos) => (
          <li
            key={i}
            className={cn("flex items-center gap-3 border-b border-dashed border-border py-3 last:border-b-0", i === view.me && "font-bold")}
          >
            <span className="w-8 text-2xl leading-none font-bold">{top(i) ? 1 : pos + 1}º</span>
            <span className="min-w-0 flex-1 truncate">{p.name}</span>
            <Chips lives={p.lives} total={total} />
          </li>
        ))}
      </ol>

      <div className="flex flex-col gap-2 stage-sm:flex-row">
        <Button size="lg" onClick={onAgain} disabled={busy} autoFocus>
          Jogar de novo
        </Button>
        <Button size="lg" variant="outline" onClick={onHome}>
          Voltar ao início
        </Button>
      </div>
    </main>
  )
}
