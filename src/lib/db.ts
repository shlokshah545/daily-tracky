import { PrismaClient } from '@prisma/client'
import path from 'path'
import fs from 'fs'

function getDatabaseUrl(): string {
  // Remote database connection provided (Postgres / Supabase / Neon / Planetscale etc.)
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('file:')) {
    return process.env.DATABASE_URL
  }

  // Serverless environment (e.g. Vercel / AWS Lambda)
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const tmpDbPath = path.join('/tmp', 'dev.db')
    try {
      if (!fs.existsSync(tmpDbPath)) {
        const candidatePaths = [
          path.join(process.cwd(), 'prisma', 'dev.db'),
          path.join(process.cwd(), 'dev.db'),
          path.join(__dirname, '..', '..', '..', 'prisma', 'dev.db'),
          path.join(__dirname, '..', '..', 'prisma', 'dev.db'),
        ]
        for (const cand of candidatePaths) {
          if (fs.existsSync(/*turbopackIgnore: true*/ cand)) {
            fs.copyFileSync(/*turbopackIgnore: true*/ cand, tmpDbPath)
            break
          }
        }
      }
    } catch (e) {
      console.warn('Could not copy sqlite database to /tmp:', e)
    }
    return `file:${tmpDbPath}`
  }

  // Local development: always use absolute path to prisma/dev.db to prevent Windows spaces and CWD issues
  const localDb = path.resolve(process.cwd(), 'prisma', 'dev.db')
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
