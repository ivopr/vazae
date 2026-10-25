/**
 * Where opponents sit around the desktop oval, in px from the oval box's top
 * left. Seats are spaced evenly along the rim measured in seat sizes, not by
 * equal angle: on an oval much wider than tall, equal angles bunch seats at
 * the sides and spread them across the top.
 */
export function seatPositions(n: number, w: number, h: number): { x: number; y: number }[] {
  if (n <= 0 || w <= 0 || h <= 0) return []
  // The rim of the oval drawn on the felt (inset 8% sideways, 14% top, 2% bottom).
  const cx = w / 2
  const cy = h * 0.56
  const rx = w * 0.42
  const ry = h * 0.42
  // Many seats don't fit on the upper half: the arc runs a little past the
  // middle on both sides.
  const dip = n >= 5 ? 0.45 : 0
  const a0 = Math.PI - dip
  const a1 = 2 * Math.PI + dip
  const at = (a: number) => ({ x: cx + rx * Math.cos(a), y: cy + ry * Math.sin(a) })

  // Distance along the rim in seat sizes: a seat is about twice as wide as it
  // is tall, so across the top seats need twice the room they need down the
  // sides.
  const seatW = 180
  const seatH = 90
  const steps = 240
  const lengths = [0]
  let prev = at(a0)
  for (let s = 1; s <= steps; s++) {
    const p = at(a0 + ((a1 - a0) * s) / steps)
    lengths.push(lengths[s - 1] + Math.hypot((p.x - prev.x) / seatW, (p.y - prev.y) / seatH))
    prev = p
  }
  const total = lengths[steps]

  // Half a seat stays inside the box: seats are about 13rem wide with a card, 5rem tall.
  const mx = Math.min(104, w / 2)
  const my = 56
  return Array.from({ length: n }, (_, k) => {
    const target = (total * (k + 0.5)) / n
    let s = 1
    while (s < steps && lengths[s] < target) s++
    const f = (target - lengths[s - 1]) / (lengths[s] - lengths[s - 1] || 1)
    const p = at(a0 + ((a1 - a0) * (s - 1 + f)) / steps)
    return { x: Math.min(w - mx, Math.max(mx, p.x)), y: Math.max(my, p.y) }
  })
}
