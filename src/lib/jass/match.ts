import { dealCards, type BotDifficulty, type GameMode } from "./cards";
import { createGame, type GameState } from "./game";
import { parseSavedGame, serializeGame } from "./saved-game";

export const MATCH_KEY = "jass-plattform.match.v1";
export const TARGET_SCORE = 2500;
export type MatchState = {
  dealer: number;
  round: number;
  bankedScores: [number, number];
  game: GameState;
  choosing: boolean;
  shifted: boolean;
};

// Plätze: Du unten, Bot 1 rechts, Bot 2 oben, Bot 3 links.
export const rightOf = (player: number) => (player + 1) % 4;
export const nextDealer = (dealer: number) => (dealer + 3) % 4;

export function createMatch(difficulty: BotDifficulty, dealer = Math.floor(Math.random() * 4)): MatchState {
  return { dealer, round: 1, bankedScores: [0, 0], game: createGame(dealCards(), "Rosen", difficulty, rightOf(dealer)), choosing: true, shifted: false };
}
export function totalScores(match: MatchState): [number, number] {
  return [match.bankedScores[0] + match.game.scores[0], match.bankedScores[1] + match.game.scores[1]];
}
export function matchWinner(match: MatchState): number | null {
  const scores = totalScores(match);
  return scores[0] >= TARGET_SCORE ? 0 : scores[1] >= TARGET_SCORE ? 1 : null;
}
export function selectMode(match: MatchState, mode: GameMode, shifted = false): MatchState {
  if (!match.choosing || matchWinner(match) !== null) return match;
  return { ...match, choosing: false, shifted, game: createGame(match.game.hands, mode, match.game.difficulty, rightOf(match.dealer)) };
}
export function advanceRound(match: MatchState): MatchState {
  if (match.choosing || match.game.completedTricks !== 9 || matchWinner(match) !== null) return match;
  const dealer = nextDealer(match.dealer);
  return { ...match, dealer, round: match.round + 1, bankedScores: totalScores(match), choosing: true, shifted: false, game: createGame(dealCards(), "Rosen", match.game.difficulty, rightOf(dealer)) };
}
export function serializeMatch(match: MatchState): string {
  return JSON.stringify({ version: 1, ...match });
}
export function parseMatch(text: string | null): MatchState | null {
  if (!text) return null;
  try {
    const raw = JSON.parse(text);
    if (!raw || raw.version !== 1 || !Number.isInteger(raw.dealer) || raw.dealer < 0 || raw.dealer > 3 || !Number.isInteger(raw.round) || raw.round < 1 || typeof raw.choosing !== "boolean" || typeof raw.shifted !== "boolean") return null;
    if (!Array.isArray(raw.bankedScores) || raw.bankedScores.length !== 2 || raw.bankedScores.some((s: unknown) => !Number.isInteger(s) || (s as number) < 0 || (s as number) >= TARGET_SCORE)) return null;
    if (raw.bankedScores[0] + raw.bankedScores[1] !== (raw.round - 1) * 157) return null;
    const saved = parseSavedGame(serializeGame(raw.game, raw.shifted));
    if (!saved || saved.game.startingPlayer !== rightOf(raw.dealer)) return null;
    if (raw.choosing && (saved.game.trick.length || saved.game.completedTricks || raw.shifted)) return null;
    return { dealer: raw.dealer, round: raw.round, bankedScores: raw.bankedScores, game: saved.game, choosing: raw.choosing, shifted: raw.shifted };
  } catch { return null; }
}
