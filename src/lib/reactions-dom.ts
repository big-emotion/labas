import { pageLocale, type Bilingual } from "../i18n/locale";
import { tapsLabel } from "./taps";
import { loadedTaps } from "./taps-dom";
import { cityName } from "../i18n/places";
import { pathFor } from "../i18n/routes";
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
  profileIn,
  type Reaction,
  reactionCount,
  reactionDate,
  replyCount,
  reviewsFound,
  shownName,
  temperamentName,
  type TopCity,
  translationNote,
} from "./reactions";
import type { Found, Place } from "./review-search";

/**
 * The browser side of reactions (components/Reactions.astro): the thread on a city page, the
 * preview of the first city on a result page, the reviews of every city on /avis, and the forms
 * they share.
 */

/** Scripts run on built pages only, whose `<html lang>` names the language. */
const locale = pageLocale();
const cityPage = (slug: string) => pathFor("city", locale, slug);

const COPY = {
  fr: {
    outOf100: (name: string, range: string, value: number) =>
      `${name} : ${range}, ${value} sur 100`,
    fewerMarks: "Moins de réactions",
    moreMarks: "Autres réactions",
    replyingTo: (name: string) => `En réponse à ${name}`,
    writeReply: "Écrivez votre réponse avant d'envoyer.",
    replyPending: "Merci ! L'équipe relit votre réponse avant de la mettre en ligne.",
    checkForm: "Vérifiez la longueur du texte, puis réessayez.",
    tooManyReplies: "Trop de messages d'un coup. Réessayez dans une heure.",
    replyFailed: "La réponse n'est pas partie. Réessayez dans un moment.",
    reduce: "Réduire",
    readMore: "Lire la suite",
    reply: "Répondre",
    reported: "Signalée, merci",
    reallyDelete: "Supprimer pour de bon ?",
    farther: (name: string) => `Moins proches du profil ${name}`,
    allReactions: (total: number) => `Voir toutes les infos (${total})`,
    cityPage: (name: string) => `Voir la page ${ofCity(name)}`,
    of: (name: string) => name,
    writeReaction: "Écrivez votre information avant d'envoyer.",
    reactionPending:
      "Merci ! L'équipe relit votre information avant de la mettre en ligne : elle aidera les prochains.",
    tooManyReactions: "Trop de messages d'un coup. Réessayez dans une heure.",
    reactionFailed: "Le message n'est pas parti. Réessayez dans un moment.",
    reactOn: (name: string) => `Laisser une info utile sur ${name}`,
    translate: "Traduire",
    original: "Voir l'original",
    translationFailed: "La traduction n'a pas marché. Réessayez dans un moment.",
  },
  en: {
    outOf100: (name: string, range: string, value: number) =>
      `${name}: ${range}, ${value} out of 100`,
    fewerMarks: "Fewer reactions",
    moreMarks: "Other reactions",
    replyingTo: (name: string) => `Replying to ${name}`,
    writeReply: "Write your reply before sending.",
    replyPending: "Thank you! The team reads your reply before it goes online.",
    checkForm: "Check the length of the text, then try again.",
    tooManyReplies: "Too many messages at once. Try again in an hour.",
    replyFailed: "The reply didn't go through. Try again in a moment.",
    reduce: "Show less",
    readMore: "Read more",
    reply: "Reply",
    reported: "Reported, thank you",
    reallyDelete: "Delete for good?",
    farther: (name: string) => `Further from the ${name} profile`,
    allReactions: (total: number) => `See all tips (${total})`,
    cityPage: (name: string) => `See the ${name} page`,
    of: (name: string) => name,
    writeReaction: "Write what you know before sending.",
    reactionPending:
      "Thank you! The team reads what you wrote before it goes online: it will help the next person.",
    tooManyReactions: "Too many messages at once. Try again in an hour.",
    reactionFailed: "The message didn't go through. Try again in a moment.",
    reactOn: (name: string) => `Share something useful about ${name}`,
    translate: "Translate",
    original: "Show original",
    translationFailed: "The translation didn't work. Try again in a moment.",
  },
} satisfies Bilingual<Record<string, unknown>>;
const copy = COPY[locale];

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
  /** The service says whether a DeepL key is set; without one, no « Traduire » button. */
  translatable: boolean;
}

const part = <T extends HTMLElement>(root: HTMLElement, name: string) =>
  root.querySelector<T>(`[data-${name}]`)!;
const fromTemplate = <T extends HTMLElement>(root: HTMLElement, name: string) =>
  part<HTMLTemplateElement>(root, name).content.firstElementChild!.cloneNode(true) as T;
const isPreview = (block: Block) => block.root.dataset.reactions === "preview";

function topChips(top: TopCity[]): HTMLElement[] {
  return top.map((city, i) => {
    const item = document.createElement("li");
    const link = document.createElement("a");
    link.href = cityPage(city.slug);
    const place = document.createElement("span");
    place.className = "place";
    place.textContent = String(i + 1);
    const percent = document.createElement("small");
    percent.textContent = `${city.percent}\u202f%`;
    link.append(place, document.createTextNode(cityName(city.name, locale)), percent);
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
      copy.outOf100(trait.name, trait.range, Math.round(trait.value * 100)),
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
    await api("POST", "/api/compte/lien", {
      email,
      back: location.pathname + location.search,
      locale,
    });
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
      button.setAttribute("aria-label", markLabel(mark.key, count, mine, locale));
      button.title = mark.label[locale];
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
    more.setAttribute("aria-label", all ? copy.fewerMarks : copy.moreMarks);
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
  part(form, "replying").textContent = copy.replyingTo(shownName(to.name, locale));
  const openedAt = Date.now();
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const body = {
      replyTo: to.id,
      text: String(data.get("text") ?? "").trim(),
      name: String(data.get("name") ?? "").trim(),
      website: String(data.get("website") ?? ""),
      elapsed: Date.now() - openedAt,
      back: location.pathname + location.search,
      locale,
    };
    error.hidden = true;
    if (!body.text) {
      error.textContent = copy.writeReply;
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
      pending.textContent = copy.replyPending;
      slot.replaceChildren(pending);
      return;
    }
    error.textContent =
      status === 400 ? copy.checkForm : status === 429 ? copy.tooManyReplies : copy.replyFailed;
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
  const name = shownName(reaction.name, locale);
  item.querySelector(".avatar")!.textContent = initialOf(name);
  item.querySelector(".who")!.textContent = name;
  const time = item.querySelector("time")!;
  time.dateTime = reaction.createdAt;
  time.textContent = reactionDate(reaction.createdAt, Date.now(), locale);
  const place = block.everywhere?.places[reaction.city];
  if (place && !isReply) {
    const where = part<HTMLAnchorElement>(item, "where");
    where.href = cityPage(place.slug);
    const taps = tapsLabel(loadedTaps(place.slug), locale);
    where.textContent = `${place.name}, ${place.country}${taps ? ` · ${taps}` : ""}`;
    where.hidden = false;
  }
  if (reaction.mention) {
    const mention = part(item, "mention");
    mention.textContent = copy.replyingTo(shownName(reaction.mention, locale));
    mention.hidden = false;
  }
  // textContent, never HTML: a reaction is the readers' text, shown as typed.
  item.querySelector(".text")!.textContent = reaction.text;
  if (block.translatable) wireTranslation(block, reaction, item);
  const readMore = item.querySelector<HTMLButtonElement>("[data-read-more]")!;
  readMore.addEventListener("click", () => {
    const open = item.classList.toggle("open");
    readMore.textContent = open ? copy.reduce : copy.readMore;
    readMore.setAttribute("aria-expanded", String(open));
  });
  if (reaction.top || reaction.profile) {
    const journey = item.querySelector<HTMLElement>(".journey")!;
    const summary = item.querySelector<HTMLButtonElement>("[data-summary]")!;
    const line = journeySummary(reaction.top, reaction.profile, locale);
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
      const shown = profileIn(reaction.profile, locale);
      const profile = item.querySelector<HTMLElement>(".profile")!;
      profile.hidden = false;
      profile.querySelector("b")!.textContent = shown.name;
      profile.querySelector(".traits")!.replaceChildren(...traitRows(shown));
    }
  }
  const slot = part(item, "slot");
  marksRow(block, reaction, part(item, "marks"), slot);

  // Two levels: the replies of a review, and a reply's « Répondre » writes under the same review.
  const answer = part<HTMLButtonElement>(item, "reply");
  const replies = part<HTMLOListElement>(item, "replies");
  if (isReply) {
    answer.textContent = copy.reply;
    answer.addEventListener("click", () => {
      const thread = item.closest<HTMLElement>(".reaction:not(.reply)")!;
      replyForm(block, review, reaction, part(thread, "slot"));
    });
  } else {
    const count = reaction.replies?.length ?? 0;
    answer.textContent = replyCount(count, locale);
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
    report.textContent = copy.reported;
    report.disabled = true;
  });
  // Two taps instead of a browser dialog: the first one only asks.
  remove.addEventListener("click", async () => {
    if (remove.dataset.armed !== "true") {
      remove.dataset.armed = "true";
      remove.textContent = copy.reallyDelete;
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

/**
 * « Traduire » under a review or reply: the service looks the review up by its id and asks DeepL
 * once per language (docs/accounts.md), so the page never sends the text itself. The answer is
 * kept on the reaction, so a redraw or a second tap asks nothing again.
 */
const translations = new Map<string, Promise<{ text: string; detectedSource: string } | null>>();

function wireTranslation(block: Block, reaction: Reaction, item: HTMLElement) {
  const row = part(item, "translation");
  const note = part(row, "translation-note");
  const button = part<HTMLButtonElement>(row, "translate");
  const text = item.querySelector<HTMLElement>(".text")!;
  let translated = false;
  row.hidden = false;
  button.addEventListener("click", async () => {
    if (translated) {
      translated = false;
      text.textContent = reaction.text;
      text.lang = "";
      note.textContent = "";
      button.textContent = copy.translate;
      return;
    }
    button.disabled = true;
    if (!translations.has(reaction.id))
      translations.set(
        reaction.id,
        api("POST", `/api/compte/reactions/${reaction.id}/traduction`, { target: locale }).then(
          ({ status, data }) => {
            // No key after all: the button goes, on every review of the page.
            if (status === 503) block.translatable = false;
            return status === 200 ? data : null;
          },
        ),
      );
    const answer = await translations.get(reaction.id)!;
    button.disabled = false;
    if (!answer) {
      translations.delete(reaction.id);
      if (!block.translatable) row.hidden = true;
      else note.textContent = copy.translationFailed;
      return;
    }
    note.textContent = translationNote(answer.detectedSource, locale);
    if (answer.detectedSource === locale) {
      button.hidden = true;
      return;
    }
    track(reactionEvent("Réaction traduite", placeOf(block.root), reaction.city));
    translated = true;
    text.textContent = answer.text;
    text.lang = locale;
    button.textContent = copy.original;
  });
}

function farther(temperament: string): HTMLElement {
  const line = document.createElement("li");
  line.className = "farther";
  line.textContent = copy.farther(temperamentName(temperament, locale));
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
    ? reviewsFound(selected.total, reactions.length, locale)
    : reactionCount(reactions.length, locale);
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
  part(root, "of").textContent = copy.of(block.cityName);
  const all = root.querySelector<HTMLAnchorElement>("[data-all]");
  if (all) {
    all.href = `${cityPage(block.city)}#reactions`;
    all.textContent = reactions.length
      ? copy.allReactions(reactions.length)
      : copy.cityPage(block.cityName);
    all.onclick = () => track(reactionEvent("Réactions consultées", "preview", block.city));
  }
}

async function load(block: Block): Promise<boolean> {
  const query = block.everywhere ? "" : `?ville=${encodeURIComponent(block.city)}`;
  const { status, data } = await api("GET", `/api/compte/reactions${query}`);
  if (status !== 200) return false;
  block.reactions = data.reactions;
  block.translatable = data.translate === true;
  draw(block);
  return true;
}

const placeOf = (root: HTMLElement) =>
  root.dataset.reactions === "preview"
    ? ("preview" as const)
    : root.dataset.reactions === "everywhere"
      ? ("everywhere" as const)
      : ("thread" as const);

function wireForm(block: Block) {
  const { root } = block;
  const open = part<HTMLButtonElement>(root, "open");
  const form = part<HTMLFormElement>(root, "form");
  const error = part(root, "error");
  const pending = part(root, "pending");
  const topField = part(root, "top-field");
  const text = form.querySelector("textarea")!;
  const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]')!;
  // Sent with the form: a person takes seconds to write, a script posts at once (server side).
  let openedAt = Date.now();

  for (const starter of form.querySelectorAll<HTMLButtonElement>("[data-starter]"))
    starter.addEventListener("click", () => {
      const start = starter.dataset.starter!;
      text.value = text.value.trim() ? `${text.value.trimEnd()}\n${start}` : start;
      text.focus();
      text.setSelectionRange(text.value.length, text.value.length);
    });

  open.addEventListener("click", async () => {
    form.hidden = !form.hidden;
    open.setAttribute("aria-expanded", String(!form.hidden));
    if (form.hidden) return;
    track(reactionEvent("Réaction : formulaire ouvert", placeOf(root), block.city));
    pending.hidden = true;
    topField.hidden = !block.link;
    openedAt = Date.now();
    text.focus();
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const body = {
      city: block.city,
      text: String(data.get("text") ?? "").trim(),
      name: String(data.get("name") ?? "").trim(),
      link: block.link ?? undefined,
      private: data.get("private") === "on",
      website: String(data.get("website") ?? ""),
      elapsed: Date.now() - openedAt,
      // A result page cannot be redrawn from a link (the quick quiz starts over): the city page
      // shows the published reaction wherever it was written.
      back: isPreview(block)
        ? `${cityPage(block.city)}#reactions`
        : `${location.pathname}#reactions`,
      locale,
    };
    error.hidden = true;
    if (!body.text) {
      error.textContent = copy.writeReaction;
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
      pending.textContent = copy.reactionPending;
      pending.hidden = false;
      return;
    }
    error.textContent =
      status === 400
        ? copy.checkForm
        : status === 429
          ? copy.tooManyReactions
          : copy.reactionFailed;
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
  translatable: false,
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
  previewBlock.cityName = cityName(city.name, locale);
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
    link.href = `${cityPage(city.slug)}#reactions`;
    link.textContent = total
      ? reactionCount(total, locale)
      : copy.reactOn(cityName(city.name, locale));
    link.onclick = () => track(reactionEvent("Réactions consultées", "card", city.slug));
    link.hidden = false;
  }
}
