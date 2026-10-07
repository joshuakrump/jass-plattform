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