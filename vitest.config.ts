import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    // The path tests replay the adaptive quiz, which re-ranks all 115 cities for every candidate
    // question: about 6 s alone, more when the whole suite runs in parallel. The default 5 s made
    // them fail at random (audit 2026-11-18); 30 s still catches a test that hangs.
    testTimeout: 30_000,
  },
});
