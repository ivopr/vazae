import { Button } from "@/components/ui/button"
import { setTheme, useTheme } from "@/lib/theme"

export function ThemeToggle({ className }: { className?: string }) {
  const theme = useTheme()
  const next = theme === "dark" ? "light" : "dark"
  return (
    // The visible text names the theme you switch to, so it doubles as the accessible name.
    <Button variant="outline" className={className} onClick={() => setTheme(next)}>
      {next === "dark" ? "Tema escuro" : "Tema claro"}
    </Button>
  )
}
