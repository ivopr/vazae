package bot

import (
	"testing"

	"vazae/game"
)

// match plays one full match. bots[i] plays seat i.
func playMatch(t testing.TB, r game.Rules, bots []Bot, seed int64) *game.Match {
	t.Helper()
	m, err := game.New(r, names(len(bots)), seed)
	if err != nil {
		t.Fatal(err)
	}
	for steps := 0; m.Phase != game.PhaseOver; steps++ {
		if steps > 200000 {
			t.Fatalf("match did not finish")
		}
		p := m.Turn
		switch m.Phase {
		case game.PhaseBidding:
			err = m.Bid(p, bots[p].Bid(m.View(p)))
		case game.PhasePlaying:
			if m.Blind() {
				err = m.PlayOnly(p)
			} else {
				err = m.Play(p, bots[p].Play(m.View(p)))
			}
		case game.PhaseRoundEnd:
			err = m.NextRound()
		}
		if err != nil {
			t.Fatalf("seat %d: %v", p, err)
		}
	}
	return m
}

// winRate seats one strong bot against weaker ones, rotating its seat, and
// returns the share of matches it wins outright (draws count as half).
func winRate(t testing.TB, r game.Rules, players, matches int, strong, weak func(seed int64) Bot) float64 {
	t.Helper()
	score := 0.0
	for i := 0; i < matches; i++ {
		seed := int64(1000 + i)
		seat := i % players
		bots := make([]Bot, players)
		for s := range bots {
			if s == seat {
				bots[s] = strong(seed + int64(s))
			} else {
				bots[s] = weak(seed + int64(s))
			}
		}
		m := playMatch(t, r, bots, seed)
		for _, w := range m.Winners {
			if w == seat {
				score += 1 / float64(len(m.Winners))
			}
		}
	}
	return score / float64(matches)
}

var (
	medium = func(s int64) Bot { return NewMedium(s) }
	hard   = func(s int64) Bot { return NewHard() }
	master = func(s int64) Bot { return NewMaster(s) }
)

func altered() game.Rules {
	r := game.DefaultRules()
	r.Tricks.Follow = game.FollowSuit
	r.Tricks.Winner = game.WinWeakest
	return r
}

// Each level must clearly beat the one below it, under the default rules and
// under rules that change how tricks work. A fair share is 25% at 4 seats.
// Measured when written: Hard 41% / 40% against Medium, Master 87% / 83%
// against Hard; the bars leave room for tuning.
func TestHardBeatsMedium(t *testing.T) {
	for name, r := range map[string]game.Rules{"default": game.DefaultRules(), "altered": altered()} {
		if got := winRate(t, r, 4, 400, hard, medium); got < 0.32 {
			t.Errorf("%s: Hard won %.1f%% against Medium, want 32%%+", name, 100*got)
		}
	}
}

func TestMasterBeatsHard(t *testing.T) {
	if testing.Short() {
		t.Skip("about a minute: 120 matches with Master")
	}
	for name, r := range map[string]game.Rules{"default": game.DefaultRules(), "altered": altered()} {
		if got := winRate(t, r, 4, 60, master, hard); got < 0.5 {
			t.Errorf("%s: Master won %.1f%% against Hard, want 50%%+", name, 100*got)
		}
	}
}
