import { keptEvent, stepEvent, type SiteEvent } from "./analytics";
import { mailtoFor } from "./keep";

// Defined by components/Analytics.astro only when audience measurement is configured.
declare global {
  interface Window {
    plausible?: (name: string, options?: { props: Record<string, string> }) => void;
  }
}

export function track(event: SiteEvent): void {
  window.plausible?.(event.name, event.props ? { props: event.props } : undefined);
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
      const target = (event.target as HTMLElement).closest<HTMLElement>(
        "[data-keep-way], [data-letter]",
      );
      if (!target) return;
      if (target.hasAttribute("data-letter")) return track(stepEvent("Lettre d'information"));
      const way = target.dataset.keepWay;
      if (way === "e-mail") {
        // Set on the click itself, so the mail carries the result as it is now.
        (target as HTMLAnchorElement).href = mailtoFor(currentText());
        return track(keptEvent("e-mail"));
      }
      if (way === "impression") {
        track(keptEvent("impression"));
        return window.print();
      }
      const text = currentText();
      if (navigator.share) {
        try {
          await navigator.share({ title: "Là-bas", text });
          track(keptEvent("partage"));
        } catch {
          // The reader closed the share sheet.
        }
        return;
      }
      try {
        await navigator.clipboard.writeText(text);
        note.textContent = "Résultats copiés : collez-les où vous voulez.";
        track(keptEvent("copie"));
      } catch {
        note.textContent = "La copie n'a pas marché sur ce navigateur : essayez l'e-mail.";
      }
    });
  }
}
