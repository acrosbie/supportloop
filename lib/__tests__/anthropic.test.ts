import { describe, it, expect } from "vitest";
import { parseJson } from "../anthropic";

describe("parseJson", () => {
  it("parses raw JSON", () => {
    expect(parseJson<{ a: number }>('{"a":1}')).toEqual({ a: 1 });
  });

  it("parses fenced JSON", () => {
    expect(parseJson("```json\n{\"a\":2}\n```")).toEqual({ a: 2 });
  });

  it("tolerates leading prose before the JSON", () => {
    expect(parseJson('Sure, here you go: {"a":3}')).toEqual({ a: 3 });
  });

  it("parses arrays", () => {
    expect(parseJson<number[]>("[1,2,3]")).toEqual([1, 2, 3]);
  });

  it("throws when there is no JSON", () => {
    expect(() => parseJson("nothing structured here")).toThrow();
  });
});
