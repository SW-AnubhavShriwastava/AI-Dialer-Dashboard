-- Create the database if it doesn't exist
DO
$do$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_database
      WHERE datname = 'ai_dialer') THEN
      CREATE DATABASE ai_dialer;
   END IF;
END
$do$;

-- Connect to the database
\c ai_dialer

-- Create the schema
CREATE SCHEMA IF NOT EXISTS dashboard;

-- Create the user if it doesn't exist
DO
$do$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles
      WHERE  rolname = 'ai_dialer_user') THEN
      CREATE USER ai_dialer_user WITH PASSWORD '@NuBHAV2' CREATEDB;
   ELSE
      ALTER USER ai_dialer_user WITH CREATEDB;
   END IF;
END
$do$;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE ai_dialer TO ai_dialer_user;
GRANT ALL PRIVILEGES ON SCHEMA dashboard TO ai_dialer_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA dashboard TO ai_dialer_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA dashboard TO ai_dialer_user;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA dashboard GRANT ALL ON TABLES TO ai_dialer_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA dashboard GRANT ALL ON SEQUENCES TO ai_dialer_user; 