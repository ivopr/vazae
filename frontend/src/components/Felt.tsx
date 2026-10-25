import { useId, useLayoutEffect, useRef, useState, type ReactNode } from "react"

import { layout, type Layout } from "@/lib/seating"
import { cn } from "@/lib/utils"

type Props = {
  /** Opponents at the table, not counting you. */
  opponents: number
  /** A desktop table: bigger plaques around a landscape oval. */
  wide?: boolean
  /** The trick's card size, so cards land clear of the VIRA box and the plaques. */
  card?: { w: number; h: number }
  /** The oval runs on below, behind the dock, which becomes its near rail. */
  open?: boolean
  /** How much of the felt's bottom your fanned hand covers. */
  near?: number
  /** Where your fanned hand sits, in page coordinates [left, right]; the felt converts it. */
  nearSpan?: [number, number]
  /** Whether any card lies on the felt. */
  cardsOut?: boolean
  /** Printed along the legend ring: across the far side, the near side, or either near quarter. */
  legend?: { top?: string; bottom?: string; left?: string; right?: string }
  children: (l: Layout) => ReactNode
  className?: string
}

/** A stretch of the legend ring between two screen angles, drawn anticlockwise so its text stands upright. */
function arc(l: Layout, from: number, to: number) {
  const at = (a: number) => `${l.c.x + l.lx * Math.cos((a * Math.PI) / 180)} ${l.c.y + l.ly * Math.sin((a * Math.PI) / 180)}`
  return `M ${at(from)} A ${l.lx} ${l.ly} 0 0 0 ${at(to)}`
}

/**
 * The oval table seen from your seat: burgundy lacquer rail with brass piping, baize
 * under one lamp, and the house legend printed in old gold, the way a casino table
 * prints its rules. Everything on it is placed from the measured layout.
 */
export function Felt({ opponents, wide, card, open, near, nearSpan, cardsOut, legend = {}, children, className }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState<{ w: number; h: number } | null>(null)
  const id = useId().replace(/:/g, "")

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Page coordinates to the felt's own: the desktop stage is scaled as a whole.
  const box = ref.current?.getBoundingClientRect()
  const k = box && ref.current?.offsetWidth ? box.width / ref.current.offsetWidth : 1
  const span: [number, number] | undefined = nearSpan && box && [(nearSpan[0] - box.left) / k, (nearSpan[1] - box.left) / k]
  const l = size && size.w > 0 && size.h > 0 ? layout(size.w, size.h, opponents, { wide, card, open, near, nearSpan: span, cardsOut }) : null

  return (
    <div ref={ref} className={cn("relative", className)}>
      {l && (
        <>
          <svg className="pointer-events-none absolute inset-0 size-full overflow-visible" aria-hidden>
            <defs>
              <radialGradient id={`lamp-${id}`} cx="50%" cy="46%" r="62%">
                <stop offset="0%" stopColor="var(--felt-lamp)" />
                <stop offset="55%" stopColor="var(--felt)" />
                <stop offset="100%" stopColor="var(--felt-deep)" />
              </radialGradient>
              <linearGradient id={`lacquer-${id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--rail-hi)" />
                <stop offset="45%" stopColor="var(--rail)" />
                <stop offset="100%" stopColor="var(--rail-deep)" />
              </linearGradient>
              {/* The nap of the cloth: fine noise, kept faint so text on it stays clean. */}
              <filter id={`nap-${id}`} x="0" y="0" width="100%" height="100%">
                <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="7" />
                <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.22 0" />
                <feComposite in2="SourceGraphic" operator="in" />
              </filter>
              {/* The near quarters, below the side seats and above your hand (see legendArcs). */}
              {l.arcs && <path id={`left-${id}`} d={arc(l, ...l.arcs.left)} />}
              {l.arcs && <path id={`right-${id}`} d={arc(l, ...l.arcs.right)} />}
              <path
                id={`top-${id}`}
                d={`M ${l.c.x - l.lx} ${l.c.y} A ${l.lx} ${l.ly} 0 0 1 ${l.c.x + l.lx} ${l.c.y}`}
              />
              <path
                id={`bottom-${id}`}
                d={`M ${l.c.x - l.lx} ${l.c.y} A ${l.lx} ${l.ly} 0 0 0 ${l.c.x + l.lx} ${l.c.y}`}
              />
            </defs>

            {/* Rail: a lacquered band whose centre line carries the plaques. */}
            <ellipse cx={l.c.x} cy={l.c.y} rx={l.rx + 2} ry={l.ry + 2} fill="none" stroke="var(--rail-deep)" strokeWidth="26" />
            <ellipse cx={l.c.x} cy={l.c.y} rx={l.rx} ry={l.ry} fill="none" stroke={`url(#lacquer-${id})`} strokeWidth="22" />
            <ellipse cx={l.c.x} cy={l.c.y} rx={l.rx + 6} ry={l.ry + 6} fill="none" stroke="var(--rail-hi)" strokeWidth="1" opacity=".7" />
            {/* Felt, lamp-lit in the middle, with its nap. */}
            <ellipse cx={l.c.x} cy={l.c.y} rx={l.rx - 11} ry={l.ry - 11} fill={`url(#lamp-${id})`} />
            <ellipse cx={l.c.x} cy={l.c.y} rx={l.rx - 11} ry={l.ry - 11} fill="var(--felt)" filter={`url(#nap-${id})`} />
            {/* Brass piping where the rail meets the cloth. */}
            <ellipse cx={l.c.x} cy={l.c.y} rx={l.rx - 11} ry={l.ry - 11} fill="none" stroke="var(--piping)" strokeWidth="1.5" />

            {/* The printed ring, with the house legend set along it. */}
            <ellipse cx={l.c.x} cy={l.c.y} rx={l.lx + 10} ry={l.ly + 10} fill="none" stroke="var(--felt-print)" strokeWidth=".9" opacity=".55" />
            <ellipse cx={l.c.x} cy={l.c.y} rx={l.lx + 13} ry={l.ly + 13} fill="none" stroke="var(--felt-print)" strokeWidth=".6" opacity=".4" />
            {(["top", "bottom", "left", "right"] as const).map(
              (k) =>
                legend[k] &&
                (k === "top" || k === "bottom" || l.arcs) && (
                  <text key={k} className="fill-felt-print font-sans text-[9.5px] font-bold tracking-[0.1em] uppercase">
                    {/* The near quarters print their text at the low end, by your hand: the left arc
                        runs down toward you, the right one up from you. */}
                    <textPath
                      href={`#${k}-${id}`}
                      startOffset={k === "left" ? "100%" : k === "right" ? "0%" : "50%"}
                      textAnchor={k === "left" ? "end" : k === "right" ? "start" : "middle"}
                    >
                      {legend[k]}
                    </textPath>
                  </text>
                ),
            )}
          </svg>
          {children(l)}
        </>
      )}
    </div>
  )
}
