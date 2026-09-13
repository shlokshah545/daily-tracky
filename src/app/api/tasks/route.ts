import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTodayString } from '@/lib/utils'
import { isTaskScheduledForDate } from '@/lib/recurrence'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const projectId = searchParams.get('projectId')
    const status = searchParams.get('status')
    const tagId = searchParams.get('tagId')

    const where: Record<string, unknown> = {}

    if (projectId) where.projectId = projectId
    if (status) where.status = status
    if (tagId) where.tags = { some: { tagId } }

    if (date) {
      // Query tasks matching date OR recurring tasks OR active tasks (future due dates / overdue / anytime)
      where.OR = [
        { dueDate: date },
        { isRecurring: true },
        { dueDate: null, status: { not: 'done' } },
        { status: { not: 'done' } },
      ]
    }

    const allTasks = await prisma.task.findMany({
      where,
      include: {
        subtasks: { orderBy: { order: 'asc' } },
        tags: { include: { tag: true } },
        project: { select: { id: true, name: true, color: true, icon: true } },
      },
      orderBy: [
        { dueTime: 'asc' },
        { createdAt: 'desc' },
      ],
    })

    // If date was specified, filter by recurrence rules and active ongoing schedule
    const tasks = date
      ? allTasks.filter(task => isTaskScheduledForDate(task, date, { includeOngoingTillDue: true }))
      : allTasks

    return NextResponse.json({ tasks })
  } catch (error) {
    console.error('GET /api/tasks error:', error)
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      title, description, status, priority,
      dueDate, dueTime, estimatedDuration, isTimeBlocked,
      isRecurring, recurrenceRule, projectId, notes,
      tags, subtasks,
    } = body

    const task = await prisma.task.create({
      data: {
        title,
        description,
        status: status || 'not_started',
        priority: priority || 'medium',
        dueDate,
        dueTime,
        estimatedDuration,
        isTimeBlocked: isTimeBlocked || false,
        isRecurring: isRecurring || false,
        recurrenceRule: typeof recurrenceRule === 'object' && recurrenceRule !== null
          ? JSON.stringify(recurrenceRule)
          : recurrenceRule,
        projectId,
        notes,
        subtasks: subtasks?.length ? {
          create: subtasks.map((s: { title: string }, i: number) => ({
            title: s.title,
            order: i,
          })),
        } : undefined,
        tags: tags?.length ? {
          create: tags.map((tagId: string) => ({ tagId })),
        } : undefined,
      },
      include: {
        subtasks: { orderBy: { order: 'asc' } },
        tags: { include: { tag: true } },
        project: { select: { id: true, name: true, color: true, icon: true } },
      },
    })

    // Update daily log
    await upsertDailyLog(dueDate || getTodayString())

    return NextResponse.json({ task }, { status: 201 })
  } catch (error) {
    console.error('POST /api/tasks error:', error)
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
  }
}

async function upsertDailyLog(date: string) {
  const tasks = await prisma.task.findMany({ where: { dueDate: date } })
  const completed = tasks.filter(t => t.status === 'done').length
  await prisma.dailyLog.upsert({
    where: { date },
    create: {
      date,
      tasksCompleted: completed,
      tasksTotal: tasks.length,
      isStreakDay: tasks.length > 0 && completed / tasks.length >= 0.8,
    },
    update: {
      tasksCompleted: completed,
      tasksTotal: tasks.length,
      isStreakDay: tasks.length > 0 && completed / tasks.length >= 0.8,
    },
  })
}
