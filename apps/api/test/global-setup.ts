import { execSync } from 'child_process';
import path from 'path';

export default async function globalSetup() {
  const testDbUrl =
    process.env.DATABASE_URL_TEST ??
    'postgresql://postgres:pepeperoni123@localhost:5433/fitness_saas_test';

  // Create the test database if it doesn't exist
  execSync(
    `docker exec postgres_db_fitness_saas psql -U postgres -c "CREATE DATABASE fitness_saas_test;" 2>/dev/null || true`,
    { stdio: 'inherit' },
  );

  execSync('npx prisma migrate deploy', {
    cwd: path.resolve(__dirname, '../../../packages/database'),
    env: { ...process.env, DATABASE_URL: testDbUrl },
    stdio: 'inherit',
  });
}
