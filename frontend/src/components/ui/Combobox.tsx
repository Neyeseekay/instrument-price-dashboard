import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

export interface ComboboxProps<T> {
  /** All selectable items; filtered client-side as the user types. */
  options: T[];
  /** Reads a display label off one item. */
  getLabel: (item: T) => string;
  /** Reads a unique, stable identifier off one item. */
  getValue: (item: T) => string;
  /** Currently selected value(s) -- always an array, even in single-select mode. */
  value: string[];
  /** Called with the complete new selection whenever it changes. */
  onChange: (value: string[]) => void;
  /** Allow more than one selection. Default false. */
  multiple?: boolean;
  /** Max selections allowed when multiple is true. Ignored otherwise. */
  max?: number;
  placeholder?: string;
  disabled?: boolean;
}

export function Combobox<T>({
  options,
  getLabel,
  getValue,
  value,
  onChange,
  multiple = false,
  max,
  placeholder,
  disabled = false,
}: ComboboxProps<T>) {
  const [inputText, setInputText] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const rootRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  const filtered = options.filter((option) =>
    getLabel(option).toLowerCase().includes(inputText.trim().toLowerCase()),
  );

  const atMax = multiple && max !== undefined && value.length >= max;

  // Close on outside click/tap.
  useEffect(() => {
    if (!isOpen) return;
    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen]);

  // Reset the highlighted row whenever the filtered list changes.
  useEffect(() => {
    setHighlightedIndex(0);
  }, [inputText, isOpen]);

  function selectOption(option: T) {
    const optionValue = getValue(option);

    if (!multiple) {
      onChange([optionValue]);
      setInputText(getLabel(option));
      setIsOpen(false);
      return;
    }

    const isSelected = value.includes(optionValue);
    const next = isSelected
      ? value.filter((v) => v !== optionValue)
      : max !== undefined && value.length >= max
        ? value // already at max, ignore
        : [...value, optionValue];

    onChange(next);
    setInputText("");

    if (!isSelected && max !== undefined && next.length >= max) {
      setIsOpen(false); // just filled the last slot
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setIsOpen(true);
      setHighlightedIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const option = filtered[highlightedIndex];
      if (option) selectOption(option);
    } else if (event.key === "Escape") {
      setIsOpen(false);
    }
  }

  return (
    <div ref={rootRef} className="relative w-full">
      <input
        type="text"
        role="combobox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-activedescendant={
          isOpen && filtered[highlightedIndex] ? `${listboxId}-${highlightedIndex}` : undefined
        }
        autoComplete="off"
        disabled={disabled}
        placeholder={placeholder}
        value={inputText}
        onChange={(e) => {
          setInputText(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        onKeyDown={handleKeyDown}
        className="w-full rounded-md border border-hairline bg-surface px-3 py-2 text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-brand disabled:cursor-not-allowed disabled:opacity-50"
      />

      {isOpen && (
        <ul
          id={listboxId}
          role="listbox"
          aria-multiselectable={multiple}
          className="absolute z-10 mt-1 max-h-64 w-full overflow-y-auto rounded-md border border-hairline bg-surface shadow-lg"
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-ink-muted">No matches</li>
          ) : (
            filtered.map((option, index) => {
              const optionValue = getValue(option);
              const isSelected = value.includes(optionValue);
              const isDisabled = multiple && atMax && !isSelected;

              return (
                <li
                  key={optionValue}
                  id={`${listboxId}-${index}`}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={isDisabled}
                  onPointerDown={(e) => {
                    e.preventDefault(); // keep focus on the input
                    if (!isDisabled) selectOption(option);
                  }}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={[
                    "flex min-h-[44px] cursor-pointer items-center px-3 py-2 text-ink",
                    index === highlightedIndex ? "bg-page" : "",
                    "hover:bg-page",
                    isDisabled ? "cursor-not-allowed opacity-40" : "",
                  ].join(" ")}
                >
                  {isSelected && (
                    <span className="mr-2 text-brand" aria-hidden="true">
                      ✓
                    </span>
                  )}
                  {getLabel(option)}
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}
