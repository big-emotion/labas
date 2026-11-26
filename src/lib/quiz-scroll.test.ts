import { describe, expect, it } from "vitest";
import { scrollBack } from "./quiz-scroll";

describe("scrollBack", () => {
  it("leaves the page still while the top of the quiz is on screen", () => {
    expect(scrollBack(0, false)).toBeUndefined();
    expect(scrollBack(120, false)).toBeUndefined();
  });

  it("glides back to the top of the quiz once it has left the screen", () => {
    expect(scrollBack(-340, false)).toEqual({ behavior: "smooth", block: "start" });
  });

  it("jumps without gliding when the reader asks for less motion", () => {
    expect(scrollBack(-340, true)).toEqual({ behavior: "auto", block: "start" });
  });
});
