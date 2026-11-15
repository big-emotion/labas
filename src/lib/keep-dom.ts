import type { AnswerEvent, SiteEvent } from "./analytics";
import { mailtoFor } from "./keep";

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
 * result the reader sees right now.
 */
export function wireKeep(currentText: () => string): void {
  for (const block of document.querySelectorAll<HTMLElement>("[data-keep]")) {
    const note = block.querySelector<HTMLElement>("[data-keep-note]")!;
    block.addEventListener("click", async (event) => {
      const target = (event.target as HTMLElement).closest<HTMLElement>("[data-keep-way]");
      const way = target?.dataset.keepWay;
      if (way === "e-mail") {
        // Set on the click itself, so the mail carries the result as it is now.
        (target as HTMLAnchorElement).href = mailtoFor(currentText());
        return;
      }
      if (way === "impression") return window.print();
      if (way !== "partage") return;
      const text = currentText();
      if (navigator.share) {
        // Closing the share sheet rejects; nothing to tell the reader.
        return navigator.share({ title: "Là-bas", text }).catch(() => undefined);
      }
      try {
        await navigator.clipboard.writeText(text);
        note.textContent = "Résultats copiés : collez-les où vous voulez.";
      } catch {
        note.textContent = "La copie n'a pas marché sur ce navigateur : essayez l'e-mail.";
      }
    });
  }
}
