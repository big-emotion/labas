// @vitest-environment node
import { describe, expect, it } from "vitest";
import { bestMatches, type Answers } from "../lib/ranking";
import { readShared, resultLink, sharedResult } from "../lib/shared-result";
import {
  confirmationEmail,
  loginLinkEmail,
  reactionLinkEmail,
  readLocale,
  resultsEmail,
  saveLinkEmail,
} from "./emails";

const SITE = "https://labas.africa";
const answers: Answers = { project: "decouvrir", saturday: 1, order: 0.5, together: 1 };
const top = bestMatches(answers, 3);
const link = resultLink(answers, top);
const shared = sharedResult(readShared(new URL(link).hash)!)!;

describe("the results e-mail", () => {
  it("writes each city's neighbourhood lines as text, the lines that fit only", () => {
    const mail = resultsEmail(
      "reader@example.org",
      shared,
      { resultLink: link, sites: { fr: SITE, en: "" } },
      "fr",
    );
    for (const body of [mail.text, mail.html]) expect(body).not.toContain("[object Object]");
    const fits = shared.cities[0].lines.find((line) => !line.weak);
    if (fits) expect(mail.text).toContain(fits.text);
    for (const weak of shared.cities.flatMap((c) => c.lines.filter((line) => line.weak)))
      expect(mail.text).not.toContain(weak.text);
  });

  it("speaks English to an English reader and links to the English pages", () => {
    const mail = resultsEmail(
      "reader@example.org",
      shared,
      {
        resultLink: link,
        sites: { fr: SITE, en: "" },
        space: { link: "https://x/login", sensitiveLeftOut: true },
      },
      "en",
    );
    expect(mail.subject).toMatch(/^Your African cities: /);
    expect(mail.text).toContain("Over There");
    expect(mail.text).not.toContain("Bonjour");
    expect(mail.text).toContain(`${SITE}/en/city/${shared.cities[0].city.slug}/`);
    expect(mail.text).toContain(`${SITE}/en/go-deeper/`);
    expect(mail.html).toContain('<html lang="en">');
    expect(mail.html).toContain("See my results");
  });
});

describe("the e-mails in the reader's language", () => {
  it("confirms the news in English, with the brand of the English site", () => {
    const mail = confirmationEmail("a@b.co", "https://c/confirm", "https://c/leave", "en");
    expect(mail.subject).toBe("Confirm your sign-up to Over There news");
    expect(mail.text).toContain("https://c/confirm");
    expect(mail.text).toContain("https://c/leave");
    expect(mail.html).toContain("I confirm my sign-up");
    expect(mail.text).not.toMatch(/Bonjour|Là-bas/);
  });

  it("keeps French for a French reader", () => {
    const mail = confirmationEmail("a@b.co", "https://c/confirm", "https://c/leave", "fr");
    expect(mail.subject).toBe("Confirmez votre inscription aux nouveautés de Là-bas");
  });

  it("writes the save, login and reaction links in English", () => {
    expect(saveLinkEmail("a@b.co", "https://l", "en").subject).toBe(
      "Your link to pick up where you left off on Over There",
    );
    expect(loginLinkEmail("a@b.co", "https://l", "en").subject).toBe(
      "Your sign-in link for Over There",
    );
    const reaction = reactionLinkEmail("a@b.co", "https://l", "Cape Town", "en");
    expect(reaction.subject).toBe("Publish your reaction to Cape Town");
    expect(reaction.html).toContain("Publish my reaction");
  });
});

describe("the language a request asks for", () => {
  it("is English only when it says so, French otherwise", () => {
    expect(readLocale("en")).toBe("en");
    expect(readLocale("fr")).toBe("fr");
    expect(readLocale(undefined)).toBe("fr");
    expect(readLocale("de")).toBe("fr");
    expect(readLocale({ toString: () => "en" })).toBe("fr");
  });
});
