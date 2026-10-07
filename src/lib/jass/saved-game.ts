import { createDeck, suits, type Card } from "./cards";
import { createGame, playTurn, startNextTrick, type GameState, type PlayedCard } from "./game";

export const SAVED_GAME_KEY = "jass-plattform.round.v1";

export type SavedGame = { game: GameState; shifted: boolean };

export function serializeGame(game: GameState, shifted: boolean): string {
  return JSON.stringify({ version: 1, game, shifted });
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// Gespeicherte Züge werden erneut durch die Engine geprüft. So können alte
// oder beschädigte Daten keine ungültige Runde in die Oberfläche bringen.
export function parseSavedGame(text: string | null): SavedGame | null {
  if (!text) return null;
  try {
    const data: unknown = JSON.parse(text);
    if (!record(data) || data.version !== 1 || !record(data.game)) return null;
    const raw = data.game;
    if (typeof data.shifted !== "boolean") return null;
    if (![...suits, "Obenabe", "Undenufe"].includes(raw.gameMode as never)) return null;
    if (!["easy", "medium", "hard"].includes(raw.difficulty as string)) return null;
    if (!Array.isArray(raw.hands) || raw.hands.length !== 4 || !Array.isArray(raw.history) || !Array.isArray(raw.trick)) return null;
    if (raw.history.length > 9 || raw.trick.length > 4) return null;

    const deck = new Map(createDeck().map((card) => [card.id, card]));
    function readCard(value: unknown): Card {
      if (!record(value) || typeof value.id !== "string") throw new Error("Karte fehlt");
      const card = deck.get(value.id);
      if (!card || value.suit !== card.suit || value.rank !== card.rank) throw new Error("Ungültige Karte");
      return card;
    }
    function readPlay(value: unknown): PlayedCard {
      if (!record(value) || !Number.isInteger(value.playerIndex) || (value.playerIndex as number) < 0 || (value.playerIndex as number) > 3) throw new Error("Spieler fehlt");
      return { playerIndex: value.playerIndex as number, card: readCard(value.card) };
    }
    const remaining = raw.hands.map((hand) => {
      if (!Array.isArray(hand) || hand.length > 9) throw new Error("Ungültige Hand");
      return hand.map(readCard);
    });
    const history = raw.history.map((entry) => {
      if (!record(entry) || !Array.isArray(entry.plays) || entry.plays.length !== 4) throw new Error("Ungültiger Stich");
      return entry.plays.map(readPlay);
    });
    const trick = raw.trick.map(readPlay);
    const consumed = [...history.flat(), ...(trick.length < 4 ? trick : [])];
    const initial = remaining.map((hand, index) => [
      ...hand, ...consumed.filter((play) => play.playerIndex === index).map((play) => play.card),
    ]);
    if (initial.some((hand) => hand.length !== 9) || new Set(initial.flat().map((card) => card.id)).size !== 36) return null;

    let game = createGame(initial, raw.gameMode as GameState["gameMode"], raw.difficulty as GameState["difficulty"]);
    function replay(plays: PlayedCard[]) {
      for (const play of plays) {
        if (game.currentPlayer !== play.playerIndex) throw new Error("Falsche Reihenfolge");
        const next = playTurn(game, play.card.id);
        if (next === game) throw new Error("Ungültiger Zug");
        game = next;
      }
    }
    for (let index = 0; index < history.length; index++) {
      if (index > 0) game = startNextTrick(game, false);
      replay(history[index]);
    }
    if (trick.length < 4) {
      if (history.length) {
        if (history.length === 9) return null;
        game = startNextTrick(game, false);
      }
      replay(trick);
    }
    if (game.completedTricks !== raw.completedTricks || game.currentPlayer !== raw.currentPlayer || game.winner !== raw.winner) return null;
    if (JSON.stringify(game.scores) !== JSON.stringify(raw.scores)) return null;
    if (JSON.stringify(game.trick) !== JSON.stringify(trick)) return null;
    for (let index = 0; index < 4; index++) {
      const ids = (hand: Card[]) => hand.map((card) => card.id).sort().join(",");
      if (ids(game.hands[index]) !== ids(remaining[index])) return null;
    }
    return { game, shifted: data.shifted };
  } catch {
    return null;
  }
}
