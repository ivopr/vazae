import { Button } from "@/components/ui/button"
import { setTheme, useTheme } from "@/lib/theme"

export function ThemeToggle({ className }: { className?: string }) {
  const theme = useTheme()
  const next = theme === "dark" ? "light" : "dark"
  return (
    <Button variant="outline" className={className} onClick={() => setTheme(next)} aria-label={`Mudar para tema ${next === "dark" ? "escuro" : "claro"}`}>
      {theme === "dark" ? "Tema claro" : "Tema escuro"}
    </Button>
  )
}
