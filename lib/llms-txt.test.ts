import { describe, expect, it } from "vitest";
import { sampleProducts } from "@/lib/data/sample-repository";
import { Catalog } from "@/lib/domain/catalog";
import { buildLlmsTxt } from "./llms-txt";

describe("buildLlmsTxt", () => {
  const text = buildLlmsTxt(Catalog.fromDTOs(sampleProducts), [
    { question: "Do you ship nationwide?", answer: "Yes." },
  ]);

  it("starts with the store name and summary", () => {
    expect(text).toMatch(/^# .+\n\n> .+/);
  });

  it("lists products with price, stock and specs", () => {
    expect(text).toContain(
      "[Sony A7 IV](http://localhost:3000/product/sony-a7-iv): ₱139,999.00, New, in stock. Type: Digital; Mount: Sony E;",
    );
  });

  it("includes the FAQ", () => {
    expect(text).toContain("### Do you ship nationwide?\n\nYes.");
  });
});

describe("buildLlmsTxt: used items", () => {
  it("states the condition of used items", () => {
    const text = buildLlmsTxt(Catalog.fromDTOs(sampleProducts), []);
    expect(text).toContain("₱18,500.00, Used – Excellent, in stock. Type: Film; Mount: Canon FD;");
  });
});
