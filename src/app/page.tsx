"use client";

import { useState } from "react";

import {
  dealCards,
  sortHand,
  type Card,
  type Suit,
  type GameMode,
} from "@/lib/jass/cards";

import { getPlayableCards } from "@/lib/jass/rules";
import { chooseBotGameMode } from "@/lib/jass/bot";

import {
  createGame,
  playTurn,
  playBotsUntilHuman,
  startNextTrick,
  type GameState,
} from "@/lib/jass/game";

const symbols: Record<Suit, string> = {
  Rosen: "🌹",
  Schellen: "🔔",
  Eicheln: "🌰",
  Schilten: "🛡️",
};

const players = ["Du", "Bot 1", "Bot 2", "Bot 3"];
const teams = ["Du und Bot 2", "Bot 1 und Bot 3"];

const gameModes: GameMode[] = [
  "Rosen",
  "Schellen",
  "Eicheln",
  "Schilten",
  "Obenabe",
  "Undenufe",
];

export default function Home() {
  const [dealtHands, setDealtHands] = useState<Card[][]>([]);
  const [game, setGame] = useState<GameState | null>(null);
  const [shifted, setShifted] = useState(false);

  const hands = game ? game.hands : dealtHands;
  const roundFinished = game?.completedTricks === 9;
  const trickFinished = game?.trick.length === 4;

  const canPlay =
    game !== null &&
    game.currentPlayer === 0 &&
    !trickFinished &&
    !roundFinished;

  const playableCards =
    game && canPlay
      ? getPlayableCards(
          game.hands[0],
          game.trick.map((play) => play.card),
          game.gameMode
        )
      : [];

  function dealNewRound() {
    setDealtHands(dealCards());
    setGame(null);
    setShifted(false);
  }

  function selectGameMode(mode: GameMode) {
    if (game || dealtHands.length !== 4) return;

    setGame(createGame(dealtHands, mode));
  }

  function playCard(card: Card) {
    if (!game || !canPlay) return;

    const next = playTurn(game, card.id);

    if (next === game) return;

    setGame(playBotsUntilHuman(next));
  }

  function shiftToPartner() {
    if (game || dealtHands.length !== 4) return;
    setShifted(true);
    setGame(createGame(dealtHands, chooseBotGameMode(dealtHands[2])));
  }

  function nextTrick() {
    if (!game || !trickFinished || roundFinished) return;

    setGame(startNextTrick(game));
  }

  return (
    <main className="min-h-screen bg-emerald-950 p-6 text-white">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold">Jass-Plattform</h1>

        <button
          type="button"
          onClick={dealNewRound}
          className="mt-6 rounded-lg bg-amber-400 px-6 py-3 font-bold text-emerald-950 hover:bg-amber-300"
        >
          Mischen und austeilen
        </button>
      </header>

      {hands.length === 0 && (
        <p className="text-center text-emerald-200">
          Teile zuerst die Karten aus.
        </p>
      )}

      {hands.length > 0 && (
        <section className="mb-8 text-center">
          <h2 className="mb-3 text-xl font-bold">Spielart</h2>

          <div className="flex flex-wrap justify-center gap-2">
            {gameModes.map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => selectGameMode(mode)}
                disabled={game !== null}
                aria-pressed={game?.gameMode === mode}
                className={`rounded-lg px-4 py-2 font-bold disabled:cursor-not-allowed ${
                  game?.gameMode === mode
                    ? "bg-amber-400 text-emerald-950"
                    : "bg-emerald-800 text-white hover:bg-emerald-700"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {!game && dealtHands.length === 4 && (
            <button
              type="button"
              onClick={shiftToPartner}
              className="mt-4 rounded-lg border border-emerald-400 px-6 py-3 font-bold hover:bg-emerald-800"
            >
              Schieben zu Bot 2
            </button>
          )}

          <p className="mt-3 text-emerald-200" aria-live="polite">
            {game
              ? `${shifted ? "Bot 2 hat gewählt" : "Gewählte Spielart"}: ${game.gameMode}`
              : "Wähle eine Spielart. Deine Auswahl startet die Runde."}
          </p>
        </section>
      )}

      {game && (
        <>
          <section className="mx-auto mb-8 grid max-w-5xl grid-cols-2 gap-4">
            {teams.map((team, index) => (
              <div
                key={team}
                className="rounded-xl bg-emerald-800 p-4 text-center"
              >
                <p>{team}</p>
                <p className="mt-1 text-3xl font-bold">
                  {game.scores[index]}
                </p>
              </div>
            ))}
          </section>

          <section className="mx-auto mb-8 max-w-5xl rounded-xl bg-emerald-900 p-6 text-center">
            <h2 className="mb-4 text-xl font-bold">
              Stich{" "}
              {Math.min(
                game.completedTricks + (trickFinished ? 0 : 1),
                9
              )}{" "}
              von 9
            </h2>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {game.trick.map((play) => (
                <div
                  key={play.card.id}
                  className="rounded-lg bg-white p-4 text-slate-800"
                >
                  <p className="mb-2 text-sm font-bold">
                    {players[play.playerIndex]}
                  </p>
                  <p className="text-4xl">
                    {symbols[play.card.suit]}
                  </p>
                  <p className="mt-2 font-bold">{play.card.rank}</p>
                  <p className="text-sm">{play.card.suit}</p>
                </div>
              ))}
            </div>

            {game.winner !== null ? (
              <p className="mt-4 text-xl font-bold text-amber-300">
                Stich gewonnen: {players[game.winner]}
              </p>
            ) : (
              <p className="mt-4 text-emerald-200">
                Du bist dran. Wähle eine erlaubte Karte.
              </p>
            )}

            {trickFinished && !roundFinished && (
              <button
                type="button"
                onClick={nextTrick}
                className="mt-4 rounded-lg bg-amber-400 px-6 py-3 font-bold text-emerald-950 hover:bg-amber-300"
              >
                Nächster Stich
              </button>
            )}

            {roundFinished && (
              <div className="mt-4 text-amber-300">
                <p className="text-xl font-bold">Runde beendet!</p>

                <p className="mt-2">
                  {game.scores[0] === game.scores[1]
                    ? "Unentschieden."
                    : `Gewonnen: ${
                        teams[game.scores[0] > game.scores[1] ? 0 : 1]
                      }`}
                </p>

                <p className="mt-2">
                  Gesamtpunkte: {game.scores[0] + game.scores[1]}
                </p>
              </div>
            )}
          </section>
        </>
      )}

      <div className="mx-auto max-w-5xl space-y-8">
        {hands.map((hand, playerIndex) => (
          <section key={players[playerIndex]}>
            <h2 className="mb-3 text-xl font-bold">
              {players[playerIndex]} · {hand.length} Karten
            </h2>

            <div className="grid grid-cols-3 gap-3 sm:grid-cols-9">
              {sortHand(hand).map((card) => {
                if (playerIndex !== 0) {
                  return (
                    <div
                      key={card.id}
                      aria-label="Verdeckte Karte"
                      className="flex aspect-[2/3] items-center justify-center rounded-xl border-4 border-white bg-blue-900 shadow-lg"
                    >
                      <span
                        aria-hidden="true"
                        className="text-3xl text-blue-200"
                      >
                        ✦
                      </span>
                    </div>
                  );
                }

                const enabled = playableCards.some(
                  (allowed) => allowed.id === card.id
                );

                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => playCard(card)}
                    disabled={!enabled}
                    aria-label={`${card.suit} ${card.rank} spielen`}
                    className={`flex aspect-[2/3] flex-col justify-between rounded-xl bg-white p-3 shadow-lg disabled:cursor-not-allowed ${
                      enabled
                        ? "cursor-pointer ring-2 ring-amber-400 hover:bg-amber-50"
                        : "opacity-60"
                    } ${
                      card.suit === "Rosen" || card.suit === "Schellen"
                        ? "text-red-700"
                        : "text-slate-800"
                    }`}
                  >
                    <span className="font-bold">{card.rank}</span>
                    <span className="text-center text-4xl">
                      {symbols[card.suit]}
                    </span>
                    <span className="text-right text-sm">
                      {card.suit}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {game && game.history.length === 1 && (
        <section className="mx-auto mt-8 max-w-5xl">
          <details className="rounded-lg bg-emerald-900 p-4">
            <summary className="cursor-pointer font-bold">
              Ersten Stich nochmals anschauen
            </summary>

            <ul className="mt-3 space-y-1 text-emerald-200">
              {game.history[0].plays.map((play) => (
                <li key={play.card.id}>
                  {players[play.playerIndex]}:{" "}
                  {symbols[play.card.suit]} {play.card.suit}{" "}
                  {play.card.rank}
                </li>
              ))}
            </ul>
          </details>
        </section>
      )}
    </main>
  );
}
