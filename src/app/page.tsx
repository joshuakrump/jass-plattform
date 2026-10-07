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

  const firstTrick = game?.history.length === 1 ? game.history[0] : null;
  const visibleSeats = [2, 1, 3];
  const currentTrickNumber = game
    ? Math.min(game.completedTricks + (trickFinished ? 0 : 1), 9)
    : 1;

  return (
    <main className="jass-page">
      <div className="jass-shell">
        <header className="jass-header">
          <div>
            <p className="jass-eyebrow">SCHIEBER · DU UND DEIN PARTNER</p>
            <h1>Am Jasstisch</h1>
          </div>
          <button type="button" onClick={dealNewRound} className="jass-button jass-button-secondary">
            {hands.length ? "Neu austeilen" : "Karten austeilen"}
          </button>
        </header>

        <section className="jass-scoreboard" aria-label="Punktestand">
          {teams.map((team, index) => (
            <div key={team} className="jass-score">
              <span>{team}</span>
              <strong>{game?.scores[index] ?? 0}</strong>
            </div>
          ))}
        </section>

        {hands.length > 0 && !game && (
          <section className="jass-mode-panel" aria-label="Spielart wählen">
            <h2>Was spielen wir?</h2>
            <div className="jass-mode-buttons">
              {gameModes.map((mode) => (
                <button key={mode} type="button" onClick={() => selectGameMode(mode)} className="jass-button jass-button-secondary">
                  {mode}
                </button>
              ))}
              <button type="button" onClick={shiftToPartner} className="jass-button jass-button-primary">
                Schieben zu Bot 2
              </button>
            </div>
          </section>
        )}

        <section className="jass-table" aria-label="Jasstisch">
          <div className="jass-table-info" aria-live="polite">
            {game ? `${game.gameMode} · Stich ${currentTrickNumber}/9` : "Dein Jasstisch"}
            {shifted && game && <span>Von Bot 2 gewählt</span>}
          </div>

          {visibleSeats.map((playerIndex) => (
            <div key={playerIndex} className={`jass-seat jass-seat-${playerIndex}`}>
              <div className="jass-avatar" aria-hidden="true">{playerIndex === 2 ? "P" : playerIndex}</div>
              <strong>{players[playerIndex]}</strong>
              <span>{playerIndex === 2 ? "Dein Partner" : "Gegner"}</span>
              <div className="jass-mini-hand" aria-hidden="true">
                {Array.from({ length: hands[playerIndex]?.length ?? 0 }, (_, index) => (
                  <i key={index} />
                ))}
              </div>
              <small>{hands[playerIndex]?.length ?? 0} Karten</small>
            </div>
          ))}

          <div className="jass-trick" aria-label="Aktueller Stich">
            {game?.trick.map((play) => (
              <div key={play.card.id} className={`jass-table-card jass-table-card-${play.playerIndex}`}>
                <span className="jass-card-owner">{players[play.playerIndex]}</span>
                <div className={`jass-card-face ${play.card.suit === "Rosen" || play.card.suit === "Schellen" ? "jass-card-red" : ""}`}>
                  <strong>{play.card.rank}</strong>
                  <span aria-hidden="true">{symbols[play.card.suit]}</span>
                  <small>{play.card.suit}</small>
                </div>
              </div>
            ))}
          </div>

          {!game && (
            <p className="jass-table-empty">
              {hands.length ? "Wähle eine Spielart oder schiebe zu deinem Partner." : "Ein Tisch. Vier Plätze. Zeit für einen Jass."}
            </p>
          )}
          <div className="jass-your-seat"><strong>Du</strong><span>Partner von Bot 2</span></div>
        </section>

        <section className="jass-status" aria-live="polite">
          {!game ? (
            <p>{hands.length ? "Deine Karten liegen bereit." : "Teile die Karten aus, um zu beginnen."}</p>
          ) : roundFinished ? (
            <div>
              <h2>Runde beendet</h2>
              <p>{game.scores[0] === game.scores[1] ? "Unentschieden." : `Gewonnen: ${teams[game.scores[0] > game.scores[1] ? 0 : 1]}`}</p>
              <small>Gesamtpunkte: {game.scores[0] + game.scores[1]}</small>
            </div>
          ) : trickFinished && game.winner !== null ? (
            <>
              <p><strong>{players[game.winner]}</strong> gewinnt den Stich.</p>
              <button type="button" onClick={nextTrick} className="jass-button jass-button-primary">Nächster Stich</button>
            </>
          ) : (
            <p>Du bist dran. Wähle eine erlaubte Karte.</p>
          )}
        </section>

        {hands.length > 0 && (
          <section className="jass-hand-panel" aria-label="Deine Hand">
            <div className="jass-hand-heading"><h2>Deine Hand</h2><span>{hands[0].length} Karten</span></div>
            <div className="jass-hand">
              {sortHand(hands[0]).map((card) => {
                const enabled = playableCards.some((allowed) => allowed.id === card.id);
                return (
                  <button key={card.id} type="button" onClick={() => playCard(card)} disabled={!enabled}
                    aria-label={`${card.suit} ${card.rank} spielen`}
                    className={`jass-hand-card jass-card-face ${enabled ? "jass-card-playable" : ""} ${card.suit === "Rosen" || card.suit === "Schellen" ? "jass-card-red" : ""}`}>
                    <strong>{card.rank}</strong>
                    <span aria-hidden="true">{symbols[card.suit]}</span>
                    <small>{card.suit}</small>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {firstTrick && (
          <details className="jass-recall">
            <summary>Ersten Stich nochmals anschauen</summary>
            <ul>{firstTrick.plays.map((play) => (
              <li key={play.card.id}>{players[play.playerIndex]}: {symbols[play.card.suit]} {play.card.suit} {play.card.rank}</li>
            ))}</ul>
          </details>
        )}
      </div>
    </main>
  );
}
