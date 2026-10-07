import { createDeck, shuffleDeck, suits, ranks, type Card, type GameMode, type BotDifficulty } from "./cards";
import { getPlayableCards, getWinningCardIndex, getCardPoints, getTrickPoints } from "./rules";

export type BotContext = {
  difficulty: BotDifficulty;
  playerIndex: number;
  trickPlayers: number[];
  playedCards?: Card[];
  handSizes?: number[];
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

  if (context.difficulty === "hard") {
    const choice = chooseBySimulation(hand, trick, gameMode, context);
    if (choice) return choice;
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

// Verwendet nur die eigene Hand, öffentliche Karten und Handgrössen.
// Unbekannte Hände werden geschätzt, niemals aus dem echten Spiel gelesen.
function chooseBySimulation(
  hand: Card[],
  trick: Card[],
  mode: GameMode,
  context: BotContext
): Card | null {
  const allowed = getPlayableCards(hand, trick, mode);
  if (allowed.length === 1) return allowed[0];
  if (!context.handSizes || !context.playedCards) return null;

  const known = new Set([
    ...hand, ...trick, ...context.playedCards,
  ].map((card) => card.id));
  const unseen = createDeck().filter((card) => !known.has(card.id));
  const otherPlayers = [0, 1, 2, 3].filter((index) => index !== context.playerIndex);
  const needed = otherPlayers.reduce((sum, index) => sum + context.handSizes![index], 0);
  if (needed !== unseen.length) return null;

  // Dieselben möglichen Verteilungen für jede Kandidatenkarte vergleichen.
  const worlds: Card[][][] = [];
  for (let trial = 0; trial < 48; trial++) {
    const pool = shuffleDeck(unseen);
    const hands: Card[][] = [[], [], [], []];
    let offset = 0;
    for (const index of otherPlayers) {
      const count = context.handSizes[index];
      hands[index] = pool.slice(offset, offset + count);
      offset += count;
    }
    worlds.push(hands);
  }

  let bestCard = allowed[0];
  let bestScore = -Infinity;
  for (const candidate of allowed) {
    let total = 0;
    for (const hands of worlds) {
      const cards = [...trick, candidate];
      const players = [...context.trickPlayers, context.playerIndex];
      let nextPlayer = (context.playerIndex + 1) % 4;
      while (cards.length < 4) {
        const card = chooseBotCard(hands[nextPlayer], cards, mode, {
          difficulty: "medium", playerIndex: nextPlayer, trickPlayers: players,
        });
        if (!card) return null;
        cards.push(card);
        players.push(nextPlayer);
        nextPlayer = (nextPlayer + 1) % 4;
      }
      const winner = players[getWinningCardIndex(cards, mode)];
      const teamWins = winner % 2 === context.playerIndex % 2;
      total += (teamWins ? 1 : -1) * (getTrickPoints(cards, mode) + 4);
    }

    // Gleichwertige Chancen: wertvolle Karten für spätere Stiche sparen.
    const rank = ranks.indexOf(candidate.rank);
    const power = candidate.suit === mode
      ? 20 + (candidate.rank === "Under" ? 9 : candidate.rank === "9" ? 8 : rank)
      : mode === "Undenufe" ? 8 - rank : rank;
    const score = total / worlds.length - power * 0.12;
    if (score > bestScore) { bestScore = score; bestCard = candidate; }
  }
  return bestCard;
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
