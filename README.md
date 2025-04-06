# AI Dialer Dashboard

A comprehensive dashboard for managing AI-powered phone call campaigns, built with Next.js 14, TypeScript, and Prisma.

## Overview

AI Dialer Dashboard is a modern web application that allows users to manage and monitor AI-powered phone call campaigns. It provides a user-friendly interface for administrators to create campaigns, manage contacts, track call logs, and schedule appointments.

The dashboard works in conjunction with the [AI-Dialer](https://github.com/yourusername/AI-Dialer) Python application, which handles the actual phone calls using AI agents.

## Features

- **User Management**: Create and manage admin and employee accounts with role-based permissions
- **Campaign Management**: Create, configure, and monitor call campaigns
- **Contact Management**: Import, organize, and manage contacts for campaigns
- **Call Logs**: Track and analyze call history, duration, and outcomes
- **Appointment Scheduling**: Schedule follow-up appointments from calls
- **Transcripts**: View and analyze AI agent conversation transcripts
- **Analytics**: Monitor campaign performance and agent effectiveness

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS, Shadcn UI
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: NextAuth.js
- **Deployment**: Vercel (recommended)

## Prerequisites

- Node.js 18 or later
- PostgreSQL 17 or later
- Git

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/AI-Dialer-Dashboard.git
cd AI-Dialer-Dashboard
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Set Up Environment Variables

Create a `.env` file in the root directory with the following variables:

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

### 4. Set Up the Database

Follow the detailed instructions in [Database Setup.md](./Database%20Setup.md) to set up your PostgreSQL database.

### 5. Run Database Migrations

```bash
npx prisma generate
npx prisma db push
```

### 6. Start the Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Project Structure

```
AI-Dialer-Dashboard/
├── prisma/              # Database schema and migrations
├── public/              # Static assets
├── src/                 # Source code
│   ├── app/             # Next.js App Router pages
│   ├── components/      # Reusable UI components
│   ├── lib/             # Utility functions and shared code
│   ├── services/        # API service functions
│   └── types/           # TypeScript type definitions
├── .env                 # Environment variables
├── .env.local           # Local environment variables
└── package.json         # Project dependencies
```

## Integration with AI-Dialer

This dashboard is designed to work with the [AI-Dialer](https://github.com/yourusername/AI-Dialer) Python application. The AI-Dialer handles the actual phone calls using AI agents, while this dashboard provides the management interface.

To set up the complete system:

1. Set up the AI-Dialer application following its documentation
2. Configure the `AI_DIALER_URL` in your dashboard's `.env` file to point to your AI-Dialer instance
3. Ensure both applications are using the same database (see [Database Setup.md](./Database%20Setup.md))

## Deployment

### Deploying to Vercel

1. Push your code to a GitHub repository
2. Import the repository to Vercel
3. Configure the environment variables in the Vercel dashboard
4. Deploy

### Manual Deployment

```bash
npm run build
npm start
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Author

**Anubhav Shriwastava** - [GitHub](https://github.com/SW-AnubhavShriwastava)

## Acknowledgments

- [Next.js](https://nextjs.org/)
- [Prisma](https://www.prisma.io/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Shadcn UI](https://ui.shadcn.com/)
- [PostgreSQL](https://www.postgresql.org/)
