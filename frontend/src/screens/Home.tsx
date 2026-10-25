import { Rank, Suit } from "../../bindings/vazae/game/models"
import { Button } from "@/components/ui/button"
import { Chip } from "@/components/Chip"
import { Felt } from "@/components/Felt"
import { PlayingCard } from "@/components/PlayingCard"
import { RulesDialog } from "@/components/RulesDialog"
import { ThemeToggle } from "@/components/ThemeToggle"

export function Home({ onSolo }: { onSolo: () => void }) {
  return (
    <main className="on-room relative mx-auto flex min-h-full max-w-5xl flex-col px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] stage-sm:px-8">
      <div className="flex justify-end">
        <ThemeToggle />
      </div>

      <div className="flex flex-1 flex-col justify-center gap-6 py-4 stage-md:flex-row stage-md:items-center stage-md:justify-between stage-md:gap-12">
        <Table />

        <div className="flex w-full max-w-sm flex-col gap-3 self-center">
          <p className="text-lg">
            <span className="sr-only">Jogo de vazas com as cartas do truco. </span>
            Acerte quantas vazas faz, ou perde vida.
          </p>
          <Button size="lg" onClick={onSolo}>
            Jogar contra robôs
          </Button>
          {/* TODO: online rooms over WebSocket (phase 4 of the plan). */}
          <Button size="lg" variant="outline" disabled aria-describedby="online-soon">
            Jogar online
          </Button>
          <span id="online-soon" className="-mt-1 text-sm text-room-muted">
            Online chega em breve.
          </span>
          <RulesDialog trigger={<Button variant="outline">Como se joga</Button>} />
        </div>
      </div>
    </main>
  )
}

/** The empty table waiting under the lamp: the name in brass, a hand dealt, a few chips. */
function Table() {
  return (
    <div className="on-felt relative h-[24rem] w-full stage-md:h-[28rem] stage-md:max-w-lg">
      <Felt className="size-full" opponents={0} legend={{ top: "Jogo de vazas com as cartas do truco", bottom: "Último com vida leva a mesa" }}>
        {(l) => (
          <div className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-3" style={{ left: l.c.x, top: l.c.y }}>
            <h1 className="font-display text-[3.5rem] leading-[0.85] text-brass [text-shadow:0_2px_0_var(--felt-deep)] stage-md:text-[4.5rem]">
              Vazaê
            </h1>
            <div className="flex items-end gap-3" aria-hidden>
              <div className="flex -space-x-7">
                <PlayingCard card={{ rank: Rank.Four, suit: Suit.Clubs }} size="sm" className="-rotate-12" />
                <PlayingCard card={{ rank: Rank.Seven, suit: Suit.Hearts }} size="sm" className="translate-y-[-3px]" />
                <PlayingCard card={{ rank: Rank.Ace, suit: Suit.Spades }} size="sm" className="rotate-12" />
              </div>
              <div className="flex -space-x-2 text-felt-muted">
                <Chip className="size-7" />
                <Chip className="size-7" />
                <Chip lost className="size-7" />
              </div>
            </div>
          </div>
        )}
      </Felt>
    </div>
  )
}
