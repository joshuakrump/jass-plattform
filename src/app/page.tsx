"use client";

import { useEffect, useState } from "react";
import "./jass-table.css";
import Image from "next/image";

import {
  sortHand,
  getCardImage,
  type BotDifficulty,
  type Card,
  type GameMode,
} from "@/lib/jass/cards";

import { SAVED_GAME_KEY, parseSavedGame } from "@/lib/jass/saved-game";
import { MATCH_KEY, createMatch, totalScores, matchWinner, selectMode, advanceRound, rightOf, serializeMatch, parseMatch, type MatchState } from "@/lib/jass/match";

import { getPlayableCards } from "@/lib/jass/rules";
import { chooseBotGameMode } from "@/lib/jass/bot";

import {
  playTurn,
  playBotTurn,
  startNextTrick,
  type GameState,
} from "@/lib/jass/game";

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
  const [match, setMatch] = useState<MatchState | null>(null);
  const [saveMessage, setSaveMessage] = useState("");
  const [difficulty, setDifficulty] = useState<BotDifficulty>("easy");
  const game = match && !match.choosing ? match.game : null;
  const hands = match?.game.hands ?? [];
  const winnerTeam = match ? matchWinner(match) : null;
  const scores = match ? totalScores(match) : [0, 0];

  function setGame(update: (current: GameState | null) => GameState | null) {
    setMatch((current) => {
      if (!current || current.choosing || matchWinner(current) !== null) return current;
      const next = update(current.game);
      return next && next !== current.game ? { ...current, game: next } : current;
    });
  }
  const roundFinished = game?.completedTricks === 9;
  const trickFinished = game?.trick.length === 4;

  const canPlay =
    game !== null &&
    game.currentPlayer === 0 &&
    !trickFinished &&
    !roundFinished && winnerTeam === null;

  const playableCards =
    game && canPlay
      ? getPlayableCards(
          game.hands[0],
          game.trick.map((play) => play.card),
          game.gameMode
        )
      : [];

  useEffect(() => {
    if (
      !game || winnerTeam !== null ||
      game.currentPlayer === 0 ||
      game.trick.length === 4 ||
      game.completedTricks >= 9
    ) return;

    const timer = window.setTimeout(() => {
      // Die Zufallsauswahl erfolgt ausserhalb des React-State-Updaters.
      const next = playBotTurn(game);
      setGame((current) => current === game ? next : current);
    }, 650);

    // Ein neuer Spielstand oder Neustart verwirft den vorherigen Timer.
    return () => window.clearTimeout(timer);
  }, [game, winnerTeam]);

  useEffect(() => {
    if (!match) return;
    try { window.localStorage.setItem(MATCH_KEY, serializeMatch(match)); } catch { /* Speichern ist optional. */ }
  }, [match]);

  useEffect(() => {
    if (!match || !match.choosing || rightOf(match.dealer) === 0) return;
    const timer = window.setTimeout(() => {
      const next = selectMode(match, chooseBotGameMode(match.game.hands[rightOf(match.dealer)]));
      setMatch((current) => current === match ? next : current);
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [match]);

  useEffect(() => {
    if (!match || match.choosing || match.game.completedTricks !== 9 || matchWinner(match) !== null) return;
    const timer = window.setTimeout(() => {
      const next = advanceRound(match);
      setMatch((current) => current === match ? next : current);
    }, 2200);
    return () => window.clearTimeout(timer);
  }, [match]);

  function resumeRound() {
    try {
      let saved = parseMatch(window.localStorage.getItem(MATCH_KEY));
      if (!saved) {
        const legacy = parseSavedGame(window.localStorage.getItem(SAVED_GAME_KEY));
        if (legacy) saved = { dealer: (legacy.game.startingPlayer + 3) % 4, round: 1, bankedScores: [0, 0], game: legacy.game, choosing: false, shifted: legacy.shifted };
      }
      if (!saved) { setSaveMessage("Keine fortsetzbare Partie gespeichert. Starte eine neue Partie."); return; }
      setMatch(saved);
      setDifficulty(saved.game.difficulty);
      setSaveMessage("Gespeicherte Partie geladen.");
    } catch { setSaveMessage("Der Browser erlaubt keinen Zugriff auf gespeicherte Partien."); }
  }

  function dealNewRound() {
    setMatch(createMatch(difficulty));
    setSaveMessage("");
  }

  function selectGameMode(mode: GameMode) {
    if (!match?.choosing || rightOf(match.dealer) !== 0) return;
    setMatch(selectMode(match, mode));
  }

  function playCard(card: Card) {
    if (!game || !canPlay) return;

    const next = playTurn(game, card.id);

    if (next === game) return;

    setGame((current) => current === game ? next : current);
  }

  function shiftToPartner() {
    if (!match?.choosing || rightOf(match.dealer) !== 0) return;
    setMatch(selectMode(match, chooseBotGameMode(match.game.hands[2]), true));
  }

  function nextTrick() {
    if (!game || !trickFinished || roundFinished) return;

    setGame((current) => current === game ? startNextTrick(game, false) : current);
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
            {!match ? "Partie starten" : winnerTeam !== null ? "Neue Partie" : "Partie neu starten"}
          </button>
        </header>

        {!game && hands.length === 0 && (
          <section className="jass-resume">
            <p>Schon eine Partie begonnen? Dein letzter Spielstand wird in diesem Browser gespeichert.</p>
            <button type="button" onClick={resumeRound} className="jass-button jass-button-secondary">Gespeicherte Partie fortsetzen</button>
          </section>
        )}
        {saveMessage && <p className="jass-save-message" role="status">{saveMessage}</p>}

        <fieldset className="jass-difficulty" disabled={match !== null}>
          <legend>Bot-Schwierigkeit</legend>
          <label><input type="radio" name="difficulty" value="easy" checked={difficulty === "easy"} onChange={() => setDifficulty("easy")} /> Leicht</label>
          <label><input type="radio" name="difficulty" value="medium" checked={difficulty === "medium"} onChange={() => setDifficulty("medium")} /> Mittel</label>
          <label><input type="radio" name="difficulty" value="hard" checked={difficulty === "hard"} onChange={() => setDifficulty("hard")} /> Schwer</label>
          <span>{match ? "Für diese Partie festgelegt." : difficulty === "hard" ? "Schätzt unbekannte Karten und vergleicht mögliche Stichverläufe." : difficulty === "medium" ? "Einfache Teamstrategie." : "Zufällige erlaubte Karten."}</span>
        </fieldset>

        {match && <p className="jass-save-message">Runde {match.round} · Geber: {players[match.dealer]} · Ansage und erste Karte: {players[rightOf(match.dealer)]}</p>}

        <section className="jass-scoreboard" aria-label="Punktestand">
          {teams.map((team, index) => (
            <div key={team} className="jass-score">
              <span>{team}</span>
              <strong>{scores[index]} / 2500</strong>
            </div>
          ))}
        </section>

        {match?.choosing && rightOf(match.dealer) === 0 && (
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
            {match?.shifted && game && <span>Von Bot 2 gewählt</span>}
          </div>

          {visibleSeats.map((playerIndex) => (
            <div key={playerIndex} className={`jass-seat jass-seat-${playerIndex} ${game?.currentPlayer === playerIndex && !trickFinished && !roundFinished && winnerTeam === null ? "jass-seat-active" : ""}`}>
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
                  <Image src={getCardImage(play.card)} alt={`${play.card.suit} ${play.card.rank}`} width={161} height={247} unoptimized className="jass-card-image" />
                </div>
              </div>
            ))}
          </div>

          {!game && (
            <p className="jass-table-empty">
              {hands.length ? rightOf(match!.dealer) === 0 ? "Wähle eine Spielart oder schiebe zu deinem Partner." : `${players[rightOf(match!.dealer)]} wählt die Spielart …` : "Ein Tisch. Vier Plätze. Zeit für einen Jass."}
            </p>
          )}
          <div className="jass-your-seat"><strong>Du</strong><span>Partner von Bot 2</span></div>
        </section>

        <section className="jass-status" aria-live="polite">
          {winnerTeam !== null ? (
            <div><h2>Partie gewonnen: {teams[winnerTeam]}</h2><p>{scores[0]} : {scores[1]} Punkte</p></div>
          ) : !game ? (
            <p>{hands.length ? rightOf(match!.dealer) === 0 ? "Du sagst an und spielst die erste Karte." : `${players[rightOf(match!.dealer)]} sagt an …` : "Starte eine Partie bis 2.500 Punkte."}</p>
          ) : roundFinished ? (
            <div>
              <h2>Runde beendet</h2>
              <p>Rundenpunkte: {game.scores[0]} : {game.scores[1]}</p>
              <small>Die nächste Person gibt gleich automatisch aus.</small>
            </div>
          ) : trickFinished && game.winner !== null ? (
            <>
              <p><strong>{players[game.winner]}</strong> gewinnt den Stich.</p>
              <button type="button" onClick={nextTrick} className="jass-button jass-button-primary">Nächster Stich</button>
            </>
          ) : (
            <p>{game.currentPlayer === 0 ? "Du bist dran. Wähle eine erlaubte Karte." : `${players[game.currentPlayer]} ist dran …`}</p>
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
                    <Image src={getCardImage(card)} alt="" width={161} height={247} unoptimized className="jass-card-image" />
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
              <li key={play.card.id}>{players[play.playerIndex]}: {play.card.suit} {play.card.rank}</li>
            ))}</ul>
          </details>
        )}
        <footer className="jass-card-credit">
          Kartenbilder: <a href="https://github.com/JoelNiklaus/jass-server" target="_blank" rel="noreferrer">jass-server / webplatformz</a> · <a href="/cards/swiss/LICENSE.txt">MIT-Lizenz</a>
        </footer>
      </div>
    </main>
  );
}
