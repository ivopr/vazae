// Package solo runs a local match of one human against bots and exposes it
// to the frontend as a Wails service.
package solo

import (
	"errors"
	"fmt"
	"log"
	"math/rand"
	"slices"
	"sync"
	"time"

	"github.com/wailsapp/wails/v3/pkg/application"

	"vazae/game"
	"vazae/game/bot"
)

// StateEvent carries the human's PlayerView after every change.
const StateEvent = "solo:state"

var ErrNoMatch = errors.New("nenhuma partida em andamento")

type Difficulty string

const (
	Easy   Difficulty = "easy"
	Medium Difficulty = "medium"
	Hard   Difficulty = "hard"
	Master Difficulty = "master"
	// Mixed draws a level for each bot.
	Mixed Difficulty = "mixed"
)

var levels = []Difficulty{Easy, Medium, Hard, Master}

func newBot(level Difficulty, seed int64) bot.Bot {
	switch level {
	case Easy:
		return bot.NewEasy(seed)
	case Hard:
		return bot.NewHard()
	case Master:
		return bot.NewMaster(seed)
	default:
		return bot.NewMedium(seed)
	}
}

// drawLevels picks a level per bot for a mixed table, with at least two
// different levels when there are two bots or more.
func drawLevels(rng *rand.Rand, n int) []Difficulty {
	out := make([]Difficulty, n)
	for i := range out {
		out[i] = levels[rng.Intn(len(levels))]
	}
	if n > 1 && slices.IndexFunc(out, func(d Difficulty) bool { return d != out[0] }) < 0 {
		i := rng.Intn(n)
		out[i] = levels[(slices.Index(levels, out[i])+1+rng.Intn(len(levels)-1))%len(levels)]
	}
	return out
}

type StartConfig struct {
	Name       string     `json:"name"`
	Bots       int        `json:"bots"`
	Difficulty Difficulty `json:"difficulty"`
	Rules      game.Rules `json:"rules"`
}

// MaxBots is how many bots fit around the table on screen.
const MaxBots = 9

type Service struct {
	mu     sync.Mutex
	match  *game.Match
	human  int // the seat the person plays
	bots   []bot.Bot
	levels []Difficulty // per seat; empty for the person
	gen    int          // bumped on Start/Quit so a stale bot loop stops
	emit   func(game.PlayerView)

	// Pauses between bot moves, so the table can be followed.
	BotDelay   time.Duration
	TrickDelay time.Duration
}

func NewService() *Service {
	return &Service{
		emit: func(v game.PlayerView) {
			if app := application.Get(); app != nil {
				app.Event.Emit(StateEvent, v)
			}
		},
		BotDelay:   700 * time.Millisecond,
		TrickDelay: 1400 * time.Millisecond,
	}
}

// DefaultRules is the rule set a new player starts from.
func (s *Service) DefaultRules() game.Rules { return game.DefaultRules() }

// Presets are the built-in rule sets.
func (s *Service) Presets() []game.Preset { return game.Presets() }

// CheckRules lists what is wrong with a rule set; empty means it can be played.
func (s *Service) CheckRules(r game.Rules) []game.RuleError {
	return append([]game.RuleError{}, r.Validate()...)
}

// BotRange is how many bots these rules allow at the table.
func (s *Service) BotRange(r game.Rules) []int {
	lo, hi := botRange(r)
	return []int{lo, hi}
}

func botRange(r game.Rules) (lo, hi int) {
	lo, hi = r.Players.Min-1, r.MaxPlayers()-1
	if lo < 1 {
		lo = 1
	}
	if hi > MaxBots {
		hi = MaxBots
	}
	return lo, hi
}

// Start deals a new match and returns the first view.
func (s *Service) Start(cfg StartConfig) (game.PlayerView, error) {
	if errs := cfg.Rules.Validate(); len(errs) > 0 {
		return game.PlayerView{}, fmt.Errorf("regras inválidas: %s", errs[0].Msg)
	}
	if lo, hi := botRange(cfg.Rules); cfg.Bots < lo || cfg.Bots > hi {
		return game.PlayerView{}, fmt.Errorf("com estas regras, escolha de %d a %d robôs", lo, hi)
	}
	name := cfg.Name
	if name == "" {
		name = "Você"
	}
	seed := time.Now().UnixNano()
	n := cfg.Bots + 1
	human := 0
	if cfg.Rules.Players.HumanSeat == game.SeatRandom {
		human = rand.New(rand.NewSource(seed)).Intn(n)
	}
	drawn := drawLevels(rand.New(rand.NewSource(seed+1)), cfg.Bots)
	names := make([]string, n)
	bots := make([]bot.Bot, n)
	seatLevels := make([]Difficulty, n)
	k := 0
	for i := range names {
		if i == human {
			names[i] = name
			continue
		}
		level := cfg.Difficulty
		if level == Mixed {
			level = drawn[k]
		}
		k++
		names[i] = fmt.Sprintf("Robô %d", k)
		bots[i] = newBot(level, seed+int64(i))
		seatLevels[i] = level
	}
	m, err := game.New(cfg.Rules, names, seed)
	if err != nil {
		return game.PlayerView{}, err
	}

	s.mu.Lock()
	s.match, s.bots, s.human, s.levels = m, bots, human, seatLevels
	s.gen++
	v := m.View(s.human)
	s.mu.Unlock()

	s.runBots()
	return v, nil
}

// Levels is each seat's bot level, with "" for the person's seat.
func (s *Service) Levels() []Difficulty {
	s.mu.Lock()
	defer s.mu.Unlock()
	return append([]Difficulty{}, s.levels...)
}

func (s *Service) State() (game.PlayerView, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.match == nil {
		return game.PlayerView{}, ErrNoMatch
	}
	return s.match.View(s.human), nil
}

func (s *Service) Bid(n int) error {
	return s.act(func(m *game.Match) error { return m.Bid(s.human, n) })
}

func (s *Service) Play(c game.Card) error {
	return s.act(func(m *game.Match) error { return m.Play(s.human, c) })
}

// PlayOnly plays the hidden card of a one-card round.
func (s *Service) PlayOnly() error {
	return s.act(func(m *game.Match) error { return m.PlayOnly(s.human) })
}

func (s *Service) NextRound() error {
	return s.act(func(m *game.Match) error { return m.NextRound() })
}

func (s *Service) Quit() {
	s.mu.Lock()
	s.match, s.bots = nil, nil
	s.gen++
	s.mu.Unlock()
}

func (s *Service) act(f func(*game.Match) error) error {
	s.mu.Lock()
	if s.match == nil {
		s.mu.Unlock()
		return ErrNoMatch
	}
	if err := f(s.match); err != nil {
		s.mu.Unlock()
		return err
	}
	v := s.match.View(s.human)
	s.mu.Unlock()

	s.emit(v)
	s.runBots()
	return nil
}

// runBots plays bot turns in the background until it is the human's turn,
// the round ends, or the match is over.
func (s *Service) runBots() {
	s.mu.Lock()
	gen := s.gen
	s.mu.Unlock()

	go func() {
		for {
			s.mu.Lock()
			m := s.match
			if s.gen != gen || m == nil || !s.botTurn() {
				s.mu.Unlock()
				return
			}
			trickBefore := len(m.LastTrick) > 0 && len(m.Trick) == 0
			delay := s.BotDelay
			if trickBefore {
				// A trick was just completed: give the table time to show it.
				delay = s.TrickDelay
			}
			p, phase, blind := m.Turn, m.Phase, m.Blind()
			view, b := m.View(p), s.bots[p]
			s.mu.Unlock()

			// Think during the pause, not after it: a Master's simulation then
			// costs the table no extra time. Bots only read their view.
			start := time.Now()
			var bid int
			var card game.Card
			switch {
			case phase == game.PhaseBidding:
				bid = b.Bid(view)
			case !blind:
				card = b.Play(view)
			}
			time.Sleep(delay - time.Since(start))

			s.mu.Lock()
			if s.gen != gen || s.match != m || m.Turn != p || m.Phase != phase {
				s.mu.Unlock()
				return
			}
			var err error
			switch {
			case phase == game.PhaseBidding:
				err = m.Bid(p, bid)
			case blind:
				err = m.PlayOnly(p)
			default:
				err = m.Play(p, card)
			}
			v := m.View(s.human)
			s.mu.Unlock()

			if err != nil {
				// A bot made an illegal move; that is a bug in the bot.
				log.Printf("solo: bot %d: %v", p, err)
				return
			}
			s.emit(v)
		}
	}()
}

// botTurn reports whether the match is waiting on a bot. Caller holds mu.
func (s *Service) botTurn() bool {
	m := s.match
	if m.Phase != game.PhaseBidding && m.Phase != game.PhasePlaying {
		return false
	}
	return m.Turn != s.human
}
