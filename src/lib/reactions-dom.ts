import { api } from "./account-dom";
import { reactionEvent } from "./analytics";
import { track } from "./keep-dom";
import {
  initialOf,
  journeySummary,
  MARKS,
  markLabel,
  type MarkKey,
  ofCity,
  type Profile,
  type Reaction,
  reactionCount,
  reactionDate,
  replyCount,
  reviewsFound,
  type TopCity,
} from "./reactions";
import type { Found, Place } from "./review-search";

/**
 * The browser side of reactions (components/Reactions.astro): the thread on a city page, the
 * preview of the first city on a result page, the reviews of every city on /avis, and the forms
 * they share.
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

/** What /avis adds: names for every city, and the page's filters. */
export interface Everywhere {
  places: Record<string, Place>;
  /** The page to show and how many reviews the filters keep in all. */
  select: (reactions: Reaction[]) => { shown: Found[]; total: number };
  temperament: () => string | null;
  /** Every review loaded, for what the page builds around the list (the city list, the pages). */
  onDraw: (reactions: Reaction[]) => void;
}

interface Block {
  root: HTMLElement;
  city: string;
  cityName: string;
  link: string | null;
  reactions: Reaction[];
  shown: number;
  /** Reviews whose replies are open: a redraw after a tap must not fold them back. */
  open: Set<string>;
  everywhere?: Everywhere;
  signedIn?: Promise<boolean>;
}

const part = <T extends HTMLElement>(root: HTMLElement, name: string) =>
  root.querySelector<T>(`[data-${name}]`)!;
const fromTemplate = <T extends HTMLElement>(root: HTMLElement, name: string) =>
  part<HTMLTemplateElement>(root, name).content.firstElementChild!.cloneNode(true) as T;
const isPreview = (block: Block) => block.root.dataset.reactions === "preview";
/** Asked once per page: the answer only changes through a link that reloads it. */
const signedIn = (block: Block) =>
  (block.signedIn ??= api("GET", "/api/compte").then(({ status }) => status === 200));

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

/** Asked where the reader tapped: hearts need a space, so that one tap counts once. */
function askLogin(block: Block, slot: HTMLElement) {
  const form = fromTemplate<HTMLFormElement>(block.root, "login-template");
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = String(new FormData(form).get("email") ?? "").trim();
    if (!email) return;
    form.querySelector<HTMLButtonElement>("button")!.disabled = true;
    await api("POST", "/api/compte/lien", { email, back: location.pathname + location.search });
    part(form, "done").hidden = false;
  });
  slot.replaceChildren(form);
  form.querySelector("input")!.focus();
}

function marksRow(block: Block, reaction: Reaction, row: HTMLElement, slot: HTMLElement) {
  let all = false;
  const toggle = async (key: MarkKey) => {
    const { status, data } = await api("POST", `/api/compte/reactions/${reaction.id}/marques`, {
      mark: key,
    });
    if (status === 401) return askLogin(block, slot);
    if (status !== 200) return;
    reaction.marks = data.marks;
    reaction.myMarks = data.mine;
    all = false;
    paint();
  };
  // The heart always shows; the others only once someone left them, or on « + ».
  const paint = () => {
    const shown = MARKS.filter((m) => m.key === "coeur" || all || reaction.marks[m.key]);
    const buttons = shown.map((mark) => {
      const count = reaction.marks[mark.key] ?? 0;
      const mine = reaction.myMarks.includes(mark.key);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "mark";
      button.setAttribute("aria-pressed", String(mine));
      button.setAttribute("aria-label", markLabel(mark.key, count, mine));
      button.title = mark.label;
      const emoji = document.createElement("span");
      emoji.setAttribute("aria-hidden", "true");
      emoji.textContent = mark.emoji;
      button.append(emoji);
      if (count) button.append(document.createTextNode(String(count)));
      button.addEventListener("click", () => toggle(mark.key));
      return button;
    });
    const more = document.createElement("button");
    more.type = "button";
    more.className = "mark more-marks";
    more.textContent = all ? "−" : "+";
    more.setAttribute("aria-label", all ? "Moins de réactions" : "Autres réactions");
    more.setAttribute("aria-expanded", String(all));
    more.hidden = !all && shown.length === MARKS.length;
    more.addEventListener("click", () => {
      all = !all;
      paint();
    });
    row.replaceChildren(...buttons, more);
  };
  paint();
}

function replyForm(block: Block, review: Reaction, to: Reaction, slot: HTMLElement) {
  const form = fromTemplate<HTMLFormElement>(block.root, "reply-template");
  const error = part(form, "error");
  part(form, "replying").textContent = `En réponse à ${to.name}`;
  signedIn(block).then((yes) => (part(form, "email-field").hidden = yes));
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const isMember = await signedIn(block);
    const body = {
      replyTo: to.id,
      text: String(data.get("text") ?? "").trim(),
      name: String(data.get("name") ?? "").trim(),
      email: isMember ? undefined : String(data.get("email") ?? "").trim(),
      website: String(data.get("website") ?? ""),
      back: location.pathname + location.search,
    };
    error.hidden = true;
    if (!body.text) {
      error.textContent = "Écrivez votre réponse avant d'envoyer.";
      error.hidden = false;
      return;
    }
    const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]')!;
    submit.disabled = true;
    const { status, data: answer } = await api("POST", "/api/compte/reactions", body);
    submit.disabled = false;
    if (status === 201) {
      review.replies = [...(review.replies ?? []), answer.reaction];
      block.open.add(review.id);
      draw(block);
      return;
    }
    if (status === 202) {
      const pending = document.createElement("p");
      pending.className = "pending";
      pending.setAttribute("role", "status");
      pending.textContent = `Votre réponse est en attente. Pour la publier, ouvrez le lien que nous venons d'envoyer à ${body.email}. Il vous connecte aussi.`;
      slot.replaceChildren(pending);
      return;
    }
    error.textContent =
      status === 400
        ? "Vérifiez votre adresse e-mail et la longueur du texte, puis réessayez."
        : status === 429
          ? "Trop de messages d'un coup. Réessayez dans une heure."
          : "La réponse n'est pas partie. Réessayez dans un moment.";
    error.hidden = false;
  });
  slot.replaceChildren(form);
  form.querySelector("textarea")!.focus();
}

/** `review` is the first review of the thread when `reaction` is one of its replies. */
function itemFor(block: Block, reaction: Reaction, review: Reaction = reaction): HTMLElement {
  const item = fromTemplate(block.root, "item");
  const isReply = review !== reaction;
  item.classList.toggle("reply", isReply);
  item.querySelector(".avatar")!.textContent = initialOf(reaction.name);
  item.querySelector(".who")!.textContent = reaction.name;
  const time = item.querySelector("time")!;
  time.dateTime = reaction.createdAt;
  time.textContent = reactionDate(reaction.createdAt, Date.now());
  const place = block.everywhere?.places[reaction.city];
  if (place && !isReply) {
    const where = part<HTMLAnchorElement>(item, "where");
    where.href = `/ville/${place.slug}/`;
    where.textContent = `${place.name}, ${place.country}`;
    where.hidden = false;
  }
  if (reaction.mention) {
    const mention = part(item, "mention");
    mention.textContent = `En réponse à ${reaction.mention}`;
    mention.hidden = false;
  }
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
  const slot = part(item, "slot");
  marksRow(block, reaction, part(item, "marks"), slot);

  // Two levels: the replies of a review, and a reply's « Répondre » writes under the same review.
  const answer = part<HTMLButtonElement>(item, "reply");
  const replies = part<HTMLOListElement>(item, "replies");
  if (isReply) {
    answer.textContent = "Répondre";
    answer.addEventListener("click", () => {
      const thread = item.closest<HTMLElement>(".reaction:not(.reply)")!;
      replyForm(block, review, reaction, part(thread, "slot"));
    });
  } else {
    const count = reaction.replies?.length ?? 0;
    answer.textContent = replyCount(count);
    const open = block.open.has(reaction.id);
    answer.setAttribute("aria-expanded", String(open));
    replies.replaceChildren(...(reaction.replies ?? []).map((r) => itemFor(block, r, reaction)));
    replies.hidden = !open || count === 0;
    answer.addEventListener("click", () => {
      const opening = !block.open.has(reaction.id);
      if (opening) block.open.add(reaction.id);
      else block.open.delete(reaction.id);
      answer.setAttribute("aria-expanded", String(opening));
      replies.hidden = !opening || count === 0;
      if (opening) replyForm(block, reaction, reaction, slot);
      else slot.replaceChildren();
    });
  }

  const report = item.querySelector<HTMLButtonElement>("[data-report]")!;
  const remove = item.querySelector<HTMLButtonElement>("[data-delete]")!;
  report.hidden = reaction.mine;
  remove.hidden = !reaction.mine;
  report.addEventListener("click", async () => {
    const { status } = await api("POST", `/api/compte/reactions/${reaction.id}/signaler`);
    // A report counts once per reader, so it needs a space, like hearts.
    if (status === 401) return askLogin(block, slot);
    if (status !== 202) return;
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
    if (isReply) review.replies = review.replies?.filter((r) => r.id !== reaction.id);
    else block.reactions = block.reactions.filter((r) => r.id !== reaction.id);
    draw(block);
  });
  return item;
}

function farther(temperament: string): HTMLElement {
  const line = document.createElement("li");
  line.className = "farther";
  line.textContent = `Moins proches du tempérament ${temperament}`;
  return line;
}

function draw(block: Block) {
  const { root, reactions, everywhere } = block;
  const preview = isPreview(block);
  // /avis pages its list itself; the other places show more on « Voir plus ».
  const selected = everywhere?.select(reactions);
  const found = selected ? selected.shown : reactions.map((review) => ({ review, close: true }));
  const visible = selected ? found : found.slice(0, preview ? PREVIEW : block.shown);
  part(root, "count").textContent = selected
    ? reviewsFound(selected.total, reactions.length)
    : reactionCount(reactions.length);
  const temperament = everywhere?.temperament();
  part(root, "list").replaceChildren(
    ...visible.flatMap(({ review, close }, i) => {
      const item = itemFor(block, review);
      const first = !close && temperament && (i === 0 || visible[i - 1].close);
      return first ? [farther(temperament), item] : [item];
    }),
  );
  // « Lire la suite » only where the text is really cut, measured once the block is laid out.
  requestAnimationFrame(() => {
    for (const item of root.querySelectorAll<HTMLElement>(".reaction:not(.open)")) {
      const text = item.querySelector<HTMLElement>(".text")!;
      item.querySelector<HTMLElement>("[data-read-more]")!.hidden =
        text.scrollHeight <= text.clientHeight + 2;
    }
  });
  part(root, "empty").hidden = (selected?.total ?? found.length) > 0;
  part(root, "more").hidden = preview || Boolean(selected) || visible.length >= found.length;
  everywhere?.onDraw(reactions);
  if (everywhere) return;
  for (const name of root.querySelectorAll("[data-name]")) name.textContent = block.cityName;
  part(root, "of").textContent = ofCity(block.cityName);
  const all = root.querySelector<HTMLAnchorElement>("[data-all]");
  if (all) {
    all.href = `/ville/${block.city}/#reactions`;
    all.textContent = reactions.length
      ? `Voir toutes les réactions (${reactions.length})`
      : `Voir la page ${ofCity(block.cityName)}`;
    all.onclick = () => track(reactionEvent("Réactions consultées", "preview", block.city));
  }
}

async function load(block: Block): Promise<boolean> {
  const query = block.everywhere ? "" : `?ville=${encodeURIComponent(block.city)}`;
  const { status, data } = await api("GET", `/api/compte/reactions${query}`);
  if (status !== 200) return false;
  block.reactions = data.reactions;
  draw(block);
  return true;
}

const placeOf = (root: HTMLElement) =>
  root.dataset.reactions === "preview" ? ("preview" as const) : ("thread" as const);

function wireForm(block: Block) {
  const { root } = block;
  const open = part<HTMLButtonElement>(root, "open");
  const form = part<HTMLFormElement>(root, "form");
  const error = part(root, "error");
  const pending = part(root, "pending");
  const emailField = part(root, "email-field");
  const topField = part(root, "top-field");
  const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]')!;
  let member = false;

  open.addEventListener("click", async () => {
    form.hidden = !form.hidden;
    open.setAttribute("aria-expanded", String(!form.hidden));
    if (form.hidden) return;
    track(reactionEvent("Réaction : formulaire ouvert", placeOf(root), block.city));
    pending.hidden = true;
    topField.hidden = !block.link;
    form.querySelector("textarea")!.focus();
    // Signed in already: the address was confirmed once, the reaction goes online at once.
    member = await signedIn(block);
    emailField.hidden = member;
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const body = {
      city: block.city,
      text: String(data.get("text") ?? "").trim(),
      name: String(data.get("name") ?? "").trim(),
      email: member ? undefined : String(data.get("email") ?? "").trim(),
      link: block.link ?? undefined,
      private: data.get("private") === "on",
      website: String(data.get("website") ?? ""),
      // A result page cannot be redrawn from a link (the quick quiz starts over): the city page
      // shows the published reaction wherever it was written.
      back: isPreview(block) ? `/ville/${block.city}/#reactions` : `${location.pathname}#reactions`,
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
    if (status === 201 || status === 202)
      track(reactionEvent("Réaction envoyée", placeOf(root), block.city, status === 201));
    if (status === 201) {
      block.reactions = [{ ...answer.reaction, replies: [] }, ...block.reactions];
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

const newBlock = (root: HTMLElement, fields: Partial<Block>): Block => ({
  root,
  city: "",
  cityName: "",
  link: null,
  reactions: [],
  shown: PAGE,
  open: new Set(),
  ...fields,
});

function wireMore(block: Block) {
  part(block.root, "more").addEventListener("click", () => {
    block.shown += PAGE;
    draw(block);
  });
}

/** The full thread on a city page. */
export async function mountThread(root: HTMLElement) {
  const block = newBlock(root, {
    city: root.dataset.city!,
    cityName: root.dataset.cityName!,
    link: lastResult(),
  });
  wireMore(block);
  wireForm(block);
  root.hidden = !(await load(block));
}

/** The reviews of every city on /avis; `redraw` after each change of filter. */
export async function mountEverywhere(root: HTMLElement, everywhere: Everywhere) {
  const block = newBlock(root, { everywhere });
  wireMore(block);
  root.hidden = !(await load(block));
  return {
    loaded: !root.hidden,
    redraw() {
      block.shown = PAGE;
      draw(block);
    },
  };
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
    previewBlock = newBlock(root, { link, shown: PREVIEW });
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
    link.onclick = () => track(reactionEvent("Réactions consultées", "card", city.slug));
    link.hidden = false;
  }
}
