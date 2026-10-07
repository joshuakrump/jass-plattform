import { suits, type Card, type GameMode } from "./cards";
import { getPlayableCards } from "./rules";

export function chooseBotCard(
  hand: Card[],
  trick: Card[],
  gameMode: GameMode
): Card | null {
  const allowedCards = getPlayableCards(hand, trick, gameMode);

  if (allowedCards.length === 0) return null;

  const randomIndex = Math.floor(Math.random() * allowedCards.length);

  return allowedCards[randomIndex];
}

// Eine einfache Heuristik, die ausschliesslich die eigene Hand bewertet.
export function chooseBotGameMode(hand: Card[]): GameMode {
  const modes: GameMode[] = [...suits, "Obenabe", "Undenufe"];

  function evaluate(mode: GameMode): number {
    return hand.reduce((total, card) => {
      if (mode === "Obenabe") {
        const value = card.rank === "Ass" ? 5 : card.rank === "König" ? 3 : card.rank === "Ober" ? 1 : 0;
        return total + value;
      }
      if (mode === "Undenufe") {
        const value = card.rank === "6" ? 5 : card.rank === "7" ? 3 : card.rank === "8" ? 1 : 0;
        return total + value;
      }
      if (card.suit === mode) {
        const value = card.rank === "Under" ? 9 : card.rank === "9" ? 7 : card.rank === "Ass" ? 5 : card.rank === "König" ? 4 : 2;
        return total + value;
      }
      return total + (card.rank === "Ass" ? 2 : 0);
    }, 0);
  }

  let bestMode = modes[0];
  let bestScore = evaluate(bestMode);
  for (const mode of modes.slice(1)) {
    const score = evaluate(mode);
    if (score > bestScore) {
      bestMode = mode;
      bestScore = score;
    }
  }
  return bestMode;
}
