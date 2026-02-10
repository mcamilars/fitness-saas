/**
 * Base ESLint configuration shared across all packages.
 * Uses ESLint 9 flat config with typescript-eslint.
 *
 * @see https://eslint.org/docs/latest/use/configure/configuration-files
 * @see https://typescript-eslint.io/getting-started/
 */
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

/**
 * Base rules applied to ALL TypeScript files in the monorepo.
 * Individual apps/packages extend this with their own specific configs.
 */
export const baseConfig = tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  {
    name: "repo/base-language-options",
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    name: "repo/base-rules",
    rules: {
      // ── Mejores prácticas ──
      "no-console": "warn",
      "prefer-const": "error",
      "no-var": "error",
      eqeqeq: ["error", "always"],
      curly: ["error", "all"],
      "no-throw-literal": "error",

      // ── TypeScript ──
      "@typescript-eslint/consistent-type-imports": [
        "warn",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-non-null-assertion": "warn",
      "@typescript-eslint/restrict-template-expressions": [
        "error",
        { allowNumber: true, allowBoolean: true },
      ],
    },
  },
);

export default baseConfig;
