package solo

import (
	"math/rand"
	"slices"
	"testing"
	"time"

	"vazae/game"
	"vazae/game/bot"
)

// TestFullMatch drives the human seat with a bot until the match ends.
func TestFullMatch(t *testing.T) {
	states := make(chan game.PlayerView, 1024)
	s := &Service{emit: func(v game.PlayerView) { states <- v }}

	v, err := s.Start(StartConfig{Bots: 3, Difficulty: Medium, Rules: twoLives()})
	if err != nil {
		t.Fatal(err)
	}
	me := bot.NewEasy(1)
	deadline := time.After(10 * time.Second)
	for v.Phase != game.PhaseOver {
		if v.Turn == v.Me || v.Phase == game.PhaseRoundEnd {
			switch {
			case v.Phase == game.PhaseRoundEnd:
				err = s.NextRound()
			case v.Phase == game.PhaseBidding:
				err = s.Bid(me.Bid(v))
			case len(v.Hand) == 0:
				err = s.PlayOnly()
			default:
				err = s.Play(me.Play(v))
			}
			if err != nil {
				t.Fatalf("%s: %v", v.Phase, err)
			}
		}
		select {
		case v = <-states:
		case <-deadline:
			t.Fatalf("stuck at %+v", v)
		}
	}
	if v.Winner < 0 {
		t.Fatal("no winner")
	}
}

func TestStartValidatesBots(t *testing.T) {
	s := &Service{emit: func(game.PlayerView) {}}
	if _, err := s.Start(StartConfig{Bots: 0, Rules: game.DefaultRules()}); err == nil {
		t.Fatal("expected error for 0 bots")
	}
}

func twoLives() game.Rules {
	r := game.DefaultRules()
	r.Players.Lives = 2
	return r
}

func TestStartRejectsInvalidRules(t *testing.T) {
	s := &Service{emit: func(game.PlayerView) {}}
	r := game.DefaultRules()
	r.Players.Lives = 0
	if _, err := s.Start(StartConfig{Bots: 2, Rules: r}); err == nil {
		t.Fatal("expected error for invalid rules")
	}
}

func TestRandomSeatPlaysThrough(t *testing.T) {
	r := twoLives()
	r.Players.HumanSeat = game.SeatRandom
	seats := map[int]bool{}
	for i := 0; i < 40; i++ {
		s := &Service{emit: func(game.PlayerView) {}}
		v, err := s.Start(StartConfig{Bots: 3, Rules: r})
		if err != nil {
			t.Fatal(err)
		}
		if v.Players[v.Me].Name != "Você" {
			t.Fatalf("seat %d holds %q", v.Me, v.Players[v.Me].Name)
		}
		seats[v.Me] = true
		s.Quit()
	}
	if len(seats) < 2 {
		t.Fatalf("seat never moved: %v", seats)
	}
}

func TestMixedTableHasDifferentLevels(t *testing.T) {
	for seed := int64(0); seed < 300; seed++ {
		got := drawLevels(rand.New(rand.NewSource(seed)), 2+int(seed%6))
		first := got[0]
		mixed := false
		for _, d := range got {
			mixed = mixed || d != first
			if !slices.Contains(levels, d) {
				t.Fatalf("drew unknown level %q", d)
			}
		}
		if !mixed {
			t.Fatalf("seed %d: all bots %q", seed, first)
		}
	}
}

func TestLevelsMatchSeats(t *testing.T) {
	s := &Service{emit: func(game.PlayerView) {}}
	v, err := s.Start(StartConfig{Bots: 3, Difficulty: Mixed, Rules: twoLives()})
	if err != nil {
		t.Fatal(err)
	}
	s.Quit()
	got := s.Levels()
	if len(got) != 4 || got[v.Me] != "" {
		t.Fatalf("levels %v, human at %d", got, v.Me)
	}
}

// Every level, including a full table of Masters, plays a match to the end
// through the service.
func TestEveryLevelFinishes(t *testing.T) {
	for _, d := range []Difficulty{Hard, Master, Mixed} {
		states := make(chan game.PlayerView, 1024)
		s := &Service{emit: func(v game.PlayerView) { states <- v }}
		v, err := s.Start(StartConfig{Bots: 3, Difficulty: d, Rules: twoLives()})
		if err != nil {
			t.Fatal(err)
		}
		me := bot.NewEasy(1)
		deadline := time.After(60 * time.Second)
		for v.Phase != game.PhaseOver {
			if v.Turn == v.Me || v.Phase == game.PhaseRoundEnd {
				switch {
				case v.Phase == game.PhaseRoundEnd:
					err = s.NextRound()
				case v.Phase == game.PhaseBidding:
					err = s.Bid(me.Bid(v))
				case len(v.Hand) == 0:
					err = s.PlayOnly()
				default:
					err = s.Play(me.Play(v))
				}
				if err != nil {
					t.Fatalf("%s %s: %v", d, v.Phase, err)
				}
			}
			select {
			case v = <-states:
			case <-deadline:
				t.Fatalf("%s: stuck at %+v", d, v)
			}
		}
	}
}
