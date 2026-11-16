import { describe, expect, it } from "vitest";
import { NEWS_AFTER, outcomeOf, resultsBody, shouldOfferNews, signUpBody } from "./newsletter";

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

describe("sending one's results by e-mail", () => {
  const link = "https://labas.africa/resultat/#r=abc";

  it("sends the address, the result link and the news choice, nothing from the answers", () => {
    expect(resultsBody({ email: " awa@exemple.fr ", news: false, website: "" }, link)).toEqual({
      email: "awa@exemple.fr",
      link,
      news: false,
      website: "",
    });
    expect(resultsBody({ email: "awa@exemple.fr", news: true, website: "" }, link)?.news).toBe(
      true,
    );
  });

  it("needs only a plausible address: the news box stays optional", () => {
    expect(resultsBody({ email: "awa", news: true, website: "" }, link)).toBeNull();
  });

  it("asks only to check the address when the form is refused", () => {
    expect(outcomeOf(400, "results")).toEqual({
      sent: false,
      message: "Vérifiez votre adresse, puis réessayez.",
    });
  });
});
