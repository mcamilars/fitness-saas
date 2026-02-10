/**
 * ESLint configuration for the NestJS API.
 * Uses @repo/eslint-config/nestjs shared configuration.
 */
import { nestjsConfig } from "@repo/eslint-config/nestjs";

export default nestjsConfig({
  tsconfigRootDir: import.meta.dirname,
});
