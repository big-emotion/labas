// Queues Plausible events until its script has loaded. A file rather than an inline script, so
// the Content-Security-Policy can forbid every inline script (deploy/nginx.conf).
window.plausible =
  window.plausible ||
  function (...args) {
    // Plausible replays this queue with apply(), so an array works like `arguments`.
    (window.plausible.q = window.plausible.q || []).push(args);
  };
