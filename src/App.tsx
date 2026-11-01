import { useState } from "react";
import { allCards, decks, type PlaneDeck } from "./data/decks";
import { advancePlane, beginNextTurn, createGame, rollPlanarDie } from "./game";

const initialDeck = decks.find((deck) => deck.id === "all-official-cards") ?? decks[0];

if (!initialDeck) {
  throw new Error("No Planechase decks are available.");
}

function cardReference(name: string): string {
  return `https://scryfall.com/search?q=${encodeURIComponent(`!"${name}"`)}`;
}

function rollCostLabel(cost: number): string {
  return cost === 0 ? "Free" : `${cost} mana`;
}

export default function App() {
  const [selectedDeckId, setSelectedDeckId] = useState(initialDeck.id);
  const [game, setGame] = useState(() => createGame(initialDeck));
  const [notice, setNotice] = useState("Your planar deck is ready. Let the chaos begin.");
  const selectedDeck = decks.find((deck) => deck.id === selectedDeckId) ?? initialDeck;
  const planeCount = selectedDeck.cards.filter((card) => card.kind === "plane").length;
  const phenomenonCount = selectedDeck.cards.length - planeCount;

  function startGame(deck: PlaneDeck = selectedDeck) {
    setSelectedDeckId(deck.id);
    setGame(createGame(deck));
    setNotice(`${deck.name} shuffled. Your journey begins on a new plane.`);
  }

  function handleDeckChange(deckId: string) {
    const deck = decks.find((availableDeck) => availableDeck.id === deckId);
    if (!deck) {
      throw new Error(`Unknown deck selected: ${deckId}.`);
    }

    startGame(deck);
  }

  function handleRoll() {
    const nextGame = rollPlanarDie(game);
    setGame(nextGame);

    const roll = nextGame.lastRoll;
    if (!roll) return;

    if (roll.outcome === "blank") {
      setNotice(`Blank face. ${rollCostLabel(roll.cost)} planar die roll.`);
    } else if (roll.outcome === "chaos") {
      setNotice(
        game.currentCard.kind === "phenomenon"
          ? "Chaos face. Check the phenomenon reference for its effect."
          : `Chaos ensues on ${game.currentCard.name}. Resolve its chaos ability.`,
      );
    } else {
      setNotice(`Planeswalked from ${roll.walkedFrom} to ${nextGame.currentCard.name}.`);
    }
  }

  function handlePlaneswalk() {
    const previousCard = game.currentCard;
    const nextGame = advancePlane(game);
    setGame(nextGame);
    setNotice(`Planeswalked from ${previousCard.name} to ${nextGame.currentCard.name}.`);
  }

  function handleNextTurn() {
    setGame(beginNextTurn(game));
    setNotice(`Turn ${game.turn + 1}. Your planar die roll cost is reset.`);
  }

  const currentReference = cardReference(game.currentCard.name);
  const nextRollCost = rollCostLabel(game.rollsThisTurn);
  const currentIndex = ((game.cardsVisited - 1) % selectedDeck.cards.length) + 1;

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" aria-label="Planes Chase home">
          <span className="brand-mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <span className="brand-name">planes<span>chase</span></span>
        </a>
        <div className="topbar-right">
          <span className="format-pill"><span className="status-dot" /> PLANECHASE COMPANION</span>
          <a
            className="rules-link"
            href="https://magic.wizards.com/en/formats/planechase"
            target="_blank"
            rel="noreferrer"
          >
            Format rules <span aria-hidden="true">↗</span>
          </a>
        </div>
      </header>

      <section className="intro">
        <div>
          <p className="eyebrow">A MULTIVERSE IN MOTION</p>
          <h1>Where will the chaos take you?</h1>
          <p className="intro-copy">
            Pick a planar deck, roll the die, and let the Blind Eternities decide.
          </p>
        </div>
        <div className="edition-mark" aria-hidden="true">
          <span className="orbit orbit-one" />
          <span className="orbit orbit-two" />
          <span className="orbit-core" />
        </div>
      </section>

      <section className="deck-picker" aria-label="Planar deck selection">
        <div className="picker-label">
          <span className="section-index">01</span>
          <label htmlFor="deck-select">Choose your planar deck</label>
        </div>
        <div className="picker-controls">
          <div className="select-wrap">
            <select
              id="deck-select"
              value={selectedDeck.id}
              onChange={(event) => handleDeckChange(event.currentTarget.value)}
            >
              {decks.map((deck) => (
                <option key={deck.id} value={deck.id}>
                  {deck.name} · {deck.edition}
                </option>
              ))}
            </select>
            <span aria-hidden="true" className="select-chevron">⌄</span>
          </div>
          <button className="button button-outline" onClick={() => startGame()}>
            <span aria-hidden="true">↻</span>
            New game
          </button>
        </div>
        <div className="deck-meta">
          <p>{selectedDeck.description}</p>
          <span>{planeCount} planes <i /> {phenomenonCount} phenomena</span>
        </div>
      </section>

      <section className="game-layout" aria-label="Planechase game">
        <div className="plane-column">
          <div className="panel-heading">
            <div>
              <span className="section-index">02</span>
              <h2>Current destination</h2>
            </div>
            <span className="card-position">
              <span className="position-dot" />
              CARD {currentIndex} <span className="position-divider">/</span> {selectedDeck.cards.length}
            </span>
          </div>

          <article className={`plane-card ${game.currentCard.kind === "phenomenon" ? "is-phenomenon" : ""}`}>
            <div className="card-atmosphere" aria-hidden="true">
              <span className="card-orbit card-orbit-one" />
              <span className="card-orbit card-orbit-two" />
              <span className="card-orbit card-orbit-three" />
              <span className="card-spark card-spark-one" />
              <span className="card-spark card-spark-two" />
            </div>
            <div className="plane-card-content">
              <div className="card-topline">
                <span className="kind-label">
                  <span className="kind-symbol" aria-hidden="true">
                    {game.currentCard.kind === "plane" ? "◇" : "✦"}
                  </span>
                  {game.currentCard.kind}
                </span>
                <span className="card-number">PL {String(currentIndex).padStart(3, "0")}</span>
              </div>
              <div className="card-title-wrap">
                <span className="card-kicker">
                  {game.currentCard.kind === "plane" ? "YOU ARE TRAVELING TO" : "YOU HAVE ENCOUNTERED"}
                </span>
                <h3>{game.currentCard.name}</h3>
                <a className="card-reference" href={currentReference} target="_blank" rel="noreferrer">
                  View card details <span aria-hidden="true">↗</span>
                </a>
              </div>
              <div className="card-bottomline">
                <span>THE BLIND ETERNITIES</span>
                <span className="bottomline-mark" aria-hidden="true">✦</span>
                <span>{game.currentCard.kind === "plane" ? "PLANE" : "PHENOMENON"}</span>
              </div>
            </div>
          </article>

          {game.currentCard.kind === "phenomenon" && (
            <div className="phenomenon-note">
              <span className="note-icon" aria-hidden="true">!</span>
              <p>
                Resolve this phenomenon using its card reference, then planeswalk away.
              </p>
              <a href={currentReference} target="_blank" rel="noreferrer" aria-label="Open phenomenon card details">
                ↗
              </a>
            </div>
          )}

          <details className="deck-list">
            <summary>
              <span>
                <span className="section-index">03</span>
                Planar deck list
              </span>
              <span className="deck-list-count">{selectedDeck.cards.length} cards <span aria-hidden="true">⌄</span></span>
            </summary>
            <ol>
              {selectedDeck.cards.map((card, index) => (
                <li key={card.name}>
                  <span className="list-number">{String(index + 1).padStart(2, "0")}</span>
                  <span className="list-card-name">{card.name}</span>
                  <span className={`list-kind ${card.kind}`}>{card.kind}</span>
                  <a href={cardReference(card.name)} target="_blank" rel="noreferrer" aria-label={`View ${card.name} card details`}>
                    ↗
                  </a>
                </li>
              ))}
            </ol>
          </details>
        </div>

        <aside className="die-panel">
          <div className="panel-heading die-heading">
            <div>
              <span className="section-index">04</span>
              <h2>The planar die</h2>
            </div>
            <span className="turn-label">TURN {String(game.turn).padStart(2, "0")}</span>
          </div>

          <div className={`die-face ${game.lastRoll?.outcome ?? "idle"}`} aria-label="Planar die">
            {game.lastRoll?.outcome === "chaos" ? (
              <span className="die-glyph" aria-hidden="true">✶</span>
            ) : game.lastRoll?.outcome === "planeswalk" ? (
              <span className="die-glyph" aria-hidden="true">↗</span>
            ) : null}
          </div>

          <p className="roll-cost">
            NEXT ROLL <span>{nextRollCost}</span>
          </p>
          <button className="button button-primary roll-button" onClick={handleRoll}>
            Roll planar die <span aria-hidden="true">↗</span>
          </button>
          <p className="die-note">First roll each turn is free. Each additional roll costs one more mana.</p>

          <div className="roll-result" aria-live="polite">
            <span className="result-spark" aria-hidden="true">✦</span>
            <p>{notice}</p>
          </div>

          <div className="die-legend" aria-label="Planar die faces">
            <span><i className="legend-blank" /> Blank</span>
            <span><i className="legend-chaos">✶</i> Chaos</span>
            <span><i className="legend-walk">↗</i> Planeswalk</span>
          </div>

          <div className="panel-actions">
            <button className="button button-outline" onClick={handlePlaneswalk}>
              <span aria-hidden="true">↗</span>
              {game.currentCard.kind === "phenomenon" ? "Continue planeswalking" : "Planeswalk"}
            </button>
            <button className="button button-quiet" onClick={handleNextTurn}>
              End turn <span aria-hidden="true">→</span>
            </button>
          </div>
        </aside>
      </section>

      <footer className="app-footer">
        <p>Card names and types are included for gameplay. Open a card reference for its official text and art.</p>
        <span>{allCards.length} OFFICIAL PLANAR CARDS <i /> {decks.length - 1} DECKS</span>
      </footer>
    </main>
  );
}
