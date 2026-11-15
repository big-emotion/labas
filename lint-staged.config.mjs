// Only staged files are checked before a commit; the full gate stays `make check`.
export default {
  "*.{ts,js,mjs,astro}": ["eslint --fix", "prettier --write"],
  "*.{json,md,css,yml,yaml}": ["prettier --write"],
};
