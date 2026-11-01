import type { PlaneCard, PlaneDeck } from "./data/decks";

export type DieOutcome = "blank" | "chaos" | "planeswalk";

export interface DieRoll {
  outcome: DieOutcome;
  cost: number;
  walkedFrom?: string;
}

export interface GameState {
  deckId: string;
  currentCard: PlaneCard;
  queue: PlaneCard[];
  cardsVisited: number;
  turn: number;
  rollsThisTurn: number;
  totalRolls: number;
  lastRoll: DieRoll | null;
}

const planarDieFaces: DieOutcome[] = [
  "blank",
  "blank",
  "blank",
  "blank",
  "chaos",
  "planeswalk",
];

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
    turn: 1,
    rollsThisTurn: 0,
    totalRolls: 0,
    lastRoll: null,
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
    lastRoll: null,
  };
}

export function rollPlanarDie(
  game: GameState,
  random: () => number = Math.random,
): GameState {
  const outcome = planarDieFaces[Math.floor(random() * planarDieFaces.length)];
  const cost = game.rollsThisTurn;
  const rolledGame: GameState = {
    ...game,
    rollsThisTurn: cost + 1,
    totalRolls: game.totalRolls + 1,
    lastRoll: { outcome, cost },
  };

  if (outcome !== "planeswalk") {
    return rolledGame;
  }

  const walkedGame = advancePlane(rolledGame);
  return {
    ...walkedGame,
    lastRoll: { outcome, cost, walkedFrom: game.currentCard.name },
  };
}

export function beginNextTurn(game: GameState): GameState {
  return {
    ...game,
    turn: game.turn + 1,
    rollsThisTurn: 0,
    lastRoll: null,
  };
}
