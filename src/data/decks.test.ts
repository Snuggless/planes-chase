import { describe, expect, it } from "vitest";
import { allCards, decks } from "./decks";

describe("bundled planar decks", () => {
  it("includes the complete official card pool", () => {
    const completePool = decks.find((deck) => deck.id === "all-official-cards");

    expect(allCards).toHaveLength(151);
    expect(allCards.filter((card) => card.kind === "plane")).toHaveLength(139);
    expect(allCards.filter((card) => card.kind === "phenomenon")).toHaveLength(12);
    expect(completePool?.cards).toHaveLength(allCards.length);
    expect(new Set(completePool?.cards.map((card) => card.name))).toEqual(
      new Set(allCards.map((card) => card.name)),
    );
  });

  it("loads every official preconstructed planar deck as ten unique cards", () => {
    const preconstructedDecks = decks.filter(
      (deck) => deck.id !== "all-official-cards" && deck.edition !== "Custom",
    );

    expect(preconstructedDecks).toHaveLength(17);
    for (const deck of preconstructedDecks) {
      expect(deck.cards).toHaveLength(10);
      expect(new Set(deck.cards.map((card) => card.name)).size).toBe(10);
    }
  });

  it("loads the 20-card Light and Darkness custom deck with Planechase rules text", () => {
    const customDeck = decks.find((deck) => deck.id === "light-and-darkness");
    const cards = customDeck?.cards ?? [];
    const planes = cards.filter((card) => card.kind === "plane");
    const phenomena = cards.filter((card) => card.kind === "phenomenon");

    expect(cards).toHaveLength(20);
    expect(new Set(cards.map((card) => card.name)).size).toBe(20);
    expect(planes).toHaveLength(18);
    expect(phenomena).toHaveLength(2);
    expect(planes.every((card) => card.rulesText?.includes("Whenever chaos ensues,"))).toBe(true);
    expect(
      phenomena.every((card) => card.rulesText?.startsWith(`When you encounter ${card.name},`)),
    ).toBe(true);
  });
});
