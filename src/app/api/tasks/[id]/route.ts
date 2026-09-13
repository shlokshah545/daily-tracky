import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        subtasks: { orderBy: { order: 'asc' } },
        tags: { include: { tag: true } },
        project: { select: { id: true, name: true, color: true, icon: true } },
      },
    })
    if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    return NextResponse.json({ task })
  } catch (error) {
    console.error('GET /api/tasks/[id] error:', error)
    return NextResponse.json({ error: 'Failed to fetch task' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const body = await request.json()
    const {
      title, description, status, priority,
      dueDate, dueTime, estimatedDuration, isTimeBlocked,
      isRecurring, recurrenceRule, projectId, notes,
      tags, subtasks, completedAt,
    } = body

    // Handle tag updates: delete all, recreate
    await prisma.tagOnTask.deleteMany({ where: { taskId: id } })

    // Handle subtask updates
    if (subtasks !== undefined) {
      await prisma.subtask.deleteMany({ where: { taskId: id } })
    }

    const task = await prisma.task.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(status !== undefined && { status }),
        ...(priority !== undefined && { priority }),
        ...(dueDate !== undefined && { dueDate }),
        ...(dueTime !== undefined && { dueTime }),
        ...(estimatedDuration !== undefined && { estimatedDuration }),
        ...(isTimeBlocked !== undefined && { isTimeBlocked }),
        ...(isRecurring !== undefined && { isRecurring }),
        ...(recurrenceRule !== undefined && {
          recurrenceRule: typeof recurrenceRule === 'object' && recurrenceRule !== null
            ? JSON.stringify(recurrenceRule)
            : recurrenceRule
        }),
        ...(projectId !== undefined && { projectId }),
        ...(notes !== undefined && { notes }),
        ...(completedAt !== undefined && { completedAt: completedAt ? new Date(completedAt) : null }),
        ...(tags !== undefined && {
          tags: {
            create: tags.map((tagId: string) => ({ tagId })),
          },
        }),
        ...(subtasks !== undefined && {
          subtasks: {
            create: subtasks.map((s: { title: string; isCompleted?: boolean }, i: number) => ({
              title: s.title,
              isCompleted: s.isCompleted || false,
              order: i,
            })),
          },
        }),
      },
      include: {
        subtasks: { orderBy: { order: 'asc' } },
        tags: { include: { tag: true } },
        project: { select: { id: true, name: true, color: true, icon: true } },
      },
    })

    // Update daily log if status or date changed
    if (status !== undefined || dueDate !== undefined) {
      await upsertDailyLog(task.dueDate || new Date().toISOString().split('T')[0])
    }

    return NextResponse.json({ task })
  } catch (error) {
    console.error('PUT /api/tasks/[id] error:', error)
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const task = await prisma.task.findUnique({ where: { id } })
    if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await prisma.task.delete({ where: { id } })

    if (task.dueDate) await upsertDailyLog(task.dueDate)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/tasks/[id] error:', error)
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 })
  }
}

async function upsertDailyLog(date: string) {
  const tasks = await prisma.task.findMany({ where: { dueDate: date } })
  const completed = tasks.filter(t => t.status === 'done').length
  await prisma.dailyLog.upsert({
    where: { date },
    create: {
      date, tasksCompleted: completed, tasksTotal: tasks.length,
      isStreakDay: tasks.length > 0 && completed / tasks.length >= 0.8,
    },
    update: {
      tasksCompleted: completed, tasksTotal: tasks.length,
      isStreakDay: tasks.length > 0 && completed / tasks.length >= 0.8,
    },
  })
}
