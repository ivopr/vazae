package game

import "sort"

// PlayerView is what one player is allowed to know. Other players' hands are
// hidden, except in blind one-card rounds where you see everybody's card but
// your own. Everything the UI needs to follow the rules is computed here, so it
// never re-implements them.
type PlayerView struct {
	Me        int            `json:"me"`
	Rules     Rules          `json:"rules"`
	Phase     Phase          `json:"phase"`
	Round     int            `json:"round"`
	Cards     int            `json:"cards"`
	Dealer    int            `json:"dealer"`
	Turn      int            `json:"turn"`
	Vira      *Card          `json:"vira"`             // nil when no card is turned up
	Manilhas  []Card         `json:"manilhas"`         // weakest first; empty without manilhas
	Hand      []Card         `json:"hand"`             // weakest first under the rules
	Playable  []Card         `json:"playable"`         // cards you may play now, weakest first
	Others    map[int][]Card `json:"others,omitempty"` // only populated in blind one-card rounds
	Players   []PublicInfo   `json:"players"`
	Trick     []Played       `json:"trick"`
	MinBid    int            `json:"minBid"`
	Forbidden int            `json:"forbidden"` // bid you may not make, or -1
	LastLoss  []Loss         `json:"lastLoss,omitempty"`
	Winner    int            `json:"winner"`
	Winners   []int          `json:"winners"`

	LastTrick       []Played `json:"lastTrick"`
	LastTrickWinner int      `json:"lastTrickWinner"` // -1 when every card cancelled
	// RoundTricks are this round's completed tricks, in order.
	RoundTricks [][]Played `json:"roundTricks"`
}

type PublicInfo struct {
	Name   string `json:"name"`
	Lives  int    `json:"lives"`
	Bid    int    `json:"bid"`
	Bidded bool   `json:"bidded"`
	Won    int    `json:"won"`
	Left   int    `json:"left"` // cards still in hand
}

// Blind reports whether this round hides each player's own card.
func (m *Match) Blind() bool { return m.Cards == 1 && m.rules.OneCard.Blind }

func (m *Match) withCancelled(trick []Played) []Played {
	out := append([]Played{}, trick...)
	for i, dead := range m.cancelled(trick) {
		out[i].Cancelled = dead
	}
	return out
}

func (m *Match) View(me int) PlayerView {
	v := PlayerView{
		Me: me, Rules: m.rules, Phase: m.Phase, Round: m.Round, Cards: m.Cards, Dealer: m.Dealer,
		Turn: m.Turn, Vira: m.Vira, Manilhas: append([]Card{}, m.Manilhas...),
		Trick: m.withCancelled(m.Trick), MinBid: m.rules.Bidding.MinBid, Forbidden: -1,
		LastLoss: m.LastLoss, Winner: m.Winner, Winners: append([]int{}, m.Winners...),
		LastTrick: m.withCancelled(m.LastTrick), LastTrickWinner: m.LastTrickWinner,
		Hand: []Card{}, Playable: []Card{}, RoundTricks: [][]Played{},
	}
	for _, t := range m.RoundTricks {
		v.RoundTricks = append(v.RoundTricks, m.withCancelled(t))
	}
	if m.Turn == me {
		v.Forbidden = m.ForbiddenBid()
	}
	blind := m.Blind()
	for i, p := range m.Players {
		v.Players = append(v.Players, PublicInfo{p.Name, p.Lives, p.Bid, p.Bidded, p.Won, len(p.Hand)})
		if i == me && !blind {
			v.Hand = append(v.Hand, p.Hand...)
			sort.SliceStable(v.Hand, func(a, b int) bool { return m.Strength(v.Hand[a]) < m.Strength(v.Hand[b]) })
			if m.Phase == PhasePlaying && m.Turn == me {
				v.Playable = m.Legal(me)
				sort.SliceStable(v.Playable, func(a, b int) bool { return m.Strength(v.Playable[a]) < m.Strength(v.Playable[b]) })
			}
		}
		if i != me && blind && len(p.Hand) > 0 {
			if v.Others == nil {
				v.Others = map[int][]Card{}
			}
			v.Others[i] = append([]Card(nil), p.Hand...)
		}
	}
	return v
}

// Strength orders cards for one trick under the view's rules, higher is
// stronger. With Rules.Tricks.Winner set to weakest, the lowest wins.
func (v PlayerView) Strength(c Card) int { return v.Rules.strength(v.Manilhas, c) }

// TrickWinner is who would take these cards under the match's rules, or -1
// if they all cancel. Bots use it to try a card on the current trick.
func (v PlayerView) TrickWinner(trick []Played) int {
	return v.Rules.trickWinner(v.Manilhas, trick)
}

// Deck is every card in this match's deck.
func (v PlayerView) Deck() []Card { return v.Rules.newDeck() }

// Percentile places a card among the whole deck: 0 is the weakest card, 1 the
// strongest. Bots use it instead of fixed ranks, so they adapt to any rules.
func (v PlayerView) Percentile(c Card) float64 {
	deck := v.Rules.newDeck()
	if len(deck) < 2 {
		return 1
	}
	s, below := v.Strength(c), 0
	for _, d := range deck {
		if v.Strength(d) < s {
			below++
		}
	}
	return float64(below) / float64(len(deck)-1)
}
