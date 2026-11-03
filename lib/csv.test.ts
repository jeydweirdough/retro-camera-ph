import { describe, expect, it } from "vitest";
import { parseCsv, toCsv } from "./csv";

describe("csv", () => {
  it("parses quoted fields with commas, quotes and line breaks", () => {
    const { headers, rows } = parseCsv(
      'name,notes,price\r\n"Canon AE-1, black","Says ""mint""\nLight seals new",18500\r\n',
    );
    expect(headers).toEqual(["name", "notes", "price"]);
    expect(rows).toEqual([{ name: "Canon AE-1, black", notes: 'Says "mint"\nLight seals new', price: "18500" }]);
  });

  it("skips blank lines, trims values and handles Excel's byte-order mark", () => {
    const { headers, rows } = parseCsv("﻿a,b\n\n 1 , 2 \n");
    expect(headers).toEqual(["a", "b"]);
    expect(rows).toEqual([{ a: "1", b: "2" }]);
  });

  it("fills missing trailing columns with empty strings", () => {
    expect(parseCsv("a,b,c\n1").rows).toEqual([{ a: "1", b: "", c: "" }]);
  });

  it("round-trips through toCsv", () => {
    const rows = [{ name: 'He said "hi", twice', qty: "2" }];
    expect(parseCsv(toCsv(["name", "qty"], rows)).rows).toEqual(rows);
  });

  it("stops spreadsheets from running cells as formulas", () => {
    const csv = toCsv(["name"], [{ name: "=HYPERLINK(\"evil\")" }, { name: "-5" }]);
    expect(parseCsv(csv).rows.map((r) => r.name)).toEqual(["'=HYPERLINK(\"evil\")", "-5"]);
  });
});
