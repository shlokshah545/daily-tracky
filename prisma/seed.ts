import { PrismaClient } from '@prisma/client'
import { addDays, subDays, format } from 'date-fns'

const prisma = new PrismaClient()

const today = new Date()
const fmt = (d: Date) => format(d, 'yyyy-MM-dd')

async function main() {
  console.log('🌱 Seeding database...')

  // Clean existing data
  await prisma.tagOnTask.deleteMany()
  await prisma.subtask.deleteMany()
  await prisma.task.deleteMany()
  await prisma.project.deleteMany()
  await prisma.tag.deleteMany()
  await prisma.dailyLog.deleteMany()

  // ── Tags ──────────────────────────────────────────────────────────
  const [tagWork, tagPersonal, tagDSA, tagHealth, tagUrgent] = await Promise.all([
    prisma.tag.create({ data: { name: 'work', color: '#3B82F6' } }),
    prisma.tag.create({ data: { name: 'personal', color: '#10B981' } }),
    prisma.tag.create({ data: { name: 'dsa', color: '#F59E0B' } }),
    prisma.tag.create({ data: { name: 'health', color: '#EF4444' } }),
    prisma.tag.create({ data: { name: 'urgent', color: '#8B5CF6' } }),
  ])

  // ── Projects ──────────────────────────────────────────────────────
  const [projectAlpha, projectPortfolio, projectFitness] = await Promise.all([
    prisma.project.create({
      data: {
        name: 'Project Alpha',
        description: 'Main client project with tight deadlines. Full-stack web application.',
        color: '#3B82F6',
        icon: 'briefcase',
        deadline: fmt(addDays(today, 30)),
        status: 'active',
        notes: '## Project Notes\n\nKey milestones:\n- Sprint 1: Auth + Dashboard\n- Sprint 2: Core features\n- Sprint 3: Polish & launch',
      },
    }),
    prisma.project.create({
      data: {
        name: 'Portfolio Website',
        description: 'Personal portfolio to showcase projects and skills.',
        color: '#10B981',
        icon: 'globe',
        deadline: fmt(addDays(today, 14)),
        status: 'active',
        notes: '## Ideas\n\n- Dark/light mode\n- Animated hero section\n- Blog integration',
      },
    }),
    prisma.project.create({
      data: {
        name: 'Fitness Journey',
        description: '90-day fitness transformation plan with daily tracking.',
        color: '#EF4444',
        icon: 'dumbbell',
        deadline: fmt(addDays(today, 60)),
        status: 'active',
        notes: '## Routine\n\nMon/Wed/Fri: Weights\nTue/Thu: Cardio\nWeekend: Rest or yoga',
      },
    }),
  ])

  // ── Tasks ──────────────────────────────────────────────────────────

  // Today's tasks
  const task1 = await prisma.task.create({
    data: {
      title: 'Review pull request for auth module',
      description: 'Check the OAuth2 implementation and leave detailed feedback.',
      status: 'in_progress',
      priority: 'high',
      dueDate: fmt(today),
      dueTime: '10:00',
      estimatedDuration: 45,
      isTimeBlocked: true,
      projectId: projectAlpha.id,
      subtasks: {
        create: [
          { title: 'Check authentication flow', isCompleted: true, order: 0 },
          { title: 'Review error handling', isCompleted: false, order: 1 },
          { title: 'Test edge cases', isCompleted: false, order: 2 },
        ],
      },
    },
  })

  const task2 = await prisma.task.create({
    data: {
      title: 'Solve 3 LeetCode problems',
      description: 'Focus on dynamic programming today. Target: medium difficulty.',
      status: 'not_started',
      priority: 'medium',
      dueDate: fmt(today),
      dueTime: '14:00',
      estimatedDuration: 90,
      isTimeBlocked: true,
      isRecurring: true,
      recurrenceRule: JSON.stringify({ type: 'daily' }),
    },
  })

  const task3 = await prisma.task.create({
    data: {
      title: 'Morning workout',
      description: 'Upper body + cardio session. 45 minutes.',
      status: 'done',
      priority: 'medium',
      dueDate: fmt(today),
      dueTime: '07:00',
      estimatedDuration: 45,
      isTimeBlocked: true,
      isRecurring: true,
      recurrenceRule: JSON.stringify({ type: 'weekly', days: [1, 3, 5] }),
      projectId: projectFitness.id,
      completedAt: new Date(),
    },
  })

  const task4 = await prisma.task.create({
    data: {
      title: 'Update portfolio hero section design',
      description: 'Redesign with animated gradient and better typography.',
      status: 'not_started',
      priority: 'medium',
      dueDate: fmt(today),
      estimatedDuration: 120,
      projectId: projectPortfolio.id,
    },
  })

  const task5 = await prisma.task.create({
    data: {
      title: 'Read 30 pages of "Deep Work"',
      description: 'Continue from chapter 3 on scheduling deep work blocks.',
      status: 'not_started',
      priority: 'low',
      dueDate: fmt(today),
      estimatedDuration: 40,
      isRecurring: true,
      recurrenceRule: JSON.stringify({ type: 'daily' }),
    },
  })

  const task6 = await prisma.task.create({
    data: {
      title: 'Call dentist to schedule appointment',
      description: 'Long overdue checkup. Prioritize this today.',
      status: 'not_started',
      priority: 'urgent',
      dueDate: fmt(today),
    },
  })

  // Tomorrow's tasks
  const task7 = await prisma.task.create({
    data: {
      title: 'Deploy auth module to staging',
      description: 'After PR review is merged, deploy to staging environment.',
      status: 'not_started',
      priority: 'high',
      dueDate: fmt(addDays(today, 1)),
      dueTime: '11:00',
      estimatedDuration: 60,
      isTimeBlocked: true,
      projectId: projectAlpha.id,
    },
  })

  const task8 = await prisma.task.create({
    data: {
      title: 'Design database schema for portfolio CMS',
      status: 'not_started',
      priority: 'medium',
      dueDate: fmt(addDays(today, 1)),
      estimatedDuration: 90,
      projectId: projectPortfolio.id,
    },
  })

  // Past tasks (for analytics)
  await prisma.task.create({
    data: {
      title: 'Set up project repository and CI/CD',
      status: 'done',
      priority: 'high',
      dueDate: fmt(subDays(today, 1)),
      completedAt: subDays(today, 1),
      projectId: projectAlpha.id,
    },
  })

  await prisma.task.create({
    data: {
      title: 'Write technical specification document',
      status: 'done',
      priority: 'medium',
      dueDate: fmt(subDays(today, 2)),
      completedAt: subDays(today, 2),
      projectId: projectAlpha.id,
    },
  })

  await prisma.task.create({
    data: {
      title: 'Research competitor apps for portfolio inspiration',
      status: 'done',
      priority: 'low',
      dueDate: fmt(subDays(today, 2)),
      completedAt: subDays(today, 2),
      projectId: projectPortfolio.id,
    },
  })

  await prisma.task.create({
    data: {
      title: 'Configure Tailwind design tokens',
      status: 'done',
      priority: 'medium',
      dueDate: fmt(subDays(today, 3)),
      completedAt: subDays(today, 3),
      projectId: projectPortfolio.id,
    },
  })

  await prisma.task.create({
    data: {
      title: 'Week 1 fitness assessment',
      status: 'done',
      priority: 'high',
      dueDate: fmt(subDays(today, 5)),
      completedAt: subDays(today, 5),
      projectId: projectFitness.id,
    },
  })

  // Overdue tasks
  await prisma.task.create({
    data: {
      title: 'Submit invoice to client',
      status: 'overdue',
      priority: 'urgent',
      dueDate: fmt(subDays(today, 1)),
      projectId: projectAlpha.id,
    },
  })

  // Tag associations
  await prisma.tagOnTask.createMany({
    data: [
      { taskId: task1.id, tagId: tagWork.id },
      { taskId: task1.id, tagId: tagUrgent.id },
      { taskId: task2.id, tagId: tagDSA.id },
      { taskId: task3.id, tagId: tagHealth.id },
      { taskId: task4.id, tagId: tagPersonal.id },
      { taskId: task5.id, tagId: tagPersonal.id },
      { taskId: task6.id, tagId: tagPersonal.id },
      { taskId: task6.id, tagId: tagUrgent.id },
      { taskId: task7.id, tagId: tagWork.id },
      { taskId: task8.id, tagId: tagPersonal.id },
    ],
  })

  // ── Daily Logs (7 days for heatmap/analytics) ──────────────────────
  const logData = [
    { daysAgo: 6, completed: 4, total: 5 },
    { daysAgo: 5, completed: 5, total: 5 },
    { daysAgo: 4, completed: 3, total: 6 },
    { daysAgo: 3, completed: 6, total: 6 },
    { daysAgo: 2, completed: 4, total: 5 },
    { daysAgo: 1, completed: 5, total: 6 },
    { daysAgo: 0, completed: 1, total: 6 }, // today (partial)
  ]

  for (const log of logData) {
    const date = fmt(subDays(today, log.daysAgo))
    await prisma.dailyLog.create({
      data: {
        date,
        tasksCompleted: log.completed,
        tasksTotal: log.total,
        isStreakDay: log.completed / log.total >= 0.8,
      },
    })
  }

  console.log('✅ Seed complete!')
  console.log(`   - 3 projects`)
  console.log(`   - 5 tags`)
  console.log(`   - 13 tasks`)
  console.log(`   - 7 daily logs`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
