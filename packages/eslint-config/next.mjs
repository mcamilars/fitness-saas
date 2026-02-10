/**
 * ESLint configuration for Next.js (apps/web).
 * Extends eslint-config-next with additional TypeScript and best-practice rules.
 *
 * NOTE: eslint-config-next must be installed in the consuming package.
 *
 * @see https://nextjs.org/docs/app/api-reference/config/eslint
 */
import { defineConfig, globalIgnores } from "eslint/config";

/**
 * @param {Object} options
 * @param {Array} options.nextVitals - eslint-config-next/core-web-vitals spread
 * @param {Array} options.nextTs - eslint-config-next/typescript spread
 * @returns {import("eslint").Linter.Config[]}
 */
export function nextConfig({ nextVitals, nextTs }) {
  return defineConfig([
    // ── Next.js presets ──
    ...nextVitals,
    ...nextTs,

    // ── Global ignores ──
    globalIgnores([
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "node_modules/**",
      "coverage/**",
    ]),

    // ── Reglas adicionales ──
    {
      name: "next/custom-rules",
      rules: {
        // ── Mejores prácticas ──
        "prefer-const": "error",
        "no-var": "error",
        eqeqeq: ["error", "always"],
        curly: ["error", "all"],
        "no-console": "warn",

        // ── React ──
        "react/self-closing-comp": "warn",
        "react/jsx-no-target-blank": "error",

        // ── Import/export ──
        "import/no-anonymous-default-export": "warn",
      },
    },
  ]);
}

export default nextConfig;
