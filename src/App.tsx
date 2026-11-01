import { useEffect, useRef, useState } from "react";
import { fetchCardOracleText } from "./card-text";
import { allCards, decks, type PlaneDeck } from "./data/decks";
import { advancePlane, createGame } from "./game";

const initialDeck = decks.find((deck) => deck.id === "all-official-cards") ?? decks[0];

if (!initialDeck) {
  throw new Error("No Planechase decks are available.");
}

function cardReference(name: string): string {
  return `https://scryfall.com/search?q=${encodeURIComponent(`!"${name}"`)}`;
}

type CardTextState =
  | { cardName: string; status: "loading" }
  | { cardName: string; status: "error" }
  | { cardName: string; status: "loaded"; text: string };

export default function App() {
  const [selectedDeckId, setSelectedDeckId] = useState(initialDeck.id);
  const [game, setGame] = useState(() => createGame(initialDeck));
  const [notice, setNotice] = useState(
    "Roll your physical planar die. Use the button when you roll the planeswalk symbol.",
  );
  const [cardText, setCardText] = useState<CardTextState>({
    cardName: "",
    status: "loading",
  });
  const [cardTextRetry, setCardTextRetry] = useState(0);
  const cardTextCache = useRef(new Map<string, string>());
  const selectedDeck = decks.find((deck) => deck.id === selectedDeckId) ?? initialDeck;
  const planeCount = selectedDeck.cards.filter((card) => card.kind === "plane").length;
  const phenomenonCount = selectedDeck.cards.length - planeCount;

  useEffect(() => {
    const cardName = game.currentCard.name;
    const cachedText = cardTextCache.current.get(cardName);
    if (cachedText !== undefined) {
      setCardText({ cardName, status: "loaded", text: cachedText });
      return;
    }

    const controller = new AbortController();
    setCardText({ cardName, status: "loading" });

    const requestDelay = window.setTimeout(() => {
      void fetchCardOracleText(cardName, controller.signal)
        .then((text) => {
          if (controller.signal.aborted) return;

          cardTextCache.current.set(cardName, text);
          setCardText({ cardName, status: "loaded", text });
        })
        .catch(() => {
          if (controller.signal.aborted) return;
          setCardText({ cardName, status: "error" });
        });
    }, 150);

    return () => {
      window.clearTimeout(requestDelay);
      controller.abort();
    };
  }, [game.currentCard.name, cardTextRetry]);

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

  function handlePlaneswalk() {
    const previousCard = game.currentCard;
    const nextGame = advancePlane(game);
    setGame(nextGame);
    setNotice(`Planeswalked from ${previousCard.name} to ${nextGame.currentCard.name}.`);
  }

  const currentReference = cardReference(game.currentCard.name);
  const currentIndex = ((game.cardsVisited - 1) % selectedDeck.cards.length) + 1;
  const currentCardText =
    cardText.cardName === game.currentCard.name ? cardText : null;

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
            Pick a planar deck, roll your physical planar die, and let the Blind Eternities decide.
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

          <section className="card-text-panel" aria-label="Current card text">
            <div className="card-text-heading">
              <div>
                <span className="section-index">CARD TEXT</span>
                <h3>{game.currentCard.kind === "plane" ? "Plane ability" : "Phenomenon effect"}</h3>
              </div>
              <a href={currentReference} target="_blank" rel="noreferrer">
                Scryfall <span aria-hidden="true">↗</span>
              </a>
            </div>
            <div
              className="card-text-content"
              aria-live="polite"
              aria-busy={!currentCardText || currentCardText.status === "loading"}
            >
              {!currentCardText || currentCardText.status === "loading" ? (
                <p className="card-text-state">Loading card text from Scryfall…</p>
              ) : currentCardText.status === "error" ? (
                <div className="card-text-error">
                  <p>Card text couldn’t be loaded. Check the Scryfall reference or try again.</p>
                  <button
                    className="card-text-retry"
                    onClick={() => setCardTextRetry((retry) => retry + 1)}
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <p className="card-text-body">{currentCardText.text}</p>
              )}
            </div>
          </section>

          {game.currentCard.kind === "phenomenon" && (
            <div className="phenomenon-note">
              <span className="note-icon" aria-hidden="true">!</span>
              <p>Resolve this phenomenon, then continue planeswalking.</p>
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

        <aside className="journey-panel">
          <div className="panel-heading journey-heading">
            <div>
              <span className="section-index">04</span>
              <h2>Plane travel</h2>
            </div>
            <span className="journey-position">
              {String(currentIndex).padStart(2, "0")} / {String(selectedDeck.cards.length).padStart(2, "0")}
            </span>
          </div>

          <div className="journey-symbol" aria-hidden="true">
            <span className="journey-orbit journey-orbit-one" />
            <span className="journey-orbit journey-orbit-two" />
            <span className="journey-core">↗</span>
          </div>
          <p className="journey-label">ROLL A PHYSICAL PLANAR DIE</p>
          <p className="journey-description">
            When it shows the planeswalk symbol, advance to the next card in this deck.
          </p>
          <button className="button button-primary journey-button" onClick={handlePlaneswalk}>
            {game.currentCard.kind === "phenomenon" ? "Continue planeswalking" : "Planeswalk"}
            <span aria-hidden="true">↗</span>
          </button>

          <div className="journey-status" aria-live="polite">
            <span aria-hidden="true">✦</span>
            <p>{notice}</p>
          </div>

          <p className="journey-footnote">The physical die stays at your table; this app tracks the planar deck.</p>
        </aside>
      </section>

      <footer className="app-footer">
        <p>Card text is fetched from Scryfall on demand. Artwork isn’t bundled in the app.</p>
        <span>{allCards.length} OFFICIAL PLANAR CARDS <i /> {decks.length - 1} DECKS</span>
      </footer>
    </main>
  );
}
