import { z } from "zod";
import fs from 'fs';
import path from 'path';

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

// Helper function to dynamically import ESM config file - not used in this version
// We're using direct file reading instead for simplicity

// Load database configuration
export function loadDbConfig(): DbConfig {
  try {
    // Use a synchronous approach to read the config file
    const configPath = path.resolve(process.cwd(), 'db.config.mjs');
    const fileContent = fs.readFileSync(configPath, 'utf-8');
    
    // Extract engine value using a simple regex - not perfect but works for our simple format
    const engineMatch = fileContent.match(/engine:\s*['"]([^'"]+)['"]/);
    const configEngine = engineMatch ? engineMatch[1] : 'postgresql';
    
    console.log(`Using database engine: ${configEngine}`);

    if (configEngine === 'mysql') {
      return {
        engine: 'mysql',
        host: process.env.MYSQL_HOST || 'localhost',
        port: parseInt(process.env.MYSQL_PORT || '3306'),
        database: process.env.MYSQL_DATABASE || 'subsidiary_management',
        username: process.env.MYSQL_USER || 'root',
        password: process.env.MYSQL_PASSWORD || '',
      };
    } else {
      return {
        engine: 'postgresql',
        host: process.env.PGHOST || 'localhost',
        port: parseInt(process.env.PGPORT || '5432'),
        database: process.env.PGDATABASE || 'postgres',
        username: process.env.PGUSER || 'postgres',
        password: process.env.PGPASSWORD || '',
      };
    }
  } catch (error) {
    console.error('Error loading database config:', error);
    // Default to PostgreSQL if there's an error
    return {
      engine: 'postgresql',
      host: process.env.PGHOST || 'localhost',
      port: parseInt(process.env.PGPORT || '5432'),
      database: process.env.PGDATABASE || 'postgres',
      username: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD || '',
    };
  }
}