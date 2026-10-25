package bot

import (
	"vazae/game"
)

// Hard remembers every card played this round, reads the odds of each card
// taking the trick, uses cancellation to dodge tricks, and when its own result
// doesn't depend on the choice, plays to make the leader miss.
type Hard struct{}

func NewHard() *Hard { return &Hard{} }

func (b *Hard) Bid(v game.PlayerView) int {
	k := know(v)
	exp := 0.0
	if len(v.Hand) == 0 {
		exp = k.blindChance()
	} else {
		for _, c := range v.Hand {
			exp += k.trickShare(c)
		}
	}
	return closestBid(v, exp)
}

// closestBid is the legal bid nearest to an expected number of tricks.
func closestBid(v game.PlayerView, exp float64) int {
	best, gap := v.MinBid, -1.0
	for n := v.MinBid; n <= v.Cards; n++ {
		if n == v.Forbidden {
			continue
		}
		d := float64(n) - exp
		if d < 0 {
			d = -d
		}
		if gap < 0 || d < gap {
			best, gap = n, d
		}
	}
	return best
}

func (b *Hard) Play(v game.PlayerView) game.Card {
	k := know(v)
	me := v.Players[v.Me]
	need := me.Bid - me.Won
	left := len(v.Hand)
	onePerMiss := v.Rules.Scoring.Loss == game.LossOnePerMiss

	cards := distinct(v.Playable)
	// Weakest first, by how likely a card is to take tricks under these rules.
	byPower(v, cards)

	// How much each card serves our own bid. Cards are already sorted, so the
	// position breaks ties: cheap cards when winning, strong ones when dodging.
	chance := make([]float64, len(cards))
	bestChance := 0.0
	for i, c := range cards {
		chance[i] = k.winChance(c)
		bestChance = max(bestChance, chance[i])
	}
	own := make([]float64, len(cards))
	for i := range cards {
		p := chance[i]
		rank := float64(i) / float64(len(cards))
		switch {
		case onePerMiss && (need < 0 || need > left):
			own[i] = 0 // already missed: one life either way
		case need >= left && need > 0:
			own[i] = p - 0.01*rank // need every trick left
		case need > 0 && bestChance >= 0.5:
			if p >= 0.5 {
				own[i] = 1 - 0.01*rank // the cheapest card that probably wins
			} else {
				own[i] = -0.01 * rank
			}
		case need > 0 && bestChance >= 0.2:
			own[i] = p - 0.01*rank // no sure thing: go with the best odds
		case need > 0:
			own[i] = -0.01 * rank // hopeless now: keep the strong cards for later
		default:
			own[i] = -p + 0.01*rank // dodge, shedding the most dangerous safe card
		}
	}

	// Among the cards that serve us about equally, hurt the leader.
	best := own[0]
	for _, s := range own {
		if s > best {
			best = s
		}
	}
	pick, pickSab := -1, -1
	for i, c := range cards {
		if own[i] < best-0.1 {
			continue
		}
		s := sabotage(v, c)
		if pick < 0 || s > pickSab || (s == pickSab && own[i] > own[pick]) {
			pick, pickSab = i, s
		}
	}
	return cards[pick]
}

// target is the opponent closest to winning: the one with most lives.
func target(v game.PlayerView) int {
	t := -1
	for i, p := range v.Players {
		if i != v.Me && p.Lives > 0 && (t < 0 || p.Lives > v.Players[t].Lives) {
			t = i
		}
	}
	return t
}

// sabotage scores 1 when playing c leaves the target, who already played,
// heading for a miss on this trick.
func sabotage(v game.PlayerView, c game.Card) int {
	t := target(v)
	if t < 0 {
		return 0
	}
	played := false
	for _, p := range v.Trick {
		played = played || p.Player == t
	}
	if !played {
		return 0
	}
	w := v.TrickWinner(append(append([]game.Played{}, v.Trick...), game.Played{Player: v.Me, Card: c}))
	needs := v.Players[t].Bid > v.Players[t].Won
	if (needs && w != t) || (!needs && w == t) {
		return 1
	}
	return 0
}

func distinct(cards []game.Card) []game.Card {
	seen := map[game.Card]bool{}
	var out []game.Card
	for _, c := range cards {
		if !seen[c] {
			seen[c] = true
			out = append(out, c)
		}
	}
	return out
}
