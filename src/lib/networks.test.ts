import { describe, expect, it } from "vitest";
import { GOALS } from "./analytics";
import { NETWORKS, networkShare, networkText, shareEvent } from "./networks";
import { type Answers, bestMatches } from "./ranking";
import { resultLink } from "./shared-result";

const answers = { project: "installer", order: 1 } as unknown as Answers;
const matches = bestMatches(answers, 3);
const link = resultLink(answers, matches);
const names = matches.map((m) => m.city.name);

describe("sharing a result on a network", () => {
  it("offers the five networks the operator named, in one order", () => {
    expect(NETWORKS.map((n) => n.label)).toEqual([
      "WhatsApp",
      "Facebook",
      "X",
      "Instagram",
      "TikTok",
    ]);
  });

  it("says the three cities and the link, never an answer", () => {
    const text = networkText(link);
    expect(text).toBe(`Mes villes d'Afrique sur Là-bas : ${names.join(", ")}. ${link}`);
    expect(text).not.toContain("installer");
  });

  it("opens WhatsApp, Facebook and X on their own share pages, with nothing of theirs on the site", () => {
    const text = encodeURIComponent(networkText(link));
    expect(networkShare("whatsapp", link)).toEqual({
      kind: "link",
      href: `https://wa.me/?text=${text}`,
    });
    expect(networkShare("facebook", link)).toEqual({
      kind: "link",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`,
    });
    const x = networkShare("x", link);
    expect(x.kind).toBe("link");
    const url = new URL((x as { href: string }).href);
    expect(url.origin + url.pathname).toBe("https://x.com/intent/post");
    expect(url.searchParams.get("url")).toBe(link);
    expect(url.searchParams.get("text")).toBe(
      `Mes villes d'Afrique sur Là-bas : ${names.join(", ")}.`,
    );
  });

  it("goes through the phone's share sheet for Instagram and TikTok, which have no web share page", () => {
    expect(networkShare("instagram", link)).toEqual({ kind: "phone", app: "Instagram" });
    expect(networkShare("tiktok", link)).toEqual({ kind: "phone", app: "TikTok" });
  });

  it("counts a share by its network only", () => {
    expect(shareEvent("instagram")).toEqual({ name: "Partage", props: { reseau: "Instagram" } });
    expect(GOALS).toContain(shareEvent("x").name);
  });
});

describe("sharing a result from an English page", () => {
  it("says the cities in English under the Over There name", () => {
    expect(networkText(link, "en")).toMatch(/^My African cities on Over There: .+\. https:/);
    expect(networkText(link, "en")).not.toContain("Là-bas");
  });
});
