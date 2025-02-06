import { Pool as PgPool, neonConfig } from '@neondatabase/serverless';
import { drizzle as drizzlePg } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzleMysql } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import ws from "ws";
import * as schema from "@shared/schema";
import { loadDbConfig } from './config';

neonConfig.webSocketConstructor = ws;

const config = loadDbConfig();

// Function to create PostgreSQL connection
async function createPostgresConnection() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL must be set for PostgreSQL connection.",
    );
  }
  const pool = new PgPool({ connectionString: process.env.DATABASE_URL });
  return drizzlePg({ client: pool, schema });
}

// Function to create MySQL connection
async function createMysqlConnection() {
  const pool = mysql.createPool({
    host: config.host,
    port: config.port,
    user: config.username,
    password: config.password,
    database: config.database,
  });
  return drizzleMysql(pool, { 
    schema,
    mode: 'default' // Add required mode parameter
  });
}

// Create the appropriate database connection based on engine configuration
async function createDbConnection() {
  console.log(`Initializing database connection for ${config.engine}`);
  try {
    let connection;
    switch (config.engine) {
      case 'postgresql':
        connection = await createPostgresConnection();
        break;
      case 'mysql':
        connection = await createMysqlConnection();
        break;
      default:
        throw new Error(`Unsupported database engine: ${config.engine}`);
    }
    return connection;
  } catch (error) {
    console.error('Failed to create database connection:', error);
    throw error;
  }
}

// Initialize database connection
export let db: ReturnType<typeof drizzlePg> | ReturnType<typeof drizzleMysql>;

// Initialize connection immediately
createDbConnection()
  .then((connection) => {
    db = connection;
    console.log('Database connection established successfully');
  })
  .catch((error) => {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  });