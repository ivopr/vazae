import type { ReactNode } from "react"

import type { Rules } from "../../bindings/vazae/game/models"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { describe } from "@/lib/rules"
import { useBuiltIns } from "@/lib/ruleSets"
import { WithSuits } from "./SuitIcon"

/**
 * The rules in words, written from the same Rules the engine enforces. Without
 * `rules` (outside a match) it shows the defaults.
 */
export function RulesDialog({ trigger, rules }: { trigger: ReactNode; rules?: Rules }) {
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="stage-sm:max-w-lg stage-lg:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Como se joga</DialogTitle>
          <DialogDescription>
            {rules ? "As regras desta partida." : "Jogo de vazas com o baralho e a força das cartas do truco."}
          </DialogDescription>
        </DialogHeader>
        {rules ? <RuleText rules={rules} /> : <DefaultRuleText />}
      </DialogContent>
    </Dialog>
  )
}

function DefaultRuleText() {
  const { builtIns, failed } = useBuiltIns()
  if (failed) return <p className="text-destructive">Não deu para carregar as regras.</p>
  if (!builtIns) return <p className="text-muted-foreground">Carregando as regras…</p>
  return <RuleText rules={builtIns.defaults} />
}

function RuleText({ rules }: { rules: Rules }) {
  return (
    // Two columns on desktop so every rule fits on screen at once.
    <div className="flex flex-col gap-4 text-[15px] leading-relaxed stage-lg:grid stage-lg:grid-cols-2 stage-lg:gap-x-8">
      {describe(rules).map((s) => (
        <section key={s.title}>
          <h3 className="font-display text-xl">{s.title}</h3>
          <p className="text-card-foreground">
            <WithSuits text={s.text} />
          </p>
        </section>
      ))}
    </div>
  )
}
