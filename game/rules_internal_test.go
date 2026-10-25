package game

import (
	"encoding/json"
	"errors"
	"testing"
)

// One test per rule knob: each flips a rule from its default and checks the
// engine follows it.

func c(r Rank, s Suit) Card { return Card{r, s} }

func names(n int) []string {
	out := make([]string, n)
	for i := range out {
		out[i] = string(rune('a' + i))
	}
	return out
}

func mustNew(t *testing.T, r Rules, n int) *Match {
	t.Helper()
	m, err := New(r, names(n), 1)
	if err != nil {
		t.Fatal(err)
	}
	return m
}

// playing sets up a trick from scratch: player 0 leads, vira fixes the manilhas.
func playing(t *testing.T, r Rules, vira Card, hands ...[]Card) *Match {
	t.Helper()
	m := mustNew(t, r, len(hands))
	for i, h := range hands {
		m.Players[i].Hand = append([]Card(nil), h...)
		m.Players[i].Bid, m.Players[i].Won, m.Players[i].Bidded = 0, 0, true
	}
	m.Cards = len(hands[0])
	m.Vira = &vira
	m.Manilhas = r.manilhas(m.Vira)
	m.Phase, m.Leader, m.Turn, m.Trick = PhasePlaying, 0, 0, nil
	return m
}

func playAll(t *testing.T, m *Match, cards ...Card) {
	t.Helper()
	for _, card := range cards {
		if err := m.Play(m.Turn, card); err != nil {
			t.Fatalf("play %v: %v", card, err)
		}
	}
}

func TestDefaultRulesValid(t *testing.T) {
	for _, p := range Presets() {
		if errs := p.Rules.Validate(); errs != nil {
			t.Fatalf("%s: %v", p.ID, errs)
		}
	}
}

func TestDeckRanks(t *testing.T) { // rule 1
	r := DefaultRules()
	r.Deck.Ranks = []Rank{Queen, Jack, King, Ace, Two, Three}
	r.Deck.Order = append([]Rank(nil), r.Deck.Ranks...)
	m := mustNew(t, r, 3)
	m.Round = 3
	m.deal()
	for _, p := range m.Players {
		for _, h := range p.Hand {
			if h.Rank < Queen {
				t.Fatalf("dealt %v outside the deck", h)
			}
		}
	}
}

func TestDeckOrder(t *testing.T) { // rule 2
	r := DefaultRules()
	r.Manilha.Mode, r.Rounds.ReserveVira = ManilhaNone, false
	for i, j := 0, len(r.Deck.Order)-1; i < j; i, j = i+1, j-1 {
		r.Deck.Order[i], r.Deck.Order[j] = r.Deck.Order[j], r.Deck.Order[i]
	}
	if r.strength(nil, c(Four, Clubs)) <= r.strength(nil, c(Three, Clubs)) {
		t.Fatal("reversed order: 4 should beat 3")
	}
}

func TestManilhaModes(t *testing.T) { // rule 3
	r := DefaultRules()
	if got := r.manilhas(&Card{Three, Clubs})[0].Rank; got != Four {
		t.Fatalf("vira 3 gives manilha %v, want 4", got)
	}
	r.Manilha.Mode = ManilhaFixed
	m := r.manilhas(&Card{Three, Clubs})
	if len(m) != 4 || m[3] != c(Four, Clubs) {
		t.Fatalf("fixed manilhas = %v", m)
	}
	if r.strength(m, c(Seven, Diamonds)) <= r.strength(m, c(Three, Clubs)) {
		t.Fatal("7♦ should beat 3 with fixed manilhas")
	}
	if r.strength(m, c(Seven, Clubs)) >= r.strength(m, c(Three, Clubs)) {
		t.Fatal("7♣ is not a fixed manilha")
	}
	r.Manilha.Mode = ManilhaNone
	if r.manilhas(&Card{Three, Clubs}) != nil {
		t.Fatal("mode none still has manilhas")
	}
}

func TestManilhaAboveAll(t *testing.T) { // rule 4
	r := DefaultRules()
	r.Manilha.AboveAll = false
	m := r.manilhas(&Card{Four, Clubs}) // manilha 5
	if r.strength(m, c(Five, Clubs)) >= r.strength(m, c(Six, Diamonds)) {
		t.Fatal("manilha 5 should stay below 6 when not above all")
	}
	if r.strength(m, c(Five, Clubs)) <= r.strength(m, c(Four, Clubs)) {
		t.Fatal("manilha 5 should still beat 4")
	}
}

func TestSuitOrder(t *testing.T) { // rule 5
	r := DefaultRules()
	r.Manilha.SuitOrder = []Suit{Clubs, Hearts, Spades, Diamonds}
	m := r.manilhas(&Card{Four, Clubs})
	if r.strength(m, c(Five, Diamonds)) <= r.strength(m, c(Five, Clubs)) {
		t.Fatal("♦ should be the strongest manilha")
	}
}

func TestPlayerLimits(t *testing.T) { // rules 6, 7
	r := DefaultRules()
	r.Players.Min, r.Players.Max = 3, 4
	if _, err := New(r, names(2), 1); !errors.Is(err, ErrMinimum) {
		t.Fatalf("2 players: %v", err)
	}
	if _, err := New(r, names(5), 1); !errors.Is(err, ErrTooMany) {
		t.Fatalf("5 players: %v", err)
	}
}

func TestLives(t *testing.T) { // rule 8
	r := DefaultRules()
	r.Players.Lives = 9
	if got := mustNew(t, r, 2).Players[1].Lives; got != 9 {
		t.Fatalf("lives = %d", got)
	}
}

func TestSequences(t *testing.T) { // rules 10, 11
	r := DefaultRules()
	r.Rounds.MaxCards = 4
	want := map[Sequence][]int{
		SeqUpDown:     {1, 2, 3, 4, 3, 2},
		SeqUpDownFull: {1, 2, 3, 4, 3, 2, 1},
		SeqUp:         {1, 2, 3, 4},
		SeqDown:       {4, 3, 2, 1},
		SeqFixed:      {4},
	}
	for s, w := range want {
		r.Rounds.Sequence = s
		if got := r.sequence(3); !equalInts(got, w) {
			t.Errorf("%s = %v, want %v", s, got, w)
		}
	}
}

func equalInts(a, b []int) bool {
	if len(a) != len(b) {
		return false
	}
	for i := range a {
		if a[i] != b[i] {
			return false
		}
	}
	return true
}

func TestGrowWhenFewer(t *testing.T) { // rule 12
	r := DefaultRules()
	r.Rounds.GrowWhenFewer = true
	m := mustNew(t, r, 8) // 39/8 = 4 cards at most
	for i := 2; i < 8; i++ {
		m.Players[i].Lives = 0
	}
	m.Round = 8 // the largest hand of a 2-player cycle (1…10…2)
	m.deal()
	if m.Cards != 9 {
		t.Fatalf("cards = %d, want 9 with two players left", m.Cards)
	}
}

func TestNoVira(t *testing.T) { // rule 13
	r := DefaultRules()
	r.Manilha.Mode, r.Rounds.ReserveVira = ManilhaNone, false
	m := mustNew(t, r, 4)
	if m.Vira != nil || len(m.Manilhas) != 0 {
		t.Fatal("no card should be turned up")
	}
	if _, err := New(r, names(40), 1); err != nil {
		t.Fatalf("40 players with no vira: %v", err)
	}
}

func TestDealerStays(t *testing.T) { // rule 14
	r := DefaultRules()
	r.Rounds.Dealer = DealerStays
	m := mustNew(t, r, 3)
	m.Phase = PhaseRoundEnd
	if err := m.NextRound(); err != nil || m.Dealer != 0 {
		t.Fatalf("dealer = %d, err %v", m.Dealer, err)
	}
}

func TestBiddingOrderAndDirection(t *testing.T) { // rule 16
	r := DefaultRules()
	r.Bidding.Order = BidDealerFirst
	if m := mustNew(t, r, 3); m.Turn != m.Dealer {
		t.Fatalf("turn %d, dealer %d", m.Turn, m.Dealer)
	}
	r.Bidding.Order, r.Bidding.Direction = BidLeftOfDealer, Counter
	if m := mustNew(t, r, 3); m.Turn != 2 {
		t.Fatalf("counter-clockwise: first bidder %d, want 2", m.Turn)
	}
}

func TestMinBid(t *testing.T) { // rule 17
	r := DefaultRules()
	r.Bidding.MinBid = 1
	m := mustNew(t, r, 3)
	m.Round = 2
	m.deal() // 3 cards
	if err := m.Bid(m.Turn, 0); !errors.Is(err, ErrBadBid) {
		t.Fatalf("bid 0: %v", err)
	}
}

func TestMinBidOneCardHasAMove(t *testing.T) { // rules 17 + 19
	r := DefaultRules()
	r.Bidding.MinBid = 1
	m := mustNew(t, r, 2) // round 1: one card, so 1 is the only bid
	for m.Phase == PhaseBidding {
		if err := m.Bid(m.Turn, 1); err != nil {
			t.Fatal(err)
		}
	}
}

func TestRestrictedDealer(t *testing.T) { // rule 18
	r := DefaultRules()
	r.Bidding.Order, r.Bidding.Restricted = BidDealerFirst, RestrictDealer
	m := mustNew(t, r, 3)
	if got := m.ForbiddenBid(); got != m.Cards {
		t.Fatalf("dealer bidding first may not bid %d, got %d", m.Cards, got)
	}
}

func TestNoSumRule(t *testing.T) { // rule 19
	r := DefaultRules()
	r.Bidding.SumRule = false
	m := mustNew(t, r, 2)
	_ = m.Bid(m.Turn, 0)
	if got := m.ForbiddenBid(); got != -1 {
		t.Fatalf("forbidden = %d", got)
	}
}

func TestFirstLeader(t *testing.T) { // rule 20
	r := DefaultRules()
	r.Tricks.FirstLeader = LeadDealer
	m := mustNew(t, r, 3)
	_ = m.Bid(1, 0)
	_ = m.Bid(2, 0)
	_ = m.Bid(0, 0)
	if m.Leader != m.Dealer {
		t.Fatalf("leader %d, dealer %d", m.Leader, m.Dealer)
	}

	r.Tricks.FirstLeader = LeadHighestBid
	m = mustNew(t, r, 3)
	_ = m.Bid(1, 0)
	_ = m.Bid(2, 1)
	_ = m.Bid(0, 1)
	if m.Leader != 2 {
		t.Fatalf("leader %d, want 2 (first highest bid)", m.Leader)
	}
}

func TestFollowSuit(t *testing.T) { // rule 21
	r := DefaultRules()
	r.Tricks.Follow = FollowSuit
	m := playing(t, r, c(Four, Clubs),
		[]Card{c(Six, Hearts), c(Six, Spades)},
		[]Card{c(Two, Hearts), c(Three, Spades)})
	playAll(t, m, c(Six, Hearts))
	if err := m.Play(1, c(Three, Spades)); !errors.Is(err, ErrFollow) {
		t.Fatalf("off-suit with a heart in hand: %v", err)
	}
	if got := m.Legal(1); len(got) != 1 || got[0] != c(Two, Hearts) {
		t.Fatalf("legal = %v", got)
	}
}

func TestWeakestWins(t *testing.T) { // rule 23
	r := DefaultRules()
	r.Tricks.Winner = WinWeakest
	m := playing(t, r, c(Four, Clubs), []Card{c(Six, Hearts)}, []Card{c(Three, Spades)})
	playAll(t, m, c(Six, Hearts), c(Three, Spades))
	if m.LastTrickWinner != 0 {
		t.Fatalf("winner %d", m.LastTrickWinner)
	}
}

func TestNoCancel(t *testing.T) { // rule 24
	r := DefaultRules()
	r.Tricks.CancelEqual = false
	m := playing(t, r, c(Four, Clubs),
		[]Card{c(Three, Hearts)}, []Card{c(Three, Spades)}, []Card{c(Two, Spades)})
	playAll(t, m, c(Three, Hearts), c(Three, Spades), c(Two, Spades))
	if m.LastTrickWinner != 0 {
		t.Fatalf("winner %d, want the first 3", m.LastTrickWinner)
	}
}

func TestManilhasCancel(t *testing.T) { // rule 25
	r := DefaultRules()
	r.Tricks.ManilhasCancel = true
	m := playing(t, r, c(Four, Clubs), // manilha 5
		[]Card{c(Five, Hearts)}, []Card{c(Five, Spades)}, []Card{c(Two, Spades)})
	playAll(t, m, c(Five, Hearts), c(Five, Spades), c(Two, Spades))
	if m.LastTrickWinner != 2 {
		t.Fatalf("winner %d, want 2 once the manilhas cancel", m.LastTrickWinner)
	}
}

func TestAllCancelled(t *testing.T) { // rule 26
	hands := [][]Card{{c(Three, Hearts), c(Six, Clubs)}, {c(Three, Spades), c(Six, Hearts)}}
	run := func(mode AllCancelled) *Match {
		r := DefaultRules()
		r.Tricks.AllCancelled = mode
		m := playing(t, r, c(Four, Clubs), hands...)
		playAll(t, m, c(Three, Hearts), c(Three, Spades))
		return m
	}
	if m := run(CancelSameLeader); m.LastTrickWinner != -1 || m.Leader != 0 {
		t.Fatalf("sameLeader: winner %d leader %d", m.LastTrickWinner, m.Leader)
	}
	if m := run(CancelNextLeads); m.LastTrickWinner != -1 || m.Leader != 1 {
		t.Fatalf("nextLeads: winner %d leader %d", m.LastTrickWinner, m.Leader)
	}
	if m := run(CancelLastCardWins); m.LastTrickWinner != 1 || m.Players[1].Won != 1 {
		t.Fatalf("lastCardWins: winner %d", m.LastTrickWinner)
	}
}

func TestCancelVoidsTrick(t *testing.T) { // rule 36
	hands := [][]Card{
		{c(Three, Hearts), c(Six, Clubs)},
		{c(Three, Spades), c(Six, Hearts)},
		{c(Two, Spades), c(Five, Hearts)},
	}
	run := func(voids bool) *Match {
		r := DefaultRules()
		r.Tricks.CancelVoidsTrick = voids
		m := playing(t, r, c(Four, Clubs), hands...)
		playAll(t, m, c(Three, Hearts), c(Three, Spades), c(Two, Spades))
		return m
	}
	if m := run(false); m.LastTrickWinner != 2 {
		t.Fatalf("off: winner %d, want 2", m.LastTrickWinner)
	}
	if m := run(true); m.LastTrickWinner != -1 || m.Leader != 0 {
		t.Fatalf("on: winner %d leader %d, want -1 and 0", m.LastTrickWinner, m.Leader)
	}
}

func TestNextLeaderRotates(t *testing.T) { // rule 27
	r := DefaultRules()
	r.Tricks.NextLeader = NextRotate
	m := playing(t, r, c(Four, Clubs),
		[]Card{c(Six, Hearts), c(Six, Clubs)},
		[]Card{c(Two, Spades), c(Six, Spades)},
		[]Card{c(Three, Spades), c(Seven, Hearts)})
	playAll(t, m, c(Six, Hearts), c(Two, Spades), c(Three, Spades))
	if m.LastTrickWinner != 2 || m.Leader != 1 {
		t.Fatalf("winner %d leader %d, want 2 and 1", m.LastTrickWinner, m.Leader)
	}
}

func TestOneCardNotBlind(t *testing.T) { // rule 29
	r := DefaultRules()
	r.OneCard.Blind = false
	v := mustNew(t, r, 3).View(0)
	if len(v.Hand) != 1 || len(v.Others) != 0 {
		t.Fatalf("hand %d others %d", len(v.Hand), len(v.Others))
	}
}

func TestOnePerMiss(t *testing.T) { // rule 31
	r := DefaultRules()
	r.Scoring.Loss = LossOnePerMiss
	m := playing(t, r, c(Four, Clubs), []Card{c(Six, Hearts)}, []Card{c(Six, Clubs)})
	m.Players[0].Bid = 3
	playAll(t, m, c(Six, Hearts), c(Six, Clubs))
	if m.LastLoss[0].Lost != 1 {
		t.Fatalf("lost %d, want 1", m.LastLoss[0].Lost)
	}
}

func TestEndAfterRounds(t *testing.T) { // rule 33
	r := DefaultRules()
	r.Scoring.End, r.Scoring.Rounds = EndRounds, 1
	m := playing(t, r, c(Four, Clubs), []Card{c(Six, Hearts)}, []Card{c(Two, Clubs)})
	m.Players[0].Bid, m.Players[1].Bid = 1, 1 // 2♣ takes it, so only player 0 misses
	playAll(t, m, c(Six, Hearts), c(Two, Clubs))
	if m.Phase != PhaseOver || m.Winner != 1 {
		t.Fatalf("phase %s winner %d", m.Phase, m.Winner)
	}
}

func TestTies(t *testing.T) { // rule 35
	tie := func(mode Tie) *Match {
		r := DefaultRules()
		r.Players.Lives = 1
		r.Scoring.Tie = mode
		// Both bid 1; one takes the trick, the other misses: both would lose 1.
		// Make both miss by bidding 2 with one card each.
		m := playing(t, r, c(Four, Clubs), []Card{c(Six, Hearts)}, []Card{c(Six, Clubs)})
		m.Players[0].Bid, m.Players[1].Bid = 1, 1
		playAll(t, m, c(Six, Hearts), c(Six, Clubs)) // cancel: nobody wins, both miss
		return m
	}
	if m := tie(TieFirstSeat); m.Phase != PhaseOver || m.Winner != 0 {
		t.Fatalf("firstSeat: phase %s winner %d", m.Phase, m.Winner)
	}
	if m := tie(TieDraw); m.Phase != PhaseOver || m.Winner != -1 || len(m.Winners) != 2 {
		t.Fatalf("draw: winner %d winners %v", m.Winner, m.Winners)
	}
	m := tie(TieExtraRound)
	if m.Phase != PhaseRoundEnd || m.Players[0].Lives != 1 || m.Players[1].Lives != 1 {
		t.Fatalf("extraRound: phase %s lives %d %d", m.Phase, m.Players[0].Lives, m.Players[1].Lives)
	}
}

func TestValidate(t *testing.T) {
	cases := map[string]func(*Rules){
		"deck.ranks":         func(r *Rules) { r.Deck.Ranks, r.Deck.Order = nil, nil },
		"deck.order":         func(r *Rules) { r.Deck.Order = r.Deck.Order[1:] },
		"manilha.mode":       func(r *Rules) { r.Manilha.Mode = "x" },
		"manilha.suitOrder":  func(r *Rules) { r.Manilha.SuitOrder = []Suit{Clubs, Clubs, Hearts, Spades} },
		"rounds.reserveVira": func(r *Rules) { r.Rounds.ReserveVira = false },
		"players.max":        func(r *Rules) { r.Players.Min, r.Players.Max = 3, 2 },
		"players.lives":      func(r *Rules) { r.Players.Lives = 0 },
		"scoring.rounds":     func(r *Rules) { r.Scoring.End, r.Scoring.Rounds = EndRounds, 0 },
	}
	for key, breakIt := range cases {
		r := DefaultRules()
		breakIt(&r)
		found := false
		for _, e := range r.Validate() {
			found = found || e.Key == key
		}
		if !found {
			t.Errorf("%s: not reported in %v", key, r.Validate())
		}
	}

	r := DefaultRules()
	r.Manilha.Mode = ManilhaFixed
	r.Deck.Ranks = []Rank{Four, Five, Six}
	r.Deck.Order = []Rank{Four, Five, Six}
	if errs := r.Validate(); len(errs) == 0 || errs[0].Key != "manilha.mode" {
		t.Errorf("fixed manilhas without 7 and A: %v", errs)
	}
}

func TestParseRulesKeepsDefaults(t *testing.T) {
	r, err := ParseRules([]byte(`{"players":{"lives":3},"tricks":{"winner":"weakest"}}`))
	if err != nil {
		t.Fatal(err)
	}
	if r.Players.Lives != 3 || r.Tricks.Winner != WinWeakest {
		t.Fatalf("fields not applied: %+v", r)
	}
	if r.Players.Min != 2 || !r.Tricks.CancelEqual || r.Manilha.Mode != ManilhaVira {
		t.Fatalf("missing fields lost their defaults: %+v", r)
	}
	b, _ := json.Marshal(DefaultRules())
	back, err := ParseRules(b)
	if err != nil || back.Validate() != nil {
		t.Fatalf("round trip: %v %v", err, back.Validate())
	}
}
