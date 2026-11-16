import type { SharedResult } from "./shared-result";

/**
 * The result as a 1080 × 1350 picture to post or send (beta feedback, 2026-11-16): the profile,
 * the three cities with their percentage and why they fit. Drawn in the reader's browser with
 * the site's own fonts and colour tokens, so nothing is sent anywhere to make it.
 */
const W = 1080;
const H = 1350;
const PAD = 80;

function token(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(`--${name}`).trim();
}

/** Splits text into lines that fit `width`, at most `max` of them, the last one ellipsed. */
function wrap(ctx: CanvasRenderingContext2D, text: string, width: number, max: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(" ")) {
    const tried = line ? `${line} ${word}` : word;
    if (ctx.measureText(tried).width <= width) line = tried;
    else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  if (lines.length > max) {
    lines.length = max;
    lines[max - 1] = `${lines[max - 1].replace(/\s+\S*$/, "")}…`;
  }
  return lines;
}

export async function resultImage(shared: SharedResult): Promise<Blob> {
  await document.fonts.ready;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const display = token("font-display");
  const body = token("font-body");
  const [night, deep, lift, thread, dim, saffron] = [
    "night",
    "night-deep",
    "night-lift",
    "thread",
    "thread-dim",
    "saffron",
  ].map(token);

  ctx.fillStyle = night;
  ctx.fillRect(0, 0, W, H);
  ctx.textBaseline = "alphabetic";

  ctx.fillStyle = thread;
  ctx.font = `900 56px ${display}`;
  ctx.fillText("là-bas", PAD, 120);

  let y = 220;
  if (shared.archetype) {
    ctx.fillStyle = dim;
    ctx.font = `700 26px ${body}`;
    ctx.fillText("MON PROFIL", PAD, y);
    ctx.fillStyle = saffron;
    ctx.font = `900 92px ${display}`;
    ctx.fillText(shared.archetype.name, PAD, (y += 96));
    ctx.fillStyle = thread;
    ctx.font = `400 34px ${body}`;
    for (const line of wrap(ctx, shared.archetype.text, W - 2 * PAD, 2))
      ctx.fillText(line, PAD, (y += 50));
    y += 70;
  }

  ctx.fillStyle = dim;
  ctx.font = `700 26px ${body}`;
  ctx.fillText("MES VILLES D'AFRIQUE", PAD, y);
  y += 30;
  const blockH = shared.archetype ? 210 : 260;
  shared.cities.slice(0, 3).forEach((entry, i) => {
    const top = y + i * (blockH + 16);
    ctx.fillStyle = deep;
    ctx.beginPath();
    ctx.roundRect(PAD, top, W - 2 * PAD, blockH, 28);
    ctx.fill();
    ctx.strokeStyle = i === 0 ? saffron : lift;
    ctx.lineWidth = i === 0 ? 4 : 2;
    ctx.stroke();
    const left = PAD + 36;
    ctx.fillStyle = saffron;
    ctx.font = `900 64px ${display}`;
    ctx.fillText(String(i + 1), left, top + 76);
    ctx.fillStyle = thread;
    ctx.fillText(entry.city.name, left + 64, top + 76);
    ctx.fillStyle = saffron;
    ctx.font = `800 52px ${body}`;
    const percent = `${entry.percent} %`;
    ctx.fillText(percent, W - PAD - 36 - ctx.measureText(percent).width, top + 74);
    ctx.fillStyle = dim;
    ctx.font = `400 28px ${body}`;
    ctx.fillText(entry.city.country, left + 64, top + 112);
    ctx.fillStyle = thread;
    ctx.font = `400 28px ${body}`;
    const why = entry.lines.length ? entry.lines.slice(0, 2) : [entry.city.tagline];
    why.forEach((line, j) => {
      const [first] = wrap(ctx, line, W - 2 * PAD - 72, 1);
      ctx.fillText(first, left, top + 156 + j * 36);
    });
  });

  ctx.fillStyle = dim;
  ctx.font = `400 30px ${body}`;
  ctx.fillText("Quelle ville d'Afrique vous ressemble ?", PAD, H - 90);
  ctx.fillStyle = saffron;
  ctx.font = `800 34px ${body}`;
  ctx.fillText("labas.africa", PAD, H - 44);

  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("no image"))), "image/png"),
  );
}
