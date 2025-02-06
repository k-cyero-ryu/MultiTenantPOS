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
    engine: 'mysql', // Switch to MySQL
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    database: process.env.DB_NAME || 'subsidiary_management',
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
  };
}