import { PrismaClient } from '@prisma/client'
import path from 'path'
import fs from 'fs'

function getDatabaseUrl(): string {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL
  }

  // Serverless environment (e.g. Vercel)
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const tmpDbPath = path.join('/tmp', 'dev.db')
    try {
      if (!fs.existsSync(tmpDbPath)) {
        const rootDbPath = path.join(process.cwd(), 'prisma', 'dev.db')
        if (fs.existsSync(rootDbPath)) {
          fs.copyFileSync(rootDbPath, tmpDbPath)
        }
      }
    } catch (e) {
      console.warn('Could not copy sqlite database to /tmp:', e)
    }
    return `file:${tmpDbPath}`
  }

  // Local development fallback
  const localDb = path.join(process.cwd(), 'prisma', 'dev.db')
  return `file:${localDb}`
}

const resolvedDbUrl = getDatabaseUrl()
process.env.DATABASE_URL = resolvedDbUrl

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: resolvedDbUrl,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['error'] : [],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
