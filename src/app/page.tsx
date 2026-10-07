"use client";

import { useState } from "react";
import { dealCards, type Card, type Suit } from "@/lib/jass/cards";

const symbols: Record<Suit, string> = {
  Rosen: "🌹",
  Schellen: "🔔",
  Eicheln: "🌰",
  Schilten: "🛡️",
};

const players = ["Du", "Bot 1", "Bot 2", "Bot 3"];

const gameModes = [
  "Rosen", "Schellen", "Eicheln", "Schilten", "Obenabe", "Undenufe",
] as const;

type GameMode = (typeof gameModes)[number];
export default function Home() {
  const [hands, setHands] = useState<Card[][]>([]);
  const [gameMode, setGameMode] = useState<GameMode | null>(null);
  const [playedCard, setPlayedCard] = useState<Card | null>(null);

function startNewRound() {
  setHands(dealCards());
  setGameMode(null);
  setPlayedCard(null);
}

function playCard(card: Card) {
  if (!gameMode || playedCard) return;

  setPlayedCard(card);

  setHands((currentHands) =>
    currentHands.map((hand, index) =>
      index === 0
        ? hand.filter((handCard) => handCard.id !== card.id)
        : hand
    )
  );
}
  return (
    <main className="min-h-screen bg-emerald-950 p-6 text-white">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold">Jass-Plattform</h1>

        <button
          type="button"
          onClick={startNewRound}
          className="mt-6 rounded-lg bg-amber-400 px-6 py-3 font-bold text-emerald-950 hover:bg-amber-300"
        >
          Mischen und austeilen
        </button>
      </header>

{hands.length > 0 && (
  <section className="mx-auto mb-8 max-w-5xl text-center">
    <h2 className="mb-3 text-xl font-bold">Spielart wählen</h2>

    <div className="flex flex-wrap justify-center gap-2">
      {gameModes.map((mode) => (
        <button
          key={mode}
          type="button"
          onClick={() => {
           if (!playedCard) setGameMode(mode);
                }}
          disabled={playedCard !== null}
          aria-pressed={gameMode === mode}
          className={`rounded-lg disabled:cursor-not-allowed disabled:opacity-60 px-4 py-2 font-bold ${
            gameMode === mode
              ? "bg-amber-400 text-emerald-950"
              : "bg-emerald-800 text-white hover:bg-emerald-700"
          }`}
        >
          {mode}
        </button>
      ))}
    </div>

    <p className="mt-4 text-emerald-200">
      {gameMode
        ? `Gewählte Spielart: ${gameMode}`
        : "Wähle eine Spielart für diese Runde."}
    </p>
  </section>
)}

      {hands.length === 0 && (
        <p className="text-center text-emerald-200">
          Klicke auf den Button, um die Karten auszuteilen.
        </p>
      )}

      <div className="mx-auto max-w-5xl space-y-8">
        {hands.length > 0 && (
  <section className="mx-auto mb-8 max-w-5xl rounded-xl bg-emerald-900 p-6 text-center">
    <h2 className="mb-3 text-xl font-bold">Auf dem Tisch</h2>

    <p className="text-emerald-200">
      {playedCard
        ? `Du spielst: ${symbols[playedCard.suit]} ${playedCard.suit} ${playedCard.rank}`
        : gameMode
          ? "Klicke auf eine Karte aus deiner Hand."
          : "Wähle zuerst eine Spielart."}
    </p>
  </section>
)}
        {hands.map((hand, playerIndex) => (
          <section key={players[playerIndex]}>
            <h2 className="mb-3 text-xl font-bold">
              {players[playerIndex]} · {hand.length} Karten
            </h2>

            <div className="grid grid-cols-3 gap-3 sm:grid-cols-9">
              {hand.map((card) => (
                <button
  type="button"
  onClick={() => playCard(card)}
  disabled={playerIndex !== 0 || !gameMode || playedCard !== null}
                  key={card.id}
                  className={`flex aspect-[2/3] flex-col justify-between rounded-xl bg-white p-3 shadow-lg ${
                    card.suit === "Rosen" || card.suit === "Schellen"
                      ? "text-red-700"
                      : "text-slate-800"
                  }`}
                >
                  <span className="font-bold">{card.rank}</span>
                  <span className="text-center text-4xl">
                    {symbols[card.suit]}
                  </span>
                  <span className="text-right text-sm">{card.suit}</span>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}