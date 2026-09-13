import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { subDays, format } from 'date-fns'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const today = new Date()
  const todayStr = format(today, 'yyyy-MM-dd')

  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')

    const startDate = format(subDays(today, days - 1), 'yyyy-MM-dd')
    const endDate = format(today, 'yyyy-MM-dd')

    // Daily logs for completion chart
    let dailyLogs: { date: string; tasksCompleted: number; tasksTotal: number }[] = []
    try {
      dailyLogs = await prisma.dailyLog.findMany({
        where: {
          date: { gte: startDate, lte: endDate },
        },
        orderBy: { date: 'asc' },
      })
    } catch (e) {
      console.warn('Analytics dailyLog query warning:', e)
    }

    // All-time logs for heatmap (52 weeks)
    const heatmapStart = format(subDays(today, 364), 'yyyy-MM-dd')
    let heatmapLogs: { date: string; tasksCompleted: number }[] = []
    try {
      heatmapLogs = await prisma.dailyLog.findMany({
        where: { date: { gte: heatmapStart, lte: endDate } },
        orderBy: { date: 'asc' },
      })
    } catch (e) {
      console.warn('Analytics heatmap query warning:', e)
    }

    // Task breakdown by priority
    let tasksByPriority: { priority: string; _count: { id: number } }[] = []
    try {
      const grouped = await prisma.task.groupBy({
        by: ['priority'],
        _count: { id: true },
      })
      tasksByPriority = (grouped as unknown) as { priority: string; _count: { id: number } }[]
    } catch (e) {
      console.warn('Analytics priority grouping warning:', e)
    }

    // Task breakdown by status
    let tasksByStatus: { status: string; _count: { id: number } }[] = []
    try {
      const grouped = await prisma.task.groupBy({
        by: ['status'],
        _count: { id: true },
      })
      tasksByStatus = (grouped as unknown) as { status: string; _count: { id: number } }[]
    } catch (e) {
      console.warn('Analytics status grouping warning:', e)
    }

    // Overdue tasks
    let overdueCount = 0
    try {
      overdueCount = await prisma.task.count({
        where: { status: 'overdue' },
      })
    } catch (e) {
      console.warn('Analytics overdue query warning:', e)
    }

    // Today's stats
    let todayTasks: { status: string }[] = []
    try {
      todayTasks = await prisma.task.findMany({
        where: { dueDate: todayStr },
        select: { status: true },
      })
    } catch (e) {
      console.warn('Analytics todayTasks query warning:', e)
    }
    const todayCompleted = todayTasks.filter(t => t.status === 'done').length

    // Active projects with progress
    let projects: { id: string; name: string; color: string; totalTasks: number; completedTasks: number }[] = []
    try {
      const dbProjects = await prisma.project.findMany({
        where: { status: 'active' },
        include: {
          tasks: { select: { status: true } },
        },
      })
      projects = dbProjects.map(p => ({
        id: p.id,
        name: p.name,
        color: p.color,
        totalTasks: p.tasks.length,
        completedTasks: p.tasks.filter(t => t.status === 'done').length,
      }))
    } catch (e) {
      console.warn('Analytics projects query warning:', e)
    }

    // Calculate current streak
    let currentStreak = 0
    let longestStreak = 0
    try {
      const allLogs = await prisma.dailyLog.findMany({
        orderBy: { date: 'desc' },
      })
      for (const log of allLogs) {
        if (log.date > todayStr) continue
        if (log.isStreakDay) currentStreak++
        else break
      }
      longestStreak = calculateLongestStreak(allLogs)
    } catch (e) {
      console.warn('Analytics streak calculation warning:', e)
    }

    return NextResponse.json({
      dailyLogs,
      heatmapLogs,
      tasksByPriority,
      tasksByStatus,
      overdueCount,
      todayCompleted,
      todayTotal: todayTasks.length,
      projects,
      currentStreak,
      longestStreak,
    })
  } catch (error) {
    console.error('GET /api/analytics error:', error)
    return NextResponse.json({
      dailyLogs: [],
      heatmapLogs: [],
      tasksByPriority: [],
      tasksByStatus: [],
      overdueCount: 0,
      todayCompleted: 0,
      todayTotal: 0,
      projects: [],
      currentStreak: 0,
      longestStreak: 0,
    })
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
