package game

import (
	"reflect"
	"testing"
)

// step makes one simple legal move, the same way on any match.
func step(m *Match) {
	switch m.Phase {
	case PhaseBidding:
		b := m.rules.Bidding.MinBid
		if b == m.ForbiddenBid() {
			b++
		}
		_ = m.Bid(m.Turn, b)
	case PhasePlaying:
		_ = m.Play(m.Turn, m.Legal(m.Turn)[0])
	}
}

func inRound(m *Match) bool { return m.Phase == PhaseBidding || m.Phase == PhasePlaying }

// A hypothetical match built from a view and the true hands plays the rest of
// the round exactly like the real one.
func TestHypotheticalMatchesReal(t *testing.T) {
	variants := map[string]func(*Rules){
		"default":   func(*Rules) {},
		"follow":    func(r *Rules) { r.Tricks.Follow = FollowSuit },
		"dealer1st": func(r *Rules) { r.Bidding.Order, r.Tricks.NextLeader = BidDealerFirst, NextRotate },
		"counter":   func(r *Rules) { r.Bidding.Direction, r.Tricks.FirstLeader = Counter, LeadHighestBid },
	}
	for name, change := range variants {
		for seed := int64(1); seed <= 40; seed++ {
			r := DefaultRules()
			change(&r)
			real, err := New(r, names(4), seed)
			if err != nil {
				t.Fatal(err)
			}
			for real.Round < 3 {
				for inRound(real) {
					step(real)
				}
				_ = real.NextRound()
			}
			for k := 0; k < int(seed%9) && inRound(real); k++ {
				step(real)
			}
			if !inRound(real) {
				continue
			}

			hands := map[int][]Card{}
			for i, p := range real.Players {
				hands[i] = p.Hand
			}
			hyp := Hypothetical(real.View(0), hands, 1)
			// Leader is only meaningful once play starts; while bidding it's last round's.
			if (real.Phase == PhasePlaying && hyp.Leader != real.Leader) || hyp.firstBidder != real.firstBidder {
				t.Fatalf("%s seed %d: leader %d/%d firstBidder %d/%d", name, seed, hyp.Leader, real.Leader, hyp.firstBidder, real.firstBidder)
			}
			for inRound(real) {
				step(real)
				step(hyp)
			}
			if !reflect.DeepEqual(real.LastLoss, hyp.LastLoss) {
				t.Fatalf("%s seed %d: losses %v, hypothetical %v", name, seed, real.LastLoss, hyp.LastLoss)
			}
		}
	}
}
