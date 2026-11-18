import type { ShareEvent } from "./analytics";
import { readShared, sharedResult } from "./shared-result";

/**
 * Sharing a result on a network (operator, 2026-11-18). WhatsApp, Facebook and X have a share page
 * that takes a link: a plain link to it, so none of their scripts, cookies or frames ever load on
 * Là-bas. Instagram and TikTok have no such page on the web: the phone's share sheet lists them
 * when they are installed, so they go through it, with the result's picture for a story.
 */
export const NETWORKS = [
  { key: "whatsapp", label: "WhatsApp" },
  { key: "facebook", label: "Facebook" },
  { key: "x", label: "X" },
  { key: "instagram", label: "Instagram" },
  { key: "tiktok", label: "TikTok" },
] as const;
export type Network = (typeof NETWORKS)[number]["key"];

export type NetworkShare = { kind: "link"; href: string } | { kind: "phone"; app: string };

/** The three cities in one line: what a network shows above the link. Never an answer. */
function citiesLine(link: string): string {
  const shared = sharedResult(readShared(new URL(link).hash)!);
  const names = shared?.cities.map((c) => c.city.name).join(", ") ?? "";
  return `Mes villes d'Afrique sur Là-bas : ${names}.`;
}

export const networkText = (link: string) => `${citiesLine(link)} ${link}`;

export function networkShare(network: Network, link: string): NetworkShare {
  if (network === "whatsapp")
    return { kind: "link", href: `https://wa.me/?text=${encodeURIComponent(networkText(link))}` };
  if (network === "facebook")
    return {
      kind: "link",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`,
    };
  if (network === "x") {
    const query = new URLSearchParams({ text: citiesLine(link), url: link });
    return { kind: "link", href: `https://x.com/intent/post?${query}` };
  }
  return { kind: "phone", app: NETWORKS.find((n) => n.key === network)!.label };
}

/** Which network was chosen, and nothing else: never the result, never an answer. */
export function shareEvent(network: Network): ShareEvent {
  return { name: "Partage", props: { reseau: NETWORKS.find((n) => n.key === network)!.label } };
}
