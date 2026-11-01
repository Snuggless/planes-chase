import rawCardCatalog from "./cards.json";

export type CardKind = "plane" | "phenomenon";

export interface PlaneCard {
  name: string;
  kind: CardKind;
  rulesText?: string;
}

export interface PlaneDeck {
  schemaVersion: 1;
  id: string;
  name: string;
  edition: string;
  description: string;
  cards: PlaneCard[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseCardCatalog(value: unknown): Map<string, PlaneCard> {
  if (
    !isRecord(value) ||
    value.schemaVersion !== 1 ||
    !Array.isArray(value.planes) ||
    !Array.isArray(value.phenomena)
  ) {
    throw new Error("The card catalog must contain planes and phenomena arrays.");
  }

  const cards = new Map<string, PlaneCard>();
  const entries: [CardKind, unknown[]][] = [
    ["plane", value.planes],
    ["phenomenon", value.phenomena],
  ];

  for (const [kind, names] of entries) {
    for (const name of names) {
      if (typeof name !== "string" || name.trim().length === 0) {
        throw new Error(`The card catalog contains an invalid ${kind} name.`);
      }

      if (cards.has(name)) {
        throw new Error(`The card catalog contains a duplicate card: ${name}.`);
      }

      cards.set(name, { name, kind });
    }
  }

  return cards;
}

const cardCatalog = parseCardCatalog(rawCardCatalog);

function parseCustomCards(value: unknown, deckName: string): Map<string, PlaneCard> {
  if (value === undefined) {
    return new Map();
  }

  if (!Array.isArray(value)) {
    throw new Error(`Deck "${deckName}" has an invalid customCards list.`);
  }

  const cards = new Map<string, PlaneCard>();
  for (const card of value) {
    if (
      !isRecord(card) ||
      typeof card.name !== "string" ||
      card.name.trim().length === 0 ||
      (card.kind !== "plane" && card.kind !== "phenomenon") ||
      typeof card.rulesText !== "string" ||
      card.rulesText.trim().length === 0
    ) {
      throw new Error(`Deck "${deckName}" contains an invalid custom card.`);
    }

    if (cardCatalog.has(card.name) || cards.has(card.name)) {
      throw new Error(`Deck "${deckName}" contains a duplicate custom card: ${card.name}.`);
    }

    cards.set(card.name, {
      name: card.name,
      kind: card.kind,
      rulesText: card.rulesText,
    });
  }

  return cards;
}

function parseDeck(value: unknown, fileName: string): PlaneDeck {
  if (!isRecord(value)) {
    throw new Error(`Deck file ${fileName} must contain a JSON object.`);
  }

  const { schemaVersion, id, name, edition, description, cards } = value;
  if (
    schemaVersion !== 1 ||
    typeof id !== "string" ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) ||
    typeof name !== "string" ||
    name.trim().length === 0 ||
    typeof edition !== "string" ||
    edition.trim().length === 0 ||
    typeof description !== "string" ||
    description.trim().length === 0 ||
    !Array.isArray(cards)
  ) {
    throw new Error(`Deck file ${fileName} does not match deck schema version 1.`);
  }

  if (cards.length < 10) {
    throw new Error(`Deck "${name}" must contain at least 10 cards.`);
  }

  const customCards = parseCustomCards(value.customCards, name);
  const seen = new Set<string>();
  const resolvedCards = cards.map((cardName) => {
    if (typeof cardName !== "string" || seen.has(cardName)) {
      throw new Error(`Deck "${name}" contains an invalid or duplicate card name.`);
    }

    seen.add(cardName);
    const card = cardCatalog.get(cardName) ?? customCards.get(cardName);
    if (!card) {
      throw new Error(`Deck "${name}" references unknown card "${cardName}".`);
    }

    return card;
  });

  for (const customCardName of customCards.keys()) {
    if (!seen.has(customCardName)) {
      throw new Error(`Deck "${name}" defines custom card "${customCardName}" outside its card list.`);
    }
  }

  return {
    schemaVersion,
    id,
    name,
    edition,
    description,
    cards: resolvedCards,
  };
}

const deckFiles = import.meta.glob<unknown>("./decks/*.json", {
  eager: true,
  import: "default",
});

const editionOrder = [
  "Planechase (2009)",
  "Planechase 2012",
  "March of the Machine Commander (2023)",
  "Doctor Who Commander (2023)",
];

export const decks = Object.entries(deckFiles)
  .map(([fileName, deck]) => parseDeck(deck, fileName))
  .sort((left, right) => {
    if (left.id === "all-official-cards") return -1;
    if (right.id === "all-official-cards") return 1;
    const leftOrder = editionOrder.indexOf(left.edition);
    const rightOrder = editionOrder.indexOf(right.edition);
    const leftRank = leftOrder === -1 ? editionOrder.length : leftOrder;
    const rightRank = rightOrder === -1 ? editionOrder.length : rightOrder;
    return leftRank - rightRank || left.name.localeCompare(right.name);
  });

const deckIds = new Set(decks.map((deck) => deck.id));
if (deckIds.size !== decks.length) {
  throw new Error("Deck files must have unique ids.");
}

export const cardsByName = cardCatalog;
export const allCards = [...cardCatalog.values()];
