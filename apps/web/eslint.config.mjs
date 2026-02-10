/**
 * ESLint configuration for the Next.js web app.
 * Uses @repo/eslint-config/next shared configuration.
 */
import { nextConfig } from "@repo/eslint-config/next";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default nextConfig({
  nextVitals,
  nextTs,
});
