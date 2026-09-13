import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { subDays, format } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')
    const today = new Date()

    const startDate = format(subDays(today, days - 1), 'yyyy-MM-dd')
    const endDate = format(today, 'yyyy-MM-dd')

    // Daily logs for completion chart
    const dailyLogs = await prisma.dailyLog.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
      },
      orderBy: { date: 'asc' },
    })

    // All-time logs for heatmap (52 weeks)
    const heatmapStart = format(subDays(today, 364), 'yyyy-MM-dd')
    const heatmapLogs = await prisma.dailyLog.findMany({
      where: { date: { gte: heatmapStart, lte: endDate } },
      orderBy: { date: 'asc' },
    })

    // Task breakdown by priority
    const tasksByPriority = await prisma.task.groupBy({
      by: ['priority'],
      _count: { id: true },
    })

    // Task breakdown by status
    const tasksByStatus = await prisma.task.groupBy({
      by: ['status'],
      _count: { id: true },
    })

    // Overdue tasks
    const overdueCount = await prisma.task.count({
      where: { status: 'overdue' },
    })

    // Today's stats
    const todayStr = format(today, 'yyyy-MM-dd')
    const todayTasks = await prisma.task.findMany({
      where: { dueDate: todayStr },
      select: { status: true },
    })
    const todayCompleted = todayTasks.filter(t => t.status === 'done').length

    // Active projects with progress
    const projects = await prisma.project.findMany({
      where: { status: 'active' },
      include: {
        tasks: { select: { status: true } },
      },
    })

    // Calculate current streak
    const allLogs = await prisma.dailyLog.findMany({
      orderBy: { date: 'desc' },
    })
    let currentStreak = 0
    for (const log of allLogs) {
      if (log.date > todayStr) continue
      if (log.isStreakDay) currentStreak++
      else break
    }

    const longestStreak = calculateLongestStreak(allLogs)

    return NextResponse.json({
      dailyLogs,
      heatmapLogs,
      tasksByPriority,
      tasksByStatus,
      overdueCount,
      todayCompleted,
      todayTotal: todayTasks.length,
      projects: projects.map(p => ({
        id: p.id,
        name: p.name,
        color: p.color,
        totalTasks: p.tasks.length,
        completedTasks: p.tasks.filter(t => t.status === 'done').length,
      })),
      currentStreak,
      longestStreak,
    })
  } catch (error) {
    console.error('GET /api/analytics error:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}

function calculateLongestStreak(logs: { date: string; isStreakDay: boolean }[]): number {
  const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date))
  let longest = 0, current = 0
  for (const log of sorted) {
    if (log.isStreakDay) {
      current++
      longest = Math.max(longest, current)
    } else {
      current = 0
    }
  }
  return longest
}
