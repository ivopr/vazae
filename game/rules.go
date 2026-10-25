package game

import (
	"encoding/json"
	"fmt"
)

// Rules holds every rule a match can change. The zero value is not valid; start
// from DefaultRules. JSON keys are stable: the frontend and RuleError use them.
type Rules struct {
	Deck    DeckRules    `json:"deck"`
	Manilha ManilhaRules `json:"manilha"`
	Players PlayerRules  `json:"players"`
	Rounds  RoundRules   `json:"rounds"`
	Bidding BiddingRules `json:"bidding"`
	Tricks  TrickRules   `json:"tricks"`
	OneCard OneCardRules `json:"oneCard"`
	Scoring ScoringRules `json:"scoring"`
}

type DeckRules struct {
	Ranks []Rank `json:"ranks"` // which ranks are in the deck (four suits each)
	Order []Rank `json:"order"` // the same ranks, weakest first
}

type ManilhaMode string

const (
	ManilhaVira  ManilhaMode = "vira"  // the rank after the vira in Deck.Order
	ManilhaFixed ManilhaMode = "fixed" // 4♣ 7♥ A♠ 7♦, whatever the vira
	ManilhaNone  ManilhaMode = "none"
)

type ManilhaRules struct {
	Mode ManilhaMode `json:"mode"`
	// AboveAll puts manilhas above every other card; otherwise a manilha keeps
	// its rank's place and only beats plain cards of that rank.
	AboveAll bool `json:"aboveAll"`
	// SuitOrder ranks manilhas of the same rank, weakest first. Fixed manilhas
	// have their own order (FixedManilhas).
	SuitOrder []Suit `json:"suitOrder"`
}

type Seat string

const (
	SeatFirst  Seat = "first"
	SeatRandom Seat = "random"
)

type PlayerRules struct {
	Min int `json:"min"`
	// Max of 0 means as many as the deck can deal one card each.
	Max       int  `json:"max"`
	Lives     int  `json:"lives"`
	HumanSeat Seat `json:"humanSeat"`
}

type Sequence string

const (
	SeqUpDown     Sequence = "upDown"     // 1, 2, …, max, max-1, …, 2, then again from 1
	SeqUpDownFull Sequence = "upDownFull" // 1, 2, …, max, max-1, …, 1
	SeqUp         Sequence = "up"         // 1, 2, …, max
	SeqDown       Sequence = "down"       // max, …, 1
	SeqFixed      Sequence = "fixed"      // always max
)

type DealerMove string

const (
	DealerNext  DealerMove = "next"
	DealerStays DealerMove = "stays"
)

type RoundRules struct {
	Sequence Sequence `json:"sequence"`
	// MaxCards caps the largest hand; 0 means as many as the deck allows, up to 10.
	MaxCards int `json:"maxCards"`
	// GrowWhenFewer recomputes the largest hand from the players still in.
	GrowWhenFewer bool       `json:"growWhenFewer"`
	ReserveVira   bool       `json:"reserveVira"`
	Dealer        DealerMove `json:"dealer"`
}

type BidStart string

const (
	BidLeftOfDealer BidStart = "leftOfDealer"
	BidDealerFirst  BidStart = "dealerFirst"
)

type Direction string

const (
	Clockwise Direction = "clockwise"
	Counter   Direction = "counter"
)

type Restricted string

const (
	RestrictLastBidder Restricted = "lastBidder"
	RestrictDealer     Restricted = "dealer"
)

type BiddingRules struct {
	Order BidStart `json:"order"`
	// Direction sets the order of bidding, play and dealing.
	Direction  Direction  `json:"direction"`
	MinBid     int        `json:"minBid"`
	Restricted Restricted `json:"restricted"`
	// SumRule stops the restricted bidder making the bids add up to the cards in hand.
	SumRule bool `json:"sumRule"`
}

type FirstLeader string

const (
	LeadFirstBidder FirstLeader = "firstBidder"
	LeadDealer      FirstLeader = "dealer"
	LeadHighestBid  FirstLeader = "highestBid"
)

type Follow string

const (
	FollowFree Follow = "free"
	FollowSuit Follow = "followSuit"
)

type TrickWinner string

const (
	WinStrongest TrickWinner = "strongest"
	WinWeakest   TrickWinner = "weakest"
)

type AllCancelled string

const (
	CancelSameLeader   AllCancelled = "sameLeader"
	CancelNextLeads    AllCancelled = "nextLeads"
	CancelLastCardWins AllCancelled = "lastCardWins"
)

type NextLeader string

const (
	NextWinner NextLeader = "winner"
	NextRotate NextLeader = "rotate"
)

type TrickRules struct {
	FirstLeader    FirstLeader `json:"firstLeader"`
	Follow         Follow      `json:"follow"`
	Winner         TrickWinner `json:"winner"`
	CancelEqual    bool        `json:"cancelEqual"`
	ManilhasCancel bool        `json:"manilhasCancel"`
	// CancelVoidsTrick: a cancelled pair leaves the trick with no winner,
	// instead of the next card taking it. AllCancelled then applies.
	CancelVoidsTrick bool         `json:"cancelVoidsTrick"`
	AllCancelled     AllCancelled `json:"allCancelled"`
	NextLeader       NextLeader   `json:"nextLeader"`
}

type OneCardRules struct {
	// Blind: in one-card rounds you see everyone's card but your own.
	Blind bool `json:"blind"`
}

type LossRule string

const (
	LossDifference LossRule = "difference"
	LossOnePerMiss LossRule = "onePerMiss"
)

type End string

const (
	EndLastStanding End = "lastStanding"
	EndRounds       End = "rounds"
)

type Tie string

const (
	TieFirstSeat  Tie = "firstSeat"
	TieDraw       Tie = "draw"
	TieExtraRound Tie = "extraRound"
)

type ScoringRules struct {
	Loss   LossRule `json:"loss"`
	End    End      `json:"end"`
	Rounds int      `json:"rounds"` // match length when End is EndRounds
	Tie    Tie      `json:"tie"`
}

// FixedManilhas are the "manilha velha" cards, weakest first.
var FixedManilhas = []Card{{Seven, Diamonds}, {Ace, Spades}, {Seven, Hearts}, {Four, Clubs}}

func allRanks() []Rank {
	r := make([]Rank, 0, numRanks)
	for k := Rank(0); k < numRanks; k++ {
		r = append(r, k)
	}
	return r
}

// DefaultRules is the game as Vazaê has always played it.
func DefaultRules() Rules {
	return Rules{
		Deck:    DeckRules{Ranks: allRanks(), Order: allRanks()},
		Manilha: ManilhaRules{Mode: ManilhaVira, AboveAll: true, SuitOrder: []Suit{Diamonds, Spades, Hearts, Clubs}},
		Players: PlayerRules{Min: 2, Lives: 5, HumanSeat: SeatFirst},
		Rounds:  RoundRules{Sequence: SeqUpDown, ReserveVira: true, Dealer: DealerNext},
		Bidding: BiddingRules{Order: BidLeftOfDealer, Direction: Clockwise, Restricted: RestrictLastBidder, SumRule: true},
		Tricks: TrickRules{
			FirstLeader: LeadFirstBidder, Follow: FollowFree, Winner: WinStrongest,
			CancelEqual: true, AllCancelled: CancelSameLeader, NextLeader: NextWinner,
		},
		OneCard: OneCardRules{Blind: true},
		Scoring: ScoringRules{Loss: LossDifference, End: EndLastStanding, Rounds: 10, Tie: TieFirstSeat},
	}
}

type Preset struct {
	ID    string `json:"id"`
	Name  string `json:"name"`
	Rules Rules  `json:"rules"`
}

// Presets are the built-in rule sets.
func Presets() []Preset {
	velha := DefaultRules()
	velha.Manilha.Mode = ManilhaFixed
	return []Preset{
		{ID: "padrao", Name: "Padrão", Rules: DefaultRules()},
		{ID: "manilha-velha", Name: "Manilha velha", Rules: velha},
	}
}

// ParseRules decodes JSON over DefaultRules, so a rule set saved before a rule
// existed still loads with that rule at its default.
func ParseRules(b []byte) (Rules, error) {
	r := DefaultRules()
	err := json.Unmarshal(b, &r)
	return r, err
}

// DeckLen is the number of cards in the deck.
func (r Rules) DeckLen() int { return len(r.Deck.Ranks) * int(numSuits) }

func (r Rules) vira() int {
	if r.Rounds.ReserveVira {
		return 1
	}
	return 0
}

// MostPlayers is how many players the deck can deal one card each.
func (r Rules) MostPlayers() int { return r.DeckLen() - r.vira() }

// MaxPlayers is the largest table these rules allow.
func (r Rules) MaxPlayers() int {
	if r.Players.Max > 0 {
		return r.Players.Max
	}
	return r.MostPlayers()
}

// RuleError names the rule by its JSON key, e.g. "deck.order".
type RuleError struct {
	Key string `json:"key"`
	Msg string `json:"msg"`
}

func (e RuleError) Error() string { return e.Key + ": " + e.Msg }

// Validate lists every problem; nil means the rules can be played.
func (r Rules) Validate() []RuleError {
	var errs []RuleError
	bad := func(key, msg string, a ...any) { errs = append(errs, RuleError{key, fmt.Sprintf(msg, a...)}) }

	seen := map[Rank]bool{}
	for _, k := range r.Deck.Ranks {
		if k < 0 || k >= numRanks || seen[k] {
			bad("deck.ranks", "Cartas repetidas ou desconhecidas no baralho.")
			break
		}
		seen[k] = true
	}
	if len(r.Deck.Ranks) == 0 {
		bad("deck.ranks", "O baralho precisa de pelo menos uma carta.")
	}
	inOrder := map[Rank]bool{}
	for _, k := range r.Deck.Order {
		inOrder[k] = true
	}
	if len(r.Deck.Order) != len(r.Deck.Ranks) || len(inOrder) != len(r.Deck.Order) {
		bad("deck.order", "A ordem de força precisa ter cada carta do baralho uma vez.")
	} else {
		for k := range seen {
			if !inOrder[k] {
				bad("deck.order", "A ordem de força precisa ter cada carta do baralho uma vez.")
				break
			}
		}
	}

	switch r.Manilha.Mode {
	case ManilhaVira:
		if !r.Rounds.ReserveVira {
			bad("rounds.reserveVira", "Com manilha pela vira, uma carta precisa ser virada.")
		}
	case ManilhaFixed:
		if !seen[Four] || !seen[Seven] || !seen[Ace] {
			bad("manilha.mode", "A manilha velha usa 4, 7 e A: deixe essas cartas no baralho.")
		}
	case ManilhaNone:
	default:
		bad("manilha.mode", "Modo de manilha desconhecido.")
	}
	suits := map[Suit]bool{}
	for _, s := range r.Manilha.SuitOrder {
		if s >= 0 && s < numSuits {
			suits[s] = true
		}
	}
	if len(r.Manilha.SuitOrder) != int(numSuits) || len(suits) != int(numSuits) {
		bad("manilha.suitOrder", "A ordem dos naipes precisa ter os quatro naipes uma vez.")
	}

	p := r.Players
	if p.Min < 2 {
		bad("players.min", "A mesa precisa de pelo menos 2 jogadores.")
	}
	if most := r.MostPlayers(); p.Max > most {
		bad("players.max", "Com este baralho cabem no máximo %d jogadores.", most)
	} else if p.Max < 0 || r.MaxPlayers() < p.Min {
		bad("players.max", "O máximo de jogadores não pode ser menor que o mínimo.")
	}
	if p.Lives < 1 || p.Lives > 15 {
		bad("players.lives", "As vidas vão de 1 a 15.")
	}
	if p.HumanSeat != SeatFirst && p.HumanSeat != SeatRandom {
		bad("players.humanSeat", "Lugar desconhecido.")
	}

	switch r.Rounds.Sequence {
	case SeqUpDown, SeqUpDownFull, SeqUp, SeqDown, SeqFixed:
	default:
		bad("rounds.sequence", "Sequência de rodadas desconhecida.")
	}
	if r.Rounds.MaxCards < 0 || r.Rounds.MaxCards > 10 {
		bad("rounds.maxCards", "O máximo de cartas vai de 1 a 10, ou sem limite.")
	}
	if r.Rounds.Dealer != DealerNext && r.Rounds.Dealer != DealerStays {
		bad("rounds.dealer", "Rodízio de quem dá desconhecido.")
	}

	b := r.Bidding
	if b.Order != BidLeftOfDealer && b.Order != BidDealerFirst {
		bad("bidding.order", "Quem começa a palpitar: opção desconhecida.")
	}
	if b.Direction != Clockwise && b.Direction != Counter {
		bad("bidding.direction", "Sentido desconhecido.")
	}
	if b.MinBid != 0 && b.MinBid != 1 {
		bad("bidding.minBid", "O menor palpite é 0 ou 1.")
	}
	if b.Restricted != RestrictLastBidder && b.Restricted != RestrictDealer {
		bad("bidding.restricted", "Quem tem a restrição: opção desconhecida.")
	}

	t := r.Tricks
	if t.FirstLeader != LeadFirstBidder && t.FirstLeader != LeadDealer && t.FirstLeader != LeadHighestBid {
		bad("tricks.firstLeader", "Quem abre a primeira vaza: opção desconhecida.")
	}
	if t.Follow != FollowFree && t.Follow != FollowSuit {
		bad("tricks.follow", "Regra de naipe desconhecida.")
	}
	if t.Winner != WinStrongest && t.Winner != WinWeakest {
		bad("tricks.winner", "Quem leva a vaza: opção desconhecida.")
	}
	if t.AllCancelled != CancelSameLeader && t.AllCancelled != CancelNextLeads && t.AllCancelled != CancelLastCardWins {
		bad("tricks.allCancelled", "Vaza toda anulada: opção desconhecida.")
	}
	if t.NextLeader != NextWinner && t.NextLeader != NextRotate {
		bad("tricks.nextLeader", "Quem abre a vaza seguinte: opção desconhecida.")
	}

	s := r.Scoring
	if s.Loss != LossDifference && s.Loss != LossOnePerMiss {
		bad("scoring.loss", "Perda de vidas: opção desconhecida.")
	}
	switch s.End {
	case EndLastStanding:
	case EndRounds:
		if s.Rounds < 1 || s.Rounds > 100 {
			bad("scoring.rounds", "Uma partida por rodadas tem de 1 a 100 rodadas.")
		}
	default:
		bad("scoring.end", "Fim de partida: opção desconhecida.")
	}
	if s.Tie != TieFirstSeat && s.Tie != TieDraw && s.Tie != TieExtraRound {
		bad("scoring.tie", "Desempate: opção desconhecida.")
	}
	return errs
}

// sequence lists the hand sizes of one cycle of rounds.
func (r Rules) sequence(players int) []int {
	max := (r.DeckLen() - r.vira()) / players
	if max > 10 {
		max = 10
	}
	if r.Rounds.MaxCards > 0 && r.Rounds.MaxCards < max {
		max = r.Rounds.MaxCards
	}
	if max < 1 {
		max = 1
	}
	var seq []int
	switch r.Rounds.Sequence {
	case SeqFixed:
		return []int{max}
	case SeqDown:
		for i := max; i >= 1; i-- {
			seq = append(seq, i)
		}
		return seq
	}
	for i := 1; i <= max; i++ {
		seq = append(seq, i)
	}
	switch r.Rounds.Sequence {
	case SeqUpDown:
		for i := max - 1; i >= 2; i-- {
			seq = append(seq, i)
		}
	case SeqUpDownFull:
		for i := max - 1; i >= 1; i-- {
			seq = append(seq, i)
		}
	}
	return seq
}

// manilhas lists this round's manilhas, weakest first.
func (r Rules) manilhas(vira *Card) []Card {
	switch r.Manilha.Mode {
	case ManilhaFixed:
		return append([]Card(nil), FixedManilhas...)
	case ManilhaVira:
		if vira == nil {
			return nil
		}
		order := r.Deck.Order
		rank := order[0]
		for i, k := range order {
			if k == vira.Rank {
				rank = order[(i+1)%len(order)]
			}
		}
		var m []Card
		for _, s := range r.Manilha.SuitOrder {
			m = append(m, Card{rank, s})
		}
		return m
	}
	return nil
}

func manilhaIndex(manilhas []Card, c Card) int {
	for i, m := range manilhas {
		if m == c {
			return i
		}
	}
	return -1
}

// strength gives a total order for one trick, higher is stronger.
func (r Rules) strength(manilhas []Card, c Card) int {
	base := 0
	for i, k := range r.Deck.Order {
		if k == c.Rank {
			base = i
		}
	}
	if mi := manilhaIndex(manilhas, c); mi >= 0 {
		if r.Manilha.AboveAll {
			return 1000 + mi
		}
		return base*10 + 1 + mi
	}
	return base * 10
}

// cancelled marks the cards voided by an equal card in the same trick.
func (r Rules) cancelled(manilhas []Card, trick []Played) []bool {
	out := make([]bool, len(trick))
	if !r.Tricks.CancelEqual {
		return out
	}
	type key struct {
		rank    Rank
		manilha bool
	}
	count := map[key]int{}
	keyOf := func(c Card) key { return key{c.Rank, manilhaIndex(manilhas, c) >= 0} }
	for _, pl := range trick {
		count[keyOf(pl.Card)]++
	}
	for i, pl := range trick {
		k := keyOf(pl.Card)
		if k.manilha && !r.Tricks.ManilhasCancel {
			continue
		}
		out[i] = count[k] > 1
	}
	return out
}

// trickWinner is who takes these cards, or -1 when they all cancel and nobody
// does. For a trick still being played, it is who takes it if it ended now.
func (r Rules) trickWinner(manilhas []Card, trick []Played) int {
	dead := r.cancelled(manilhas, trick)
	winner, best := -1, 0
	voided := false
	for i, pl := range trick {
		if dead[i] {
			voided = voided || r.Tricks.CancelVoidsTrick
			continue
		}
		s := r.strength(manilhas, pl.Card)
		if r.Tricks.Winner == WinWeakest {
			s = -s
		}
		if winner < 0 || s > best {
			winner, best = pl.Player, s
		}
	}
	if voided {
		winner = -1
	}
	if winner < 0 && len(trick) > 0 && r.Tricks.AllCancelled == CancelLastCardWins {
		winner = trick[len(trick)-1].Player
	}
	return winner
}

func (r Rules) newDeck() []Card {
	d := make([]Card, 0, r.DeckLen())
	for _, k := range r.Deck.Order {
		for s := Suit(0); s < numSuits; s++ {
			d = append(d, Card{k, s})
		}
	}
	return d
}
