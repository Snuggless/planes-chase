import { describe, expect, it } from "vitest";
import { advancePlane, createGame, shuffle } from "./game";
import type { PlaneDeck } from "./data/decks";

const testDeck: PlaneDeck = {
  schemaVersion: 1,
  id: "test-deck",
  name: "Test deck",
  edition: "Test",
  description: "A test-only deck.",
  cards: Array.from({ length: 10 }, (_, index) => ({
    name: `Plane ${index + 1}`,
    kind: "plane" as const,
  })),
};

describe("planar game", () => {
  it("shuffles a copy without changing the source", () => {
    const items = [1, 2, 3];
    const result = shuffle(items, () => 0);

    expect(result).toEqual([2, 3, 1]);
    expect(items).toEqual([1, 2, 3]);
  });

  it("starts on a random card and keeps the remaining planar deck", () => {
    const game = createGame(testDeck, () => 0);

    expect(game.currentCard.name).toBe("Plane 2");
    expect(game.queue).toHaveLength(9);
  });

  it("cycles through the deck without losing or repeating cards early", () => {
    let game = createGame(testDeck, () => 0);
    const originalOrder = [game.currentCard.name, ...game.queue.map((card) => card.name)];

    for (let index = 0; index < testDeck.cards.length - 1; index += 1) {
      game = advancePlane(game);
    }

    expect(game.currentCard.name).toBe(originalOrder.at(-1));
    expect(game.queue).toHaveLength(9);

    game = advancePlane(game);
    expect(game.currentCard.name).toBe(originalOrder[0]);
  });

  it("advances the deck only when requested", () => {
    const game = createGame(testDeck, () => 0);
    const nextCardName = game.queue[0]?.name;
    const nextGame = advancePlane(game);

    expect(nextGame.currentCard.name).toBe(nextCardName);
    expect(nextGame.cardsVisited).toBe(2);
    expect(nextGame.queue).toHaveLength(9);
  });
});
