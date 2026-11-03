import { describe, expect, it } from "vitest";
import { cn } from "./cn";

describe("cn", () => {
  it("lets the later Tailwind class win a conflict", () => {
    expect(cn("rounded-lg px-5", "rounded-full")).toBe("px-5 rounded-full");
  });

  it("skips falsy values and extra whitespace", () => {
    expect(cn(`
      inline-flex
      font-medium
    `, false, undefined, "h-11")).toBe("inline-flex font-medium h-11");
  });
});
