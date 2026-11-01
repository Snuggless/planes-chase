import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchCardOracleText, parseCardOracleText, scryfallNamedCardUrl } from "./card-text";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Scryfall card text", () => {
  it("builds an exact-name lookup URL", () => {
    const url = new URL(scryfallNamedCardUrl("The Maelstrom"));

    expect(url.origin).toBe("https://api.scryfall.com");
    expect(url.pathname).toBe("/cards/named");
    expect(url.searchParams.get("exact")).toBe("The Maelstrom");
  });

  it("parses and preserves card text", () => {
    expect(parseCardOracleText({ oracle_text: "First ability.\n\nSecond ability." })).toBe(
      "First ability.\n\nSecond ability.",
    );
  });

  it("rejects responses without card text", () => {
    expect(() => parseCardOracleText({ name: "Unknown" })).toThrow(
      "Scryfall response did not contain card text.",
    );
  });

  it("fetches oracle text from Scryfall", async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
      new Response(JSON.stringify({ oracle_text: "Chaos ensues." }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchCardOracleText("Akoum", new AbortController().signal)).resolves.toBe(
      "Chaos ensues.",
    );

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain("exact=Akoum");
  });

  it("surfaces non-successful API responses", async () => {
    vi.stubGlobal(
      "fetch",
      async () => new Response(JSON.stringify({ details: "Not found" }), { status: 404 }),
    );

    await expect(fetchCardOracleText("Unknown Plane", new AbortController().signal)).rejects.toThrow(
      "Scryfall request failed with status 404.",
    );
  });
});
