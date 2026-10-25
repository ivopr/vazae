package bot

import (
	"math/rand"
	"sort"

	"vazae/game"
)

// knowledge is what one player can work out from a view: which cards are
// still hidden somewhere, which suits each opponent has run out of, and how
// many cards everyone holds. It never looks past the view.
type knowledge struct {
	v      game.PlayerView
	unseen []game.Card
	// void[p][s]: player p showed they have no cards of suit s (follow suit only).
	void map[int]map[game.Suit]bool
	// hidden[p]: how many cards of player p we can't see (us too, in a blind round).
	hidden map[int]int
}

func know(v game.PlayerView) knowledge {
	k := knowledge{v: v, void: map[int]map[game.Suit]bool{}, hidden: map[int]int{}}

	seen := map[game.Card]bool{}
	mark := func(c game.Card) { seen[c] = true }
	for _, c := range v.Hand {
		mark(c)
	}
	if v.Vira != nil {
		mark(*v.Vira)
	}
	for _, h := range v.Others {
		for _, c := range h {
			mark(c)
		}
	}
	tricks := append(append([][]game.Played{}, v.RoundTricks...), v.Trick)
	for _, t := range tricks {
		for _, p := range t {
			mark(p.Card)
		}
	}
	for _, c := range v.Deck() {
		if !seen[c] {
			k.unseen = append(k.unseen, c)
		}
	}

	if v.Rules.Tricks.Follow == game.FollowSuit {
		for _, t := range tricks {
			if len(t) == 0 {
				continue
			}
			lead := t[0].Card.Suit
			for _, p := range t[1:] {
				if p.Card.Suit != lead {
					if k.void[p.Player] == nil {
						k.void[p.Player] = map[game.Suit]bool{}
					}
					k.void[p.Player][lead] = true
				}
			}
		}
	}

	for i, p := range v.Players {
		switch {
		case i == v.Me && len(v.Hand) == 0 && p.Left > 0:
			k.hidden[i] = p.Left // blind round: our own card
		case i != v.Me && len(v.Others[i]) == 0 && p.Left > 0:
			k.hidden[i] = p.Left
		}
	}
	return k
}

// sample deals the unseen cards into one possible world: a hand for every
// player whose cards are hidden, respecting the suits they ran out of.
func (k knowledge) sample(rng *rand.Rand) map[int][]game.Card {
	for try := 0; try < 20; try++ {
		if hands, ok := k.deal(rng, try < 19); ok {
			return hands
		}
	}
	return nil // unreachable: the last try ignores voids, and there are enough cards
}

func (k knowledge) deal(rng *rand.Rand, voids bool) (map[int][]game.Card, bool) {
	pool := append([]game.Card(nil), k.unseen...)
	rng.Shuffle(len(pool), func(i, j int) { pool[i], pool[j] = pool[j], pool[i] })
	hands := map[int][]game.Card{}
	// Most constrained players pick first.
	order := make([]int, 0, len(k.hidden))
	for p := range k.hidden {
		order = append(order, p)
	}
	sort.Slice(order, func(i, j int) bool {
		a, b := order[i], order[j]
		if len(k.void[a]) != len(k.void[b]) {
			return len(k.void[a]) > len(k.void[b])
		}
		return a < b
	})
	for _, p := range order {
		for n := k.hidden[p]; n > 0; n-- {
			found := -1
			for i, c := range pool {
				if !voids || !k.void[p][c.Suit] {
					found = i
					break
				}
			}
			if found < 0 {
				return nil, false
			}
			hands[p] = append(hands[p], pool[found])
			pool = append(pool[:found], pool[found+1:]...)
		}
	}
	return hands, true
}

// pending lists who still plays in the current trick after us, in turn order.
func (k knowledge) pending() []int {
	v := k.v
	played := map[int]bool{v.Me: true}
	for _, p := range v.Trick {
		played[p.Player] = true
	}
	n := len(v.Players)
	step := 1
	if v.Rules.Bidding.Direction == game.Counter {
		step = n - 1
	}
	var out []int
	for i, j := 1, (v.Me+step)%n; i < n; i, j = i+1, (j+step)%n {
		if v.Players[j].Lives > 0 && !played[j] {
			out = append(out, j)
		}
	}
	return out
}

// winChance is how likely playing c now takes the current trick.
func (k knowledge) winChance(c game.Card) float64 {
	table := append(append([]game.Played{}, k.v.Trick...), game.Played{Player: k.v.Me, Card: c})
	return k.survives(table, k.pending())
}

// trickShare is how likely c takes the trick it ends up in, over the whole
// round. Bids add these up. Each opponent meets c with one card of theirs, not
// their whole hand (their strong cards are spread over all the tricks), so the
// odds are against a single unseen card per opponent.
func (k knowledge) trickShare(c game.Card) float64 {
	v := k.v
	table := []game.Played{{Player: v.Me, Card: c}}
	beaten := 0
	for _, u := range k.unseen {
		if v.TrickWinner(append(table[:1:1], game.Played{Player: -2, Card: u})) != v.Me {
			beaten++
		}
	}
	if len(k.unseen) == 0 {
		return 1
	}
	q := float64(beaten) / float64(len(k.unseen)) * shareDamp
	p := 1.0
	for i, pl := range v.Players {
		if i != v.Me && pl.Lives > 0 {
			p *= 1 - q
		}
	}
	return p
}

// survives is the chance that we still hold the trick after everyone in rest
// plays. Cards we can see (blind rounds) count exactly. For a hidden hand, the
// opponent takes it from us only if they hold a card that does, and choose to
// play it: likely when they still need tricks, unlikely when they are dodging.
func (k knowledge) survives(table []game.Played, rest []int) float64 {
	v := k.v
	if v.TrickWinner(table) != v.Me {
		return 0
	}
	beats := func(c game.Card) bool {
		return v.TrickWinner(append(table[:len(table):len(table)], game.Played{Player: -2, Card: c})) != v.Me
	}
	threats := -1 // counted on first use
	p := 1.0
	for _, o := range rest {
		if shown := v.Others[o]; len(shown) > 0 {
			for _, c := range shown {
				if beats(c) {
					return 0
				}
			}
			continue
		}
		if threats < 0 {
			threats = 0
			for _, u := range k.unseen {
				if beats(u) {
					threats++
				}
			}
		}
		holds := 1 - noneOf(len(k.unseen), threats, k.hidden[o])
		p *= 1 - holds*k.eagerness(o)
	}
	return p
}

// eagerness is how likely an opponent who can take a trick does take it.
func (k knowledge) eagerness(o int) float64 {
	pl := k.v.Players[o]
	switch {
	case !pl.Bidded:
		return 0.6 // unknown yet: bidding is still going on
	case pl.Bid > pl.Won:
		return 0.9
	default:
		return 0.25 // dodging, but follow suit or a thin hand can force them
	}
}

// blindChance is, in a blind one-card round, how likely our unseen card beats
// the cards we can see on everyone else.
func (k knowledge) blindChance() float64 {
	v := k.v
	if len(k.unseen) == 0 {
		return 0
	}
	var others []game.Played
	for i, h := range v.Others {
		for _, c := range h {
			others = append(others, game.Played{Player: i, Card: c})
		}
	}
	wins := 0
	for _, u := range k.unseen {
		if v.TrickWinner(append(others[:len(others):len(others)], game.Played{Player: v.Me, Card: u})) == v.Me {
			wins++
		}
	}
	return float64(wins) / float64(len(k.unseen))
}

// noneOf is the chance that n cards drawn from a pool holding bad ones include
// none of them (hypergeometric).
func noneOf(pool, bad, n int) float64 {
	if bad <= 0 {
		return 1
	}
	p := 1.0
	for i := 0; i < n; i++ {
		if pool-i <= 0 {
			return 0
		}
		p *= float64(pool-bad-i) / float64(pool-i)
		if p <= 0 {
			return 0
		}
	}
	return p
}

// shareDamp scales how often an opponent's card beats ours when bidding.
// Opponents who are dodging play their weakest cards, so a random card
// overstates the threat. 0.65 brought Hard's bids closest to what it then
// makes (tried 1.0, 0.8, 0.65, 0.5 against Medium tables of 4).
const shareDamp = 0.65
