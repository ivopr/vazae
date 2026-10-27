import { useEffect, useState } from "react"

import type { Rules } from "../../bindings/vazae/game/models"
import * as Solo from "../../bindings/vazae/solo/service"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Difficulty, LEVEL_LABEL, type StartConfig, type StartStatus } from "@/game/useSolo"
import { changedRules, withDefaults } from "@/lib/rules"
import { loadSaved, useBuiltIns, type BuiltIns } from "@/lib/ruleSets"
import { cn } from "@/lib/utils"
import { RulesEditor } from "./RulesEditor"

const KEY = "vazae:solo-setup"

type Saved = {
  name: string
  bots: number
  /** Overrides the rule set's lives; null follows the rule set. */
  lives: number | null
  difficulty: Difficulty
  /** A preset or saved set; null means the custom rules below. */
  ruleSetId: string | null
  customRules?: unknown
}

const MIN_LIVES = 1
const MAX_LIVES = 15

const DEFAULTS: Saved = { name: "", bots: 3, lives: null, difficulty: Difficulty.Medium, ruleSetId: "padrao" }

function load(): Saved {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS
  } catch {
    return DEFAULTS
  }
}

const check = (r: Rules) => Solo.CheckRules(r)

const LEVELS = [Difficulty.Easy, Difficulty.Medium, Difficulty.Hard, Difficulty.Master, Difficulty.Mixed]

const LEVEL_HINT: Record<Difficulty, string> = {
  [Difficulty.$zero]: "",
  [Difficulty.Easy]: "Fácil: palpita perto da média e joga carta ao acaso.",
  [Difficulty.Medium]: "Médio: conta as cartas fortes da mão e joga para cumprir o palpite.",
  [Difficulty.Hard]: "Difícil: lembra as cartas que saíram, calcula as chances e usa a anulação.",
  [Difficulty.Master]: "Mestre: simula as jogadas possíveis antes de decidir e joga para você errar.",
  [Difficulty.Mixed]: "Misturado: cada robô com um nível, sorteado. A mesa mostra qual é qual.",
}

type Props = {
  status: StartStatus
  onStart: (cfg: StartConfig) => void
  onBack: () => void
}

export function SoloSetup({ status, onStart, onBack }: Props) {
  const { builtIns, failed, retry } = useBuiltIns()
  const [cfg, setCfg] = useState<Saved>(load)
  const [editing, setEditing] = useState(false)

  if (editing && builtIns) {
    const { rules, setId } = resolve(cfg, builtIns)
    return (
      <RulesEditor
        defaults={builtIns.defaults}
        presets={builtIns.presets}
        initial={rules}
        initialSetId={setId}
        check={check}
        onCancel={() => setEditing(false)}
        onDone={(r, id) => {
          setCfg({ ...cfg, ruleSetId: id, customRules: id ? undefined : r, lives: null })
          setEditing(false)
        }}
      />
    )
  }

  return (
    <Setup
      cfg={cfg}
      setCfg={setCfg}
      builtIns={builtIns}
      failed={failed}
      retry={retry}
      status={status}
      onEdit={() => setEditing(true)}
      onStart={onStart}
      onBack={onBack}
    />
  )
}

/** The rules a setup points at, falling back to the defaults if its set was deleted. */
function resolve(cfg: Saved, b: BuiltIns): { rules: Rules; setId: string | null; name: string } {
  const sets = [...b.presets, ...loadSaved(b.defaults)]
  if (cfg.ruleSetId === null && cfg.customRules) {
    return { rules: withDefaults(cfg.customRules, b.defaults), setId: null, name: "Personalizadas" }
  }
  const s = sets.find((x) => x.id === cfg.ruleSetId) ?? b.presets[0]
  return { rules: s.rules, setId: s.id, name: s.name }
}

function Setup({
  cfg,
  setCfg,
  builtIns,
  failed,
  retry,
  status,
  onEdit,
  onStart,
  onBack,
}: {
  cfg: Saved
  setCfg: (c: Saved) => void
  builtIns: BuiltIns | null
  failed: boolean
  retry: () => void
  status: StartStatus
  onEdit: () => void
  onStart: (cfg: StartConfig) => void
  onBack: () => void
}) {
  const starting = status.kind === "starting"
  const chosen = builtIns ? resolve(cfg, builtIns) : null
  const sets = builtIns ? [...builtIns.presets, ...loadSaved(builtIns.defaults)] : []
  const range = useBotRange(chosen?.rules ?? null)
  const botsOk = range !== null && cfg.bots >= range[0] && cfg.bots <= range[1]
  const changed = chosen && builtIns ? changedRules(chosen.rules, builtIns.defaults).size : 0

  // Raw text while typing, so the field can be cleared; null shows the stored value.
  const [livesText, setLivesText] = useState<string | null>(null)
  const livesShown = livesText ?? String(cfg.lives ?? chosen?.rules.players.lives ?? "")
  const lives = /^\d+$/.test(livesShown) ? Number(livesShown) : NaN
  const livesOk = lives >= MIN_LIVES && lives <= MAX_LIVES

  const submit = () => {
    if (!chosen || !botsOk || !livesOk) return
    try {
      localStorage.setItem(KEY, JSON.stringify(cfg))
    } catch {
      // Remembering the setup is a convenience; ignore blocked storage.
    }
    const rules = { ...chosen.rules, players: { ...chosen.rules.players, lives } }
    onStart({ name: cfg.name.trim(), bots: cfg.bots, difficulty: cfg.difficulty, rules })
  }

  return (
    <main className="on-room mx-auto flex min-h-full max-w-lg flex-col justify-center gap-4 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] stage-lg:max-w-3xl">
      <div>
        <Button variant="ghost" onClick={onBack} className="-ml-3 hover:bg-room-deep">
          Voltar
        </Button>
      </div>

      {/* The setup is a house card in the deco frame. */}
      <form
        className="panel deco-frame flex flex-col gap-6 rounded-lg bg-card p-5 text-card-foreground stage-sm:p-6"
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        <h1 className="font-display text-4xl leading-none text-marquee">Mesa contra robôs</h1>

        {/* Two columns on desktop so the whole form fits the window without scrolling. */}
        <div className="flex flex-col gap-6 stage-lg:flex-row stage-lg:items-start stage-lg:gap-x-8">
          <div className="flex flex-col gap-6 stage-lg:flex-1">
          <Field label="Seu nome" htmlFor="name">
            <Input
              id="name"
              value={cfg.name}
              maxLength={16}
              placeholder="Seu nome"
              autoComplete="nickname"
              onChange={(e) => setCfg({ ...cfg, name: e.target.value })}
            />
          </Field>

          <Field
            label="Robôs na mesa"
            hint={
              range && (range[0] > 1 || range[1] < 9)
                ? `Com estas regras, de ${range[0]} a ${range[1]} robôs.`
                : "Com mais gente, as rodadas têm menos cartas."
            }
          >
            <ToggleGroup
              type="single"
              variant="outline"
              value={String(cfg.bots)}
              onValueChange={(v) => v && setCfg({ ...cfg, bots: Number(v) })}
              // Phones: two full rows (5 and 4) instead of a ninth chip wrapping alone.
              className="grid w-full grid-cols-20 gap-2 stage-sm:flex stage-sm:w-fit"
              aria-label="Robôs na mesa"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                <ToggleGroupItem
                  key={n}
                  value={String(n)}
                  disabled={range !== null && (n < range[0] || n > range[1])}
                  className={cn("text-xl font-bold", n <= 5 ? "col-span-4" : "col-span-5")}
                >
                  {n}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </Field>

          <Field
            label="Vidas"
            htmlFor="lives"
            hint={livesOk ? "Quem perde todas sai da mesa." : `De ${MIN_LIVES} a ${MAX_LIVES} vidas.`}
          >
            <Input
              id="lives"
              type="number"
              inputMode="numeric"
              min={MIN_LIVES}
              max={MAX_LIVES}
              value={livesShown}
              aria-invalid={!livesOk}
              disabled={!chosen}
              onChange={(e) => {
                setLivesText(e.target.value)
                const n = Number(e.target.value)
                if (Number.isInteger(n) && n >= MIN_LIVES && n <= MAX_LIVES) setCfg({ ...cfg, lives: n })
              }}
            />
          </Field>

          </div>

          <div className="flex flex-col gap-6 stage-lg:flex-1">
          <Field label="Dificuldade" hint={LEVEL_HINT[cfg.difficulty]}>
            <ToggleGroup
              type="single"
              variant="outline"
              value={cfg.difficulty}
              onValueChange={(v) => v && setCfg({ ...cfg, difficulty: v as Difficulty })}
              // Phones: three then two, each row filled, so "Misturado" never wraps alone.
              className="grid w-full grid-cols-6 gap-2 stage-sm:flex stage-sm:w-fit stage-sm:flex-wrap"
              aria-label="Dificuldade"
            >
              {LEVELS.map((d, i) => (
                <ToggleGroupItem key={d} value={d} className={i < 3 ? "col-span-2" : "col-span-3"}>
                  {LEVEL_LABEL[d]}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </Field>

          <Field label="Regras" htmlFor="rules">
            {failed ? (
              <div className="flex flex-col items-start gap-2">
                <p className="text-sm text-destructive">Não deu para carregar as regras.</p>
                <Button type="button" variant="outline" onClick={retry}>
                  Tentar de novo
                </Button>
              </div>
            ) : !builtIns || !chosen ? (
              <p className="text-sm text-muted-foreground">Carregando as regras…</p>
            ) : (
              <>
                <select
                  id="rules"
                  className="h-11 w-full rounded-md border border-input bg-transparent px-3 text-base"
                  value={cfg.ruleSetId ?? ""}
                  onChange={(e) => {
                    setLivesText(null)
                    setCfg({ ...cfg, ruleSetId: e.target.value || null, lives: null })
                  }}
                >
                  {cfg.ruleSetId === null && <option value="">Personalizadas</option>}
                  {sets.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <p className="text-sm text-muted-foreground">
                  {changed === 0
                    ? "Todas as regras no padrão."
                    : `${changed} ${changed === 1 ? "regra diferente" : "regras diferentes"} do padrão.`}
                </p>
                <Button type="button" variant="outline" className="self-start" onClick={onEdit}>
                  Editar regras
                </Button>
              </>
            )}
          </Field>
          </div>
        </div>

        {status.kind === "error" && (
          <Alert variant="destructive">
            <AlertTitle>Não deu para começar a partida</AlertTitle>
            <AlertDescription>{status.message} Confira as opções e tente de novo.</AlertDescription>
          </Alert>
        )}

        <Button type="submit" size="lg" disabled={starting || !chosen || !botsOk || !livesOk}>
          {starting ? "Embaralhando…" : status.kind === "error" ? "Tentar de novo" : "Sentar à mesa"}
        </Button>
      </form>
    </main>
  )
}

/** How many bots the rules allow, as [min, max]; null until the engine answers. */
function useBotRange(rules: Rules | null): [number, number] | null {
  const [range, setRange] = useState<[number, number] | null>(null)
  // Only the rules that decide the table size; the rules object itself is rebuilt each render.
  const key = rules ? JSON.stringify([rules.players, rules.deck.ranks?.length, rules.rounds.reserveVira]) : ""
  useEffect(() => {
    if (!rules) return
    let live = true
    Solo.BotRange(rules)
      .then((r) => live && r && setRange([r[0], r[1]]))
      .catch(() => live && setRange([1, 9]))
    return () => {
      live = false
    }
  }, [key])
  return range
}

function Field({ label, hint, htmlFor, children }: { label: string; hint?: string; htmlFor?: string; children: React.ReactNode }) {
  const body = (
    <>
      {children}
      {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
    </>
  )
  if (htmlFor) {
    return (
      <div className="flex flex-col gap-2">
        <Label htmlFor={htmlFor} className="text-base font-bold">
          {label}
        </Label>
        {body}
      </div>
    )
  }
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-base font-bold">{label}</legend>
      {body}
    </fieldset>
  )
}
