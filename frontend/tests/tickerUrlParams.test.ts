import { describe, expect, it } from "vitest";

import { buildSearchWithTickers, parseTickersFromSearch } from "../src/lib/tickerUrlParams";

describe("parseTickersFromSearch", () => {
  it("returns an empty array when there's no tickers param", () => {
    expect(parseTickersFromSearch("", 3)).toEqual([]);
    expect(parseTickersFromSearch("?foo=bar", 3)).toEqual([]);
  });

  it("splits a comma-separated list", () => {
    expect(parseTickersFromSearch("?tickers=AAPL,MSFT,GOOGL", 3)).toEqual([
      "AAPL",
      "MSFT",
      "GOOGL",
    ]);
  });

  it("trims whitespace and drops empty entries", () => {
    expect(parseTickersFromSearch("?tickers=AAPL,%20,MSFT,,", 3)).toEqual(["AAPL", "MSFT"]);
  });

  it("dedupes repeated tickers", () => {
    expect(parseTickersFromSearch("?tickers=AAPL,AAPL,MSFT", 3)).toEqual(["AAPL", "MSFT"]);
  });

  it("caps the result at max", () => {
    expect(parseTickersFromSearch("?tickers=AAPL,MSFT,GOOGL,TSLA", 3)).toEqual([
      "AAPL",
      "MSFT",
      "GOOGL",
    ]);
  });
});

describe("buildSearchWithTickers", () => {
  it("returns an empty string for no selection", () => {
    expect(buildSearchWithTickers([])).toBe("");
  });

  it("builds a readable, comma-joined tickers param", () => {
    expect(buildSearchWithTickers(["AAPL", "MSFT"])).toBe("?tickers=AAPL,MSFT");
  });

  it("round-trips through parseTickersFromSearch", () => {
    const tickers = ["AAPL", "MSFT", "GOOGL"];
    expect(parseTickersFromSearch(buildSearchWithTickers(tickers), 3)).toEqual(tickers);
  });
});
