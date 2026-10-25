package game

import "math/rand"

// Hypothetical rebuilds the match a view describes, with guessed hands for
// the cards the viewer can't see. Bots simulate the rest of the round on it,
// so every rule applies exactly as in the real match.
//
// hands holds a hand for every player whose cards the view doesn't show: the
// others, and the viewer too in a blind one-card round.
func Hypothetical(v PlayerView, hands map[int][]Card, seed int64) *Match {
	m := &Match{
		rules:           v.Rules,
		rng:             rand.New(rand.NewSource(seed)),
		Round:           v.Round,
		Cards:           v.Cards,
		Dealer:          v.Dealer,
		Phase:           v.Phase,
		Manilhas:        append([]Card(nil), v.Manilhas...),
		Turn:            v.Turn,
		Winner:          -1,
		LastTrick:       plain(v.LastTrick),
		LastTrickWinner: v.LastTrickWinner,
		Trick:           plain(v.Trick),
	}
	if v.Vira != nil {
		c := *v.Vira
		m.Vira = &c
	}
	for _, t := range v.RoundTricks {
		m.RoundTricks = append(m.RoundTricks, plain(t))
	}
	for i, p := range v.Players {
		hand, ok := hands[i]
		switch {
		case ok:
		case i == v.Me:
			hand = v.Hand
		default:
			hand = v.Others[i]
		}
		m.Players = append(m.Players, Player{
			Name: p.Name, Lives: p.Lives, Bid: p.Bid, Won: p.Won, Bidded: p.Bidded,
			Hand: append([]Card(nil), hand...),
		})
	}
	m.seq = m.rules.sequence(len(m.Players))

	// The view doesn't carry who leads or who bid first; both follow from it.
	m.Leader = m.Turn
	if len(m.Trick) > 0 {
		m.Leader = m.Trick[0].Player
	}
	m.firstBidder = m.Dealer
	if m.rules.Bidding.Order == BidLeftOfDealer {
		m.firstBidder = m.next(m.Dealer)
	}
	return m
}

// plain drops the view-only Cancelled marks.
func plain(t []Played) []Played {
	out := make([]Played, len(t))
	for i, p := range t {
		out[i] = Played{Player: p.Player, Card: p.Card}
	}
	return out
}
