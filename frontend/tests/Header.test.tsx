import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Header } from "../src/components/Header";

describe("Header", () => {
  it("renders the Pharo logo", () => {
    render(<Header />);
    const logo = screen.getByAltText("Pharo");
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute("src", "/pharo_logo.svg");
  });
});
