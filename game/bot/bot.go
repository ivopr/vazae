// Package bot holds computer players. A Bot only sees a PlayerView, so it
// cannot cheat. Bots judge cards through the view (Strength, Percentile,
// Playable), so they follow whatever rules the match uses.
package bot

import (
	"math/rand"
	"sort"

	"vazae/game"
)

type Bot interface {
	Bid(v game.PlayerView) int
	Play(v game.PlayerView) game.Card
}

// In blind one-card rounds the own card is hidden (v.Hand is empty), so Play
// is never called; the runner uses Match.PlayOnly instead.

// legalBid clamps n to a bid the engine will accept.
func legalBid(v game.PlayerView, n int) int {
	if n > v.Cards {
		n = v.Cards
	}
	if n < v.MinBid {
		n = v.MinBid
	}
	if n == v.Forbidden {
		if n > v.MinBid {
			return n - 1
		}
		return n + 1
	}
	return n
}

// power is how likely a card is to take a trick, 0 to 1, whichever way the
// rules decide tricks.
func power(v game.PlayerView, c game.Card) float64 {
	p := v.Percentile(c)
	if v.Rules.Tricks.Winner == game.WinWeakest {
		return 1 - p
	}
	return p
}

// byPower sorts cards from the least to the most likely to take a trick. It
// compares strengths directly, which is cheaper than power.
func byPower(v game.PlayerView, cards []game.Card) {
	key := func(c game.Card) int {
		if v.Rules.Tricks.Winner == game.WinWeakest {
			return -v.Strength(c)
		}
		return v.Strength(c)
	}
	sort.SliceStable(cards, func(i, j int) bool { return key(cards[i]) < key(cards[j]) })
}

// Easy bids near the average and plays at random.
type Easy struct{ rng *rand.Rand }

func NewEasy(seed int64) *Easy { return &Easy{rand.New(rand.NewSource(seed))} }

func (b *Easy) Bid(v game.PlayerView) int {
	avg := v.Cards / len(v.Players)
	return legalBid(v, avg+b.rng.Intn(2))
}

func (b *Easy) Play(v game.PlayerView) game.Card {
	return v.Playable[b.rng.Intn(len(v.Playable))]
}

// Medium estimates tricks from hand strength and plays to hit its bid.
type Medium struct{ rng *rand.Rand }

func NewMedium(seed int64) *Medium { return &Medium{rand.New(rand.NewSource(seed))} }

func (b *Medium) Bid(v game.PlayerView) int {
	if len(v.Hand) == 0 {
		// Blind round: can't see our card, so bid on whether others look weak.
		best := 0.0
		for _, h := range v.Others {
			if p := power(v, h[0]); p > best {
				best = p
			}
		}
		if best < 0.35 {
			return legalBid(v, 1)
		}
		return legalBid(v, 0)
	}
	est := 0
	for _, c := range v.Hand {
		// Under the default rules, aces and up.
		if power(v, c) >= 0.7 {
			est++
		}
	}
	return legalBid(v, est)
}

func (b *Medium) Play(v game.PlayerView) game.Card {
	me := v.Players[v.Me]
	cards := append([]game.Card(nil), v.Playable...)
	byPower(v, cards)
	if me.Won < me.Bid {
		return cards[len(cards)-1]
	}
	return cards[0]
}
