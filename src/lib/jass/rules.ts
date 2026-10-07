import { type Card, type GameMode, type Rank } from "./cards";

// Von der schwächsten zur stärksten Trumpfkarte.
const trumpRanks: readonly Rank[] = [
  "6", "7", "8", "Banner", "Ober", "König", "Ass", "9", "Under",
];

export function getPlayableCards(
  hand: Card[],
  trick: Card[],
  gameMode: GameMode
): Card[] {
  const leadCard = trick[0];

  // Wer den Stich eröffnet, darf jede eigene Karte spielen.
  if (!leadCard) return [...hand];

  const matchingCards = hand.filter(
    (card) => card.suit === leadCard.suit
  );

  // Ohne Trumpf muss man die angespielte Farbe bedienen.
  if (gameMode === "Obenabe" || gameMode === "Undenufe") {
    return matchingCards.length > 0 ? matchingCards : [...hand];
  }

  const trumpCards = hand.filter(
    (card) => card.suit === gameMode
  );

  // Wird Trumpf angespielt, muss Trumpf bedient werden.
  if (leadCard.suit === gameMode) {
    const onlyUnder =
      trumpCards.length === 1 && trumpCards[0].rank === "Under";

    if (trumpCards.length === 0 || onlyUnder) return [...hand];

    return trumpCards;
  }

  // Bei einer anderen Farbe darf man bedienen oder trumpfen.
  const candidates =
    matchingCards.length > 0
      ? hand.filter(
          (card) =>
            card.suit === leadCard.suit || card.suit === gameMode
        )
      : [...hand];

  const tableTrumps = trick.filter(
    (card) => card.suit === gameMode
  );

  const onlyTrumps = hand.every(
    (card) => card.suit === gameMode
  );

  if (tableTrumps.length === 0 || onlyTrumps) {
    return candidates;
  }

  const strongestTrump = Math.max(
    ...tableTrumps.map((card) => trumpRanks.indexOf(card.rank))
  );

  // Solange andere Farben vorhanden sind, kein Untertrumpfen.
  return candidates.filter(
    (card) =>
      card.suit !== gameMode ||
      trumpRanks.indexOf(card.rank) > strongestTrump
  );
}
const normalRanks: readonly Rank[] = [
  "6", "7", "8", "9", "Banner", "Under", "Ober", "König", "Ass",
];

export function getTrickWinner(
  trick: Card[],
  gameMode: GameMode
): number {
  if (trick.length !== 4) {
    throw new Error("Ein vollständiger Stich braucht vier Karten.");
  }

  const leadSuit = trick[0].suit;

  function strength(card: Card): number {
    if (gameMode === "Obenabe" || gameMode === "Undenufe") {
      if (card.suit !== leadSuit) return -1;

      const rankIndex = normalRanks.indexOf(card.rank);

      return gameMode === "Obenabe"
        ? rankIndex
        : normalRanks.length - 1 - rankIndex;
    }

    if (card.suit === gameMode) {
      return 100 + trumpRanks.indexOf(card.rank);
    }

    if (card.suit === leadSuit) {
      return normalRanks.indexOf(card.rank);
    }

    return -1;
  }

  let winnerIndex = 0;

  for (let index = 1; index < trick.length; index++) {
    if (strength(trick[index]) > strength(trick[winnerIndex])) {
      winnerIndex = index;
    }
  }

  return winnerIndex;
}

export function getCardPoints(
  card: Card,
  gameMode: GameMode
): number {
  if (gameMode === "Obenabe") {
    if (card.rank === "8") return 8;
  } else if (gameMode === "Undenufe") {
    if (card.rank === "6") return 11;
    if (card.rank === "8") return 8;
    if (card.rank === "Ass") return 0;
  } else if (card.suit === gameMode) {
    if (card.rank === "Under") return 20;
    if (card.rank === "9") return 14;
  }

  switch (card.rank) {
    case "Ass": return 11;
    case "König": return 4;
    case "Ober": return 3;
    case "Under": return 2;
    case "Banner": return 10;
    default: return 0;
  }
}

export function getTrickPoints(
  trick: Card[],
  gameMode: GameMode,
  isLastTrick = false
): number {
  const cardPoints = trick.reduce(
    (total, card) => total + getCardPoints(card, gameMode),
    0
  );

  return cardPoints + (isLastTrick ? 5 : 0);
}