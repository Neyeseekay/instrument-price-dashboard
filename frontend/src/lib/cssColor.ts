/**
 * Reads a color straight off the compiled Tailwind theme (`@theme` in
 * index.css compiles our palette into real CSS custom properties on
 * :root). Lets canvas-based rendering (Chart.js) share the exact same
 * source of truth as everything Tailwind styles directly, instead of
 * duplicating hex values in a second file.
 */
export function cssColor(variable: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
}
