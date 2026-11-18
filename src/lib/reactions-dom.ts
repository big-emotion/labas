import { api } from "./account-dom";
import {
  initialOf,
  journeySummary,
  ofCity,
  type Profile,
  type Reaction,
  reactionCount,
  reactionDate,
  type TopCity,
} from "./reactions";

/**
 * The browser side of reactions (components/Reactions.astro): the thread on a city page, the
 * preview of the first city on a result page, and the form both share.
 */

const PAGE = 10;
const PREVIEW = 3;
/** The last result link shown, so a reaction written on the city page still carries the journey. */
const LAST_RESULT = "labas.result-link";

function remember(link: string) {
  try {
    localStorage.setItem(LAST_RESULT, link);
  } catch {
    // Blocked storage: the city page simply has no journey to join.
  }
}
function lastResult(): string | null {
  try {
    return localStorage.getItem(LAST_RESULT);
  } catch {
    return null;
  }
}

interface Block {
  root: HTMLElement;
  city: string;
  cityName: string;
  link: string | null;
  reactions: Reaction[];
  shown: number;
}

const part = <T extends HTMLElement>(root: HTMLElement, name: string) =>
  root.querySelector<T>(`[data-${name}]`)!;

function topChips(top: TopCity[]): HTMLElement[] {
  return top.map((city, i) => {
    const item = document.createElement("li");
    const link = document.createElement("a");
    link.href = `/ville/${city.slug}/`;
    const place = document.createElement("span");
    place.className = "place";
    place.textContent = String(i + 1);
    const percent = document.createElement("small");
    percent.textContent = `${city.percent}\u202f%`;
    link.append(place, document.createTextNode(city.name), percent);
    item.append(link);
    return item;
  });
}

function traitRows(profile: Profile): HTMLElement[] {
  return profile.traits.map((trait) => {
    const item = document.createElement("li");
    const label = document.createElement("span");
    label.textContent = trait.name;
    label.title = trait.range;
    const meter = document.createElement("span");
    meter.className = "meter";
    meter.setAttribute(
      "aria-label",
      `${trait.name} : ${trait.range}, ${Math.round(trait.value * 100)} sur 100`,
    );
    const fill = document.createElement("i");
    fill.style.width = `${Math.max(8, Math.round(trait.value * 100))}%`;
    meter.append(fill);
    item.append(label, meter);
    return item;
  });
}

function itemFor(block: Block, reaction: Reaction): HTMLElement {
  const template = part<HTMLTemplateElement>(block.root, "item");
  const item = template.content.firstElementChild!.cloneNode(true) as HTMLElement;
  item.querySelector(".avatar")!.textContent = initialOf(reaction.name);
  item.querySelector(".who")!.textContent = reaction.name;
  const time = item.querySelector("time")!;
  time.dateTime = reaction.createdAt;
  time.textContent = reactionDate(reaction.createdAt, Date.now());
  // textContent, never HTML: a reaction is the readers' text, shown as typed.
  item.querySelector(".text")!.textContent = reaction.text;
  const readMore = item.querySelector<HTMLButtonElement>("[data-read-more]")!;
  readMore.addEventListener("click", () => {
    const open = item.classList.toggle("open");
    readMore.textContent = open ? "Réduire" : "Lire la suite";
    readMore.setAttribute("aria-expanded", String(open));
  });
  if (reaction.top || reaction.profile) {
    const journey = item.querySelector<HTMLElement>(".journey")!;
    const summary = item.querySelector<HTMLButtonElement>("[data-summary]")!;
    const line = journeySummary(reaction.top, reaction.profile);
    const show = (name: string, text: string | null) => {
      const part = summary.querySelector<HTMLElement>(`[data-${name}]`)!;
      part.hidden = !text;
      (part.lastElementChild ?? part).textContent = text ?? "";
    };
    show("first", line.first);
    show("temperament", line.temperament);
    show("others", line.more);
    summary.setAttribute("aria-label", line.label);
    summary.hidden = false;
    summary.addEventListener("click", () => {
      journey.hidden = !journey.hidden;
      summary.setAttribute("aria-expanded", String(!journey.hidden));
    });
    if (reaction.top) item.querySelector(".top")!.replaceChildren(...topChips(reaction.top));
    if (reaction.profile) {
      const profile = item.querySelector<HTMLElement>(".profile")!;
      profile.hidden = false;
      profile.querySelector("b")!.textContent = reaction.profile.name;
      profile.querySelector(".traits")!.replaceChildren(...traitRows(reaction.profile));
    }
  }
  const report = item.querySelector<HTMLButtonElement>("[data-report]")!;
  const remove = item.querySelector<HTMLButtonElement>("[data-delete]")!;
  report.hidden = reaction.mine;
  remove.hidden = !reaction.mine;
  report.addEventListener("click", async () => {
    await api("POST", `/api/compte/reactions/${reaction.id}/signaler`);
    report.textContent = "Signalée, merci";
    report.disabled = true;
  });
  // Two taps instead of a browser dialog: the first one only asks.
  remove.addEventListener("click", async () => {
    if (remove.dataset.armed !== "true") {
      remove.dataset.armed = "true";
      remove.textContent = "Supprimer pour de bon ?";
      return;
    }
    const { status } = await api("DELETE", `/api/compte/reactions/${reaction.id}`);
    if (status !== 200) return;
    block.reactions = block.reactions.filter((r) => r.id !== reaction.id);
    draw(block);
  });
  return item;
}

function draw(block: Block) {
  const { root, reactions } = block;
  const preview = root.dataset.reactions === "preview";
  const visible = reactions.slice(0, preview ? PREVIEW : block.shown);
  part(root, "count").textContent = reactionCount(reactions.length);
  part(root, "list").replaceChildren(...visible.map((r) => itemFor(block, r)));
  // « Lire la suite » only where the text is really cut, measured once the block is laid out.
  requestAnimationFrame(() => {
    for (const item of root.querySelectorAll<HTMLElement>(".reaction:not(.open)")) {
      const text = item.querySelector<HTMLElement>(".text")!;
      item.querySelector<HTMLElement>("[data-read-more]")!.hidden =
        text.scrollHeight <= text.clientHeight + 2;
    }
  });
  part(root, "empty").hidden = reactions.length > 0;
  part(root, "more").hidden = preview || visible.length >= reactions.length;
  for (const name of root.querySelectorAll("[data-name]")) name.textContent = block.cityName;
  part(root, "of").textContent = ofCity(block.cityName);
  const all = root.querySelector<HTMLAnchorElement>("[data-all]");
  if (all) {
    all.href = `/ville/${block.city}/#reactions`;
    all.textContent = reactions.length
      ? `Voir toutes les réactions (${reactions.length})`
      : `Voir la page ${ofCity(block.cityName)}`;
  }
}

async function load(block: Block): Promise<boolean> {
  const { status, data } = await api(
    "GET",
    `/api/compte/reactions?ville=${encodeURIComponent(block.city)}`,
  );
  if (status !== 200) return false;
  block.reactions = data.reactions;
  draw(block);
  return true;
}

function wireForm(block: Block) {
  const { root } = block;
  const open = part<HTMLButtonElement>(root, "open");
  const form = part<HTMLFormElement>(root, "form");
  const error = part(root, "error");
  const pending = part(root, "pending");
  const emailField = part(root, "email-field");
  const topField = part(root, "top-field");
  const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]')!;
  let signedIn = false;

  open.addEventListener("click", async () => {
    form.hidden = !form.hidden;
    open.setAttribute("aria-expanded", String(!form.hidden));
    if (form.hidden) return;
    pending.hidden = true;
    topField.hidden = !block.link;
    form.querySelector("textarea")!.focus();
    // Signed in already: the address was confirmed once, the reaction goes online at once.
    signedIn = (await api("GET", "/api/compte")).status === 200;
    emailField.hidden = signedIn;
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const body = {
      city: block.city,
      text: String(data.get("text") ?? "").trim(),
      name: String(data.get("name") ?? "").trim(),
      email: signedIn ? undefined : String(data.get("email") ?? "").trim(),
      link: block.link ?? undefined,
      private: data.get("private") === "on",
      website: String(data.get("website") ?? ""),
      // A result page cannot be redrawn from a link (the quick quiz starts over): the city page
      // shows the published reaction wherever it was written.
      back:
        root.dataset.reactions === "preview"
          ? `/ville/${block.city}/#reactions`
          : `${location.pathname}#reactions`,
    };
    error.hidden = true;
    if (!body.text) {
      error.textContent = "Écrivez votre réaction avant d'envoyer.";
      error.hidden = false;
      return;
    }
    submit.disabled = true;
    const { status, data: answer } = await api("POST", "/api/compte/reactions", body);
    submit.disabled = false;
    if (status === 201) {
      block.reactions = [answer.reaction, ...block.reactions];
      draw(block);
      form.reset();
      form.hidden = true;
      open.setAttribute("aria-expanded", "false");
      return;
    }
    if (status === 202) {
      form.reset();
      form.hidden = true;
      open.setAttribute("aria-expanded", "false");
      pending.textContent = `Votre réaction est en attente. Pour la publier, ouvrez le lien que nous venons d'envoyer à ${body.email}. Vous ne le ferez qu'une fois.`;
      pending.hidden = false;
      return;
    }
    error.textContent =
      status === 400
        ? "Vérifiez votre adresse e-mail et la longueur du texte, puis réessayez."
        : status === 429
          ? "Trop de réactions d'un coup. Réessayez dans une heure."
          : "La réaction n'est pas partie. Réessayez dans un moment.";
    error.hidden = false;
  });
}

/** The full thread on a city page. */
export async function mountThread(root: HTMLElement) {
  const block: Block = {
    root,
    city: root.dataset.city!,
    cityName: root.dataset.cityName!,
    link: lastResult(),
    reactions: [],
    shown: PAGE,
  };
  part(root, "more").addEventListener("click", () => {
    block.shown += PAGE;
    draw(block);
  });
  wireForm(block);
  root.hidden = !(await load(block));
}

let previewBlock: Block | null = null;

/**
 * The preview of the first city on a result page, called after every drawing of the result.
 * `put` places it inside the first card, under its pitch; the thread is
 * fetched again only when the first city changed.
 */
export async function showPreview(
  city: { slug: string; name: string },
  link: string | null,
  put: (root: HTMLElement) => void,
) {
  // Once placed, the block leaves the document each time the cards are redrawn: keep hold of it.
  const root =
    previewBlock?.root ?? document.querySelector<HTMLElement>('[data-reactions="preview"]');
  if (!root) return;
  root.id = "reactions-preview";
  if (link) remember(link);
  put(root);
  if (!previewBlock) {
    previewBlock = { root, city: "", cityName: "", link, reactions: [], shown: PREVIEW };
    wireForm(previewBlock);
  }
  previewBlock.link = link;
  if (previewBlock.city === city.slug) return;
  previewBlock.city = city.slug;
  previewBlock.cityName = city.name;
  root.hidden = !(await load(previewBlock));
}

const counts = new Map<string, Promise<number | null>>();
/** Fetched once per city and page: redrawing the cards after each answer asks nothing again. */
function countOf(slug: string) {
  if (!counts.has(slug))
    counts.set(
      slug,
      api("GET", `/api/compte/reactions?ville=${encodeURIComponent(slug)}`).then(
        ({ status, data }) => (status === 200 ? data.reactions.length : null),
      ),
    );
  return counts.get(slug)!;
}

/** A discreet link on the other cards: their own reactions, or an invitation to give one. */
export async function showCounts(
  cards: { city: { slug: string; name: string }; card: HTMLElement }[],
) {
  // No reactions block on the page means the accounts service is off: ask it nothing.
  if (!previewBlock && !document.querySelector("[data-reactions]")) return;
  for (const { city, card } of cards) {
    const link = card.querySelector<HTMLAnchorElement>(".card-reactions");
    if (!link) continue;
    const total = await countOf(city.slug);
    if (total === null) continue;
    link.href = `/ville/${city.slug}/#reactions`;
    link.textContent = total ? reactionCount(total) : `Réagir sur ${city.name}`;
    link.hidden = false;
  }
}
