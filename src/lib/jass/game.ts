import { type Card, type GameMode } from "./cards";
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

export type GameState = {
  hands: Card[][];
  gameMode: GameMode;
  trick: PlayedCard[];
  currentPlayer: number;
  winner: number | null;
  completedTricks: number;
  scores: [number, number];
};

export function createGame(
  hands: Card[][],
  gameMode: GameMode
): GameState {
  return {
    hands: hands.map((hand) => [...hand]),
    gameMode,
    trick: [],
    currentPlayer: 0,
    winner: null,
    completedTricks: 0,
    scores: [0, 0],
  };
}

export function playTurn(
  game: GameState,
  cardId: string
): GameState {
  if (game.trick.length === 4 || game.completedTricks === 9) {
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

  if (!card) return game;

  const hands = game.hands.map((playerHand, index) =>
    index === playerIndex
      ? playerHand.filter((candidate) => candidate.id !== card.id)
      : [...playerHand]
  );

  const trick = [...game.trick, { playerIndex, card }];

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

  const scores: [number, number] = [...game.scores];
  scores[winner % 2] += points;

  return {
    ...game,
    hands,
    trick,
    winner,
    currentPlayer: winner,
    completedTricks,
    scores,
  };
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
    const card = chooseBotCard(
      next.hands[next.currentPlayer],
      next.trick.map((play) => play.card),
      next.gameMode
    );

    if (!card) break;

    const updated = playTurn(next, card.id);

    if (updated === next) break;

    next = updated;
  }

  return next;
}

export function startNextTrick(
  game: GameState
): GameState {
  if (
    game.trick.length !== 4 ||
    game.winner === null ||
    game.completedTricks === 9
  ) {
    return game;
  }

  return playBotsUntilHuman({
    ...game,
    trick: [],
    winner: null,
    currentPlayer: game.winner,
  });
}