import type { SharedResult } from "../lib/shared-result";

/**
 * The e-mails the subscribe service sends, as plain text and HTML. The HTML keeps to inline
 * styles and tables-free blocks that mail clients render; colours are the site's tokens
 * (src/styles/global.css), written out because mail clients ignore CSS variables.
 */
export interface Mail {
  to: string;
  subject: string;
  text: string;
  html: string;
}

const SITE_FOOTER =
  "Là-bas est édité par Big Emotion · labas.africa. Nous ne vendons ni ne prêtons votre adresse.";

/** City names and lines come from the repository, but an apostrophe or « & » must still not break the markup. */
const escape = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const page = (inner: string, footer: string) =>
  `<!doctype html><html lang="fr"><body style="margin:0;background:#f1f0ff;font-family:Arial,sans-serif;color:#1d1b3a">
<div style="max-width:560px;margin:24px auto;background:#161a5c;color:#f1f0ff;border-radius:20px;padding:28px">
<p style="margin:0 0 16px;font-family:Georgia,serif;font-weight:900;font-size:32px">Là<span style="color:#ffb627">-</span>bas</p>
${inner}
</div>
<p style="max-width:560px;margin:0 auto 24px;font-size:13px;color:#4a4870">${escape(footer)}</p>
</body></html>`;

const button = (link: string, label: string) =>
  `<p><a href="${escape(link)}" style="display:inline-block;padding:14px 24px;border-radius:999px;background:#ffb627;color:#1d1b3a;font-weight:800;text-decoration:none">${escape(label)}</a></p>`;

const confirmButton = (link: string, outlined = false) =>
  `<p><a href="${escape(link)}" style="display:inline-block;padding:14px 24px;border-radius:999px;${
    outlined ? "border:2px solid #ffb627;color:#ffb627" : "background:#ffb627;color:#1d1b3a"
  };font-weight:800;text-decoration:none">Je confirme mon inscription</a></p>`;

export function confirmationEmail(to: string, link: string): Mail {
  return {
    to,
    subject: "Confirmez votre inscription aux nouveautés de Là-bas",
    text: `Bonjour,

Vous avez demandé à recevoir les nouveautés de Là-bas : nouvelles villes, questionnaire amélioré, un e-mail par mois au plus.

Pour confirmer, ouvrez ce lien :
${link}

Vous n'avez rien demandé ? Ignorez ce message : vous ne recevrez rien d'autre.

${SITE_FOOTER}`,
    html: page(
      `<p>Bonjour,</p>
<p>Vous avez demandé à recevoir les nouveautés de Là-bas : nouvelles villes, questionnaire amélioré, un e-mail par mois au plus. Pour confirmer, touchez le bouton.</p>
${confirmButton(link)}
<p style="color:#b4b8ea;font-size:15px">Vous n'avez rien demandé ? Ignorez ce message : vous ne recevrez rien d'autre.</p>`,
      SITE_FOOTER,
    ),
  };
}

/**
 * The reader's result, sent once at their request (approved mockup, 2026-11-16): profile, three
 * cities with their percentage and why they fit, and the result link. Never the answers. With
 * the news box ticked, the same e-mail carries the confirmation link instead of a second one.
 */
export function resultsEmail(
  to: string,
  result: SharedResult,
  resultLink: string,
  siteUrl: string,
  confirmLink?: string,
): Mail {
  const names = result.cities.map((c) => c.city.name).join(", ");
  const profileText = result.archetype
    ? [`Votre profil : ${result.archetype.name}. ${result.archetype.text}`, ""]
    : [];
  const citiesText = result.cities.flatMap((c, i) => [
    `${i + 1}. ${c.city.name} (${c.city.country}) · ${c.percent} %`,
    ...c.lines
      .filter((line) => !line.weak)
      .slice(0, 2)
      .map((line) => `   ${line.text}`),
    `   ${siteUrl}/ville/${c.city.slug}/`,
  ]);
  const confirmText = confirmLink
    ? [
        "",
        "Vous avez aussi demandé les nouveautés de Là-bas. Confirmez-le en ouvrant ce lien ; sans cela, vous ne recevrez rien d'autre :",
        confirmLink,
      ]
    : [];
  const footer = `Vous recevez cet e-mail parce que vous l'avez demandé sur labas.africa. Il contient votre profil et vos villes, jamais vos autres réponses. ${SITE_FOOTER}`;

  const citiesHtml = result.cities
    .map(
      (
        c,
        i,
      ) => `<div style="margin:0 0 10px;padding:14px 16px;border-radius:18px;background:#0e1145;border:${
        i === 0 ? "2px solid #ffb627" : "1px solid #262c86"
      }">
<p style="margin:0;font-family:Georgia,serif;font-size:20px;font-weight:700">${i + 1}. ${escape(c.city.name)} <span style="font-family:Arial,sans-serif;font-weight:400;font-size:15px;color:#b4b8ea">${escape(c.city.country)}</span> <span style="float:right;color:#ffb627">${c.percent} %</span></p>
${c.lines
  .filter((line) => !line.weak)
  .slice(0, 2)
  .map((line) => `<p style="margin:4px 0 0;font-size:15px;color:#b4b8ea">${escape(line.text)}</p>`)
  .join("")}
<p style="margin:6px 0 0"><a href="${siteUrl}/ville/${c.city.slug}/" style="color:#ffb627;font-weight:700">Voir la ville</a></p>
</div>`,
    )
    .join("\n");

  return {
    to,
    subject: `Vos villes d'Afrique : ${names}`,
    text: [
      "Bonjour, voici vos résultats, comme vous l'avez demandé.",
      "",
      ...profileText,
      "Vos villes d'Afrique :",
      ...citiesText,
      "",
      `Revoir mon résultat : ${resultLink}`,
      `Pour un classement plus fin, le questionnaire complet : ${siteUrl}/approfondir/`,
      ...confirmText,
      "",
      footer,
    ].join("\n"),
    html: page(
      `<p>Bonjour, voici vos résultats, comme vous l'avez demandé.</p>
${
  result.archetype
    ? `<p style="color:#b4b8ea;font-size:15px">Votre profil : <b style="color:#ffb627">${escape(result.archetype.name)}</b>. ${escape(result.archetype.text)}</p>`
    : ""
}
${citiesHtml}
<p><a href="${escape(resultLink)}" style="display:inline-block;padding:14px 24px;border-radius:999px;background:#ffb627;color:#1d1b3a;font-weight:800;text-decoration:none">Revoir mon résultat</a></p>
<p style="font-size:15px">Pour un classement plus fin : <a href="${siteUrl}/approfondir/" style="color:#ffb627">le questionnaire complet</a>.</p>
${
  confirmLink
    ? `<div style="margin-top:12px;padding:16px;border-radius:14px;border:1px dashed #b4b8ea">
<p style="margin:0">Vous avez aussi demandé les nouveautés de Là-bas. Confirmez-le en un clic ; sans cela, vous ne recevrez rien d'autre.</p>
${confirmButton(confirmLink, true)}
</div>`
    : ""
}`,
      footer,
    ),
  };
}

/** After « Reprendre plus tard »: the journey waits, unconfirmed, until this link is opened. */
export function saveLinkEmail(to: string, link: string): Mail {
  return {
    to,
    subject: "Votre lien pour reprendre sur Là-bas",
    text: `Bonjour, votre parcours est enregistré. Pour le reprendre là où vous en étiez, sur n'importe quel appareil, ouvrez ce lien :
${link}

Ce lien marche pendant 24 heures. Ensuite, ouvrez labas.africa et touchez « Mon espace » : un nouveau lien vous sera envoyé.

Vous n'avez rien demandé ? Ignorez ce message : sans clic de votre part, ce parcours est effacé sous 7 jours.

${SITE_FOOTER}`,
    html: page(
      `<p>Bonjour, votre parcours est enregistré. Touchez le bouton pour le reprendre là où vous en étiez, sur n'importe quel appareil.</p>
${button(link, "Reprendre mon parcours")}
<p style="color:#b4b8ea;font-size:15px">Ce lien marche pendant 24 heures. Ensuite, ouvrez labas.africa et touchez « Mon espace » : un nouveau lien vous sera envoyé.</p>
<p style="color:#b4b8ea;font-size:15px">Vous n'avez rien demandé ? Ignorez ce message : sans clic de votre part, ce parcours est effacé sous 7 jours.</p>`,
      SITE_FOOTER,
    ),
  };
}

/** From « Mon espace »: a short-lived, single-use link instead of a password. */
export function loginLinkEmail(to: string, link: string): Mail {
  return {
    to,
    subject: "Votre lien de connexion à Là-bas",
    text: `Bonjour, voici votre lien pour ouvrir Mon espace sur Là-bas :
${link}

Il marche 15 minutes, une seule fois. Vous n'avez rien demandé ? Ignorez ce message : personne ne peut se connecter sans ce lien.

${SITE_FOOTER}`,
    html: page(
      `<p>Bonjour, voici votre lien pour ouvrir Mon espace sur Là-bas.</p>
${button(link, "Ouvrir Mon espace")}
<p style="color:#b4b8ea;font-size:15px">Il marche 15 minutes, une seule fois. Vous n'avez rien demandé ? Ignorez ce message : personne ne peut se connecter sans ce lien.</p>`,
      SITE_FOOTER,
    ),
  };
}
