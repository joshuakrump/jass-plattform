export const suits = ["Rosen", "Schellen", "Eicheln", "Schilten"] as const;

export const ranks = [
  "6", "7", "8", "9", "Banner", "Under", "Ober", "König", "Ass",
] as const;

export type Suit = (typeof suits)[number];
export type Rank = (typeof ranks)[number];

export type Card = {
  id: string;
  suit: Suit;
  rank: Rank;
};

export function createDeck(): Card[] {
  return suits.flatMap((suit) =>
    ranks.map((rank) => ({
      id: `${suit}-${rank}`,
      suit,
      rank,
    }))
  );
}

export function shuffleDeck(cards: Card[]): Card[] {
  const shuffled = [...cards];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

export function dealCards(): Card[][] {
  const deck = shuffleDeck(createDeck());

  return [
    deck.slice(0, 9),
    deck.slice(9, 18),
    deck.slice(18, 27),
    deck.slice(27, 36),
  ];
}

export type GameMode = Suit | "Obenabe" | "Undenufe";

export function sortHand(hand: Card[]): Card[] {
  return [...hand].sort((a, b) => {
    const suitDifference =
      suits.indexOf(a.suit) - suits.indexOf(b.suit);

    if (suitDifference !== 0) return suitDifference;

    return ranks.indexOf(a.rank) - ranks.indexOf(b.rank);
  });
}
export type BotDifficulty = "easy" | "medium" | "hard";

export function getCardImage(card: Card): string {
  const suitFiles: Record<Suit, string> = {
    Rosen: "hearts", Schellen: "clubs", Eicheln: "diamonds", Schilten: "spades",
  };
  const rankFiles: Record<Rank, number> = {
    "6": 6, "7": 7, "8": 8, "9": 9,
    Banner: 10, Under: 11, Ober: 12, König: 13, Ass: 14,
  };
  return `/cards/swiss/${suitFiles[card.suit]}_${rankFiles[card.rank]}.gif`;
}
