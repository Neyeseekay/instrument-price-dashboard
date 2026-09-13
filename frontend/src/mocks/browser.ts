import { setupWorker } from "msw/browser";

import { handlers } from "./handlers";

// Used by main.tsx in the browser, gated behind VITE_USE_MOCKS -- lets
// `npm run dev:mock` run the whole UI with zero backend process running.
export const worker = setupWorker(...handlers);
