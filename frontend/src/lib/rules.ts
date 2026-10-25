import {
  AllCancelled,
  BidStart,
  DealerMove,
  Direction,
  End,
  FirstLeader,
  Follow,
  LossRule,
  ManilhaMode,
  NextLeader,
  Rank,
  Restricted,
  Seat,
  Sequence,
  Tie,
  TrickWinner,
  type Rules,
} from "../../bindings/vazae/game/models"
import { RANK_LABEL, SUIT_GLYPH } from "./cards"

// Every rule of play, numbered as the players know them, with the copy the
// editor and the rules dialog show. The engine (game/rules.go) owns the logic;
// this file only names and describes it.

export type GroupId = "deck" | "players" | "rounds" | "bidding" | "tricks" | "oneCard" | "end"

export const GROUPS: { id: GroupId; title: string }[] = [
  { id: "deck", title: "Baralho e manilha" },
  { id: "players", title: "Jogadores" },
  { id: "rounds", title: "Rodadas" },
  { id: "bidding", title: "Palpites" },
  { id: "tricks", title: "Vazas" },
  { id: "oneCard", title: "Rodada de 1 carta" },
  { id: "end", title: "Fim da partida" },
]

type Option = { value: string | number | boolean; label: string }

export type Control =
  | { kind: "choice"; options: Option[] }
  | { kind: "number"; min: number; max: number; unlimited?: string }
  | { kind: "ranks" }
  | { kind: "rankOrder" }
  | { kind: "suitOrder" }

export type Field = {
  /** JSON path in game.Rules, e.g. "deck.order". Matches RuleError.key. */
  key: string
  label?: string
  control: Control
  /** Why the field can't change under the other rules, or null. */
  disabled?: (r: Rules) => string | null
  /** Hide the field entirely under the other rules. */
  hidden?: (r: Rules) => boolean
}

export type RuleMeta = {
  n: number
  group: GroupId
  title: string
  hint?: string
  fields: Field[]
  /** Rules with no real alternative are shown with this reason instead of controls. */
  locked?: string
}

const yesNo = (yes: string, no: string): Control => ({
  kind: "choice",
  options: [
    { value: true, label: yes },
    { value: false, label: no },
  ],
})

export const RULES: RuleMeta[] = [
  {
    n: 1,
    group: "deck",
    title: "Cartas no baralho",
    hint: "Cada valor vem nos quatro naipes.",
    fields: [{ key: "deck.ranks", control: { kind: "ranks" } }],
  },
  {
    n: 2,
    group: "deck",
    title: "Ordem de força",
    hint: "Da mais fraca para a mais forte. Escolha uma e mova.",
    fields: [{ key: "deck.order", control: { kind: "rankOrder" } }],
  },
  {
    n: 3,
    group: "deck",
    title: "Manilha",
    fields: [
      {
        key: "manilha.mode",
        control: {
          kind: "choice",
          options: [
            { value: ManilhaMode.ManilhaVira, label: "Pela vira: o valor seguinte ao da carta virada" },
            { value: ManilhaMode.ManilhaFixed, label: "Manilha velha, fixa: 4♣ 7♥ A♠ 7♦" },
            { value: ManilhaMode.ManilhaNone, label: "Sem manilha" },
          ],
        },
      },
    ],
  },
  {
    n: 4,
    group: "deck",
    title: "Força da manilha",
    fields: [
      {
        key: "manilha.aboveAll",
        control: yesNo("Ganha de qualquer carta", "Fica no lugar do seu valor e só passa à frente das cartas iguais a ela"),
        disabled: (r) => (r.manilha.mode === ManilhaMode.ManilhaNone ? "Sem manilha nesta partida." : null),
      },
    ],
  },
  {
    n: 5,
    group: "deck",
    title: "Naipes da manilha",
    hint: "Do mais fraco para o mais forte. Escolha um e mova.",
    fields: [
      {
        key: "manilha.suitOrder",
        control: { kind: "suitOrder" },
        disabled: (r) =>
          r.manilha.mode === ManilhaMode.ManilhaFixed
            ? "A manilha velha tem ordem própria: 7♦, A♠, 7♥, 4♣."
            : r.manilha.mode === ManilhaMode.ManilhaNone
              ? "Sem manilha nesta partida."
              : null,
      },
    ],
  },
  {
    n: 6,
    group: "players",
    title: "Mínimo de jogadores",
    fields: [{ key: "players.min", control: { kind: "number", min: 2, max: 8 } }],
  },
  {
    n: 7,
    group: "players",
    title: "Máximo de jogadores",
    hint: "Contra robôs, a mesa tem no máximo 8 lugares.",
    fields: [{ key: "players.max", control: { kind: "number", min: 2, max: 40, unlimited: "O que o baralho permitir" } }],
  },
  {
    n: 8,
    group: "players",
    title: "Vidas",
    fields: [{ key: "players.lives", control: { kind: "number", min: 1, max: 15 } }],
  },
  {
    n: 9,
    group: "players",
    title: "Seu lugar na mesa",
    fields: [
      {
        key: "players.humanSeat",
        control: {
          kind: "choice",
          options: [
            { value: Seat.SeatFirst, label: "Primeiro lugar: você dá as cartas na primeira rodada" },
            { value: Seat.SeatRandom, label: "Sorteado a cada partida" },
          ],
        },
      },
    ],
  },
  {
    n: 10,
    group: "rounds",
    title: "Cartas por rodada",
    fields: [
      {
        key: "rounds.sequence",
        control: {
          kind: "choice",
          options: [
            { value: Sequence.SeqUpDown, label: "Sobe e desce: 1, 2… até o máximo, desce até 2 e recomeça" },
            { value: Sequence.SeqUpDownFull, label: "Sobe e desce até 1" },
            { value: Sequence.SeqUp, label: "Só sobe: 1, 2… até o máximo e recomeça" },
            { value: Sequence.SeqDown, label: "Só desce: do máximo até 1 e recomeça" },
            { value: Sequence.SeqFixed, label: "Sempre o máximo" },
          ],
        },
      },
    ],
  },
  {
    n: 11,
    group: "rounds",
    title: "Máximo de cartas na mão",
    fields: [{ key: "rounds.maxCards", control: { kind: "number", min: 1, max: 10, unlimited: "O que o baralho permitir, até 10" } }],
  },
  {
    n: 12,
    group: "rounds",
    title: "Quando alguém sai",
    fields: [
      {
        key: "rounds.growWhenFewer",
        control: yesNo("As mãos podem crescer, porque sobram mais cartas", "O máximo de cartas continua o mesmo"),
      },
    ],
  },
  {
    n: 13,
    group: "rounds",
    title: "Carta virada (vira)",
    fields: [
      {
        key: "rounds.reserveVira",
        control: yesNo("Uma carta é virada na mesa", "Nenhuma carta é virada"),
        disabled: (r) => (r.manilha.mode === ManilhaMode.ManilhaVira ? "A manilha pela vira precisa da carta virada." : null),
      },
    ],
  },
  {
    n: 14,
    group: "rounds",
    title: "Quem dá as cartas",
    fields: [
      {
        key: "rounds.dealer",
        control: {
          kind: "choice",
          options: [
            { value: DealerMove.DealerNext, label: "Passa para o próximo a cada rodada" },
            { value: DealerMove.DealerStays, label: "O mesmo jogador, enquanto estiver na mesa" },
          ],
        },
      },
    ],
  },
  {
    n: 15,
    group: "rounds",
    title: "Quem saiu não joga",
    fields: [],
    locked: "Quem perdeu todas as vidas não recebe cartas, não palpita e não joga.",
  },
  {
    n: 16,
    group: "bidding",
    title: "Ordem dos palpites",
    fields: [
      {
        key: "bidding.order",
        control: {
          kind: "choice",
          options: [
            { value: BidStart.BidLeftOfDealer, label: "Começa por quem está depois de quem deu" },
            { value: BidStart.BidDealerFirst, label: "Começa por quem deu as cartas" },
          ],
        },
      },
      {
        key: "bidding.direction",
        label: "Sentido da mesa (vale também para jogar e dar as cartas)",
        control: {
          kind: "choice",
          options: [
            { value: Direction.Clockwise, label: "Horário" },
            { value: Direction.Counter, label: "Anti-horário" },
          ],
        },
      },
    ],
  },
  {
    n: 17,
    group: "bidding",
    title: "Menor palpite",
    fields: [
      {
        key: "bidding.minBid",
        control: {
          kind: "choice",
          options: [
            { value: 0, label: "Pode palpitar 0" },
            { value: 1, label: "Pelo menos 1" },
          ],
        },
      },
    ],
  },
  {
    n: 18,
    group: "bidding",
    title: "Quem tem a restrição da soma",
    fields: [
      {
        key: "bidding.restricted",
        control: {
          kind: "choice",
          options: [
            { value: Restricted.RestrictLastBidder, label: "Quem palpita por último (o pé)" },
            { value: Restricted.RestrictDealer, label: "Quem deu as cartas" },
          ],
        },
        disabled: (r) => (r.bidding.sumRule ? null : "A soma está liberada (regra 19)."),
      },
    ],
  },
  {
    n: 19,
    group: "bidding",
    title: "Soma dos palpites",
    fields: [
      {
        key: "bidding.sumRule",
        control: yesNo("Não pode bater com o número de cartas", "Pode dar qualquer total"),
      },
    ],
  },
  {
    n: 20,
    group: "bidding",
    title: "Quem abre a primeira vaza",
    fields: [
      {
        key: "tricks.firstLeader",
        control: {
          kind: "choice",
          options: [
            { value: FirstLeader.LeadFirstBidder, label: "Quem palpitou primeiro" },
            { value: FirstLeader.LeadDealer, label: "Quem deu as cartas" },
            { value: FirstLeader.LeadHighestBid, label: "Quem palpitou mais" },
          ],
        },
      },
    ],
  },
  {
    n: 21,
    group: "tricks",
    title: "Naipe",
    fields: [
      {
        key: "tricks.follow",
        control: {
          kind: "choice",
          options: [
            { value: Follow.FollowFree, label: "Joga qualquer carta" },
            { value: Follow.FollowSuit, label: "Segue o naipe de quem abriu, se tiver" },
          ],
        },
      },
    ],
  },
  {
    n: 22,
    group: "tricks",
    title: "Uma carta de cada",
    fields: [],
    locked: "Uma vaza é uma carta de cada jogador que ainda está na mesa.",
  },
  {
    n: 23,
    group: "tricks",
    title: "Quem leva a vaza",
    fields: [
      {
        key: "tricks.winner",
        control: {
          kind: "choice",
          options: [
            { value: TrickWinner.WinStrongest, label: "A carta mais forte" },
            { value: TrickWinner.WinWeakest, label: "A carta mais fraca" },
          ],
        },
      },
    ],
  },
  {
    n: 24,
    group: "tricks",
    title: "Cartas iguais",
    hint: "Só se anulam as que empatam no topo da vaza, as que levariam. Um par abaixo de uma carta que ganha dele vale normalmente.",
    fields: [{ key: "tricks.cancelEqual", control: yesNo("Se anulam", "Valem normalmente; a primeira jogada ganha o empate") }],
  },
  {
    n: 25,
    group: "tricks",
    title: "Manilhas iguais",
    fields: [
      {
        key: "tricks.manilhasCancel",
        control: yesNo("Também se anulam", "Nunca se anulam"),
        disabled: (r) =>
          !r.tricks.cancelEqual
            ? "Cartas iguais não se anulam (regra 24)."
            : r.manilha.mode === ManilhaMode.ManilhaNone
              ? "Sem manilha nesta partida."
              : null,
      },
    ],
  },
  {
    n: 26,
    group: "tricks",
    title: "Se todas se anularem",
    fields: [
      {
        key: "tricks.allCancelled",
        control: {
          kind: "choice",
          options: [
            { value: AllCancelled.CancelSameLeader, label: "Ninguém leva, e quem abriu abre de novo" },
            { value: AllCancelled.CancelNextLeads, label: "Ninguém leva, e o próximo abre" },
            { value: AllCancelled.CancelLastCardWins, label: "Leva quem jogou a última carta" },
          ],
        },
      },
    ],
  },
  {
    n: 36,
    group: "tricks",
    title: "Anulação deixa a vaza sem dono",
    hint: "Quando as cartas de cima da vaza se anulam, define se as outras ainda disputam. Se a vaza fica sem dono, vale a regra 26.",
    fields: [
      {
        key: "tricks.cancelVoidsTrick",
        control: yesNo("Ninguém leva a vaza", "A próxima carta mais forte leva"),
        disabled: (r) => (!r.tricks.cancelEqual ? "Cartas iguais não se anulam (regra 24)." : null),
      },
    ],
  },
  {
    n: 27,
    group: "tricks",
    title: "Quem abre a vaza seguinte",
    fields: [
      {
        key: "tricks.nextLeader",
        control: {
          kind: "choice",
          options: [
            { value: NextLeader.NextWinner, label: "Quem levou a vaza" },
            { value: NextLeader.NextRotate, label: "O próximo da mesa, em rodízio" },
          ],
        },
      },
    ],
  },
  {
    n: 28,
    group: "tricks",
    title: "Fim da rodada",
    fields: [],
    locked: "A rodada acaba quando as mãos esvaziam: não sobra o que jogar.",
  },
  {
    n: 29,
    group: "oneCard",
    title: "Carta na testa",
    fields: [
      {
        key: "oneCard.blind",
        control: yesNo("Você vê a carta dos outros, mas não a sua", "Rodada normal: cada um vê só a própria carta"),
      },
    ],
  },
  {
    n: 30,
    group: "oneCard",
    title: "Jogar sem ver",
    fields: [],
    locked: "Segue a regra 29: com a carta na testa, você joga a sua sem saber qual é.",
  },
  {
    n: 31,
    group: "end",
    title: "Vidas perdidas",
    fields: [
      {
        key: "scoring.loss",
        control: {
          kind: "choice",
          options: [
            { value: LossRule.LossDifference, label: "Uma por vaza de diferença do palpite" },
            { value: LossRule.LossOnePerMiss, label: "Uma por rodada errada, seja qual for a diferença" },
          ],
        },
      },
    ],
  },
  {
    n: 32,
    group: "end",
    title: "Quem zera, sai",
    fields: [],
    locked: "Sem vidas, não há como continuar na mesa.",
  },
  {
    n: 33,
    group: "end",
    title: "Fim da partida",
    hint: "Toda partida acaba em até 300 rodadas; aí ganha quem tiver mais vidas.",
    fields: [
      {
        key: "scoring.end",
        control: {
          kind: "choice",
          options: [
            { value: End.EndLastStanding, label: "Quando sobra um jogador" },
            { value: End.EndRounds, label: "Depois de um número de rodadas; ganha quem tiver mais vidas" },
          ],
        },
      },
      {
        key: "scoring.rounds",
        label: "Rodadas",
        control: { kind: "number", min: 1, max: 100 },
        hidden: (r) => r.scoring.end !== End.EndRounds,
      },
    ],
  },
  {
    n: 34,
    group: "end",
    title: "Quem ganha",
    fields: [],
    locked: "Segue a regra 33: o último na mesa, ou quem tiver mais vidas no fim.",
  },
  {
    n: 35,
    group: "end",
    title: "Empate",
    hint: "Vale quando todos saem na mesma rodada ou quando a partida acaba empatada em vidas.",
    fields: [
      {
        key: "scoring.tie",
        control: {
          kind: "choice",
          options: [
            { value: Tie.TieFirstSeat, label: "Ganha quem está antes na mesa" },
            { value: Tie.TieDraw, label: "Fica empate" },
            { value: Tie.TieExtraRound, label: "Uma rodada extra entre os empatados; se empatarem de novo, fica empate" },
          ],
        },
      },
    ],
  },
]

// --- reading and changing rules by key ---

export function getField(r: Rules, key: string): unknown {
  return key.split(".").reduce<unknown>((o, k) => (o as Record<string, unknown>)?.[k], r)
}

export function setField(r: Rules, key: string, value: unknown): Rules {
  const next = structuredClone(r)
  const path = key.split(".")
  let o = next as unknown as Record<string, unknown>
  for (const k of path.slice(0, -1)) o = o[k] as Record<string, unknown>
  o[path[path.length - 1]] = value
  return next
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

/** Rule numbers whose settings differ from the defaults. */
export function changedRules(r: Rules, defaults: Rules): Set<number> {
  const out = new Set<number>()
  for (const m of RULES) {
    if (m.fields.some((f) => !same(getField(r, f.key), getField(defaults, f.key)))) out.add(m.n)
  }
  return out
}

/** Fills fields missing from an older saved set with the defaults. */
export function withDefaults(partial: unknown, defaults: Rules): Rules {
  const out = structuredClone(defaults) as unknown as Record<string, Record<string, unknown>>
  if (partial && typeof partial === "object") {
    for (const [group, values] of Object.entries(partial as Record<string, unknown>)) {
      if (out[group] && values && typeof values === "object") Object.assign(out[group], values)
    }
  }
  return out as unknown as Rules
}

// --- the rules in words, for the "Como se joga" dialog ---

const ranks = (r: Rules) => (r.deck.order ?? []).map((k) => RANK_LABEL[k]).join(" ")

/** "a, b e c" */
const listPt = (items: string[]) => (items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} e ${items[items.length - 1]}`)

export function describe(r: Rules): { title: string; text: string }[] {
  const missing = (Object.keys(RANK_LABEL).map(Number) as Rank[]).filter((k) => !(r.deck.ranks ?? []).includes(k))
  const left = listPt(["8", "9", "10", ...missing.map((k) => RANK_LABEL[k])])
  const fixed = "7♦ < A♠ < 7♥ < 4♣"
  const suits = (r.manilha.suitOrder ?? []).map((s) => SUIT_GLYPH[s]).join(" < ")

  const manilha =
    r.manilha.mode === ManilhaMode.ManilhaNone
      ? "Não há manilha."
      : (r.manilha.mode === ManilhaMode.ManilhaVira
          ? `Depois de dar as cartas, uma é virada na mesa. A manilha é o valor seguinte na ordem (depois do último vem o primeiro). Entre manilhas vale o naipe: ${suits}.`
          : `A manilha é fixa, a manilha velha: ${fixed}.`) +
        (r.manilha.aboveAll ? " Manilha ganha de qualquer outra carta." : " A manilha fica no lugar do seu valor e só passa à frente das cartas iguais a ela.")

  const seq: Record<Sequence, string> = {
    [Sequence.$zero]: "",
    [Sequence.SeqUpDown]: "A primeira rodada tem 1 carta, a seguinte 2, e assim até o máximo. Depois desce até 2 e o ciclo recomeça.",
    [Sequence.SeqUpDownFull]: "A primeira rodada tem 1 carta, a seguinte 2, e assim até o máximo. Depois desce até 1 e o ciclo recomeça.",
    [Sequence.SeqUp]: "A primeira rodada tem 1 carta, a seguinte 2, e assim até o máximo; depois recomeça de 1.",
    [Sequence.SeqDown]: "A primeira rodada tem o máximo de cartas, e cada rodada uma a menos até 1; depois recomeça.",
    [Sequence.SeqFixed]: "Toda rodada tem o máximo de cartas.",
  }
  const max = r.rounds.maxCards > 0 ? `O máximo é ${r.rounds.maxCards} cartas, se o baralho der.` : "O máximo é o que o baralho permite, até 10."

  const pe =
    r.bidding.restricted === Restricted.RestrictDealer ? "Quem deu as cartas" : "Quem palpita por último (o pé)"
  const bidding = [
    r.bidding.order === BidStart.BidDealerFirst ? "Quem deu as cartas palpita primeiro" : "Os palpites começam depois de quem deu as cartas",
    r.bidding.direction === Direction.Counter ? ", em sentido anti-horário." : ", em sentido horário.",
    r.bidding.minBid === 1 ? " Cada um palpita pelo menos 1 vaza." : " Cada um diz quantas vazas vai fazer.",
    r.bidding.sumRule ? ` ${pe} não pode fazer a soma dos palpites bater com o número de cartas.` : " A soma dos palpites é livre.",
  ].join("")

  const firstLead: Record<FirstLeader, string> = {
    [FirstLeader.$zero]: "",
    [FirstLeader.LeadFirstBidder]: "Quem palpitou primeiro abre a primeira vaza.",
    [FirstLeader.LeadDealer]: "Quem deu as cartas abre a primeira vaza.",
    [FirstLeader.LeadHighestBid]: "Quem palpitou mais abre a primeira vaza.",
  }
  const allDead: Record<AllCancelled, string> = {
    [AllCancelled.$zero]: "",
    [AllCancelled.CancelSameLeader]: "Se todas se anularem, ninguém leva e quem abriu abre de novo.",
    [AllCancelled.CancelNextLeads]: "Se todas se anularem, ninguém leva e o próximo abre.",
    [AllCancelled.CancelLastCardWins]: "Se todas se anularem, leva quem jogou a última carta.",
  }
  const trick = [
    r.tricks.follow === Follow.FollowSuit ? "É preciso seguir o naipe de quem abriu, se tiver." : "Vale jogar qualquer carta.",
    r.tricks.winner === TrickWinner.WinWeakest ? "A carta mais fraca leva." : "A carta mais forte leva.",
    r.tricks.cancelEqual
      ? `Cartas iguais que empatam no topo da vaza se anulam${r.tricks.manilhasCancel ? ", manilhas também." : " (manilhas não)."} Um par abaixo de uma carta que ganha dele vale normalmente. ${
          r.tricks.cancelVoidsTrick
            ? `Havendo anulação, ninguém leva a vaza. ${allDead[r.tricks.allCancelled].replace("Se todas se anularem", "Nesse caso")}`
            : `Aí leva a próxima carta ${r.tricks.winner === TrickWinner.WinWeakest ? "mais fraca" : "mais forte"}. ${allDead[r.tricks.allCancelled]}`
        }`
      : "Cartas iguais não se anulam: entre elas, ganha a primeira jogada.",
    r.tricks.nextLeader === NextLeader.NextRotate ? "A vaza seguinte é aberta pelo próximo da mesa." : "Quem levou abre a seguinte.",
  ].join(" ")

  const tie: Record<Tie, string> = {
    [Tie.$zero]: "",
    [Tie.TieFirstSeat]: "No empate, ganha quem está antes na mesa.",
    [Tie.TieDraw]: "No empate, fica empate.",
    [Tie.TieExtraRound]: "No empate, os empatados jogam uma rodada extra; se empatarem de novo, fica empate.",
  }

  return [
    {
      title: "Baralho",
      text: `${(r.deck.ranks ?? []).length * 4} cartas, sem ${left}. Da mais fraca para a mais forte: ${ranks(r)}.`,
    },
    { title: "Manilha", text: manilha },
    {
      title: "Rodadas",
      text: `${seq[r.rounds.sequence]} ${max}${r.rounds.growWhenFewer ? " Quando alguém sai, as mãos podem crescer." : ""}${r.rounds.dealer === DealerMove.DealerStays ? " Quem dá as cartas é sempre o mesmo." : ""}`,
    },
    { title: "Palpite", text: `${bidding} ${firstLead[r.tricks.firstLeader]}` },
    { title: "Vaza", text: trick },
    {
      title: "Rodada de 1 carta",
      text: r.oneCard.blind ? "Você vê a carta de todo mundo, menos a sua." : "Cada um vê só a própria carta, como nas outras rodadas.",
    },
    {
      title: "Vidas",
      text: [
        `Cada um começa com ${r.players.lives} ${r.players.lives === 1 ? "vida" : "vidas"}.`,
        r.scoring.loss === LossRule.LossOnePerMiss
          ? "Quem erra o palpite perde 1 vida."
          : "No fim da rodada, cada um perde tantas vidas quanto errou o palpite, para mais ou para menos.",
        "Quem fica sem vida sai.",
        r.scoring.end === End.EndRounds
          ? `A partida tem ${r.scoring.rounds} ${r.scoring.rounds === 1 ? "rodada" : "rodadas"}; ganha quem tiver mais vidas, ou o último na mesa.`
          : "Ganha o último na mesa.",
        tie[r.scoring.tie],
      ].join(" "),
    },
  ]
}

