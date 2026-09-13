import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const tags = await prisma.tag.findMany({
      include: {
        tasks: {
          include: { task: { select: { id: true, status: true } } },
        },
      },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json({ tags })
  } catch (error) {
    console.error('GET /api/tags error:', error)
    return NextResponse.json({ tags: [] }, { status: 200 })
  }
}
