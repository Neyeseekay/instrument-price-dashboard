export function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-hairline bg-surface/50 px-6 py-16 text-center">
      <svg
        className="h-10 w-10 text-ink-muted"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
        />
      </svg>
      <p className="text-sm text-ink-muted">
        Search for a ticker above to see its price chart and stats.
      </p>
    </div>
  );
}
