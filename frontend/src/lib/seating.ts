export type Pt = { x: number; y: number }

type Size = { w: number; h: number }

export type Layout = {
  w: number
  h: number
  /** Centre of the oval. On an open table it sits low, the near rail running behind the dock. */
  c: Pt
  /** Radii of the rail's centre line, where the plaques sit. */
  rx: number
  ry: number
  /** Radii of the printed legend ring, inside the plaques. */
  lx: number
  ly: number
  /** The middle of the felt you can see, where the trick gathers. */
  mid: Pt
  /** Opponents' plaques, in play order from your left, over the far rail to your right. */
  seats: Pt[]
  /** Where each opponent's card lands, in front of their plaque. */
  land: Pt[]
  /** Your place on the near rail, and where your card lands. */
  me: Pt
  meLand: Pt
  /** The printed VIRA box, and whether it lies flat (card beside the label). */
  vira: Pt
  viraFlat: boolean
  /**
   * The near quarters of the legend ring the house legend is printed on, as screen
   * angles [from, to]: below the side seats and above your hand. Null when that stretch
   * is too short for the legend, which is then printed straight under the VIRA box.
   */
  arcs: { left: [number, number]; right: [number, number] } | null
  /** Where the legend is printed when there are no arcs for it. */
  legend: Pt
  plaque: Size
}

type Options = {
  /** A desktop table: bigger plaques around a landscape oval. */
  wide?: boolean
  /** The trick's card size, its name label included. */
  card?: Size
  /** The oval runs on below the felt, behind the dock, which becomes the near rail. */
  open?: boolean
  /** How much of the felt's bottom edge your fanned hand covers. */
  near?: number
  /** Where your fanned hand sits across the felt, [left, right], so the legend arcs stop short of it. */
  nearSpan?: [number, number]
  /** Whether any card lies on the felt; with none, no card can be pushed off its path. */
  cardsOut?: boolean
}

const DEG = Math.PI / 180

// The printed VIRA box (PlayingCard sm, label and manilha line), with a little air.
// On a phone the box lies flat, card beside its label, to leave the far seats room.
const VIRA_TALL = { w: 76, h: 114 }
const VIRA_FLAT = { w: 108, h: 84 }
// The straight legend a crowded table prints under the VIRA box.
const LEGEND = { w: 150, h: 34 }

/**
 * Angles round the oval for each opponent, in screen degrees (0 is your right, 270
 * straight across). A few sit across the far rail; a crowd wraps down both sides.
 */
function angles(m: number, wide: boolean): number[] {
  if (m <= 0) return []
  if (m === 1) return [270]
  // On a phone three opponents sit higher up the oval, leaving the near quarters to the legend.
  const three = wide ? [202, 338] : [220, 320]
  const [from, to] = m === 2 ? [228, 312] : m === 3 ? three : m === 4 ? [190, 350] : [164, 376]
  return Array.from({ length: m }, (_, k) => from + ((to - from) * k) / (m - 1))
}

const lerp = (a: Pt, b: Pt, t: number): Pt => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t })

// The longest legend ("Palpites somam 10 de 10") at its printed size (9.5px, Felt.tsx).
export const ARC_MIN = 150

/** Whether two boxes of the given sizes, centred at a and b, stay apart (with a gap). */
const apart = (a: Pt, as: Size, b: Pt, bs: Size, gap = 4) =>
  Math.abs(a.x - b.x) >= (as.w + bs.w) / 2 + gap || Math.abs(a.y - b.y) >= (as.h + bs.h) / 2 + gap

const asinDeg = (v: number) => (Math.asin(Math.max(-1, Math.min(1, v))) * 180) / Math.PI

/** Length of the legend ring between two screen angles, measured in short steps. */
function arcLength(c: Pt, lx: number, ly: number, from: number, to: number) {
  let len = 0
  const n = 24
  for (let k = 0; k < n; k++) {
    const a = ((from + ((to - from) * k) / n) * Math.PI) / 180
    const b = ((from + ((to - from) * (k + 1)) / n) * Math.PI) / 180
    len += Math.hypot(lx * (Math.cos(b) - Math.cos(a)), ly * (Math.sin(b) - Math.sin(a)))
  }
  return len
}

/** The near quarters of the legend ring that no plaque and no hand covers, if they are long enough. */
function legendArcs(c: Pt, lx: number, ly: number, seats: Pt[], plaque: Size, h: number, hand: { span: [number, number]; h: number }) {
  // The lowest plaque bottom on each side, among seats out over the legend ring.
  const below = (side: -1 | 1) =>
    seats
      .filter((s) => (s.x - c.x) * side > lx * 0.4)
      .reduce((y, s) => Math.max(y, s.y + plaque.h / 2 + 10), c.y - ly * 0.35)
  // Down the ring toward you until a glyph would meet your fanned hand or the felt's edge.
  let low = 0
  for (let a = 0; a <= 89; a++) {
    const p = { x: c.x + lx * Math.cos((a * Math.PI) / 180), y: c.y + ly * Math.sin((a * Math.PI) / 180) }
    const inHand = (x: number) => x > hand.span[0] - 14 && x < hand.span[1] + 14 && p.y > h - hand.h - 14
    const mirror = 2 * c.x - p.x
    // Both arcs end at the same angle, so check the left one's point too.
    if (inHand(p.x) || inHand(mirror) || p.y > h - 14) break
    low = a
  }
  const left: [number, number] = [180 - asinDeg((below(-1) - c.y) / ly), 180 - low]
  const right: [number, number] = [low, asinDeg((below(1) - c.y) / ly)]
  const long = (r: [number, number]) => r[0] > r[1] && arcLength(c, lx, ly, r[0], r[1]) >= ARC_MIN
  return long(left) && long(right) ? { left, right } : null
}

/** The table laid out for a felt of w×h with m opponents. */
export function layout(w: number, h: number, m: number, opts: Options = {}): Layout {
  const { wide = false, card = { w: 64, h: 124 }, open = false } = opts
  const VIRA = wide ? VIRA_TALL : VIRA_FLAT
  // Keep a little felt clear above the dock's edge even with no hand fanned over it.
  const near = Math.max(opts.near ?? 0, open ? 12 : 0)
  const plaque = m === 0 ? { w: 0, h: 0 } : wide ? { w: 148, h: 72 } : m >= 5 ? { w: 84, h: 64 } : { w: 96, h: 64 }
  // With no plaques to straddle it, the rail still keeps clear of the edge.
  const edge = m === 0 ? 16 : 4
  const rx = Math.max(60, w / 2 - plaque.w / 2 - edge)
  const top = plaque.h / 2 + edge / 2
  const bottom = open ? h + 40 : h - plaque.h / 2 - edge / 2
  const c = { x: w / 2, y: (top + bottom) / 2 }
  const ry = Math.max(80, (bottom - top) / 2)
  const seats = angles(m, wide).map((a) => ({ x: c.x + rx * Math.cos(a * DEG), y: c.y + ry * Math.sin(a * DEG) }))

  // The felt you can see runs from the far rail down to your hand.
  const mid = { x: c.x, y: (top + plaque.h / 2 + h - near) / 2 }
  // On a wide table the vira sits left of the middle, where no seat sends a card; on a
  // phone it takes the middle, a little low, under the far seats' cards.
  const vira = wide ? { x: mid.x - rx * 0.24, y: mid.y + 10 } : { x: mid.x, y: mid.y + 12 }

  const lx = rx - 24
  const ly = ry - plaque.h / 2 - 12
  // The fan rises highest in the middle; out at the near quarters it covers about half as much.
  let arcs = open && m > 0 ? legendArcs(c, lx, ly, seats, plaque, h, { span: opts.nearSpan ?? [c.x, c.x], h: near }) : null
  const legend = { x: vira.x, y: vira.y + VIRA.h / 2 + LEGEND.h / 2 + 2 }

  // Each card lands at the first spot that covers nothing: no plaque, not the VIRA box,
  // not the straight legend, not a card already down. Spots are tried along the line from
  // the seat toward the middle (nearest the usual reach first), then tucked under the
  // plaque on its inner side, which is where a narrow phone has room.
  const reach = wide ? 0.4 : m >= 4 ? 0.36 : 0.42
  const clampX = (x: number) => Math.max(card.w / 2, Math.min(w - card.w / 2, x))
  // A glyph of the 9.5px legend, with a little air.
  const ARC_BOX = { w: 12, h: 12 }
  // Every spot on the cloth where a card fits, on a 12px grid.
  const feltSpots: Pt[] = []
  for (let y = card.h / 2; y <= h - near - card.h / 2 + 24; y += 12) {
    for (let x = card.w / 2; x <= w - card.w / 2; x += 12) {
      if (((x - c.x) / (rx - 11)) ** 2 + ((y - c.y) / (ry - 11)) ** 2 <= 1) feltSpots.push({ x, y })
    }
  }
  // Your card first: straight in front of you, above your hand (or below the vira
  // when the felt is short). Everyone else's card works around it.
  const meLand = { x: mid.x, y: Math.min(h - near - card.h / 2 - 6, h - card.h / 2) }
  if (!apart(meLand, card, vira, VIRA)) meLand.y = vira.y + (VIRA.h + card.h) / 2 + 4

  /** Places every opponent's card; `strayed` when one had to go off its own paths. */
  const place = (withArcs: typeof arcs) => {
    // The legend arcs, as a string of small boxes along the middle stretch the centred text covers.
    const arcBoxes: Pt[] = []
    if (withArcs) {
      // The text sits at each arc's low end, by your hand (see Felt), so only that stretch is taken.
      for (const [from, to, atEnd] of [
        [...withArcs.left, true],
        [...withArcs.right, false],
      ] as const) {
        const f = Math.min(1, ARC_MIN / arcLength(c, lx, ly, from, to))
        const start = atEnd ? 1 - f : 0
        for (let k = 0; k <= 8; k++) {
          const a = ((from + (to - from) * (start + (f * k) / 8)) * Math.PI) / 180
          arcBoxes.push({ x: c.x + (lx - 5) * Math.cos(a), y: c.y + (ly - 5) * Math.sin(a) })
        }
      }
    }
    // Plaques get a wider berth: a card lies a few degrees askew.
    const free = (p: Pt, placed: Pt[]) =>
      seats.every((q) => apart(p, card, q, plaque, 8)) &&
      arcBoxes.every((q) => apart(p, card, q, ARC_BOX, 0)) &&
      apart(p, card, vira, VIRA) &&
      (withArcs !== null || apart(p, card, legend, LEGEND)) &&
      placed.every((q) => apart(p, card, q, card)) &&
      p.y - card.h / 2 >= 0 &&
      p.y + card.h / 2 <= h - near + 24
    const land: Pt[] = new Array(seats.length)
    const placed: Pt[] = [meLand]
    let strayed = false
    // Seats across the table go first: they have the least room, the side seats can
    // tuck a card under their plaque.
    const order = seats.map((_, i) => i).sort((a, b) => Math.abs(seats[a].x - c.x) - Math.abs(seats[b].x - c.x))
    for (const i of order) {
      const s = seats[i]
      // Seats low on the sides send their card straight across, not up toward the middle.
      const to = { x: mid.x, y: Math.max(mid.y, s.y) }
      const along: Pt[] = []
      for (let d = 0; d <= 0.45; d += 0.03) {
        if (reach + d <= 0.85) along.push(lerp(s, to, reach + d))
        if (d > 0 && reach - d >= 0.15) along.push(lerp(s, to, reach - d))
      }
      const under = s.y + (plaque.h + card.h) / 2 + 8
      const inward = s.x < c.x ? 1 : -1
      const tucked = [
        { x: clampX(s.x + (inward * (plaque.w - card.w)) / 2), y: under },
        { x: clampX(s.x), y: under },
        { x: clampX(s.x + (inward * (plaque.w + card.w)) / 2), y: under },
        { x: clampX(s.x - (inward * (plaque.w - card.w)) / 2), y: under },
      ]
      const usual = lerp(s, to, reach)
      const own = [...along, ...tucked].find((p) => free(p, placed))
      if (!own) strayed = true
      land[i] =
        own ??
        // Nothing on its own paths: the nearest free spot anywhere on the felt.
        feltSpots.sort((a, b) => Math.hypot(a.x - usual.x, a.y - usual.y) - Math.hypot(b.x - usual.x, b.y - usual.y)).find((p) => free(p, placed)) ??
        usual
      placed.push(land[i])
    }
    return { land, strayed }
  }

  // The legend gives way before a card does: if the arcs push any card off its own
  // paths, the legend is printed straight under the VIRA box instead.
  const first = place(arcs)
  let land = first.land
  if (first.strayed && arcs && opts.cardsOut !== false) {
    arcs = null
    land = place(null).land
  }

  const me = { x: c.x, y: open ? h : c.y + ry }

  return {
    w,
    h,
    c,
    rx,
    ry,
    lx,
    ly,
    arcs,
    mid,
    seats,
    land,
    me,
    meLand,
    vira,
    viraFlat: !wide,
    legend,
    plaque,
  }
}
