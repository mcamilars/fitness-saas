process.env.DATABASE_URL =
  process.env.DATABASE_URL_TEST ??
  'postgresql://postgres:pepeperoni123@localhost:5433/fitness_saas_test';

process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-jwt-secret-e2e';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '2h';
process.env.MAILTRAP_HOST = process.env.MAILTRAP_HOST ?? 'localhost';
process.env.MAILTRAP_PORT = process.env.MAILTRAP_PORT ?? '2525';
process.env.MAILTRAP_USER = process.env.MAILTRAP_USER ?? 'test';
process.env.MAILTRAP_PASS = process.env.MAILTRAP_PASS ?? 'test';
process.env.MAILTRAP_FROM = process.env.MAILTRAP_FROM ?? 'test@fitness-saas.local';
process.env.APP_URL = process.env.APP_URL ?? 'http://localhost:3000';
