import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Combobox, type ComboboxProps } from "../src/components/ui/Combobox";

interface Item {
  ticker: string;
}

const items: Item[] = [
  { ticker: "AAPL" },
  { ticker: "MSFT" },
  { ticker: "GOOGL" },
  { ticker: "AMZN" },
];

function renderCombobox(overrides: Partial<ComboboxProps<Item>> = {}) {
  const onChange = vi.fn();
  const utils = render(
    <Combobox<Item>
      options={items}
      getLabel={(i) => i.ticker}
      getValue={(i) => i.ticker}
      value={[]}
      onChange={onChange}
      placeholder="Search tickers..."
      {...overrides}
    />,
  );
  return { onChange, ...utils };
}

describe("Combobox", () => {
  it("renders with the given placeholder", () => {
    renderCombobox();
    expect(screen.getByPlaceholderText("Search tickers...")).toBeInTheDocument();
  });

  it("shows the full option list when focused with empty input", async () => {
    const user = userEvent.setup();
    renderCombobox();
    await user.click(screen.getByRole("combobox"));
    expect(screen.getByRole("option", { name: "AAPL" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "MSFT" })).toBeInTheDocument();
  });

  it("filters options as the user types", async () => {
    const user = userEvent.setup();
    renderCombobox();
    await user.type(screen.getByRole("combobox"), "MS");
    expect(screen.getByRole("option", { name: "MSFT" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "AAPL" })).not.toBeInTheDocument();
  });

  it("shows a 'No matches' message when nothing matches", async () => {
    const user = userEvent.setup();
    renderCombobox();
    await user.type(screen.getByRole("combobox"), "ZZZZ");
    expect(screen.getByText("No matches")).toBeInTheDocument();
  });

  it("single-select: selecting an option calls onChange, fills the input, and closes", async () => {
    const user = userEvent.setup();
    const { onChange } = renderCombobox();
    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByRole("option", { name: "MSFT" }));
    expect(onChange).toHaveBeenCalledWith(["MSFT"]);
    expect(screen.getByRole("combobox")).toHaveValue("MSFT");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("multi-select: selecting an option adds it, clears input, and stays open", async () => {
    const user = userEvent.setup();
    const { onChange } = renderCombobox({ multiple: true, max: 3 });
    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByRole("option", { name: "MSFT" }));
    expect(onChange).toHaveBeenCalledWith(["MSFT"]);
    expect(screen.getByRole("combobox")).toHaveValue("");
    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });

  it("multi-select: clicking an already-selected option removes it", async () => {
    const user = userEvent.setup();
    const { onChange } = renderCombobox({ multiple: true, max: 3, value: ["MSFT"] });
    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByRole("option", { name: "MSFT" }));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it("multi-select: ignores clicks past max and disables remaining options", async () => {
    const user = userEvent.setup();
    const { onChange } = renderCombobox({
      multiple: true,
      max: 2,
      value: ["AAPL", "MSFT"],
    });
    await user.click(screen.getByRole("combobox"));
    const option = screen.getByRole("option", { name: "GOOGL" });
    expect(option).toHaveAttribute("aria-disabled", "true");
    await user.click(option);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("multi-select: auto-closes once max is reached", async () => {
    const user = userEvent.setup();
    renderCombobox({ multiple: true, max: 1 });
    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByRole("option", { name: "MSFT" }));
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("marks already-selected options as aria-selected", async () => {
    const user = userEvent.setup();
    renderCombobox({ multiple: true, value: ["MSFT"] });
    await user.click(screen.getByRole("combobox"));
    expect(screen.getByRole("option", { name: "MSFT" })).toHaveAttribute("aria-selected", "true");
  });

  it("keyboard: ArrowDown highlights the next option and Enter selects it", async () => {
    const user = userEvent.setup();
    const { onChange } = renderCombobox();
    await user.click(screen.getByRole("combobox"));
    await user.keyboard("{ArrowDown}"); // index 0 (AAPL) -> 1 (MSFT)
    await user.keyboard("{Enter}");
    expect(onChange).toHaveBeenCalledWith(["MSFT"]);
  });

  it("keyboard: Escape closes the dropdown", async () => {
    const user = userEvent.setup();
    renderCombobox();
    await user.click(screen.getByRole("combobox"));
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("closes when clicking outside", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <Combobox<Item>
          options={items}
          getLabel={(i) => i.ticker}
          getValue={(i) => i.ticker}
          value={[]}
          onChange={vi.fn()}
        />
        <button>outside</button>
      </div>,
    );
    await user.click(screen.getByRole("combobox"));
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "outside" }));
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });
});
