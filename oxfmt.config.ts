import { defineConfig } from "oxfmt";

export default defineConfig({
  useTabs: false,
  tabWidth: 2,
  trailingComma: "all",
  singleQuote: false,
  semi: true,
  printWidth: 100,
  sortImports: true,
  sortPackageJson: true,
  sortTailwindcss: true,
  ignorePatterns: [],
});
