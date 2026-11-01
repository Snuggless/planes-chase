const SCRYFALL_NAMED_CARD_ENDPOINT = "https://api.scryfall.com/cards/named";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function scryfallNamedCardUrl(cardName: string): string {
  const url = new URL(SCRYFALL_NAMED_CARD_ENDPOINT);
  url.searchParams.set("exact", cardName);
  return url.toString();
}

export function parseCardOracleText(payload: unknown): string {
  if (!isRecord(payload) || typeof payload.oracle_text !== "string" || payload.oracle_text.trim() === "") {
    throw new Error("Scryfall response did not contain card text.");
  }

  return payload.oracle_text;
}

export async function fetchCardOracleText(cardName: string, signal: AbortSignal): Promise<string> {
  const response = await fetch(scryfallNamedCardUrl(cardName), {
    headers: { Accept: "application/json" },
    signal,
  });

  if (!response.ok) {
    throw new Error(`Scryfall request failed with status ${response.status}.`);
  }

  return parseCardOracleText(await response.json());
}
