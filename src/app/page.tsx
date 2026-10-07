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

export default function Home() {
  const [hands, setHands] = useState<Card[][]>([]);

  return (
    <main className="min-h-screen bg-emerald-950 p-6 text-white">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold">Jass-Plattform</h1>

        <button
          type="button"
          onClick={() => setHands(dealCards())}
          className="mt-6 rounded-lg bg-amber-400 px-6 py-3 font-bold text-emerald-950 hover:bg-amber-300"
        >
          Mischen und austeilen
        </button>
      </header>

      {hands.length === 0 && (
        <p className="text-center text-emerald-200">
          Klicke auf den Button, um die Karten auszuteilen.
        </p>
      )}

      <div className="mx-auto max-w-5xl space-y-8">
        {hands.map((hand, playerIndex) => (
          <section key={players[playerIndex]}>
            <h2 className="mb-3 text-xl font-bold">
              {players[playerIndex]} · {hand.length} Karten
            </h2>

            <div className="grid grid-cols-3 gap-3 sm:grid-cols-9">
              {hand.map((card) => (
                <div
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
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}