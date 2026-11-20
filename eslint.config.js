import js from "@eslint/js";
import tseslint from "typescript-eslint";
import astro from "eslint-plugin-astro";
import globals from "globals";

export default [
  // .claude/worktrees holds other sessions' checkouts with their own build output: linting them
  // from here made `make check` fail on code this branch never touched.
  { ignores: ["dist/", "dist-server/", ".astro/", "node_modules/", ".claude/"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs.recommended,
  { languageOptions: { globals: { ...globals.browser, ...globals.node } } },
];
