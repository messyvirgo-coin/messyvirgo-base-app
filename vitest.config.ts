import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "node:path";

export default defineConfig({
  plugins: [tsconfigPaths()],
  resolve: {
    alias: {
      "server-only": path.resolve(__dirname, "vitest.server-only.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["app/**/*.test.ts"],
  },
});
