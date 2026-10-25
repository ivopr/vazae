import { useEffect, useState } from "react"

import type { Rules } from "../../bindings/vazae/game/models"
import * as Solo from "../../bindings/vazae/solo/service"
import { withDefaults } from "./rules"

export type RuleSet = { id: string; name: string; rules: Rules; builtIn?: boolean }

export type BuiltIns = { defaults: Rules; presets: RuleSet[] }

let builtIns: Promise<BuiltIns> | null = null

/** The default rules and the presets, from the engine. Loaded once. */
export function loadBuiltIns(): Promise<BuiltIns> {
  builtIns ??= Promise.all([Solo.DefaultRules(), Solo.Presets()]).then(([defaults, presets]) => ({
    defaults,
    presets: (presets ?? []).map((p) => ({ id: p.id, name: p.name, rules: p.rules, builtIn: true })),
  }))
  builtIns.catch(() => (builtIns = null))
  return builtIns
}

/** builtIns is null while loading; failed is set when the engine could not be reached. */
export function useBuiltIns(): { builtIns: BuiltIns | null; failed: boolean; retry: () => void } {
  const [v, setV] = useState<BuiltIns | null>(null)
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let live = true
    setFailed(false)
    loadBuiltIns()
      .then((b) => live && setV(b))
      .catch(() => live && setFailed(true))
    return () => {
      live = false
    }
  }, [attempt])
  return { builtIns: v, failed, retry: () => setAttempt((a) => a + 1) }
}

// Named rule sets live on this device only.
const KEY = "vazae:rule-sets"

export function loadSaved(defaults: Rules): RuleSet[] {
  try {
    const raw = localStorage.getItem(KEY)
    const list: unknown = raw ? JSON.parse(raw) : []
    if (!Array.isArray(list)) return []
    return list
      .filter((s) => s && typeof s.id === "string" && typeof s.name === "string")
      .map((s) => ({ id: s.id, name: s.name, rules: withDefaults(s.rules, defaults) }))
  } catch {
    return []
  }
}

/** Returns false when storage is blocked, so the UI can say the set was not kept. */
export function storeSaved(sets: RuleSet[]): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(sets.map(({ id, name, rules }) => ({ id, name, rules }))))
    return true
  } catch {
    return false
  }
}

export const newSetId = () => `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
