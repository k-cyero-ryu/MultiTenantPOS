import { Pool as PgPool, neonConfig } from '@neondatabase/serverless';
import { drizzle as drizzlePg } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzleMysql } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import ws from "ws";
import * as schema from "@shared/schema";
import { loadDbConfig } from './config';

neonConfig.webSocketConstructor = ws;

const config = loadDbConfig();

// Define database-specific types
type PostgresDB = ReturnType<typeof drizzlePg>;
type MySQLDB = ReturnType<typeof drizzleMysql>;
export type Database = PostgresDB | MySQLDB;

// Function to create PostgreSQL connection
function createPostgresConnection(): PostgresDB {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL must be set for PostgreSQL connection.",
    );
  }
  const pool = new PgPool({ connectionString: process.env.DATABASE_URL });
  return drizzlePg(pool, { schema });
}

// Function to create MySQL connection with proper connection pooling
function createMysqlConnection(): MySQLDB {
  // MySQL connection configuration with sensible defaults
  const pool = mysql.createPool({
    host: config.host || 'localhost',
    port: config.port || 3306,
    user: config.username || 'root',
    password: config.password || '',
    database: config.database || 'subsidiary_management',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
  });

  return drizzleMysql(pool, { 
    schema,
    mode: 'default'
  });
}

// Create the appropriate database connection based on engine configuration
async function createDbConnection(): Promise<Database> {
  console.log(`Initializing database connection for ${config.engine}`);
  try {
    let connection: Database;
    let retries = 3;
    let lastError: Error | null = null;

    while (retries > 0) {
      try {
        switch (config.engine) {
          case 'postgresql':
            connection = createPostgresConnection();
            break;
          case 'mysql':
            connection = createMysqlConnection();
            break;
          default:
            throw new Error(`Unsupported database engine: ${config.engine}`);
        }

        // Test the connection
        if (config.engine === 'postgresql') {
          await (connection as PostgresDB).execute(sql`SELECT 1`);
        } else {
          await (connection as MySQLDB).execute(sql`SELECT 1`);
        }

        console.log('Database connection test successful');
        return connection;
      } catch (error) {
        lastError = error as Error;
        retries--;
        if (retries > 0) {
          console.log(`Connection attempt failed, retrying... (${retries} attempts remaining)`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    throw lastError || new Error('Failed to connect to database after multiple attempts');
  } catch (error) {
    console.error('Failed to create database connection:', error);
    throw error;
  }
}

// Initialize database connection
export let db: Database;

// Initialize connection immediately
createDbConnection()
  .then((connection) => {
    db = connection;
    console.log('Database connection established successfully');
  })
  .catch((error) => {
    console.error('Failed to initialize database:', error);
    // Don't exit process, allow fallback to in-memory if needed
  });

// Helper functions to check database engine type
export function isPostgres(db: Database): db is PostgresDB {
  return config.engine === 'postgresql';
}

export function isMysql(db: Database): db is MySQLDB {
  return config.engine === 'mysql';
}

// SQL template literal tag
import { sql } from 'drizzle-orm';
export { sql };