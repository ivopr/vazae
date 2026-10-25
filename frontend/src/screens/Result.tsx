import type { PlayerView } from "../../bindings/vazae/game/models"
import { Button } from "@/components/ui/button"
import { LivesChips } from "@/components/LivesChips"
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
    <main className="on-felt mx-auto flex min-h-full max-w-md flex-col justify-center gap-6 px-4 py-[max(1.5rem,env(safe-area-inset-top))]">
      <div className="flex flex-col gap-1">
        <p className="text-felt-muted">Fim de partida, {view.round + 1} rodadas</p>
        <h1 className="font-slab text-4xl font-bold stage-sm:text-5xl">{headline}</h1>
      </div>

      <ol className="panel flex flex-col divide-y divide-border rounded-lg border border-border bg-card text-card-foreground" aria-label="Classificação">
        {ranking.map(({ p, i }, pos) => (
          <li key={i} className={cn("flex items-center gap-3 px-4 py-3", i === view.me && "font-bold")}>
            <span className="w-6 font-slab text-xl font-bold">{top(i) ? 1 : pos + 1}º</span>
            <span className="flex-1 truncate">{p.name}</span>
            <LivesChips lives={p.lives} />
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap gap-2">
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
