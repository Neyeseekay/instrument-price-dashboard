import { setupServer } from "msw/node";

import { handlers } from "./handlers";

// Used by tests (Vitest, Node environment) -- see tests/setup.ts.
export const server = setupServer(...handlers);
