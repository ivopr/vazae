import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react"

import { Rank, Suit, type RuleError, type Rules } from "../../bindings/vazae/game/models"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { RANK_LABEL, SUIT_GLYPH, SUIT_NAME, rankName } from "@/lib/cards"
import { GROUPS, RULES, changedRules, getField, setField, type Control, type Field, type GroupId, type RuleMeta } from "@/lib/rules"
import { loadSaved, newSetId, storeSaved, type RuleSet } from "@/lib/ruleSets"
import { cn } from "@/lib/utils"
import { WithSuits } from "@/components/SuitIcon"

type Props = {
  defaults: Rules
  presets: RuleSet[]
  /** The rules being edited and the set they came from (null: unsaved). */
  initial: Rules
  initialSetId: string | null
  check: (r: Rules) => Promise<RuleError[] | null>
  onDone: (rules: Rules, setId: string | null) => void
  onCancel: () => void
}

const same = (a: Rules, b: Rules) => JSON.stringify(a) === JSON.stringify(b)

export function RulesEditor({ defaults, presets, initial, initialSetId, check, onDone, onCancel }: Props) {
  const [rules, setRules] = useState(initial)
  const [saved, setSaved] = useState(() => loadSaved(defaults))
  const [setId, setSetId] = useState(initialSetId)
  const [group, setGroup] = useState<GroupId>("deck")
  const [errors, setErrors] = useState<RuleError[]>([])
  const [naming, setNaming] = useState<"new" | "rename" | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [note, setNote] = useState("")

  const all = [...presets, ...saved]
  const base = all.find((s) => s.id === setId) ?? null
  const dirty = !base || !same(base.rules, rules)
  const changed = useMemo(() => changedRules(rules, defaults), [rules, defaults])

  // The engine is the judge; ask it after each change settles.
  useEffect(() => {
    let live = true
    const t = setTimeout(() => {
      check(rules)
        .then((errs) => live && setErrors(errs ?? []))
        .catch(() => live && setErrors([]))
    }, 150)
    return () => {
      live = false
      clearTimeout(t)
    }
  }, [rules, check])

  const errorsFor = (m: RuleMeta) => errors.filter((e) => m.fields.some((f) => f.key === e.key))
  const groupHasError = (g: GroupId) => RULES.some((m) => m.group === g && errorsFor(m).length > 0)

  const pick = (id: string) => {
    const s = all.find((x) => x.id === id)
    if (!s) return
    setRules(s.rules)
    setSetId(s.id)
    setNaming(null)
    setDeleting(false)
  }

  const persist = (next: RuleSet[], message: string) => {
    setSaved(next)
    setNote(storeSaved(next) ? message : "Não deu para guardar neste aparelho; as regras valem só para esta partida.")
  }

  const saveAs = (name: string) => {
    const s = { id: newSetId(), name, rules }
    persist([...saved, s], `"${name}" salvas.`)
    setSetId(s.id)
    setNaming(null)
  }
  const rename = (name: string) => {
    persist(
      saved.map((s) => (s.id === setId ? { ...s, name } : s)),
      `Renomeadas para "${name}".`,
    )
    setNaming(null)
  }
  const overwrite = () => {
    persist(
      saved.map((s) => (s.id === setId ? { ...s, rules } : s)),
      `"${base?.name}" atualizadas.`,
    )
  }
  const remove = () => {
    persist(
      saved.filter((s) => s.id !== setId),
      `"${base?.name}" excluídas.`,
    )
    setSetId(null)
    setDeleting(false)
  }

  const shown = RULES.filter((m) => m.group === group)

  return (
    <main className="on-room mx-auto flex min-h-full max-w-6xl flex-col gap-3 px-4 pt-[max(1rem,env(safe-area-inset-top))] stage-lg:h-full">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Button variant="ghost" onClick={onCancel} className="-ml-3 hover:bg-room-deep">
          Voltar
        </Button>
        <h1 className="font-display text-4xl leading-none text-marquee">Regras da partida</h1>
        {/* One row with the title on desktop, so the rules get the height. The set's
            actions sit in one menu, so a phone keeps them on a single line. */}
        <div className="flex w-full flex-wrap items-end gap-2 stage-sm:ml-auto stage-sm:w-auto">
          <SetPicker
            presets={presets}
            saved={saved}
            setId={setId}
            dirty={dirty}
            baseName={base?.name}
            onPick={pick}
          />
          {!naming && !deleting && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">Opções</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => setNaming("new")}>Salvar como…</DropdownMenuItem>
                {base && !base.builtIn && dirty && (
                  <DropdownMenuItem onSelect={overwrite}>Salvar em "{base.name}"</DropdownMenuItem>
                )}
                {base && !base.builtIn && (
                  <>
                    <DropdownMenuItem onSelect={() => setNaming("rename")}>Renomear</DropdownMenuItem>
                    <DropdownMenuItem variant="destructive" onSelect={() => setDeleting(true)}>
                      Excluir
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        {naming && (
          <NameForm
            initial={naming === "rename" ? (base?.name ?? "") : ""}
            taken={saved.filter((s) => s.id !== setId || naming === "new").map((s) => s.name)}
            submitLabel={naming === "rename" ? "Renomear" : "Salvar"}
            onSubmit={naming === "rename" ? rename : saveAs}
            onCancel={() => setNaming(null)}
          />
        )}
        {deleting && (
          <div className="flex w-full flex-wrap items-center gap-2">
            <span>Excluir "{base?.name}" deste aparelho?</span>
            <Button variant="outline" onClick={remove}>
              Excluir
            </Button>
            <Button variant="ghost" className="hover:bg-room-deep" onClick={() => setDeleting(false)}>
              Manter
            </Button>
          </div>
        )}
      </header>

      <Tabs group={group} onGroup={setGroup} changed={changed} hasError={groupHasError} />

      <section
        id={`grupo-${group}`}
        role="tabpanel"
        aria-labelledby={`aba-${group}`}
        className="panel deco-frame min-h-0 flex-1 overflow-y-auto rounded-lg bg-card px-4 py-1 text-card-foreground"
      >
        {/* One panel, ruled between rules like the round summary; no boxes inside the box. */}
        <div className="gap-8 stage-md:columns-2 stage-lg:columns-3">
          {shown.map((m) => (
            <RuleCard key={m.n} meta={m} rules={rules} defaults={defaults} changed={changed.has(m.n)} errors={errorsFor(m)} onChange={setRules} />
          ))}
        </div>
      </section>

      <footer className="flex flex-wrap items-center justify-end gap-2 pb-[max(1rem,env(safe-area-inset-bottom))] stage-lg:pb-6">
        <p className="mr-auto text-sm text-room-muted">
          {errors.length > 0
            ? `${errors.length === 1 ? "Uma regra precisa" : `${errors.length} regras precisam`} de ajuste antes de jogar.`
            : changed.size === 0
              ? "Todas as regras no padrão."
              : `${changed.size} ${changed.size === 1 ? "regra diferente" : "regras diferentes"} do padrão.`}{" "}
          <span role="status">{note}</span>
        </p>
        <Button variant="outline" disabled={same(rules, defaults)} onClick={() => setRules(defaults)}>
          Restaurar padrão
        </Button>
        <Button disabled={errors.length > 0} onClick={() => onDone(rules, dirty ? null : setId)}>
          Usar estas regras
        </Button>
      </footer>
    </main>
  )
}

function SetPicker({
  presets,
  saved,
  setId,
  dirty,
  baseName,
  onPick,
}: {
  presets: RuleSet[]
  saved: RuleSet[]
  setId: string | null
  dirty: boolean
  baseName?: string
  onPick: (id: string) => void
}) {
  return (
    <label className="flex min-w-0 flex-1 flex-col gap-1 stage-sm:flex-none">
      <span className="text-sm text-room-muted">Conjunto</span>
      <select
        className="h-11 w-full min-w-0 rounded-md border-2 border-input bg-room-deep px-3 text-base stage-sm:w-auto"
        value={dirty ? "" : (setId ?? "")}
        onChange={(e) => e.target.value && onPick(e.target.value)}
      >
        {dirty && <option value="">{baseName ? `${baseName}, alteradas` : "Personalizadas"}</option>}
        <optgroup label="Prontas">
          {presets.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </optgroup>
        {saved.length > 0 && (
          <optgroup label="Suas">
            {saved.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </optgroup>
        )}
      </select>
    </label>
  )
}

function NameForm({
  initial,
  taken,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial: string
  taken: string[]
  submitLabel: string
  onSubmit: (name: string) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(initial)
  const clean = name.trim()
  const clash = taken.some((t) => t.toLowerCase() === clean.toLowerCase())
  return (
    <form
      className="flex w-full flex-wrap items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        if (clean && !clash) onSubmit(clean)
      }}
    >
      <Input
        autoFocus
        aria-label="Nome das regras"
        placeholder="Regras do bar do Zé"
        maxLength={40}
        value={name}
        onChange={(e) => setName(e.target.value)}
        aria-invalid={clash || undefined}
        aria-describedby={clash ? "nome-repetido" : undefined}
        className="w-full max-w-64 flex-1"
      />
      <Button type="submit" variant="outline" disabled={!clean || clash}>
        {submitLabel}
      </Button>
      <Button type="button" variant="ghost" className="hover:bg-room-deep" onClick={onCancel}>
        Cancelar
      </Button>
      {clash && (
        <span id="nome-repetido" className="text-sm text-destructive">
          Já existe um conjunto com esse nome.
        </span>
      )}
    </form>
  )
}

function Tabs({
  group,
  onGroup,
  changed,
  hasError,
}: {
  group: GroupId
  onGroup: (g: GroupId) => void
  changed: Set<number>
  hasError: (g: GroupId) => boolean
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const onKey = (e: KeyboardEvent, i: number) => {
    const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0
    if (!step) return
    e.preventDefault()
    const j = (i + step + GROUPS.length) % GROUPS.length
    onGroup(GROUPS[j].id)
    refs.current[j]?.focus()
  }
  return (
    // On a phone the groups scroll sideways; the faded right edge says there is more.
    <div
      role="tablist"
      aria-label="Grupos de regras"
      className="-mx-4 flex gap-1 overflow-x-auto px-4 [mask-image:linear-gradient(to_right,#000_calc(100%-2.5rem),transparent)] stage-lg:mx-0 stage-lg:px-0 stage-lg:[mask-image:none]"
    >
      {GROUPS.map((g, i) => {
        const count = RULES.filter((m) => m.group === g.id && changed.has(m.n)).length
        const err = hasError(g.id)
        const active = g.id === group
        return (
          <button
            key={g.id}
            ref={(el) => {
              refs.current[i] = el
            }}
            id={`aba-${g.id}`}
            role="tab"
            type="button"
            aria-selected={active}
            aria-controls={`grupo-${g.id}`}
            tabIndex={active ? 0 : -1}
            onClick={() => onGroup(g.id)}
            onKeyDown={(e) => onKey(e, i)}
            className={cn(
              "flex min-h-11 shrink-0 flex-col items-start justify-center rounded-md border-2 px-3 py-1 text-left",
              active ? "border-room-foreground bg-room-deep font-bold" : "border-transparent hover:bg-room-deep",
            )}
          >
            <span className="whitespace-nowrap">{g.title}</span>
            {(err || count > 0) && (
              <span className={cn("text-xs font-normal whitespace-nowrap", err ? "font-bold text-destructive" : "text-room-muted")}>
                {err ? "precisa de ajuste" : count === 1 ? "1 alterada" : `${count} alteradas`}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

function RuleCard({
  meta,
  rules,
  defaults,
  changed,
  errors,
  onChange,
}: {
  meta: RuleMeta
  rules: Rules
  defaults: Rules
  changed: boolean
  errors: RuleError[]
  onChange: (r: Rules) => void
}) {
  const titleId = `regra-${meta.n}`
  const errId = `regra-${meta.n}-erro`
  return (
    <article
      aria-labelledby={titleId}
      className="flex break-inside-avoid flex-col gap-1.5 border-b border-dashed border-border py-4"
    >
      <div className="flex items-baseline gap-2">
        {/* The rule's number, as the rules dialog and the players name it. */}
        <span className="text-lg leading-none font-bold text-muted-foreground">{meta.n}</span>
        <h2 id={titleId} className="font-bold">
          {meta.title}
        </h2>
        {errors.length > 0 ? (
          <span className="ml-auto text-xs font-bold text-destructive">precisa de ajuste</span>
        ) : (
          changed && (
            <span className="ml-auto text-xs text-muted-foreground" title="Diferente do padrão">
              alterada
            </span>
          )
        )}
      </div>
      {meta.locked ? (
        <p className="text-sm text-muted-foreground">
          <span className="font-bold text-card-foreground">Fixa. </span>
          {meta.locked}
        </p>
      ) : (
        <>
          {meta.hint && <p className="text-sm text-muted-foreground">{meta.hint}</p>}
          {meta.fields
            .filter((f) => !f.hidden?.(rules))
            .map((f) => (
              <FieldControl
                key={f.key}
                field={f}
                labelledBy={titleId}
                describedBy={errors.length ? errId : undefined}
                rules={rules}
                defaults={defaults}
                onChange={onChange}
              />
            ))}
          {errors.length > 0 && (
            <p id={errId} className="text-sm font-bold text-destructive">
              {errors.map((e) => e.msg).join(" ")}
            </p>
          )}
        </>
      )}
    </article>
  )
}

function FieldControl({
  field,
  labelledBy,
  describedBy,
  rules,
  defaults,
  onChange,
}: {
  field: Field
  labelledBy: string
  describedBy?: string
  rules: Rules
  defaults: Rules
  onChange: (r: Rules) => void
}) {
  const reason = field.disabled?.(rules) ?? null
  const value = getField(rules, field.key)
  const set = (v: unknown) => onChange(setField(rules, field.key, v))
  const labelId = `${labelledBy}-${field.key}`
  const aria = { "aria-labelledby": field.label ? labelId : labelledBy, "aria-describedby": describedBy }

  let control: ReactNode
  const c: Control = field.control
  switch (c.kind) {
    case "choice":
      control = (
        <ToggleGroup
          type="single"
          variant="outline"
          orientation="vertical"
          disabled={!!reason}
          value={String(value)}
          onValueChange={(v) => {
            const opt = c.options.find((o) => String(o.value) === v)
            if (opt) set(opt.value)
          }}
          className="w-full"
          {...aria}
        >
          {c.options.map((o) => (
            <ToggleGroupItem
              key={String(o.value)}
              value={String(o.value)}
              className="h-auto min-h-11 justify-start px-3 py-2 text-left whitespace-normal"
            >
              <WithSuits text={o.label} />
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      )
      break
    case "number":
      control = <NumberControl control={c} value={value as number} disabled={!!reason} onChange={set} aria={aria} />
      break
    case "ranks":
      control = (
        <ToggleGroup
          type="multiple"
          variant="outline"
          value={(value as Rank[]).map(String)}
          onValueChange={(vs) => onChange(withRanks(rules, defaults, vs.map(Number) as Rank[]))}
          className="flex w-full flex-wrap gap-1.5"
          {...aria}
        >
          {(defaults.deck.order ?? []).map((k) => (
            <ToggleGroupItem key={k} value={String(k)} aria-label={rankName(k)} className="font-sans text-lg font-bold">
              {RANK_LABEL[k]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      )
      break
    case "rankOrder":
      control = (
        <OrderControl
          items={value as Rank[]}
          label={(k) => RANK_LABEL[k]}
          spoken={(k) => rankName(k)}
          disabled={!!reason}
          onChange={set}
          aria={aria}
        />
      )
      break
    case "suitOrder":
      control = (
        <OrderControl
          items={value as Suit[]}
          label={(s) => SUIT_GLYPH[s]}
          spoken={(s) => SUIT_NAME[s]}
          masculine
          red={(s) => s === Suit.Diamonds || s === Suit.Hearts}
          disabled={!!reason}
          onChange={set}
          aria={aria}
        />
      )
      break
  }

  return (
    <div className="flex flex-col gap-1.5">
      {field.label && (
        <span id={labelId} className="text-sm font-bold">
          {field.label}
        </span>
      )}
      {control}
      {reason && <p className="text-sm text-muted-foreground">{reason}</p>}
    </div>
  )
}

/** Rule 1 changes rule 2 too: a new rank joins the order where the default puts it. */
function withRanks(rules: Rules, defaults: Rules, ranks: Rank[]): Rules {
  const def = defaults.deck.order ?? []
  const sortedRanks = [...ranks].sort((a, b) => def.indexOf(a) - def.indexOf(b))
  let order = (rules.deck.order ?? []).filter((k) => ranks.includes(k))
  for (const k of sortedRanks) {
    if (order.includes(k)) continue
    const after = order.findIndex((o) => def.indexOf(o) > def.indexOf(k))
    order = after < 0 ? [...order, k] : [...order.slice(0, after), k, ...order.slice(after)]
  }
  return setField(setField(rules, "deck.ranks", sortedRanks), "deck.order", order)
}

type Aria = { "aria-labelledby": string; "aria-describedby"?: string }

function NumberControl({
  control,
  value,
  disabled,
  onChange,
  aria,
}: {
  control: Extract<Control, { kind: "number" }>
  value: number
  disabled: boolean
  onChange: (v: number) => void
  aria: Aria
}) {
  const unlimited = control.unlimited !== undefined && value === 0
  const clamp = (v: number) => Math.min(control.max, Math.max(control.min, v))
  const [text, setText] = useState(String(value))
  useEffect(() => setText(String(value)), [value])

  const commit = () => {
    const n = Number(text)
    if (Number.isFinite(n) && text !== "") onChange(clamp(Math.round(n)))
    else setText(String(value))
  }

  return (
    <div className="flex flex-col gap-2">
      {!unlimited && (
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="icon"
            disabled={disabled || value <= control.min}
            onClick={() => onChange(clamp(value - 1))}
            aria-label="Menos um"
          >
            −
          </Button>
          <Input
            type="number"
            inputMode="numeric"
            min={control.min}
            max={control.max}
            disabled={disabled}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => e.key === "Enter" && commit()}
            className="w-20 text-center font-sans text-lg font-bold"
            {...aria}
          />
          <Button
            variant="outline"
            size="icon"
            disabled={disabled || value >= control.max}
            onClick={() => onChange(clamp(value + 1))}
            aria-label="Mais um"
          >
            +
          </Button>
        </div>
      )}
      {control.unlimited && (
        <label className="flex min-h-11 items-center gap-2">
          <input
            type="checkbox"
            className="size-5 accent-foreground"
            checked={unlimited}
            disabled={disabled}
            onChange={(e) => onChange(e.target.checked ? 0 : clamp(8))}
          />
          {control.unlimited}
        </label>
      )}
    </div>
  )
}

/** Pick an item, then move it toward the weak or the strong end. Works the same by keyboard. */
function OrderControl<T extends number>({
  items,
  label,
  spoken,
  red,
  masculine,
  disabled,
  onChange,
  aria,
}: {
  items: T[]
  label: (t: T) => string
  spoken: (t: T) => string
  red?: (t: T) => boolean
  /** Suits (naipes) are masculine; cards (cartas) feminine. */
  masculine?: boolean
  disabled: boolean
  onChange: (v: T[]) => void
  aria: Aria
}) {
  const [picked, setPicked] = useState<T | null>(null)
  const [said, setSaid] = useState("")
  const i = picked === null ? -1 : items.indexOf(picked)
  const o = masculine ? "º" : "ª"
  const weakest = masculine ? "do mais fraco para o mais forte" : "da mais fraca para a mais forte"

  const move = (step: number) => {
    const j = i + step
    if (i < 0 || j < 0 || j >= items.length) return
    const next = [...items]
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
    setSaid(`${spoken(items[i])} agora é ${masculine ? "o" : "a"} ${j + 1}${o} de ${items.length}, ${weakest}.`)
  }

  return (
    <div className="flex flex-col gap-2">
      <ToggleGroup
        type="single"
        variant="outline"
        disabled={disabled}
        value={picked === null ? "" : String(picked)}
        onValueChange={(v) => setPicked(v === "" ? null : (Number(v) as T))}
        className="flex w-full flex-wrap gap-1.5"
        {...aria}
      >
        {items.map((t, k) => (
          <ToggleGroupItem
            key={t}
            value={String(t)}
            aria-label={`${spoken(t)}, ${k + 1}${o}`}
            className={cn("font-sans text-lg font-bold", red?.(t) && "text-destructive data-[state=on]:text-card")}
          >
            {label(t)}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" disabled={disabled || i <= 0} onClick={() => move(-1)}>
          {masculine ? "Mais fraco" : "Mais fraca"}
        </Button>
        <Button variant="outline" disabled={disabled || i < 0 || i >= items.length - 1} onClick={() => move(1)}>
          Mais forte
        </Button>
      </div>
      <p className="sr-only" aria-live="polite">
        {said}
      </p>
    </div>
  )
}
