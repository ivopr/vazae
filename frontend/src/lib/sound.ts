import { useSyncExternalStore } from "react"
import { Android } from "@wailsio/runtime"

const KEY = "vazae:sound"
const listeners = new Set<() => void>()

function stored(): boolean {
  try {
    return localStorage.getItem(KEY) !== "off"
  } catch {
    return true
  }
}

let on = stored()

export function setSound(v: boolean) {
  on = v
  try {
    localStorage.setItem(KEY, v ? "on" : "off")
  } catch {
    // Private mode or blocked storage: the choice just won't persist.
  }
  listeners.forEach((l) => l())
}

export function useSound(): boolean {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => on,
  )
}

// Browsers only start audio after a gesture, so the context is made on first use.
let ctx: AudioContext | null = null
function audio(): AudioContext | null {
  if (!on) return null
  try {
    ctx ??= new AudioContext()
    if (ctx.state === "suspended") void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

/** A short burst of filtered noise: a card snapped down on cloth. */
function snap(a: AudioContext, at: number, gain = 0.35) {
  const len = Math.floor(a.sampleRate * 0.06)
  const buf = a.createBuffer(1, len, a.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3
  const src = a.createBufferSource()
  src.buffer = buf
  const bp = a.createBiquadFilter()
  bp.type = "bandpass"
  bp.frequency.value = 1800
  bp.Q.value = 0.8
  const g = a.createGain()
  g.gain.value = gain
  src.connect(bp).connect(g).connect(a.destination)
  src.start(at)
}

/** Two clay chips knocking together. */
function clack(a: AudioContext, at: number) {
  for (const [dt, f] of [
    [0, 2900],
    [0.045, 3400],
  ] as const) {
    const o = a.createOscillator()
    o.type = "triangle"
    o.frequency.value = f
    const g = a.createGain()
    g.gain.setValueAtTime(0.18, at + dt)
    g.gain.exponentialRampToValueAtTime(0.001, at + dt + 0.07)
    o.connect(g).connect(a.destination)
    o.start(at + dt)
    o.stop(at + dt + 0.08)
  }
  snap(a, at, 0.12)
}

/** A soft two-note bell when it comes round to you. */
function chime(a: AudioContext, at: number) {
  for (const [dt, f] of [
    [0, 659.25],
    [0.12, 987.77],
  ] as const) {
    const o = a.createOscillator()
    o.type = "sine"
    o.frequency.value = f
    const g = a.createGain()
    g.gain.setValueAtTime(0.0001, at + dt)
    g.gain.exponentialRampToValueAtTime(0.12, at + dt + 0.01)
    g.gain.exponentialRampToValueAtTime(0.0001, at + dt + 0.9)
    o.connect(g).connect(a.destination)
    o.start(at + dt)
    o.stop(at + dt + 1)
  }
}

export type Cue = "card" | "deal" | "chip" | "turn"

export function play(cue: Cue, count = 1) {
  const a = audio()
  if (!a) return
  const t = a.currentTime + 0.01
  switch (cue) {
    case "card":
      return snap(a, t)
    case "deal":
      for (let i = 0; i < Math.min(count, 10); i++) snap(a, t + i * 0.06, 0.22)
      return
    case "chip":
      for (let i = 0; i < Math.min(count, 5); i++) clack(a, t + i * 0.14)
      return
    case "turn":
      return chime(a, t)
  }
}

// The Android host exposes the vibrator through the Wails bridge; elsewhere the web API.
const onAndroid = () => (window as { wails?: { platform?: () => string } }).wails?.platform?.() === "android"

/** A short buzz, if the device has a vibrator and sound is on. */
export function buzz(ms: number) {
  if (!on) return
  try {
    if (onAndroid()) void Android.Haptics.Vibrate(ms).catch(() => {})
    else navigator.vibrate?.(ms)
  } catch {
    // No vibrator, or the platform refused it.
  }
}
