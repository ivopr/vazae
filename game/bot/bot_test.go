package bot

import (
	"math/rand"
	"testing"
	"time"

	"vazae/game"
)

func names(n int) []string {
	out := make([]string, n)
	for i := range out {
		out[i] = string(rune('a' + i))
	}
	return out
}

// midRound plays simple moves until the given player is to play a card with
// at least min cards left, and returns the match there.
func midRound(t testing.TB, r game.Rules, n int, seed int64, round int, player int) *game.Match {
	t.Helper()
	m, err := game.New(r, names(n), seed)
	if err != nil {
		t.Fatal(err)
	}
	q := NewMedium(seed)
	for steps := 0; steps < 10000; steps++ {
		if m.Round == round && m.Phase == game.PhasePlaying && m.Turn == player && !m.Blind() {
			return m
		}
		p := m.Turn
		switch m.Phase {
		case game.PhaseBidding:
			err = m.Bid(p, q.Bid(m.View(p)))
		case game.PhasePlaying:
			if m.Blind() {
				err = m.PlayOnly(p)
			} else {
				err = m.Play(p, q.Play(m.View(p)))
			}
		case game.PhaseRoundEnd:
			err = m.NextRound()
		default:
			t.Fatalf("match ended before round %d", round)
		}
		if err != nil {
			t.Fatal(err)
		}
	}
	t.Fatal("never reached the position")
	return nil
}

func TestUnseenAndVoids(t *testing.T) {
	r := game.DefaultRules()
	r.Tricks.Follow = game.FollowSuit
	m := midRound(t, r, 3, 7, 4, 0) // round 5: 5 cards each
	v := m.View(0)
	k := know(v)

	known := map[game.Card]bool{}
	for _, c := range v.Hand {
		known[c] = true
	}
	for _, t := range append(v.RoundTricks, v.Trick) {
		for _, p := range t {
			known[p.Card] = true
		}
	}
	known[*v.Vira] = true
	if got, want := len(k.unseen)+len(known), len(v.Deck()); got != want {
		t.Fatalf("unseen %d + known %d = %d, want the deck's %d", len(k.unseen), len(known), got, want)
	}
	for _, u := range k.unseen {
		if known[u] {
			t.Fatalf("%v is both seen and unseen", u)
		}
	}

	// Every sampled world gives each opponent as many cards as they hold, from
	// the unseen pool, honouring the suits they ran out of.
	rng := rand.New(rand.NewSource(1))
	unseen := map[game.Card]bool{}
	for _, u := range k.unseen {
		unseen[u] = true
	}
	for w := 0; w < 200; w++ {
		hands := k.sample(rng)
		for p, n := range k.hidden {
			if len(hands[p]) != n {
				t.Fatalf("player %d got %d cards, holds %d", p, len(hands[p]), n)
			}
			for _, c := range hands[p] {
				if !unseen[c] {
					t.Fatalf("dealt %v, which is not unseen", c)
				}
				if k.void[p][c.Suit] {
					t.Fatalf("player %d is out of %v but was dealt %v", p, c.Suit, c)
				}
			}
		}
	}
}

func TestVoidsComeFromNotFollowing(t *testing.T) {
	v := game.PlayerView{
		Me:    0,
		Rules: game.DefaultRules(),
		RoundTricks: [][]game.Played{{
			{Player: 1, Card: game.Card{Rank: game.Two, Suit: game.Hearts}},
			{Player: 2, Card: game.Card{Rank: game.Four, Suit: game.Clubs}},
			{Player: 0, Card: game.Card{Rank: game.Ace, Suit: game.Hearts}},
		}},
		Players: make([]game.PublicInfo, 3),
	}
	v.Rules.Tricks.Follow = game.FollowSuit
	k := know(v)
	if !k.void[2][game.Hearts] || k.void[0][game.Hearts] || k.void[1][game.Hearts] {
		t.Fatalf("voids = %v, want only player 2 out of hearts", k.void)
	}
}

// fixedView sets up a trick by hand: vira 4♣ (manilha 5), we are player 0.
func fixedView(hand []game.Card, trick []game.Played, bid, won int, lives []int) game.PlayerView {
	r := game.DefaultRules()
	vira := game.Card{Rank: game.Four, Suit: game.Clubs}
	v := game.PlayerView{Me: 0, Rules: r, Phase: game.PhasePlaying, Cards: len(hand), Vira: &vira, Turn: 0,
		Hand: hand, Playable: hand, Trick: trick, Forbidden: -1, Winner: -1}
	for _, s := range []game.Suit{game.Diamonds, game.Spades, game.Hearts, game.Clubs} {
		v.Manilhas = append(v.Manilhas, game.Card{Rank: game.Five, Suit: s})
	}
	for i, l := range lives {
		info := game.PublicInfo{Name: names(len(lives))[i], Lives: l, Bidded: true, Left: len(hand)}
		if i == 0 {
			info.Bid, info.Won = bid, won
		}
		for _, p := range trick {
			if p.Player == i {
				info.Left--
			}
		}
		v.Players = append(v.Players, info)
	}
	return v
}

func card(r game.Rank, s game.Suit) game.Card { return game.Card{Rank: r, Suit: s} }

func TestHardTakesCheapestWhenLast(t *testing.T) {
	// Last to play, still needs a trick: 2♠ already beats the K on the table, so
	// spending the 3♥ would be a waste.
	hand := []game.Card{card(game.Six, game.Diamonds), card(game.Two, game.Spades), card(game.Three, game.Hearts)}
	trick := []game.Played{{Player: 1, Card: card(game.King, game.Clubs)}, {Player: 2, Card: card(game.Queen, game.Hearts)}}
	v := fixedView(hand, trick, 1, 0, []int{5, 5, 5})
	if got := NewHard().Play(v); got != card(game.Two, game.Spades) {
		t.Fatalf("played %v, want 2♠", got)
	}
}

func TestHardCancelsToDodge(t *testing.T) {
	// Bid already made. Our 3♦ is our most dangerous card: played later it
	// would take a trick. Here it cancels the 3♣ on the table and still loses
	// to the A♠, so it goes now. (The leader, player 3, hasn't played, so
	// sabotage has nothing to say.)
	hand := []game.Card{card(game.Three, game.Diamonds), card(game.Two, game.Hearts)}
	trick := []game.Played{{Player: 1, Card: card(game.Three, game.Clubs)}, {Player: 2, Card: card(game.Ace, game.Spades)}}
	v := fixedView(hand, trick, 0, 0, []int{5, 5, 5, 9})
	got := NewHard().Play(v)
	if got != card(game.Three, game.Diamonds) {
		t.Fatalf("played %v, want 3♦ (cancels the 3♣, sheds our strongest card without taking the trick)", got)
	}
}

func TestHardSabotagesTheLeader(t *testing.T) {
	// Our bid is made and either card dodges the trick. The leader (player 1,
	// most lives) bid 0 and is taking this trick with the 7♣. Letting them keep
	// it costs them a life, so we play the card that doesn't beat the 7.
	hand := []game.Card{card(game.Six, game.Diamonds), card(game.Queen, game.Hearts)}
	trick := []game.Played{{Player: 2, Card: card(game.Four, game.Hearts)}, {Player: 1, Card: card(game.Seven, game.Clubs)}}
	v := fixedView(hand, trick, 0, 0, []int{5, 9, 4})
	v.Players[1].Bid, v.Players[1].Won = 0, 0
	if got := NewHard().Play(v); got != card(game.Six, game.Diamonds) {
		t.Fatalf("played %v, want 6♦ so the leader keeps the trick", got)
	}
}

func TestMasterIsDeterministic(t *testing.T) {
	m := midRound(t, game.DefaultRules(), 4, 3, 5, 1)
	v := m.View(1)
	a, b := NewMaster(9).Play(v), NewMaster(9).Play(v)
	if a != b {
		t.Fatalf("same seed, different plays: %v and %v", a, b)
	}
}

func TestMasterDecisionTime(t *testing.T) {
	// The heaviest table: 3 players, 10 cards each (13 with no cap would not fit
	// the 39 cards), at the first play of the round.
	r := game.DefaultRules()
	r.Rounds.Sequence = game.SeqFixed
	m := midRound(t, r, 3, 2, 0, 1)
	v := m.View(1)
	start := time.Now()
	NewMaster(1).Play(v)
	if d := time.Since(start); d > 250*time.Millisecond {
		t.Fatalf("one decision took %v", d)
	}
	t.Logf("10-card decision: %v", time.Since(start))
}

func BenchmarkMasterPlay(b *testing.B) {
	r := game.DefaultRules()
	r.Rounds.Sequence = game.SeqFixed
	m := midRound(b, r, 3, 2, 0, 1)
	v := m.View(1)
	bot := NewMaster(1)
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		bot.Play(v)
	}
}

func BenchmarkHardPlay(b *testing.B) {
	r := game.DefaultRules()
	r.Rounds.Sequence = game.SeqFixed
	m := midRound(b, r, 3, 2, 0, 1)
	v := m.View(1)
	bot := NewHard()
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		bot.Play(v)
	}
}
