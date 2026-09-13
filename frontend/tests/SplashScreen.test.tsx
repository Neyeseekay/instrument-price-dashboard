import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SplashScreen } from "../src/components/SplashScreen";

function mockMatchMedia(reducedMotion: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query.includes("prefers-reduced-motion") && reducedMotion,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

describe("SplashScreen", () => {
  beforeEach(() => {
    sessionStorage.clear();
    mockMatchMedia(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("always renders its children", () => {
    render(
      <SplashScreen>
        <p>Page content</p>
      </SplashScreen>,
    );
    expect(screen.getByText("Page content")).toBeInTheDocument();
  });

  it("shows the splash overlay on first render this session", () => {
    render(
      <SplashScreen>
        <p>Page content</p>
      </SplashScreen>,
    );
    expect(screen.getByAltText("")).toBeInTheDocument(); // the splash logo (decorative, alt="")
  });

  it("skips the overlay if already shown this session", () => {
    sessionStorage.setItem("splashShown", "true");
    render(
      <SplashScreen>
        <p>Page content</p>
      </SplashScreen>,
    );
    expect(screen.queryByAltText("")).not.toBeInTheDocument();
  });

  it("skips the overlay when the user prefers reduced motion", () => {
    mockMatchMedia(true);
    render(
      <SplashScreen>
        <p>Page content</p>
      </SplashScreen>,
    );
    expect(screen.queryByAltText("")).not.toBeInTheDocument();
  });
});
