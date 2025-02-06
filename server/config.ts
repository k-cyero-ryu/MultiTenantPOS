import { z } from "zod";

// Database configuration schema
export const dbConfigSchema = z.object({
  engine: z.enum(['postgresql', 'mysql']),
  host: z.string(),
  port: z.number(),
  database: z.string(),
  username: z.string(),
  password: z.string(),
});

export type DbConfig = z.infer<typeof dbConfigSchema>;

// Load database configuration from environment variables
export function loadDbConfig(): DbConfig {
  return {
    engine: (process.env.DB_ENGINE || 'postgresql') as 'postgresql' | 'mysql',
    host: process.env.DB_HOST || process.env.PGHOST || 'localhost',
    port: parseInt(process.env.DB_PORT || process.env.PGPORT || '5432'),
    database: process.env.DB_NAME || process.env.PGDATABASE || 'database',
    username: process.env.DB_USER || process.env.PGUSER || 'user',
    password: process.env.DB_PASSWORD || process.env.PGPASSWORD || 'password',
  };
}
