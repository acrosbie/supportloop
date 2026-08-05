import { defineConfig } from "vitest/config";

// The eval gate runs separately from the unit tests so it shows up as its own
// CI step. Both fail the build; keeping them apart means a red run says which
// kind of thing broke without opening the log.
export default defineConfig({
  test: {
    environment: "node",
    include: ["lib/**/*.eval.ts"],
  },
});
