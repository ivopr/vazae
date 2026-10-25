import { useCallback, useEffect, useState } from "react"
import { Events } from "@wailsio/runtime"
import { toast } from "sonner"

import { SoloState } from "../../bindings/events"
import type { Card, PlayerView } from "../../bindings/vazae/game/models"
import { Difficulty, type StartConfig } from "../../bindings/vazae/solo/models"
import * as Solo from "../../bindings/vazae/solo/service"

export { Difficulty }
export type { StartConfig }

export const LEVEL_LABEL: Record<Difficulty, string> = {
  [Difficulty.$zero]: "",
  [Difficulty.Easy]: "Fácil",
  [Difficulty.Medium]: "Médio",
  [Difficulty.Hard]: "Difícil",
  [Difficulty.Master]: "Mestre",
  [Difficulty.Mixed]: "Misturado",
}

export type StartStatus = { kind: "idle" } | { kind: "starting" } | { kind: "error"; message: string }

function message(err: unknown) {
  if (err instanceof Error) return err.message
  if (typeof err === "string") return err
  return "Algo deu errado. Tente de novo."
}

export function useSolo() {
  const [view, setView] = useState<PlayerView | null>(null)
  const [status, setStatus] = useState<StartStatus>({ kind: "idle" })
  const [busy, setBusy] = useState(false)
  // Each seat's bot level, only on a mixed table (otherwise every bot is the same).
  const [levels, setLevels] = useState<Difficulty[] | null>(null)

  useEffect(() => {
    return Events.On(SoloState, (ev) => setView(ev.data))
  }, [])

  const start = useCallback(async (cfg: StartConfig) => {
    setStatus({ kind: "starting" })
    try {
      const v = await Solo.Start(cfg)
      setLevels(cfg.difficulty === Difficulty.Mixed ? await Solo.Levels() : null)
      setView(v)
      setStatus({ kind: "idle" })
    } catch (err) {
      setStatus({ kind: "error", message: message(err) })
    }
  }, [])

  // Engine rule errors (e.g. the last bid) come back as text and are shown as-is.
  const run = useCallback(async (f: () => Promise<void>) => {
    setBusy(true)
    try {
      await f()
    } catch (err) {
      toast.error(message(err))
    } finally {
      setBusy(false)
    }
  }, [])

  const bid = useCallback((n: number) => run(() => Solo.Bid(n)), [run])
  const play = useCallback((c: Card) => run(() => Solo.Play(c)), [run])
  const playHidden = useCallback(() => run(() => Solo.PlayOnly()), [run])
  const nextRound = useCallback(() => run(() => Solo.NextRound()), [run])
  const quit = useCallback(async () => {
    setView(null)
    try {
      await Solo.Quit()
    } catch {
      // Nothing to clean up if the service is gone.
    }
  }, [])

  return { view, status, busy, levels, start, bid, play, playHidden, nextRound, quit }
}

export type SoloGame = ReturnType<typeof useSolo>
