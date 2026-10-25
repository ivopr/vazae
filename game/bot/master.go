package bot

import (
	"math/rand"

	"vazae/game"
)

// Master decides by simulation: it deals many possible worlds consistent with
// what it has seen, plays each choice to the end of the round on a copy of the
// real engine (so every custom rule applies), and keeps the choice that costs
// it the fewest lives while costing the leader the most.
type Master struct {
	rng *rand.Rand
	// work caps the simulated plays per decision, which keeps each decision
	// within a few tens of milliseconds whatever the table size.
	work int
}

func NewMaster(seed int64) *Master { return &Master{rng: rand.New(rand.NewSource(seed)), work: 6000} }

const (
	minWorlds = 8
	maxWorlds = 120
	// How much a life the leader loses is worth against one of our own.
	sabotageWeight = 0.5
)

func (b *Master) Bid(v game.PlayerView) int {
	var bids []int
	for n := v.MinBid; n <= v.Cards; n++ {
		if n != v.Forbidden {
			bids = append(bids, n)
		}
	}
	if len(bids) == 1 {
		return bids[0]
	}
	return bids[b.best(v, len(bids), func(m *game.Match, i int) error { return m.Bid(v.Me, bids[i]) })]
}

func (b *Master) Play(v game.PlayerView) game.Card {
	cards := distinct(v.Playable)
	if len(cards) == 1 {
		return cards[0]
	}
	byPower(v, cards)
	return cards[b.best(v, len(cards), func(m *game.Match, i int) error { return m.Play(v.Me, cards[i]) })]
}

// best simulates each of n choices over the same sampled worlds and returns the
// one with the lowest average cost. Ties go to the earliest choice.
func (b *Master) best(v game.PlayerView, n int, choose func(m *game.Match, i int) error) int {
	k := know(v)
	t := target(v)
	plays := 0
	for _, p := range v.Players {
		plays += p.Left
	}
	worlds := b.work / (n * (plays + len(v.Players)))
	worlds = max(minWorlds, min(maxWorlds, worlds))

	cost := make([]float64, n)
	for w := 0; w < worlds; w++ {
		hands := k.sample(b.rng)
		seed := b.rng.Int63()
		for i := 0; i < n; i++ {
			m := game.Hypothetical(v, hands, seed)
			if choose(m, i) != nil {
				cost[i] += 1e9 // never pick a choice the engine refuses
				continue
			}
			playout(m)
			cost[i] += lost(m, v.Me)
			if t >= 0 {
				cost[i] -= sabotageWeight * lost(m, t)
			}
		}
	}
	pick := 0
	for i := range cost {
		if cost[i] < cost[pick] {
			pick = i
		}
	}
	return pick
}

// playout finishes the round with every player on the quick policy.
func playout(m *game.Match) {
	for steps := 0; steps < 1000; steps++ {
		p := m.Turn
		var err error
		switch m.Phase {
		case game.PhaseBidding:
			err = m.Bid(p, quickBid(m.View(p)))
		case game.PhasePlaying:
			if m.Blind() {
				err = m.PlayOnly(p)
			} else {
				err = m.Play(p, quickPlay(m.View(p)))
			}
		default:
			return
		}
		if err != nil {
			return
		}
	}
}

// lost is how many lives player p lost in the round just simulated.
func lost(m *game.Match, p int) float64 {
	for _, l := range m.LastLoss {
		if l.Player == p {
			return float64(l.Lost)
		}
	}
	return 0
}

// quickBid and quickPlay are a cheap, table-aware policy for simulated
// players: thousands of them run per decision, so they skip the odds.
func quickBid(v game.PlayerView) int {
	if len(v.Hand) == 0 {
		return legalBid(v, 0)
	}
	strong := 0
	for _, c := range v.Hand {
		if power(v, c) >= 0.7 {
			strong++
		}
	}
	return legalBid(v, strong)
}

func quickPlay(v game.PlayerView) game.Card {
	me := v.Players[v.Me]
	cards := append([]game.Card(nil), v.Playable...)
	byPower(v, cards)
	wins := func(c game.Card) bool {
		return v.TrickWinner(append(append([]game.Played{}, v.Trick...), game.Played{Player: v.Me, Card: c})) == v.Me
	}
	if me.Won < me.Bid {
		for _, c := range cards {
			if wins(c) {
				return c // the cheapest card that takes the table now
			}
		}
		return cards[0]
	}
	for i := len(cards) - 1; i >= 0; i-- {
		if !wins(cards[i]) {
			return cards[i] // shed the strongest card that doesn't take it
		}
	}
	return cards[0]
}
