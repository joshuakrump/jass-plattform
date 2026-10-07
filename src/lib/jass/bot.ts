import { suits, ranks, type Card, type GameMode, type BotDifficulty } from "./cards";
import { getPlayableCards, getWinningCardIndex, getCardPoints } from "./rules";

export type BotContext = {
  difficulty: BotDifficulty;
  playerIndex: number;
  trickPlayers: number[];
};

export function chooseBotCard(
  hand: Card[],
  trick: Card[],
  gameMode: GameMode,
  context?: BotContext
): Card | null {
  const allowed = getPlayableCards(hand, trick, gameMode);
  if (allowed.length === 0) return null;
  if (!context || context.difficulty === "easy") {
    return allowed[Math.floor(Math.random() * allowed.length)];
  }

  function strength(card: Card): number {
    if (card.suit === gameMode) {
      const order = ["6", "7", "8", "Banner", "Ober", "König", "Ass", "9", "Under"];
      return 20 + order.indexOf(card.rank);
    }
    const index = ranks.indexOf(card.rank);
    return gameMode === "Undenufe" ? ranks.length - 1 - index : index;
  }
  const cheapest = (cards: Card[]) => [...cards].sort((a, b) => strength(a) - strength(b))[0];

  if (trick.length === 0) {
    // Eine starke eigene Karte eröffnet den Stich.
    return [...allowed].sort((a, b) => strength(b) - strength(a))[0];
  }

  const winningIndex = getWinningCardIndex(trick, gameMode);
  const winningPlayer = context.trickPlayers[winningIndex];
  const partnerLeads = winningPlayer !== undefined && winningPlayer % 2 === context.playerIndex % 2;

  if (partnerLeads) {
    // Den Partner unterstützen, dabei nach Möglichkeit Trumpf sparen.
    const nonTrumps = allowed.filter((card) => card.suit !== gameMode);
    const candidates = nonTrumps.length ? nonTrumps : allowed;
    return [...candidates].sort((a, b) =>
      getCardPoints(b, gameMode) - getCardPoints(a, gameMode) || strength(a) - strength(b)
    )[0];
  }

  const winningCards = allowed.filter((card) =>
    getWinningCardIndex([...trick, card], gameMode) === trick.length
  );
  if (winningCards.length) return cheapest(winningCards);

  // Kann er nicht stechen, gibt der Bot möglichst wenige Punkte ab.
  return [...allowed].sort((a, b) =>
    getCardPoints(a, gameMode) - getCardPoints(b, gameMode) || strength(a) - strength(b)
  )[0];
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
