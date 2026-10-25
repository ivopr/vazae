import { useSyncExternalStore } from "react"

export type Theme = "light" | "dark"

const KEY = "vazae:theme"
const listeners = new Set<() => void>()

function stored(): Theme | null {
  try {
    const v = localStorage.getItem(KEY)
    return v === "light" || v === "dark" ? v : null
  } catch {
    return null
  }
}

// The salon opens at night; the daylit matinê is a choice in the menu.
let current: Theme = stored() ?? "dark"

function apply(t: Theme) {
  document.documentElement.classList.toggle("dark", t === "dark")
  document.documentElement.style.colorScheme = t
}

apply(current)

export function setTheme(t: Theme) {
  current = t
  apply(t)
  try {
    localStorage.setItem(KEY, t)
  } catch {
    // Private mode or blocked storage: the choice just won't persist.
  }
  listeners.forEach((l) => l())
}

export function useTheme(): Theme {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => current,
  )
}
