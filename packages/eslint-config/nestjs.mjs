/**
 * ESLint configuration for NestJS (apps/api).
 * Extends the base config with Node.js + Jest globals and NestJS-specific rules.
 *
 * @see https://typescript-eslint.io/users/configs
 */
import eslint from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

/**
 * @param {Object} options
 * @param {string} options.tsconfigRootDir - Root directory for tsconfig resolution
 * @returns {import("typescript-eslint").ConfigArray}
 */
export function nestjsConfig({ tsconfigRootDir }) {
  return tseslint.config(
    // ── Ignores ──
    {
      name: "nestjs/ignores",
      ignores: [
        "eslint.config.mjs",
        "dist/**",
        "build/**",
        "node_modules/**",
        "coverage/**",
      ],
    },

    // ── Base rules ──
    eslint.configs.recommended,
    tseslint.configs.strictTypeChecked,
    tseslint.configs.stylisticTypeChecked,

    // ── Language options ──
    {
      name: "nestjs/language-options",
      languageOptions: {
        globals: {
          ...globals.node,
          ...globals.jest,
        },
        sourceType: "module",
        parserOptions: {
          projectService: true,
          tsconfigRootDir,
        },
      },
    },

    // ── Rules ──
    {
      name: "nestjs/rules",
      rules: {
        // ── Mejores prácticas ──
        "no-console": "warn",
        "prefer-const": "error",
        "no-var": "error",
        eqeqeq: ["error", "always"],
        curly: ["error", "all"],

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
        "@typescript-eslint/no-floating-promises": "error",
        "@typescript-eslint/no-misused-promises": "error",
        "@typescript-eslint/await-thenable": "error",
        "@typescript-eslint/restrict-template-expressions": [
          "error",
          { allowNumber: true, allowBoolean: true },
        ],

        // ── NestJS específico - Relajar reglas que chocan con decoradores ──
        "@typescript-eslint/no-extraneous-class": "off",
        "@typescript-eslint/no-unsafe-argument": "warn",
        "@typescript-eslint/no-unsafe-assignment": "warn",
        "@typescript-eslint/no-unsafe-member-access": "warn",
        "@typescript-eslint/no-unsafe-call": "warn",
        "@typescript-eslint/no-unsafe-return": "warn",
      },
    },

    // ── Test files - reglas relajadas ──
    {
      name: "nestjs/test-overrides",
      files: ["**/*.spec.ts", "**/*.e2e-spec.ts", "test/**/*.ts"],
      rules: {
        "no-console": "off",
        "@typescript-eslint/no-unsafe-assignment": "off",
        "@typescript-eslint/no-unsafe-member-access": "off",
        "@typescript-eslint/no-unsafe-call": "off",
        "@typescript-eslint/no-unsafe-argument": "off",
        "@typescript-eslint/no-floating-promises": "off",
        "@typescript-eslint/unbound-method": "off",
      },
    },
  );
}

export default nestjsConfig;
