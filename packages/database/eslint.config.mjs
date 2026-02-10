/**
 * ESLint configuration for the @repo/database package.
 * Uses a lighter config since this is primarily Prisma-generated code.
 */
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  // ── Ignores ──
  {
    name: "database/ignores",
    ignores: [
      "eslint.config.mjs",
      "dist/**",
      "node_modules/**",
      "prisma/migrations/**",
    ],
  },

  // ── Base rules ──
  eslint.configs.recommended,
  tseslint.configs.recommended,

  // ── Language options ──
  {
    name: "database/language-options",
    languageOptions: {
      sourceType: "module",
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // ── Rules ──
  {
    name: "database/rules",
    rules: {
      "prefer-const": "error",
      "no-var": "error",
      eqeqeq: ["error", "always"],
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/consistent-type-imports": [
        "warn",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
    },
  },
);
