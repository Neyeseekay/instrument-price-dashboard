/**
 * Serializes the selected-ticker list to/from the `?tickers=` URL query
 * param, so refreshing the page -- or handing the link to someone else --
 * reproduces the same selection.
 */
const PARAM = "tickers";

export function parseTickersFromSearch(search: string, max: number): string[] {
  const raw = new URLSearchParams(search).get(PARAM);
  if (!raw) return [];

  const seen = new Set<string>();
  const tickers: string[] = [];
  for (const part of raw.split(",")) {
    const ticker = part.trim();
    if (!ticker || seen.has(ticker)) continue;
    seen.add(ticker);
    tickers.push(ticker);
    if (tickers.length === max) break;
  }
  return tickers;
}

export function buildSearchWithTickers(tickers: string[]): string {
  if (tickers.length === 0) return "";
  // Built by hand rather than via URLSearchParams so commas stay literal
  // (URLSearchParams would percent-encode them) -- a shareable link should
  // read as `?tickers=AAPL,MSFT`, not `?tickers=AAPL%2CMSFT`.
  return `?${PARAM}=${tickers.map(encodeURIComponent).join(",")}`;
}
