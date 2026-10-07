"use client";

import { useState } from "react";

import {
  dealCards,
  type Card,
  type Suit,
  type GameMode,
} from "@/lib/jass/cards";

import {
  getTrickWinner,
  getTrickPoints,
} from "@/lib/jass/rules";

import { chooseBotCard } from "@/lib/jass/bot";

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

export default function Home() {
  const [hands, setHands] = useState<Card[][]>([]);
  const [gameMode, setGameMode] = useState<GameMode | null>(null);
  const [playedCard, setPlayedCard] = useState<Card | null>(null);
  const [trick, setTrick] = useState<Card[]>([]);
  const winnerIndex =
  gameMode && trick.length === 4
    ? getTrickWinner(trick, gameMode)
    : null;
  const trickPoints =
  gameMode && trick.length === 4
    ? getTrickPoints(trick, gameMode)
    : 0;

  const winnerTeam =
  winnerIndex === null
    ? null
    : winnerIndex % 2 === 0
      ? "Du und Bot 2"
      : "Bot 1 und Bot 3";

function startNewRound() {
  setHands(dealCards());
  setGameMode(null);
  setPlayedCard(null);
  setTrick([]);
}

function playCard(card: Card) {
  if (!gameMode || playedCard) return;

  const ownHand = hands[0];

  if (!ownHand?.some((handCard) => handCard.id === card.id)) {
    return;
  }

  const nextHands = hands.map((hand) => [...hand]);
  const nextTrick: Card[] = [card];

  nextHands[0] = nextHands[0].filter(
    (handCard) => handCard.id !== card.id
  );

  for (let playerIndex = 1; playerIndex < 4; playerIndex++) {
    const botCard = chooseBotCard(
      nextHands[playerIndex],
      nextTrick,
      gameMode
);

    if (!botCard) return;

    nextTrick.push(botCard);

    nextHands[playerIndex] = nextHands[playerIndex].filter(
      (handCard) => handCard.id !== botCard.id
    );
  }

  setHands(nextHands);
  setPlayedCard(card);
  setTrick(nextTrick);
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
    <h2 className="mb-4 text-xl font-bold">Auf dem Tisch</h2>

    {trick.length === 0 ? (
      <p className="text-emerald-200">
        {gameMode
          ? "Klicke auf eine Karte aus deiner Hand."
          : "Wähle zuerst eine Spielart."}
      </p>
    ) : (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {trick.map((card, index) => (
          <div
            key={card.id}
            className="rounded-lg bg-white p-4 text-slate-800"
          >
            <p className="mb-2 text-sm font-bold">{players[index]}</p>
            <p className="text-4xl">{symbols[card.suit]}</p>
            <p className="mt-2 font-bold">{card.rank}</p>
            <p className="text-sm">{card.suit}</p>
          </div>
        ))}
      </div>
    )}
    {winnerIndex !== null && (
  <div className="mt-4 text-amber-300">
    <p className="text-xl font-bold">
      Stich gewonnen: {players[winnerIndex]}
    </p>
    <p className="mt-1">
      {trickPoints} Punkte für {winnerTeam}
    </p>
  </div>
)}
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