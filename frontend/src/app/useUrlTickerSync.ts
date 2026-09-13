import { useEffect } from "react";

import { useListInstruments } from "../api/generated/endpoints";
import { MAX_SELECTED_TICKERS, setSelectedTickers } from "../features/instruments/instrumentsSlice";
import { buildSearchWithTickers, parseTickersFromSearch } from "../lib/tickerUrlParams";
import { useAppDispatch, useAppSelector } from "./hooks";

/**
 * Keeps the `?tickers=` URL param and the Redux selection in sync, in both
 * directions:
 *  - selection -> URL, via replaceState, so the address bar always
 *    reflects the current view (refreshable, shareable) without spamming
 *    browser history on every add/remove.
 *  - browser back/forward -> selection, via the `popstate` event.
 * Also drops any ticker from a shared/stale link that the backend doesn't
 * actually know about, once the full ticker list has loaded.
 */
export function useUrlTickerSync(): void {
  const dispatch = useAppDispatch();
  const selectedTickers = useAppSelector((state) => state.instruments.selectedTickers);
  const { data: tickers } = useListInstruments();

  useEffect(() => {
    const nextSearch = buildSearchWithTickers(selectedTickers);
    const url = `${window.location.pathname}${nextSearch}${window.location.hash}`;
    window.history.replaceState(window.history.state, "", url);
  }, [selectedTickers]);

  useEffect(() => {
    function handlePopState() {
      dispatch(
        setSelectedTickers(parseTickersFromSearch(window.location.search, MAX_SELECTED_TICKERS)),
      );
    }
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [dispatch]);

  useEffect(() => {
    if (!tickers) return;
    const known = new Set(tickers);
    const valid = selectedTickers.filter((ticker) => known.has(ticker));
    if (valid.length !== selectedTickers.length) {
      dispatch(setSelectedTickers(valid));
    }
  }, [tickers, selectedTickers, dispatch]);
}
