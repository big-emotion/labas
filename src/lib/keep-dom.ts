import type { AnswerEvent, MessageEvent, ReactionEvent, ShareEvent, SiteEvent } from "./analytics";
import { type Network, networkShare, networkText, shareEvent } from "./networks";
import { type JourneyKind, resultsMailBody } from "./account";
import { mailtoFor } from "./keep";
import { outcomeOf, resultsBody } from "./newsletter";
import type { Answers, Match } from "./ranking";
import { resultImage } from "./share-image";
import { readShared, resultLink, sharedResult, shareText } from "./shared-result";

// Defined by components/Analytics.astro only when audience measurement is configured.
declare global {
  interface Window {
    plausible?: (name: string, options?: { props: Record<string, string> }) => void;
  }
}

export function track(
  event: SiteEvent | AnswerEvent | ReactionEvent | ShareEvent | MessageEvent,
): void {
  window.plausible?.(event.name, "props" in event ? { props: event.props } : undefined);
}

/** The reader's localStorage, or nothing when the browser blocks it (private mode, settings). */
export function browserStore(): Storage | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

/**
 * Wires every « Garder vos résultats » block (components/KeepResults.astro) on the page to the
 * result the reader sees right now: the message with the profile and the link, the picture,
 * print, and the reader's own mail.
 */
export function wireKeep(
  current: () => { answers: Answers; matches: Match[] },
  kind: JourneyKind,
): void {
  for (const block of document.querySelectorAll<HTMLElement>("[data-keep]")) {
    const note = block.querySelector<HTMLElement>("[data-keep-note]")!;
    const mailForm = block.querySelector<HTMLFormElement>("[data-keep-mail]");
    if (mailForm) wireMail(block, mailForm, current, kind);
    block.addEventListener("click", async (event) => {
      const network = (event.target as HTMLElement).closest<HTMLAnchorElement>(
        "[data-share-network]",
      );
      if (network) return shareOn(network, event, current(), note);
      const target = (event.target as HTMLElement).closest<HTMLElement>("[data-keep-way]");
      const way = target?.dataset.keepWay;
      if (!way) return;
      const { answers, matches } = current();
      if (way === "envoi") {
        const form = block.querySelector<HTMLFormElement>("[data-keep-mail]")!;
        form.hidden = !form.hidden;
        target!.setAttribute("aria-expanded", String(!form.hidden));
        if (!form.hidden) form.querySelector("input")?.focus();
        return;
      }
      if (way === "e-mail") {
        // Set on the click itself, so the mail carries the result as it is now.
        (target as HTMLAnchorElement).href = mailtoFor(shareText(answers, matches));
        return;
      }
      if (way === "impression") return window.print();
      if (way === "image") return savePicture(answers, matches, note);
      const text = shareText(answers, matches);
      if (navigator.share) {
        // Closing the share sheet rejects; nothing to tell the reader.
        return navigator.share({ title: "Là-bas", text }).catch(() => undefined);
      }
      try {
        await navigator.clipboard.writeText(text);
        note.textContent = "Résultat et lien copiés : collez-les où vous voulez.";
      } catch {
        note.textContent = "La copie n'a pas marché sur ce navigateur : essayez l'e-mail.";
      }
    });
  }
}

/**
 * A network button. WhatsApp, Facebook and X: the link is set on the click itself, so it carries
 * the result as it is now, and the browser follows it. Instagram and TikTok: the phone's share
 * sheet with the picture, ready for a story; a computer has none, so the link is copied.
 */
async function shareOn(
  button: HTMLAnchorElement,
  event: Event,
  { answers, matches }: { answers: Answers; matches: Match[] },
  note: HTMLElement,
) {
  const network = button.dataset.shareNetwork as Network;
  const link = resultLink(answers, matches);
  const share = networkShare(network, link);
  track(shareEvent(network));
  if (share.kind === "link") {
    button.href = share.href;
    return;
  }
  event.preventDefault();
  const file = await pictureOf(answers, matches, note);
  const text = networkText(link);
  if (file && navigator.canShare?.({ files: [file] })) {
    try {
      return await navigator.share({ files: [file], text });
    } catch (error) {
      if ((error as Error).name === "AbortError") return;
    }
  }
  try {
    await navigator.clipboard.writeText(link);
    note.textContent = `Lien copié : collez-le dans ${share.app}, en story ou en message.`;
  } catch {
    note.textContent = `La copie n'a pas marché : partagez depuis ${share.app} sur votre téléphone.`;
  }
}

async function pictureOf(answers: Answers, matches: Match[], note: HTMLElement) {
  const shared = sharedResult(readShared(new URL(resultLink(answers, matches)).hash)!);
  if (!shared) return null;
  note.textContent = "Préparation de l'image…";
  const file = new File([await resultImage(shared)], "la-bas-mes-villes.png", {
    type: "image/png",
  });
  note.textContent = "";
  return file;
}

/** Shares the picture where the phone can, and saves it otherwise. */
async function savePicture(answers: Answers, matches: Match[], note: HTMLElement) {
  const file = await pictureOf(answers, matches, note);
  if (!file) return;
  if (navigator.canShare?.({ files: [file] })) {
    try {
      return await navigator.share({ files: [file], text: resultLink(answers, matches) });
    } catch (error) {
      if ((error as Error).name === "AbortError") return;
    }
  }
  const url = URL.createObjectURL(file);
  const link = Object.assign(document.createElement("a"), { href: url, download: file.name });
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  note.textContent = "Image enregistrée dans vos téléchargements.";
}

async function post(path: string, body: unknown): Promise<number> {
  try {
    const response = await fetch(path, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    return response.status;
  } catch {
    return 0;
  }
}

/**
 * « Recevoir par e-mail » sent by Là-bas (components/KeepResults.astro, with the mail service on):
 * the service draws the e-mail from the result link the page builds, and keeps the journey so the
 * e-mail's button opens the full result in Mon espace (operator, 2026-11-17). While the database
 * is away (503), the e-mail still leaves, with the shared result link only.
 */
function wireMail(
  block: HTMLElement,
  form: HTMLFormElement,
  current: () => { answers: Answers; matches: Match[] },
  kind: JourneyKind,
) {
  const error = form.querySelector<HTMLElement>("[data-keep-error]")!;
  const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]')!;
  const show = (status: number) => {
    const outcome = outcomeOf(status, "results");
    if (outcome.sent) return;
    error.textContent = outcome.message;
    error.hidden = false;
  };
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const { answers, matches } = current();
    const fields = {
      email: String(data.get("email") ?? ""),
      sensitive: data.get("sensitive") === "on",
      news: data.get("news") === "on",
      website: String(data.get("website") ?? ""),
    };
    const link = resultLink(answers, matches);
    const body = resultsMailBody(fields, kind, answers, link);
    if (!body) return show(400);
    submit.disabled = true;
    let status = await post("/api/compte/resultats", body);
    const withSpace = status !== 503;
    if (!withSpace) status = await post("/api/resultats", resultsBody(fields, link));
    submit.disabled = false;
    if (!outcomeOf(status).sent) return show(status);
    const sent = document.createElement("div");
    sent.setAttribute("role", "status");
    sent.dataset.keepSent = "";
    const title = document.createElement("p");
    title.className = "keep-sent-title";
    title.append("C'est parti : vos résultats arrivent à ");
    const address = document.createElement("b");
    address.textContent = body.email;
    title.append(address, ".");
    const hint = document.createElement("p");
    hint.className = "keep-hint";
    hint.textContent = [
      withSpace
        ? "Le bouton « Voir mes résultats » de l'e-mail ouvre votre espace, avec votre classement complet."
        : "",
      body.news
        ? withSpace
          ? "Ce même bouton confirme aussi les nouveautés."
          : "Touchez aussi le lien de confirmation des nouveautés, dans ce même e-mail."
        : "",
      "Rien reçu d'ici quelques minutes ? Regardez dans les indésirables.",
    ]
      .filter(Boolean)
      .join(" ");
    sent.append(title, hint);
    form.replaceWith(sent);
    block.querySelector('[data-keep-way="envoi"]')?.remove();
  });
}
