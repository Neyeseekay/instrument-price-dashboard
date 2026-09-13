import { useEffect, useState, type ReactNode } from "react";

const SESSION_KEY = "splashShown";
const HOLD_MS = 1500;
const SLIDE_MS = 900;
const FADE_MS = 300;

// Roughly matches Header's logo (h-8, px-6 in a h-16 bar) so the slide
// lands close to where the real header logo already sits underneath.
const FINAL_TOP = "1rem";
const FINAL_LEFT = "1.5rem";
const FINAL_WIDTH = "6.5rem";

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true
  );
}

export function SplashScreen({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(() => {
    if (prefersReducedMotion()) return false;
    try {
      return !sessionStorage.getItem(SESSION_KEY);
    } catch {
      return false; // sessionStorage unavailable (e.g. private mode) -- skip rather than risk breaking the page
    }
  });
  const [sliding, setSliding] = useState(false);

  useEffect(() => {
    if (!visible) return;

    // Hold centered for a beat before sliding to the header position.
    const holdTimeout = setTimeout(() => setSliding(true), HOLD_MS);
    const doneTimeout = setTimeout(() => {
      try {
        sessionStorage.setItem(SESSION_KEY, "true");
      } catch {
        /* ignore */
      }
      setVisible(false);
    }, HOLD_MS + SLIDE_MS + FADE_MS);

    return () => {
      clearTimeout(holdTimeout);
      clearTimeout(doneTimeout);
    };
  }, [visible]);

  return (
    <>
      {children}
      {visible && (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-50 bg-page ease-in-out"
          style={{
            transitionProperty: "opacity",
            transitionDuration: `${FADE_MS}ms`,
            transitionDelay: sliding ? `${SLIDE_MS - FADE_MS}ms` : "0ms",
            opacity: sliding ? 0 : 1,
          }}
        >
          <img
            src="/pharo_logo.svg"
            alt=""
            className="fixed ease-in-out"
            style={{
              transitionProperty: "top, left, width, transform",
              transitionDuration: `${SLIDE_MS}ms`,
              top: sliding ? FINAL_TOP : "50%",
              left: sliding ? FINAL_LEFT : "50%",
              width: sliding ? FINAL_WIDTH : "14rem",
              transform: sliding ? "translate(0, 0)" : "translate(-50%, -50%)",
            }}
          />
        </div>
      )}
    </>
  );
}
