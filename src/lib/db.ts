import { PrismaClient } from "@prisma/client"
import { Pool } from 'pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db
}

export const prisma = db

let pool: Pool | null = null

export async function getPool() {
  if (!pool) {
    const newPool = new Pool({
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT || '5432'),
      database: process.env.POSTGRES_DB || 'ai_dialer',
      user: process.env.POSTGRES_USER || 'postgres',
      password: process.env.POSTGRES_PASSWORD || 'postgres',
    })

    // Set the search path to the dashboard schema
    await newPool.query(`SET search_path TO ${process.env.POSTGRES_SCHEMA || 'dashboard'}`)
    pool = newPool
  }
  return pool
} 