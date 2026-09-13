import { defineConfig } from "orval";

export default defineConfig({
  instrumentPriceDashboard: {
    input: {
      target: "./openapi.json",
    },
    output: {
      mode: "single",
      target: "./src/api/generated/endpoints.ts",
      client: "react-query",
      httpClient: "axios",
      clean: true,
      override: {
        mutator: {
          path: "./src/api/customInstance.ts",
          name: "customInstance",
        },
      },
    },
  },
});
