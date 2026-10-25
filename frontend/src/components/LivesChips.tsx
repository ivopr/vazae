import { cn } from "@/lib/utils"

const SUITS = ["♦", "♠", "♥", "♣"]
// Past 5 a row of chips crowds the seats around the table; a count reads better.
const MAX_CHIPS = 5

// Paper chip like a card, so the suits take the card colors in both themes.
const CHIP = "grid size-5 place-items-center rounded-full border border-ink/40 bg-paper text-[13px] leading-none"
const suitColor = (s: string) => (s === "♦" || s === "♥" ? "text-suit-red" : "text-ink")

/** Lives as round chips stamped with the suits; past MAX_CHIPS only the number shows. */
export function LivesChips({ lives, className }: { lives: number; className?: string }) {
  const label = lives === 1 ? "1 vida" : `${lives} vidas`
  if (lives <= 0) {
    return <span className={cn("text-sm font-bold", className)}>Fora</span>
  }
  return (
    <span className={cn("inline-flex items-center gap-1", className)} role="img" aria-label={label}>
      {lives <= MAX_CHIPS ? (
        Array.from({ length: lives }, (_, i) => (
          <span key={i} className={cn(CHIP, suitColor(SUITS[i % 4]))} aria-hidden>
            {SUITS[i % 4]}
          </span>
        ))
      ) : (
        <span className={cn(CHIP, "text-ink")} aria-hidden>
          ♣
        </span>
      )}
      {lives > MAX_CHIPS && (
        <span className="font-slab text-sm font-bold" aria-hidden>
          ×{lives}
        </span>
      )}
    </span>
  )
}
