import { describe, expect, it } from "vitest";
import { contactFor } from "./locale";

describe("the team's address", () => {
  it("stays the publisher's until the English domain exists", () => {
    expect(contactFor("")).toEqual({ fr: "hello@big-emotion.com", en: "hello@big-emotion.com" });
  });

  it("is hello@overthere.africa for English readers once it does", () => {
    expect(contactFor("https://overthere.africa").en).toBe("hello@overthere.africa");
  });
});
