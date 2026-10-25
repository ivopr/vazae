import { Suit } from "../../bindings/vazae/game/models"
import { cn } from "@/lib/utils"

// Drawn pips, so every card prints the same shapes whatever fonts the device has.
const PATHS: Record<number, React.ReactNode> = {
  [Suit.Diamonds]: <path d="M12 1.5 20.5 12 12 22.5 3.5 12z" />,
  [Suit.Hearts]: (
    <path d="M12 21.5S2.2 15.4 1.6 9.3C1.2 5.5 3.8 2.8 7 2.8c2.3 0 3.9 1.3 5 3.1 1.1-1.8 2.7-3.1 5-3.1 3.2 0 5.8 2.7 5.4 6.5-.6 6.1-10.4 12.2-10.4 12.2z" />
  ),
  [Suit.Spades]: (
    <path d="M12 1.5C10.2 5 2.3 9 2.3 14.2a4.9 4.9 0 0 0 8.4 3.4l-1.3 4.9h5.2l-1.3-4.9a4.9 4.9 0 0 0 8.4-3.4C21.7 9 13.8 5 12 1.5z" />
  ),
  [Suit.Clubs]: (
    <>
      <circle cx="12" cy="6.6" r="4.6" />
      <circle cx="6.4" cy="13.8" r="4.6" />
      <circle cx="17.6" cy="13.8" r="4.6" />
      <path d="M10.6 11h2.8l1.4 11.5H9.2z" />
    </>
  ),
}

export function SuitIcon({ suit, className }: { suit: Suit; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={cn("size-[1em] shrink-0", className)} aria-hidden>
      {PATHS[suit]}
    </svg>
  )
}

const GLYPH_SUIT: Record<string, Suit> = { "♦": Suit.Diamonds, "♠": Suit.Spades, "♥": Suit.Hearts, "♣": Suit.Clubs }
const SUIT_NAME: Record<string, string> = { "♦": "ouros", "♠": "espadas", "♥": "copas", "♣": "paus" }

/**
 * Text that names suits with ♦♠♥♣ (rule prose, card labels), printed with the drawn
 * pips instead of whatever the device's font makes of the glyphs. Red suits stay red
 * wherever they appear; screen readers hear the suit's name.
 */
export function WithSuits({ text }: { text: string }) {
  return (
    <>
      {text.split(/([♦♠♥♣])/).map((part, i) => {
        const suit = GLYPH_SUIT[part]
        if (suit === undefined) return part
        const red = suit === Suit.Diamonds || suit === Suit.Hearts
        return (
          <span key={i} className={cn("inline-flex align-[-0.1em]", red && "text-suit-red")}>
            <SuitIcon suit={suit} className="size-[0.9em]" />
            <span className="sr-only"> de {SUIT_NAME[part]}</span>
          </span>
        )
      })}
    </>
  )
}
