import { describe, expect, it } from "vitest";
import { APP_NAME, APP_VERSION } from "./index";

describe("shared package", () => {
  it("exposes the application name", () => {
    expect(APP_NAME).toBe("Smart Logistics");
  });

  it("exposes a semantic version", () => {
    expect(APP_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
