import { type Card, type GameMode, type BotDifficulty } from "./cards";
import { chooseBotCard } from "./bot";

import {
  getPlayableCards,
  getTrickWinner,
  getTrickPoints,
} from "./rules";

export type PlayedCard = {
  playerIndex: number;
  card: Card;
};

export type CompletedTrick = {
  plays: PlayedCard[];
  winner: number;
  points: number;
};

export type GameState = {
  hands: Card[][];
  startingPlayer: number;
  gameMode: GameMode;
  difficulty: BotDifficulty;
  trick: PlayedCard[];
  currentPlayer: number;
  winner: number | null;
  completedTricks: number;
  scores: [number, number];
  history: CompletedTrick[];
};

export function createGame(
  hands: Card[][],
  gameMode: GameMode,
  difficulty: BotDifficulty = "easy",
  startingPlayer = 0
): GameState {
  return {
    hands: hands.map((hand) => [...hand]),
    gameMode,
    difficulty,
    trick: [],
    currentPlayer: startingPlayer,
    startingPlayer,
    winner: null,
    completedTricks: 0,
    scores: [0, 0],
    history: [],
  };
}

export function playTurn(
  game: GameState,
  cardId: string
): GameState {
  if (game.trick.length === 4 || game.completedTricks >= 9) {
    return game;
  }

  const playerIndex = game.currentPlayer;
  const hand = game.hands[playerIndex];
  const tableCards = game.trick.map((play) => play.card);

  const card = getPlayableCards(
    hand,
    tableCards,
    game.gameMode
  ).find((candidate) => candidate.id === cardId);

  // Ungültige Karten verändern den Spielstand nicht.
  if (!card) return game;

  const hands = game.hands.map((playerHand, index) =>
    index === playerIndex
      ? playerHand.filter((candidate) => candidate.id !== card.id)
      : [...playerHand]
  );

  const trick: PlayedCard[] = [
    ...game.trick,
    { playerIndex, card },
  ];

  // Solange der Stich nicht vollständig ist, folgt der nächste Spieler.
  if (trick.length < 4) {
    return {
      ...game,
      hands,
      trick,
      currentPlayer: (playerIndex + 1) % 4,
    };
  }

  const cards = trick.map((play) => play.card);
  const winningPosition = getTrickWinner(cards, game.gameMode);
  const winner = trick[winningPosition].playerIndex;

  const completedTricks = game.completedTricks + 1;

  const points = getTrickPoints(
    cards,
    game.gameMode,
    completedTricks === 9
  );

  // Team 0: Du und Bot 2. Team 1: Bot 1 und Bot 3.
  const scores: [number, number] = [...game.scores];
  const winnerTeam = winner % 2;
  scores[winnerTeam] += points;

  return {
    ...game,
    hands,
    trick,
    winner,
    currentPlayer: winner,
    completedTricks,
    scores,
    history: [
      ...game.history,
      {
        plays: trick,
        winner,
        points,
      },
    ],
  };
}

// Genau ein Bot-Zug; die Oberfläche bestimmt den zeitlichen Abstand.
export function playBotTurn(game: GameState): GameState {
  if (
    game.currentPlayer === 0 ||
    game.trick.length === 4 ||
    game.completedTricks >= 9
  ) return game;

  const card = chooseBotCard(
    game.hands[game.currentPlayer],
    game.trick.map((play) => play.card),
    game.gameMode,
    {
      difficulty: game.difficulty,
      playerIndex: game.currentPlayer,
      trickPlayers: game.trick.map((play) => play.playerIndex),
      playedCards: game.history.flatMap((entry) => entry.plays.map((play) => play.card)),
      handSizes: game.hands.map((hand) => hand.length),
    }
  );

  return card ? playTurn(game, card.id) : game;
}

export function playBotsUntilHuman(
  game: GameState
): GameState {
  let next = game;

  while (
    next.currentPlayer !== 0 &&
    next.trick.length < 4 &&
    next.completedTricks < 9
  ) {
    const updated = playBotTurn(next);

    // Verhindert eine Endlosschleife bei einem ungültigen Zug.
    if (updated === next) break;

    next = updated;
  }

  return next;
}

export function startNextTrick(
  game: GameState,
  autoPlayBots = true
): GameState {
  if (
    game.trick.length !== 4 ||
    game.winner === null ||
    game.completedTricks >= 9
  ) {
    return game;
  }

  const next = {
    ...game,
    trick: [],
    winner: null,
    currentPlayer: game.winner,
  };

  return autoPlayBots ? playBotsUntilHuman(next) : next;
}