# Database Setup Guide for AI Dialer Project

This guide provides detailed instructions for setting up the database for both the AI-Dialer-Dashboard (Next.js) and AI-Dialer_old (Python) applications.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [PostgreSQL Installation](#postgresql-installation)
3. [Database Setup](#database-setup)
4. [Application Setup](#application-setup)
5. [Schema Verification](#schema-verification)
6. [Troubleshooting](#troubleshooting)
7. [Maintenance](#maintenance)

## Prerequisites

- Windows 10 or later
- PowerShell 5.1 or later
- Git
- Node.js 18 or later
- Python 3.8 or later
- PostgreSQL 17 or later

## PostgreSQL Installation

1. Download PostgreSQL 17:
   - Visit [PostgreSQL Downloads](https://www.postgresql.org/download/windows/)
   - Download the installer for Windows x86-64
   - Run the installer

2. Installation Steps:
   ```powershell
   # Default installation directory
   C:\Program Files\PostgreSQL\17
   
   # Default data directory
   C:\Program Files\PostgreSQL\17\data
   ```

3. During installation:
   - Remember the password you set for the postgres superuser
   - Keep the default port (5432)
   - Install all offered components

4. Verify Installation:
   ```powershell
   # Check PostgreSQL service
   Get-Service postgresql*
   
   # Expected output:
   # Status   Name               DisplayName
   # ------   ----               -----------
   # Running  postgresql-x64-17  postgresql-x64-17 - PostgreSQL Server
   ```

## Database Setup

1. Create Database and User:
   ```powershell
   # Connect to PostgreSQL as superuser
   & 'C:\Program Files\PostgreSQL\17\bin\psql.exe' -U postgres

   # Create database
   CREATE DATABASE ai_dialer;

   # Create user
   CREATE USER ai_dialer_user WITH PASSWORD '@NuBHAV2';

   # Grant privileges
   GRANT ALL PRIVILEGES ON DATABASE ai_dialer TO ai_dialer_user;

   # Connect to the ai_dialer database
   \c ai_dialer

   # Grant schema privileges
   GRANT ALL ON SCHEMA public TO ai_dialer_user;

   # Grant additional permissions
   GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ai_dialer_user;
   GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ai_dialer_user;
   ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ai_dialer_user;
   ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ai_dialer_user;

   # Exit psql
   \q
   ```

2. Verify Database Creation:
   ```powershell
   # Connect with new user
   & 'C:\Program Files\PostgreSQL\17\bin\psql.exe' -U ai_dialer_user -d ai_dialer
   
   # Should connect successfully
   # Exit
   \q
   ```

## Application Setup

### 1. AI-Dialer-Dashboard (Next.js App)

1. Clone and Setup:
   ```powershell
   # Clone repository
   git clone <repository-url>
   cd AI-Dialer-Dashboard

   # Install dependencies
   npm install
   ```

2. Environment Configuration:
   Create `.env` file:
   ```env
   # Database
   DATABASE_URL="postgresql://ai_dialer_user:@NuBHAV2@localhost:5432/ai_dialer?schema=public"

   # Authentication
   JWT_SECRET="your-super-secret-jwt-key"
   JWT_EXPIRES_IN="7d"

   # Email
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT=587
   SMTP_USER="your-email@gmail.com"
   SMTP_PASSWORD="your-app-specific-password"

   # App
   NEXT_PUBLIC_APP_URL="http://localhost:3000"

   # AI-Dialer Configuration
   AI_DIALER_URL="https://your-ngrok-url.ngrok-free.app"
   ```

3. Initialize Database:
   ```powershell
   # Generate Prisma client
   npx prisma generate

   # Push schema to database
   npx prisma db push
   ```

### 2. AI-Dialer_old (Python App)

1. Clone and Setup:
   ```powershell
   # Clone repository
   git clone <repository-url>
   cd AI-Dialer_old

   # Create virtual environment
   python -m venv venv
   .\venv\Scripts\activate

   # Install dependencies
   pip install -r requirements.txt
   ```

2. Environment Configuration:
   Create `.env` file:
   ```env
   # Database Configuration
   DATABASE_URL="postgresql://ai_dialer_user:@NuBHAV2@localhost:5432/ai_dialer"
   POSTGRES_USER=ai_dialer_user
   POSTGRES_PASSWORD=@NuBHAV2
   POSTGRES_DB=ai_dialer
   POSTGRES_HOST=localhost
   POSTGRES_PORT=5432

   # Server Configuration
   SERVER=your-ngrok-url.ngrok-free.app
   PORT=8000

   # Other configurations...
   ```

## Schema Verification

### Database Tables

1. Dashboard Tables (Next.js app):
   - users
   - admin_settings
   - employees
   - campaigns
   - campaign_employees
   - contacts
   - campaign_contacts
   - call_logs
   - appointments
   - transcripts

2. Dialer Tables (Python app):
   - scheduled_calls
   - transcripts

### Verify Schema:
```powershell
# Connect to database
& 'C:\Program Files\PostgreSQL\17\bin\psql.exe' -U ai_dialer_user -d ai_dialer

# List all tables
\dt

# Exit
\q
```

## Troubleshooting

### Common Issues and Solutions

1. Permission Denied:
   ```powershell
   # Connect as postgres superuser
   & 'C:\Program Files\PostgreSQL\17\bin\psql.exe' -U postgres

   # Grant permissions
   GRANT ALL PRIVILEGES ON DATABASE ai_dialer TO ai_dialer_user;
   GRANT ALL ON SCHEMA public TO ai_dialer_user;
   GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ai_dialer_user;
   ```

2. Connection Issues:
   - Verify PostgreSQL service is running:
     ```powershell
     Get-Service postgresql*
     ```
   - Check port availability:
     ```powershell
     Test-NetConnection -ComputerName localhost -Port 5432
     ```

3. Prisma Errors:
   ```powershell
   # Reset Prisma
   npx prisma generate
   npx prisma db push --force-reset
   ```

## Maintenance

### Regular Maintenance Tasks

1. Database Backup:
   ```powershell
   # Create backup
   & 'C:\Program Files\PostgreSQL\17\bin\pg_dump.exe' -U ai_dialer_user -d ai_dialer -F c -f backup.dump

   # Restore backup
   & 'C:\Program Files\PostgreSQL\17\bin\pg_restore.exe' -U ai_dialer_user -d ai_dialer backup.dump
   ```

2. Schema Updates:
   ```powershell
   # In AI-Dialer-Dashboard directory
   npx prisma generate
   npx prisma db push
   ```

3. Monitor Database:
   ```powershell
   # Connect to database
   & 'C:\Program Files\PostgreSQL\17\bin\psql.exe' -U ai_dialer_user -d ai_dialer

   # Check table sizes
   SELECT pg_size_pretty(pg_total_relation_size('table_name'));

   # Check active connections
   SELECT * FROM pg_stat_activity;
   ```

### Best Practices

1. Always backup before schema changes
2. Use transactions for critical operations
3. Monitor database size and performance
4. Keep PostgreSQL and dependencies updated
5. Regularly clean up unused data
6. Maintain proper indexes for performance

## Support

For additional support:
1. Check PostgreSQL documentation
2. Review Prisma documentation
3. Check application logs
4. Contact development team

## Security Notes

1. Never commit .env files
2. Regularly rotate database passwords
3. Use strong passwords
4. Limit database user permissions
5. Keep PostgreSQL updated
6. Enable SSL for production
7. Regular security audits
