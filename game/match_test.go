package game_test

import (
	"math/rand"
	"testing"

	"vazae/game"
	"vazae/game/bot"
)

func newMatch(t *testing.T, r game.Rules, n int, seed int64) *game.Match {
	t.Helper()
	names := make([]string, n)
	for i := range names {
		names[i] = string(rune('a' + i))
	}
	m, err := game.New(r, names, seed)
	if err != nil {
		t.Fatal(err)
	}
	return m
}

// viewWithVira is a view whose manilhas follow the given vira, for checking strength.
func viewWithVira(t *testing.T, r game.Rules, vira game.Rank) game.PlayerView {
	t.Helper()
	for seed := int64(1); seed < 10000; seed++ {
		v := newMatch(t, r, 2, seed).View(0)
		if v.Vira != nil && v.Vira.Rank == vira {
			return v
		}
	}
	t.Fatalf("no seed turns up %v", vira)
	return game.PlayerView{}
}

func TestManilhaWraps(t *testing.T) {
	if got := viewWithVira(t, game.DefaultRules(), game.Three).Manilhas[0].Rank; got != game.Four {
		t.Fatalf("manilha after 3 = %v, want 4", got)
	}
	if got := viewWithVira(t, game.DefaultRules(), game.King).Manilhas[0].Rank; got != game.Ace {
		t.Fatalf("manilha after K = %v, want A", got)
	}
}

func TestStrength(t *testing.T) {
	v := viewWithVira(t, game.DefaultRules(), game.Six) // manilha 7
	zap := game.Card{Rank: game.Seven, Suit: game.Clubs}
	ouros := game.Card{Rank: game.Seven, Suit: game.Diamonds}
	three := game.Card{Rank: game.Three, Suit: game.Clubs}
	if !(v.Strength(zap) > v.Strength(ouros) && v.Strength(ouros) > v.Strength(three)) {
		t.Fatal("manilha order wrong")
	}
}

func TestLastBidderRestriction(t *testing.T) {
	m, err := game.New(game.DefaultRules(), []string{"a", "b", "c"}, 1)
	if err != nil {
		t.Fatal(err)
	}
	// Round 0 has 1 card; dealer is player 0, so bidding goes 1, 2, 0.
	if err := m.Bid(1, 1); err != nil {
		t.Fatal(err)
	}
	if err := m.Bid(2, 0); err != nil {
		t.Fatal(err)
	}
	if got := m.ForbiddenBid(); got != 0 {
		t.Fatalf("forbidden = %d, want 0", got)
	}
	if err := m.Bid(0, 0); err != game.ErrLastBid {
		t.Fatalf("err = %v, want ErrLastBid", err)
	}
	if err := m.Bid(0, 1); err != nil {
		t.Fatal(err)
	}
}

func TestOneCardRoundHidesOwnCard(t *testing.T) {
	m, _ := game.New(game.DefaultRules(), []string{"a", "b", "c"}, 7)
	v := m.View(0)
	if len(v.Hand) != 0 || len(v.Others) != 2 {
		t.Fatalf("hand=%d others=%d", len(v.Hand), len(v.Others))
	}
	if _, leaked := v.Others[0]; leaked {
		t.Fatal("own card leaked")
	}
}

func TestLastTrickKeptAfterResolve(t *testing.T) {
	m, _ := game.New(game.DefaultRules(), []string{"a", "b"}, 3)
	if err := m.Bid(1, 0); err != nil {
		t.Fatal(err)
	}
	if err := m.Bid(0, 0); err != nil {
		t.Fatal(err)
	}
	first := m.Turn
	if err := m.PlayOnly(first); err != nil {
		t.Fatal(err)
	}
	if err := m.PlayOnly(m.Turn); err != nil {
		t.Fatal(err)
	}
	v := m.View(0)
	if len(v.Trick) != 0 || len(v.LastTrick) != 2 {
		t.Fatalf("trick=%d lastTrick=%d", len(v.Trick), len(v.LastTrick))
	}
	if v.LastTrick[0].Player != first {
		t.Fatalf("last trick order: %+v", v.LastTrick)
	}
	if m.Phase != game.PhaseRoundEnd {
		t.Fatalf("phase = %s", m.Phase)
	}
	if err := m.NextRound(); err != nil {
		t.Fatal(err)
	}
	if v := m.View(0); len(v.LastTrick) != 0 || v.LastTrickWinner != -1 {
		t.Fatal("last trick not reset on deal")
	}
}

func runBots(t *testing.T, seed int64, n int) *game.Match {
	t.Helper()
	return runBotsWith(t, game.DefaultRules(), seed, n, false)
}

// runBotsWith seats Easy, Medium and Hard bots in turn; with master, seat 0 is a
// Master (slow, so only some matches use it).
func runBotsWith(t *testing.T, r game.Rules, seed int64, n int, master bool) *game.Match {
	t.Helper()
	names := make([]string, n)
	bots := make([]bot.Bot, n)
	for i := range names {
		names[i] = string(rune('A' + i))
		switch {
		case master && i == 0:
			bots[i] = bot.NewMaster(seed)
		case i%3 == 0:
			bots[i] = bot.NewEasy(seed + int64(i))
		case i%3 == 1:
			bots[i] = bot.NewMedium(seed + int64(i))
		default:
			bots[i] = bot.NewHard()
		}
	}
	m, err := game.New(r, names, seed)
	if err != nil {
		t.Fatal(err)
	}
	for steps := 0; m.Phase != game.PhaseOver; steps++ {
		if steps > 1000000 {
			t.Fatalf("match did not finish: %s", m)
		}
		p := m.Turn
		switch m.Phase {
		case game.PhaseBidding:
			v := m.View(p)
			if err := m.Bid(p, bots[p].Bid(v)); err != nil {
				t.Fatalf("bid: %v (bot bid for view %+v)", err, v)
			}
		case game.PhasePlaying:
			var err error
			if m.Blind() {
				err = m.PlayOnly(p)
			} else {
				err = m.Play(p, bots[p].Play(m.View(p)))
			}
			if err != nil {
				t.Fatalf("play: %v", err)
			}
		case game.PhaseRoundEnd:
			if err := m.NextRound(); err != nil {
				t.Fatal(err)
			}
		}
	}
	return m
}

func TestBotsAlwaysFinish(t *testing.T) {
	for seed := int64(1); seed <= 200; seed++ {
		for _, n := range []int{2, 3, 4, 6, 8} {
			m := runBots(t, seed, n)
			if m.Winner < 0 {
				t.Fatalf("seed %d n %d: no winner", seed, n)
			}
		}
	}
}

// randomRules picks every knob at random, then repairs the few combinations
// Validate rejects, so each case is a playable rule set.
func randomRules(rng *rand.Rand) game.Rules {
	pick := func(n int) int { return rng.Intn(n) }
	r := game.DefaultRules()

	perm := rng.Perm(10)
	r.Deck.Ranks = nil
	for _, k := range perm[:2+pick(9)] {
		r.Deck.Ranks = append(r.Deck.Ranks, game.Rank(k))
	}
	r.Deck.Order = append([]game.Rank(nil), r.Deck.Ranks...)
	rng.Shuffle(len(r.Deck.Order), func(i, j int) { r.Deck.Order[i], r.Deck.Order[j] = r.Deck.Order[j], r.Deck.Order[i] })

	r.Manilha.Mode = []game.ManilhaMode{game.ManilhaVira, game.ManilhaFixed, game.ManilhaNone}[pick(3)]
	if r.Manilha.Mode == game.ManilhaFixed {
		have := map[game.Rank]bool{}
		for _, k := range r.Deck.Ranks {
			have[k] = true
		}
		for _, k := range []game.Rank{game.Four, game.Seven, game.Ace} {
			if !have[k] {
				r.Deck.Ranks = append(r.Deck.Ranks, k)
				r.Deck.Order = append(r.Deck.Order, k)
			}
		}
	}
	r.Manilha.AboveAll = pick(2) == 0
	rng.Shuffle(4, func(i, j int) {
		r.Manilha.SuitOrder[i], r.Manilha.SuitOrder[j] = r.Manilha.SuitOrder[j], r.Manilha.SuitOrder[i]
	})

	r.Players.Lives = 1 + pick(4)
	r.Rounds.Sequence = []game.Sequence{game.SeqUpDown, game.SeqUpDownFull, game.SeqUp, game.SeqDown, game.SeqFixed}[pick(5)]
	r.Rounds.MaxCards = pick(11)
	r.Rounds.GrowWhenFewer = pick(2) == 0
	r.Rounds.ReserveVira = r.Manilha.Mode == game.ManilhaVira || pick(2) == 0
	r.Rounds.Dealer = []game.DealerMove{game.DealerNext, game.DealerStays}[pick(2)]

	r.Bidding.Order = []game.BidStart{game.BidLeftOfDealer, game.BidDealerFirst}[pick(2)]
	r.Bidding.Direction = []game.Direction{game.Clockwise, game.Counter}[pick(2)]
	r.Bidding.MinBid = pick(2)
	r.Bidding.Restricted = []game.Restricted{game.RestrictLastBidder, game.RestrictDealer}[pick(2)]
	r.Bidding.SumRule = pick(2) == 0

	r.Tricks.FirstLeader = []game.FirstLeader{game.LeadFirstBidder, game.LeadDealer, game.LeadHighestBid}[pick(3)]
	r.Tricks.Follow = []game.Follow{game.FollowFree, game.FollowSuit}[pick(2)]
	r.Tricks.Winner = []game.TrickWinner{game.WinStrongest, game.WinWeakest}[pick(2)]
	r.Tricks.CancelEqual = pick(2) == 0
	r.Tricks.ManilhasCancel = pick(2) == 0
	r.Tricks.CancelVoidsTrick = pick(2) == 0
	r.Tricks.AllCancelled = []game.AllCancelled{game.CancelSameLeader, game.CancelNextLeads, game.CancelLastCardWins}[pick(3)]
	r.Tricks.NextLeader = []game.NextLeader{game.NextWinner, game.NextRotate}[pick(2)]

	r.OneCard.Blind = pick(2) == 0
	r.Scoring.Loss = []game.LossRule{game.LossDifference, game.LossOnePerMiss}[pick(2)]
	r.Scoring.End = []game.End{game.EndLastStanding, game.EndRounds}[pick(2)]
	r.Scoring.Rounds = 1 + pick(20)
	r.Scoring.Tie = []game.Tie{game.TieFirstSeat, game.TieDraw, game.TieExtraRound}[pick(3)]
	return r
}

func TestBotsFinishUnderRandomRules(t *testing.T) {
	rng := rand.New(rand.NewSource(42))
	for i := 0; i < 500; i++ {
		r := randomRules(rng)
		if errs := r.Validate(); errs != nil {
			t.Fatalf("case %d: generator made invalid rules: %v", i, errs)
		}
		hi := r.MaxPlayers()
		if hi > 8 {
			hi = 8
		}
		n := 2 + rng.Intn(hi-1)
		m := runBotsWith(t, r, int64(i), n, i%25 == 0)
		if m.Winner < 0 && len(m.Winners) < 2 {
			t.Fatalf("case %d: no winner and no draw under %+v", i, r)
		}
	}
}
