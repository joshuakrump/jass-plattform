import { type Card, type GameMode } from "./cards";
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