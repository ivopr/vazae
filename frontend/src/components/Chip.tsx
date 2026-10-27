import { useEffect, useRef } from "react"

import { cn } from "@/lib/utils"

// Chips lie in rows of this many; more lives start another row, half tucked under the first.
const PER_ROW = 5

// Six ivory inlays around the edge, like the house chips of an old salon.
const INLAYS = [0, 60, 120, 180, 240, 300]

type Size = "sm" | "md"
const SIZE: Record<Size, string> = { sm: "size-4", md: "size-5" }

/**
 * One life: a clay chip seen from above, with inlays on its edge and a lozenge in
 * the middle. A lost life leaves its place behind as a dashed ring; while it is
 * being lost the chip slides off toward the bank and the ring fades in under it.
 * The two read apart by outline, not only by colour.
 */
export function Chip({
  lost,
  slide,
  delay = 0,
  size = "md",
  className,
}: {
  lost?: boolean
  slide?: boolean
  delay?: number
  size?: Size
  className?: string
}) {
  const timing = { animationDelay: `${delay}ms` }
  return (
    <svg viewBox="0 0 24 24" className={cn(SIZE[size], "shrink-0 overflow-visible", className)} aria-hidden>
      {lost && (
        <g
          className={cn("text-muted-foreground", slide && "motion-safe:animate-[ring-in_520ms_both]")}
          style={slide ? timing : undefined}
        >
          <circle cx="12" cy="12" r="10.2" fill="none" stroke="currentColor" strokeWidth="1.4" strokeDasharray="2.4 2" />
          <circle cx="12" cy="12" r="2" fill="currentColor" opacity=".55" />
        </g>
      )}
      {(!lost || slide) && (
        <g
          className={cn(slide && "animate-[chip-slide_520ms_cubic-bezier(.3,.7,.2,1)_both] [transform-box:fill-box] [transform-origin:center]")}
          style={slide ? timing : undefined}
        >
          <circle cx="12" cy="12" r="11" fill="var(--chip)" stroke="var(--chip-rim)" strokeWidth=".8" />
          {INLAYS.map((a) => (
            <rect key={a} x="10.3" y="1.1" width="3.4" height="3.4" rx=".5" fill="var(--chip-inlay)" transform={`rotate(${a} 12 12)`} />
          ))}
          <circle cx="12" cy="12" r="7.2" fill="none" stroke="var(--chip-inlay)" strokeWidth=".7" opacity=".8" />
          <path d="M12 8.4 15.6 12 12 15.6 8.4 12z" fill="var(--chip-inlay)" opacity=".9" />
        </g>
      )}
    </svg>
  )
}

type Props = {
  lives: number
  /** Lives at the start of the match: lost chips leave their ring on the table. */
  total: number
  /** Lives to animate from (e.g. before this round); defaults to the last render's. */
  from?: number
  size?: Size
  /** Pile the chips tighter, for one-line plaques where the name needs the room. */
  dense?: boolean
  /** Always one chip with the lives left and nothing else, for the smallest plaques. */
  tally?: boolean
  className?: string
}

/** Lives as chips in front of the player; a lost one slides to the bank and leaves its ring. */
export function Chips({ lives, total, from, size = "md", dense, tally, className }: Props) {
  const prev = useRef(from ?? lives)
  const start = from ?? prev.current
  useEffect(() => {
    prev.current = lives
  }, [lives])

  const label = lives <= 0 ? "Fora" : lives === 1 ? "1 vida" : `${lives} vidas`
  const count = Math.max(total, lives)
  const lost = count - Math.max(lives, 0)

  // A one-line plaque has no room for a pile taller than a row: one chip with the
  // lives left, one ring with the lives lost. Nothing lost disappears, except on a
  // tally, whose plaque shows only what is left (the round summary keeps the rest).
  if ((dense && count > PER_ROW) || tally) {
    return (
      <span className={cn("inline-flex items-center gap-0.5 text-sm leading-none font-bold", className)} role="img" aria-label={label}>
        {lives > 0 ? (
          <>
            <Chip size={size} />
            <span aria-hidden>{lives}</span>
          </>
        ) : (
          <span aria-hidden>Fora</span>
        )}
        {lost > 0 && !tally && (
          <>
            <Chip lost size={size} className="ml-1" />
            <span className="text-muted-foreground" aria-hidden>
              {lost}
            </span>
          </>
        )}
      </span>
    )
  }
  const rows = Array.from({ length: Math.ceil(count / PER_ROW) }, (_, r) =>
    Array.from({ length: Math.min(PER_ROW, count - r * PER_ROW) }, (_, k) => r * PER_ROW + k),
  )

  return (
    <span className={cn("inline-flex items-center gap-1", className)} role="img" aria-label={label}>
      <span className="flex flex-col">
        {rows.map((row, r) => (
          // Small chips overlap like a little pile, so five fit a plaque.
          <span key={r} className={cn("flex", dense ? "-space-x-1" : size === "sm" ? "gap-px" : "gap-0.5", r > 0 && (size === "sm" ? "-mt-2" : "-mt-2.5"))}>
            {row.map((i) => {
              const gone = i >= lives
              return <Chip key={i} lost={gone} slide={gone && i < start} delay={(start - 1 - i) * 140} size={size} />
            })}
          </span>
        ))}
      </span>
      {lives <= 0 ? (
        <span className="text-sm font-bold" aria-hidden>
          Fora
        </span>
      ) : (
        // Past one row a pile can't be counted at a glance; the chips stay, a numeral says how many are left.
        count > PER_ROW && (
          <span className="text-sm leading-none font-bold" aria-hidden>
            {lives}
          </span>
        )
      )}
    </span>
  )
}
