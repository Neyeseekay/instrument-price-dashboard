import { describe, expect, it, vi } from "vitest";

const { mockRequest } = vi.hoisted(() => ({ mockRequest: vi.fn() }));

vi.mock("axios", () => ({
  default: {
    create: () => mockRequest,
  },
}));

import { customInstance } from "../src/api/customInstance";

describe("customInstance", () => {
  it("calls the underlying axios instance with the given config and returns response.data", async () => {
    mockRequest.mockResolvedValue({ data: ["AAPL", "MSFT"] });

    const result = await customInstance<string[]>({ url: "/api/instruments", method: "GET" });

    expect(mockRequest).toHaveBeenCalledWith({ url: "/api/instruments", method: "GET" });
    expect(result).toEqual(["AAPL", "MSFT"]);
  });
});
