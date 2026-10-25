// Package game implements the rules of Fodinha with a truco deck.
// It has no I/O and no global state; every Match is deterministic given its seed.
package game

import "fmt"

// Rank lists the truco ranks in their default strength order:
// 4 < 5 < 6 < 7 < Q < J < K < A < 2 < 3. Rules.Deck.Order can change it.
type Rank int

const (
	Four Rank = iota
	Five
	Six
	Seven
	Queen
	Jack
	King
	Ace
	Two
	Three
	numRanks
)

// Suit is listed in its default manilha order: ouros < espadas < copas < paus.
type Suit int

const (
	Diamonds Suit = iota
	Spades
	Hearts
	Clubs
	numSuits
)

const DeckSize = int(numRanks) * int(numSuits)

var rankNames = [numRanks]string{"4", "5", "6", "7", "Q", "J", "K", "A", "2", "3"}
var suitNames = [numSuits]string{"♦", "♠", "♥", "♣"}

type Card struct {
	Rank Rank `json:"rank"`
	Suit Suit `json:"suit"`
}

func (c Card) String() string {
	return fmt.Sprintf("%s%s", rankNames[c.Rank], suitNames[c.Suit])
}

// Card strength depends on the match's rules; see Rules.strength.
