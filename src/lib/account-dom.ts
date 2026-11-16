import { saveAnswers } from "./keep";
import { browserStore } from "./keep-dom";
import { type Journey, type JourneyKind, saveBody } from "./account";
import { outcomeOf } from "./newsletter";
import type { Answers } from "./ranking";

/**
 * The browser side of saved journeys: calls to /api/compte (same origin, the session cookie goes
 * along by itself) and the « Reprendre plus tard » block (components/SaveLater.astro).
 */

const JOURNEY = "labas.journey";

export async function api(method: string, path: string, body?: unknown) {
  try {
    const response = await fetch(path, {
      method,
      headers: body === undefined ? {} : { "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await response.text();
    return { status: response.status, data: text ? JSON.parse(text) : null };
  } catch {
    return { status: 0, data: null };
  }
}

function session(): Storage | undefined {
  try {
    return window.sessionStorage;
  } catch {
    return undefined;
  }
}

/** The journey this tab writes to, once the reader is signed in. */
export function rememberJourney(id: string | null) {
  try {
    if (id) session()?.setItem(JOURNEY, id);
    else session()?.removeItem(JOURNEY);
  } catch {
    // Blocked storage: answers simply stop being saved to the account.
  }
}

let pending: ReturnType<typeof setTimeout> | undefined;
/** Called after every answer: saves the journey to Mon espace when one is open in this tab. */
export function syncJourney(answers: Answers) {
  const id = session()?.getItem(JOURNEY);
  if (!id) return;
  clearTimeout(pending);
  pending = setTimeout(async () => {
    const { status } = await api("PUT", `/api/compte/parcours/${id}`, { answers });
    if (status === 401 || status === 404) rememberJourney(null);
  }, 600);
}

/** « Reprendre » in Mon espace: the answers go back to the browser, and the tab keeps saving. */
export function resume(journey: Journey) {
  saveAnswers(browserStore(), journey.answers as Answers);
  rememberJourney(journey.id);
}

export function wireSaveLater(kind: JourneyKind, current: () => Answers) {
  for (const block of document.querySelectorAll<HTMLElement>("[data-save-later]")) {
    const toggle = block.querySelector<HTMLButtonElement>("[data-save-toggle]")!;
    const panel = block.querySelector<HTMLElement>("[data-save-panel]")!;
    const form = panel.querySelector("form")!;
    const error = panel.querySelector<HTMLElement>("[data-save-error]")!;
    const done = panel.querySelector<HTMLElement>("[data-save-done]")!;
    const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]')!;

    const finish = (title: string, text: string) => {
      form.hidden = true;
      panel.querySelector<HTMLElement>("[data-save-intro]")!.hidden = true;
      done.querySelector("b")!.textContent = title;
      done.querySelector("span")!.textContent = text;
      done.hidden = false;
      panel.classList.add("done");
    };

    toggle.addEventListener("click", async () => {
      panel.hidden = !panel.hidden;
      toggle.setAttribute("aria-expanded", String(!panel.hidden));
      if (!panel.hidden && !form.hidden) {
        // Signed in already: no e-mail needed, the journey goes straight to Mon espace.
        const { status } = await api("GET", "/api/compte");
        if (status !== 200) return form.querySelector("input")?.focus();
        const created = await api("POST", "/api/compte/parcours", { kind, answers: current() });
        if (created.status !== 201) return form.querySelector("input")?.focus();
        rememberJourney(created.data.id);
        finish(
          "C'est enregistré dans Mon espace.",
          "Vous pouvez continuer : chaque réponse est désormais enregistrée.",
        );
      }
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const data = new FormData(form);
      const body = saveBody(
        {
          email: String(data.get("email") ?? ""),
          consent: data.get("consent") === "on",
          news: data.get("news") === "on",
          website: String(data.get("website") ?? ""),
        },
        kind,
        current(),
      );
      const show = (status: number) => {
        const outcome = outcomeOf(status, "save");
        if (outcome.sent) return;
        error.textContent = outcome.message;
        error.hidden = false;
      };
      if (!body) return show(400);
      submit.disabled = true;
      const { status } = await api("POST", "/api/compte/sauvegarder", body);
      submit.disabled = false;
      if (status !== 202) return show(status);
      finish(
        `C'est enregistré. Le lien pour reprendre arrive à ${body.email}.`,
        "Ouvrez-le pour retrouver ce parcours, ici ou sur un autre appareil.",
      );
    });
  }
}
