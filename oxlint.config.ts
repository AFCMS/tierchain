import { defineConfig } from "oxlint";

export default defineConfig({
  ignorePatterns: ["dist", "artifacts", "coverage"],
  env: { browser: true },
  plugins: ["oxc", "typescript", "react", "react-perf", "import", "jsdoc", "jsx-a11y", "promise"],
  options: { typeAware: true },
  rules: {
    "react/exhaustive-deps": "warn",
    "react/rules-of-hooks": "error",
    "react/only-export-components": [
      "error",
      {
        allowConstantExport: true,
      },
    ],
  },
  categories: {
    correctness: "warn",
  },
});
