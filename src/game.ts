import type { PlaneCard, PlaneDeck } from "./data/decks";

export interface GameState {
  deckId: string;
  currentCard: PlaneCard;
  queue: PlaneCard[];
  cardsVisited: number;
}

export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}

export function createGame(deck: PlaneDeck, random: () => number = Math.random): GameState {
  const [currentCard, ...queue] = shuffle(deck.cards, random);
  if (!currentCard) {
    throw new Error(`Cannot start an empty planar deck: ${deck.name}.`);
  }

  return {
    deckId: deck.id,
    currentCard,
    queue,
    cardsVisited: 1,
  };
}

export function advancePlane(game: GameState): GameState {
  const [nextCard, ...remainingCards] = game.queue;
  if (!nextCard) {
    return game;
  }

  return {
    ...game,
    currentCard: nextCard,
    queue: [...remainingCards, game.currentCard],
    cardsVisited: game.cardsVisited + 1,
  };
}
