import { describe, expect, it } from "vitest";
import { advancePlane, beginNextTurn, createGame, rollPlanarDie, shuffle } from "./game";
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
    expect(game.turn).toBe(1);
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

  it("rolls a six-sided die with four blank, one chaos, and one planeswalk face", () => {
    const game = createGame(testDeck, () => 0);

    expect(rollPlanarDie(game, () => 0).lastRoll?.outcome).toBe("blank");
    expect(rollPlanarDie(game, () => 0.7).lastRoll?.outcome).toBe("chaos");
    expect(rollPlanarDie(game, () => 0.99).lastRoll?.outcome).toBe("planeswalk");
  });

  it("automatically advances on a planeswalk result and charges increasing roll costs", () => {
    const game = createGame(testDeck, () => 0);
    const firstRoll = rollPlanarDie(game, () => 0);
    const secondRoll = rollPlanarDie(firstRoll, () => 0.99);

    expect(firstRoll.lastRoll?.cost).toBe(0);
    expect(secondRoll.lastRoll).toMatchObject({
      outcome: "planeswalk",
      cost: 1,
      walkedFrom: game.currentCard.name,
    });
    expect(secondRoll.currentCard.name).toBe(firstRoll.queue[0]?.name);
    expect(secondRoll.rollsThisTurn).toBe(2);
  });

  it("resets the planar die cost when the next turn begins", () => {
    const game = rollPlanarDie(createGame(testDeck, () => 0), () => 0);
    const nextTurn = beginNextTurn(game);

    expect(nextTurn.turn).toBe(2);
    expect(nextTurn.rollsThisTurn).toBe(0);
    expect(nextTurn.lastRoll).toBeNull();
  });
});
