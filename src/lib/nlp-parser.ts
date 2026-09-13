import * as chrono from 'chrono-node'
import { format } from 'date-fns'
import { RecurrenceRule } from './recurrence'

export interface ParsedTask {
  title: string
  dueDate?: string    // YYYY-MM-DD
  dueTime?: string    // HH:MM
  tags: string[]
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  isRecurring?: boolean
  recurrenceRule?: RecurrenceRule
}

const PRIORITY_KEYWORDS: Record<string, 'low' | 'medium' | 'high' | 'urgent'> = {
  '!1': 'urgent', '!urgent': 'urgent', '!!': 'high',
  '!2': 'high',   '!high': 'high',    '!':  'medium',
  '!3': 'medium', '!medium': 'medium','!4': 'low',
  '!low': 'low',
}

const DAY_MAP: Record<string, number> = {
  sunday: 0, sun: 0,
  monday: 1, mon: 1,
  tuesday: 2, tue: 2, tues: 2,
  wednesday: 3, wed: 3,
  thursday: 4, thu: 4, thur: 4, thurs: 4,
  friday: 5, fri: 5,
  saturday: 6, sat: 6,
}

export function parseNaturalTask(input: string): ParsedTask {
  let text = input.trim()

  // Extract tags (#tag)
  const tagMatches = text.match(/#[\w-]+/g) || []
  const tags = tagMatches.map(t => t.slice(1).toLowerCase())
  text = text.replace(/#[\w-]+/g, '').trim()

  // Extract priority
  let priority: ParsedTask['priority'] = 'medium'
  for (const [keyword, p] of Object.entries(PRIORITY_KEYWORDS)) {
    const regex = new RegExp(`\\b${keyword.replace('!', '\\!')}\\b`, 'i')
    if (regex.test(text)) {
      priority = p
      text = text.replace(regex, '').trim()
      break
    }
  }

  // Extract recurrence patterns
  let isRecurring = false
  let recurrenceRule: RecurrenceRule | undefined

  if (/\b(every\s+day|daily)\b/i.test(text)) {
    isRecurring = true
    recurrenceRule = { type: 'daily' }
    text = text.replace(/\b(every\s+day|daily)\b/gi, '').trim()
  } else if (/\b(every\s+weekday|weekdays)\b/i.test(text)) {
    isRecurring = true
    recurrenceRule = { type: 'weekdays', days: [1, 2, 3, 4, 5] }
    text = text.replace(/\b(every\s+weekday|weekdays)\b/gi, '').trim()
  } else if (/\b(every\s+weekend|weekends)\b/i.test(text)) {
    isRecurring = true
    recurrenceRule = { type: 'weekends', days: [0, 6] }
    text = text.replace(/\b(every\s+weekend|weekends)\b/gi, '').trim()
  } else {
    // Check for "every monday, wednesday, friday" or "every mon/wed"
    const everyDaysMatch = text.match(/\bevery\s+((?:(?:mon|tue|wed|thu|fri|sat|sun|monday|tuesday|wednesday|thursday|friday|saturday|sunday)(?:day)?(?:\s*,\s*|\s+and\s+|\s+)?)+)\b/i)
    if (everyDaysMatch) {
      const daysStr = everyDaysMatch[1].toLowerCase()
      const foundDays: number[] = []
      for (const [dayKey, dayIndex] of Object.entries(DAY_MAP)) {
        if (new RegExp(`\\b${dayKey}\\b`, 'i').test(daysStr)) {
          if (!foundDays.includes(dayIndex)) foundDays.push(dayIndex)
        }
      }
      if (foundDays.length > 0) {
        isRecurring = true
        recurrenceRule = { type: 'custom', days: foundDays.sort((a, b) => a - b) }
        text = text.replace(everyDaysMatch[0], '').trim()
      }
    }
  }

  // Extract date/time with chrono
  const parsed = chrono.parse(text, new Date(), { forwardDate: true })
  let dueDate: string | undefined
  let dueTime: string | undefined
  let titleText = text

  if (parsed.length > 0) {
    const result = parsed[0]
    const date = result.start.date()
    dueDate = format(date, 'yyyy-MM-dd')

    if (
      result.start.isCertain('hour') ||
      result.start.isCertain('minute')
    ) {
      dueTime = format(date, 'HH:mm')
    }

    // Remove matched date text from title
    titleText = (text.slice(0, result.index) + text.slice(result.index + result.text.length)).trim()
  }

  // Clean up title
  const title = titleText.replace(/\s+/g, ' ').trim() || input.trim()

  return { title, dueDate, dueTime, tags, priority, isRecurring, recurrenceRule }
}
