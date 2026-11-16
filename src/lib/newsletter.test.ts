import { describe, expect, it } from "vitest";
import { NEWS_AFTER, outcomeOf, shouldOfferNews, signUpBody } from "./newsletter";

describe("when the quiz offers the news", () => {
  it("waits for the fourth answer, so the first questions come uninterrupted", () => {
    expect(NEWS_AFTER).toBe(4);
    expect(shouldOfferNews(3, false)).toBe(false);
    expect(shouldOfferNews(4, false)).toBe(true);
    expect(shouldOfferNews(9, false)).toBe(true);
  });

  it("never comes back once the reader said « Plus tard »", () => {
    expect(shouldOfferNews(6, true)).toBe(false);
  });
});

describe("what the form sends", () => {
  it("sends only the address, the ticked box and the robot trap", () => {
    expect(signUpBody({ email: " awa@exemple.fr ", consent: true, website: "" })).toEqual({
      email: "awa@exemple.fr",
      consent: true,
      website: "",
    });
  });

  it("sends nothing without the box ticked or without a plausible address", () => {
    expect(signUpBody({ email: "awa@exemple.fr", consent: false, website: "" })).toBeNull();
    expect(signUpBody({ email: "awa", consent: true, website: "" })).toBeNull();
  });
});

describe("what the reader is told", () => {
  it("asks to check the inbox when the confirmation left", () => {
    expect(outcomeOf(202)).toEqual({ sent: true });
  });

  it("says what to fix, when to retry, or whom to write to", () => {
    expect(outcomeOf(400)).toEqual({
      sent: false,
      message: expect.stringMatching(/adresse.*case/),
    });
    expect(outcomeOf(429)).toEqual({ sent: false, message: expect.stringMatching(/une heure/) });
    for (const status of [0, 403, 500, 502, 503]) {
      expect(outcomeOf(status)).toEqual({
        sent: false,
        message: expect.stringContaining("hello@big-emotion.com"),
      });
    }
  });
});
