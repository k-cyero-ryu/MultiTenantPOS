// Database Configuration
// Change 'engine' to switch between 'postgresql' or 'mysql'
module.exports = {
  engine: 'postgresql', // Options: 'postgresql' or 'mysql'
  
  // MySQL-specific configuration (used when engine is 'mysql')
  mysql: {
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'subsidiary_management',
  },
  
  // PostgreSQL-specific configuration (used when engine is 'postgresql')
  // This will use DATABASE_URL if available, otherwise fall back to individual settings
  postgresql: {
    // These are used if DATABASE_URL is not available
    host: process.env.PGHOST || 'localhost',
    port: parseInt(process.env.PGPORT || '5432'),
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || '',
    database: process.env.PGDATABASE || 'postgres',
  }
};