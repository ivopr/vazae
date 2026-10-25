import { Button } from "@/components/ui/button"
import { RulesDialog } from "@/components/RulesDialog"
import { ThemeToggle } from "@/components/ThemeToggle"

export function Home({ onSolo }: { onSolo: () => void }) {
  return (
    <main className="on-felt mx-auto flex min-h-full max-w-5xl flex-col px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] stage-sm:px-8">
      <div className="flex justify-end">
        <ThemeToggle />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-10 py-8 stage-md:flex-row stage-md:justify-between stage-md:gap-16">
        <Wordmark />

        <div className="flex w-full max-w-sm flex-col gap-3">
          <p className="text-lg text-felt-muted">Fodinha com as cartas do truco. Acerte quantas vazas faz, ou perde vida.</p>
          <Button size="lg" onClick={onSolo} autoFocus>
            Jogar contra robôs
          </Button>
          {/* TODO: online rooms over WebSocket (phase 4 of the plan). */}
          <Button size="lg" variant="outline" disabled aria-describedby="online-soon">
            Jogar online
          </Button>
          <span id="online-soon" className="-mt-1 text-sm text-felt-muted">
            Online chega em breve.
          </span>
          <RulesDialog trigger={<Button variant="outline">Como se joga</Button>} />
        </div>
      </div>
    </main>
  )
}

/** The name printed on a playing card, like the face of a deck box. */
function Wordmark() {
  return (
    <div
      className="relative grid h-64 w-44 -rotate-3 place-items-center rounded-lg border border-ink/25 bg-paper text-ink shadow-[0_2px_0_rgba(0,0,0,.25),0_18px_40px_-12px_rgba(0,0,0,.55)] stage-sm:h-80 stage-sm:w-56 stage-lg:h-96 stage-lg:w-64"
      role="img"
      aria-label="Vazaê"
    >
      <Corner className="top-2 left-2.5" />
      <Corner className="right-2.5 bottom-2 rotate-180" />
      <div className="flex flex-col items-center gap-2" aria-hidden>
        <span className="font-slab text-5xl font-bold tracking-tight stage-sm:text-6xl">Vazaê</span>
        <span className="flex gap-2 text-xl">
          <span className="text-suit-red">♦</span>
          <span>♠</span>
          <span className="text-suit-red">♥</span>
          <span>♣</span>
        </span>
      </div>
    </div>
  )
}

function Corner({ className }: { className: string }) {
  return (
    <span className={`absolute flex flex-col items-center font-slab text-xl leading-none font-bold ${className}`} aria-hidden>
      <span>V</span>
      <span className="text-suit-red">♥</span>
    </span>
  )
}
