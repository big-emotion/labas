import type { AnswerEvent, SiteEvent } from "./analytics";
import { mailtoFor } from "./keep";
import type { Answers, Match } from "./ranking";
import { resultImage } from "./share-image";
import { readShared, resultLink, sharedResult, shareText } from "./shared-result";

// Defined by components/Analytics.astro only when audience measurement is configured.
declare global {
  interface Window {
    plausible?: (name: string, options?: { props: Record<string, string> }) => void;
  }
}

export function track(event: SiteEvent | AnswerEvent): void {
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
export function wireKeep(current: () => { answers: Answers; matches: Match[] }): void {
  for (const block of document.querySelectorAll<HTMLElement>("[data-keep]")) {
    const note = block.querySelector<HTMLElement>("[data-keep-note]")!;
    block.addEventListener("click", async (event) => {
      const target = (event.target as HTMLElement).closest<HTMLElement>("[data-keep-way]");
      const way = target?.dataset.keepWay;
      if (!way) return;
      const { answers, matches } = current();
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

/** Shares the picture where the phone can, and saves it otherwise. */
async function savePicture(answers: Answers, matches: Match[], note: HTMLElement) {
  const shared = sharedResult(readShared(new URL(resultLink(answers, matches)).hash)!);
  if (!shared) return;
  note.textContent = "Préparation de l'image…";
  const file = new File([await resultImage(shared)], "la-bas-mes-villes.png", {
    type: "image/png",
  });
  note.textContent = "";
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
