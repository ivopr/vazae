package game

import (
	"errors"
	"fmt"
	"math/rand"
)

type Phase string

const (
	PhaseBidding  Phase = "bidding"
	PhasePlaying  Phase = "playing"
	PhaseRoundEnd Phase = "roundEnd"
	PhaseOver     Phase = "over"
)

type Player struct {
	Name  string
	Lives int
	Hand  []Card
	Bid   int
	Won   int
	// Bidded is false until the player has bid in the current round.
	Bidded bool
}

func (p Player) Alive() bool { return p.Lives > 0 }

type Played struct {
	Player int  `json:"player"`
	Card   Card `json:"card"`
	// Cancelled is filled in views only: the card was voided by an equal one.
	Cancelled bool `json:"cancelled"`
}

// Loss records what a player lost at the end of a round.
type Loss struct {
	Player int `json:"player"`
	Bid    int `json:"bid"`
	Won    int `json:"won"`
	Lost   int `json:"lost"`
}

type Match struct {
	rules   Rules
	rng     *rand.Rand
	Players []Player
	seq     []int

	Round    int // 0-based index of the current round
	Cards    int // cards per hand this round
	Dealer   int
	Phase    Phase
	Vira     *Card  // nil when no card is turned up
	Manilhas []Card // this round's manilhas, weakest first
	Turn     int    // whose action is expected
	Leader   int    // who leads the current trick
	Trick    []Played
	LastLoss []Loss // losses of the round that just ended
	Winner   int    // valid in PhaseOver; -1 if none or a draw
	Winners  []int  // valid in PhaseOver: the winner, or everyone in a draw

	// The trick that was just completed, kept so a UI can show it after
	// Trick is cleared. LastTrickWinner is -1 when every card cancelled.
	LastTrick       []Played
	LastTrickWinner int
	// RoundTricks are the tricks completed this round, in order. Public: they
	// were on the table.
	RoundTricks [][]Played

	firstBidder int
	tiebreak    bool // playing an extra round to break a tie
}

var (
	ErrPhase   = errors.New("ação fora de fase")
	ErrTurn    = errors.New("não é a vez do jogador")
	ErrBadBid  = errors.New("palpite inválido")
	ErrLastBid = errors.New("este palpite fecharia a soma com o número de cartas")
	ErrNoCard  = errors.New("carta não está na mão")
	ErrFollow  = errors.New("é preciso jogar uma carta do naipe que abriu a vaza")
	ErrMinimum = errors.New("jogadores de menos para estas regras")
	ErrTooMany = errors.New("jogadores demais para estas regras")
	ErrRules   = errors.New("regras inválidas")
)

// MaxRounds ends any match, decided by lives, so rules where nobody can lose
// (say, a deck where every trick cancels) still finish.
const MaxRounds = 300

// New creates a match and deals the first round.
func New(rules Rules, names []string, seed int64) (*Match, error) {
	if errs := rules.Validate(); errs != nil {
		return nil, fmt.Errorf("%w: %v", ErrRules, errs[0])
	}
	n := len(names)
	if n < rules.Players.Min {
		return nil, ErrMinimum
	}
	if n > rules.MaxPlayers() {
		return nil, ErrTooMany
	}
	m := &Match{rules: rules, rng: rand.New(rand.NewSource(seed)), Winner: -1, Dealer: -1}
	for _, name := range names {
		m.Players = append(m.Players, Player{Name: name, Lives: rules.Players.Lives})
	}
	m.seq = rules.sequence(n)
	m.deal()
	return m, nil
}

func (m *Match) Rules() Rules { return m.rules }

func (m *Match) alive() int {
	c := 0
	for _, p := range m.Players {
		if p.Alive() {
			c++
		}
	}
	return c
}

// next returns the next living player after i in the direction of play.
func (m *Match) next(i int) int {
	n := len(m.Players)
	step := 1
	if m.rules.Bidding.Direction == Counter {
		step = n - 1
	}
	for k := 1; k <= n; k++ {
		j := (i + k*step) % n
		if m.Players[j].Alive() {
			return j
		}
	}
	return i
}

func (m *Match) deal() {
	r := m.rules
	alive := m.alive()
	if r.Rounds.GrowWhenFewer {
		m.seq = r.sequence(alive)
	}
	cards := m.seq[m.Round%len(m.seq)]
	if cap := (r.DeckLen() - r.vira()) / alive; cards > cap {
		cards = cap
	}
	m.Cards = cards
	switch {
	case m.Dealer < 0:
		m.Dealer = 0
	case r.Rounds.Dealer == DealerNext || !m.Players[m.Dealer].Alive():
		m.Dealer = m.next(m.Dealer)
	}

	deck := r.newDeck()
	m.rng.Shuffle(len(deck), func(i, j int) { deck[i], deck[j] = deck[j], deck[i] })
	for i := range m.Players {
		p := &m.Players[i]
		p.Hand, p.Bid, p.Won, p.Bidded = nil, 0, 0, false
		if p.Alive() {
			p.Hand = append(p.Hand, deck[:cards]...)
			deck = deck[cards:]
		}
	}
	m.Vira = nil
	if r.Rounds.ReserveVira {
		v := deck[0]
		m.Vira = &v
	}
	m.Manilhas = r.manilhas(m.Vira)
	m.Trick = nil
	m.LastTrick, m.LastTrickWinner = nil, -1
	m.RoundTricks = nil
	m.LastLoss = nil
	m.Phase = PhaseBidding
	m.Turn = m.Dealer
	if r.Bidding.Order == BidLeftOfDealer {
		m.Turn = m.next(m.Dealer)
	}
	m.firstBidder = m.Turn
}

// Strength orders cards for one trick under this match's rules and manilhas.
func (m *Match) Strength(c Card) int { return m.rules.strength(m.Manilhas, c) }

func (m *Match) isManilha(c Card) bool { return manilhaIndex(m.Manilhas, c) >= 0 }

// Bid registers the player's bid.
func (m *Match) Bid(player, n int) error {
	if m.Phase != PhaseBidding {
		return ErrPhase
	}
	if player != m.Turn {
		return ErrTurn
	}
	if n < m.rules.Bidding.MinBid || n > m.Cards {
		return ErrBadBid
	}
	if f := m.ForbiddenBid(); f >= 0 && n == f {
		return ErrLastBid
	}
	p := &m.Players[player]
	p.Bid, p.Bidded = n, true
	if nxt := m.next(player); nxt != m.firstBidder {
		m.Turn = nxt
		return nil
	}
	m.Phase = PhasePlaying
	switch m.rules.Tricks.FirstLeader {
	case LeadDealer:
		m.Leader = m.Dealer
	case LeadHighestBid:
		best, i := -1, m.firstBidder
		for k := 0; k < m.alive(); k++ {
			if b := m.Players[i].Bid; b > best {
				best, m.Leader = b, i
			}
			i = m.next(i)
		}
	default:
		m.Leader = m.firstBidder
	}
	m.Turn = m.Leader
	return nil
}

func (m *Match) bidSum() int {
	s := 0
	for _, p := range m.Players {
		if p.Bidded {
			s += p.Bid
		}
	}
	return s
}

// ForbiddenBid returns the bid the current player may not make, or -1.
func (m *Match) ForbiddenBid() int {
	b := m.rules.Bidding
	if m.Phase != PhaseBidding || !b.SumRule || b.MinBid >= m.Cards {
		// With a single possible bid, forbidding it would leave no move.
		return -1
	}
	restricted := m.Turn == m.Dealer
	if b.Restricted == RestrictLastBidder {
		restricted = m.next(m.Turn) == m.firstBidder
	}
	if !restricted {
		return -1
	}
	if f := m.Cards - m.bidSum(); f >= b.MinBid {
		return f
	}
	return -1
}

// Legal lists the cards the player may play now.
func (m *Match) Legal(player int) []Card {
	hand := m.Players[player].Hand
	if m.rules.Tricks.Follow != FollowSuit || len(m.Trick) == 0 {
		return append([]Card(nil), hand...)
	}
	lead := m.Trick[0].Card.Suit
	var same []Card
	for _, c := range hand {
		if c.Suit == lead {
			same = append(same, c)
		}
	}
	if len(same) == 0 {
		return append([]Card(nil), hand...)
	}
	return same
}

// Play puts a card from the player's hand on the table.
func (m *Match) Play(player int, c Card) error {
	if m.Phase != PhasePlaying {
		return ErrPhase
	}
	if player != m.Turn {
		return ErrTurn
	}
	p := &m.Players[player]
	idx := -1
	for i, h := range p.Hand {
		if h == c {
			idx = i
			break
		}
	}
	if idx < 0 {
		return ErrNoCard
	}
	if manilhaIndex(m.Legal(player), c) < 0 {
		return ErrFollow
	}
	p.Hand = append(p.Hand[:idx], p.Hand[idx+1:]...)
	m.Trick = append(m.Trick, Played{Player: player, Card: c})

	if len(m.Trick) < m.alive() {
		m.Turn = m.next(player)
		return nil
	}
	m.resolveTrick()
	return nil
}

// PlayOnly plays the single card of a one-card round, which the player
// cannot see and therefore cannot name.
func (m *Match) PlayOnly(player int) error {
	if m.Phase == PhasePlaying && player == m.Turn && len(m.Players[player].Hand) == 1 {
		return m.Play(player, m.Players[player].Hand[0])
	}
	return m.Play(player, Card{Rank: -1})
}

func (m *Match) cancelled(trick []Played) []bool { return m.rules.cancelled(m.Manilhas, trick) }

// resolveTrick finds the winner among the cards that did not cancel.
func (m *Match) resolveTrick() {
	t := m.rules.Tricks
	winner := m.rules.trickWinner(m.Manilhas, m.Trick)
	switch {
	case winner >= 0 && t.NextLeader == NextWinner:
		m.Leader = winner
	case winner >= 0 || t.AllCancelled == CancelNextLeads:
		m.Leader = m.next(m.Leader)
	}
	if winner >= 0 {
		m.Players[winner].Won++
	}
	m.LastTrick, m.LastTrickWinner = m.Trick, winner
	m.RoundTricks = append(m.RoundTricks, m.Trick)
	m.Trick = nil
	m.Turn = m.Leader

	if len(m.Players[m.Leader].Hand) == 0 {
		m.endRound()
	}
}

func (m *Match) endRound() {
	for i := range m.Players {
		p := &m.Players[i]
		if !p.Alive() {
			continue
		}
		lost := p.Bid - p.Won
		if lost < 0 {
			lost = -lost
		}
		if m.rules.Scoring.Loss == LossOnePerMiss && lost > 0 {
			lost = 1
		}
		p.Lives -= lost
		m.LastLoss = append(m.LastLoss, Loss{i, p.Bid, p.Won, lost})
	}
	s := m.rules.Scoring
	byRounds := s.End == EndRounds && !m.tiebreak && m.Round+1 >= s.Rounds
	if m.alive() > 1 && !byRounds && m.Round+1 < MaxRounds {
		m.Phase = PhaseRoundEnd
		return
	}
	m.finish()
}

// finish picks the winner, or sets up an extra round when the rules break
// ties that way.
func (m *Match) finish() {
	// Among the players still in, or everyone when all went down together.
	pool := m.alive() > 0
	best := -1 << 31
	for _, p := range m.Players {
		if (p.Alive() || !pool) && p.Lives > best {
			best = p.Lives
		}
	}
	var top []int
	for i, p := range m.Players {
		if (p.Alive() || !pool) && p.Lives == best {
			top = append(top, i)
		}
	}
	if len(top) > 1 {
		tie := m.rules.Scoring.Tie
		if tie == TieExtraRound && (m.tiebreak || m.Round+1 >= MaxRounds) {
			// One extra round only: a second tie is a draw.
			tie = TieDraw
		}
		switch tie {
		case TieDraw:
			m.Phase, m.Winner, m.Winners = PhaseOver, -1, top
			return
		case TieExtraRound:
			for i := range m.Players {
				m.Players[i].Lives = 0
			}
			for _, i := range top {
				m.Players[i].Lives = 1
			}
			m.tiebreak = true
			m.Phase = PhaseRoundEnd
			return
		}
	}
	m.Phase, m.Winner, m.Winners = PhaseOver, top[0], top[:1]
}

// NextRound deals the next round after a PhaseRoundEnd.
func (m *Match) NextRound() error {
	if m.Phase != PhaseRoundEnd {
		return ErrPhase
	}
	m.Round++
	m.deal()
	return nil
}

func (m *Match) String() string {
	return fmt.Sprintf("round %d cards %d phase %s turn %d", m.Round, m.Cards, m.Phase, m.Turn)
}
