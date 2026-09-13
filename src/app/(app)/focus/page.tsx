'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Play, Pause, RotateCcw, Volume2, VolumeX, Maximize2, Minimize2,
  CheckCircle2, Sparkles, Flame, Clock, Tag, Plus, Share2, Award
} from 'lucide-react'
import { useUIStore } from '@/lib/store'
import type { Project } from '@/types'

type TimerMode = 'focus' | 'stopwatch' | 'short_break'

const PRESET_MINUTES = [15, 25, 33, 45, 60]

export default function FocusTimerPage() {
  const [mode, setMode] = useState<TimerMode>('focus')
  const [presetMin, setPresetMin] = useState<number>(25)
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60)
  const [stopwatchElapsed, setStopwatchElapsed] = useState<number>(0)
  const [isRunning, setIsRunning] = useState<boolean>(false)
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false)
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false)
  const [completedSessions, setCompletedSessions] = useState<number>(0)
  
  // Projects list
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const { openTaskModal } = useUIStore()

  // Audio ambient generator reference
  const audioCtxRef = useRef<AudioContext | null>(null)
  const oscillatorRef = useRef<OscillatorNode | null>(null)
  const gainRef = useRef<GainNode | null>(null)

  // Fetch projects
  useEffect(() => {
    fetch('/api/projects')
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data.projects)) {
          setProjects(data.projects)
          if (data.projects.length > 0 && !selectedProjectId) {
            setSelectedProjectId(data.projects[0].id)
          }
        }
      })
      .catch(() => {})
  }, [selectedProjectId])

  // Handle ambient sound (gentle calming warm hum / binaural frequency)
  useEffect(() => {
    if (soundEnabled && isRunning) {
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        const ctx = new AudioCtx()
        audioCtxRef.current = ctx

        // Gentle relaxing pink-noise/warm tone filter
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(136.1, ctx.currentTime) // OM frequency / relaxing tone
        gain.gain.setValueAtTime(0.04, ctx.currentTime)

        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start()

        oscillatorRef.current = osc
        gainRef.current = gain
      } catch {}
    } else {
      if (oscillatorRef.current) {
        try {
          oscillatorRef.current.stop()
          oscillatorRef.current.disconnect()
        } catch {}
        oscillatorRef.current = null
      }
      if (audioCtxRef.current) {
        try {
          audioCtxRef.current.close()
        } catch {}
        audioCtxRef.current = null
      }
    }

    return () => {
      if (oscillatorRef.current) {
        try { oscillatorRef.current.stop() } catch {}
      }
      if (audioCtxRef.current) {
        try { audioCtxRef.current.close() } catch {}
      }
    }
  }, [soundEnabled, isRunning])

  // Timer ticker
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isRunning) {
      interval = setInterval(() => {
        if (mode === 'stopwatch') {
          setStopwatchElapsed(s => s + 1)
        } else {
          setTimeLeft(t => {
            if (t <= 1) {
              setIsRunning(false)
              setCompletedSessions(c => c + 1)
              // Log 25 or presetMin minutes to daily log
              fetch('/api/analytics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  date: new Date().toISOString().slice(0, 10),
                  studyMinutes: presetMin,
                }),
              }).catch(() => {})
              return 0
            }
            return t - 1
          })
        }
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning, mode, presetMin])

  // Mode change handler
  const handleModeChange = (newMode: TimerMode) => {
    setIsRunning(false)
    setMode(newMode)
    if (newMode === 'focus') {
      setTimeLeft(presetMin * 60)
    } else if (newMode === 'short_break') {
      setTimeLeft(5 * 60)
    } else {
      setStopwatchElapsed(0)
    }
  }

  // Preset change handler
  const handlePresetChange = (mins: number) => {
    setIsRunning(false)
    setPresetMin(mins)
    setTimeLeft(mins * 60)
  }

  // Format MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  // Format minutes display
  const currentMinutesDisplay = Math.ceil(timeLeft / 60)

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
      setIsFullscreen(true)
    } else {
      document.exitFullscreen().catch(() => {})
      setIsFullscreen(false)
    }
  }

  // Progress percentage
  const totalSecs = mode === 'short_break' ? 5 * 60 : presetMin * 60
  const progressPct = mode === 'stopwatch' ? 100 : ((totalSecs - timeLeft) / totalSecs) * 100
  const radius = 110
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (progressPct / 100) * circumference

  return (
    <div
      className="page"
      style={{
        maxWidth: 720,
        margin: '0 auto',
        padding: '16px 16px 120px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {/* ─── Mode Switcher Segmented Pills ─── */}
      <div
        className="segmented-pill-container"
        style={{
          display: 'inline-flex',
          padding: 4,
          background: 'var(--color-bg-subtle)',
          borderRadius: 100,
          border: '1px solid var(--color-border)',
          marginBottom: 20,
        }}
      >
        {(['focus', 'stopwatch', 'short_break'] as TimerMode[]).map(m => {
          const isActive = mode === m
          const label = m === 'focus' ? 'FOCUS' : m === 'stopwatch' ? 'STOPWATCH' : 'SHORT BREAK'
          return (
            <button
              key={m}
              onClick={() => handleModeChange(m)}
              style={{
                padding: '7px 18px',
                borderRadius: 100,
                fontSize: 12,
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                background: isActive ? 'var(--color-bg-elevated)' : 'transparent',
                color: isActive ? 'var(--color-accent-text)' : 'var(--color-text-tertiary)',
                boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s ease',
                letterSpacing: '0.04em',
              }}
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* ─── Action Utility Buttons ─── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 28,
        }}
      >
        <button
          onClick={() => {
            if (navigator.share) {
              navigator.share({ title: 'Daily Tracky', text: `Focused for ${completedSessions * 25} minutes today on Daily Tracky!` }).catch(() => {})
            }
          }}
          className="btn btn-sm"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            borderRadius: 100,
            padding: '6px 14px',
            fontSize: 12,
            fontWeight: 600,
            background: 'var(--color-accent-muted)',
            color: 'var(--color-accent-text)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
          }}
        >
          <Share2 size={13} />
          <span>SHARE</span>
        </button>

        <button
          onClick={() => openTaskModal()}
          className="btn btn-sm"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            borderRadius: 100,
            padding: '6px 14px',
            fontSize: 12,
            fontWeight: 600,
            background: 'var(--color-success-muted)',
            color: 'var(--color-success-text)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
          }}
        >
          <Plus size={13} />
          <span>LOG TASK</span>
        </button>

        <button
          onClick={() => setSoundEnabled(s => !s)}
          className="icon-btn"
          style={{
            width: 34,
            height: 34,
            borderRadius: 100,
            background: soundEnabled ? 'var(--color-accent-muted)' : 'var(--color-bg-subtle)',
            color: soundEnabled ? 'var(--color-accent-text)' : 'var(--color-text-tertiary)',
            border: '1px solid var(--color-border)',
          }}
          title={soundEnabled ? 'Disable Ambience' : 'Enable Calm Focus Tone'}
        >
          {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
        </button>

        <button
          onClick={toggleFullscreen}
          className="icon-btn"
          style={{
            width: 34,
            height: 34,
            borderRadius: 100,
            background: 'var(--color-bg-subtle)',
            color: 'var(--color-text-tertiary)',
            border: '1px solid var(--color-border)',
          }}
          title="Toggle Fullscreen"
        >
          {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
        </button>
      </div>

      {/* ─── Hero Circular Timer Display ─── */}
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: 440,
          padding: '36px 24px 30px',
          borderRadius: 32,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
          background: 'var(--color-bg-elevated)',
          border: '1px solid var(--color-border)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
          overflow: 'hidden',
          marginBottom: 24,
        }}
      >
        {/* Soft background glow arc */}
        <div
          style={{
            position: 'absolute',
            top: -60,
            right: -60,
            width: 180,
            height: 180,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* Circular Progress with Digits */}
        <div style={{ position: 'relative', width: 250, height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="250" height="250" viewBox="0 0 250 250" style={{ transform: 'rotate(-90deg)' }}>
            {/* Background ring */}
            <circle
              cx="125"
              cy="125"
              r={radius}
              stroke="var(--color-border)"
              strokeWidth="10"
              fill="transparent"
            />
            {/* Active animated stroke */}
            <circle
              cx="125"
              cy="125"
              r={radius}
              stroke="var(--color-accent)"
              strokeWidth="10"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.8s ease' }}
            />
          </svg>

          {/* Huge Numeric Digits */}
          <div
            style={{
              position: 'absolute',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {mode === 'stopwatch' ? (
              <div
                style={{
                  fontFamily: "'Outfit', 'Inter', monospace",
                  fontSize: 54,
                  fontWeight: 900,
                  color: 'var(--color-text-primary)',
                  letterSpacing: '-0.04em',
                  lineHeight: 1,
                }}
              >
                {formatTime(stopwatchElapsed)}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span
                  style={{
                    fontFamily: "'Outfit', 'Inter', sans-serif",
                    fontSize: 72,
                    fontWeight: 900,
                    color: 'var(--color-text-primary)',
                    letterSpacing: '-0.04em',
                    lineHeight: 1,
                  }}
                >
                  {timeLeft < 60 ? timeLeft : currentMinutesDisplay}
                </span>
                <span
                  style={{
                    fontFamily: "'Outfit', 'Inter', sans-serif",
                    fontSize: 26,
                    fontWeight: 600,
                    color: 'var(--color-text-tertiary)',
                  }}
                >
                  {timeLeft < 60 ? 's' : 'm'}
                </span>
              </div>
            )}

            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--color-text-tertiary)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginTop: 6,
              }}
            >
              {isRunning ? (mode === 'short_break' ? 'Break Time' : 'Flow State') : 'Ready'}
            </div>
          </div>
        </div>

        {/* ─── Duration Preset Chips (Focus Mode Only) ─── */}
        {mode === 'focus' && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginTop: 20,
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            {PRESET_MINUTES.map(mins => {
              const isActive = presetMin === mins
              return (
                <button
                  key={mins}
                  onClick={() => handlePresetChange(mins)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 100,
                    fontSize: 13,
                    fontWeight: isActive ? 700 : 500,
                    cursor: 'pointer',
                    border: `1.5px solid ${isActive ? 'var(--color-accent)' : 'var(--color-border)'}`,
                    background: isActive ? 'var(--color-accent)' : 'var(--color-bg-subtle)',
                    color: isActive ? '#ffffff' : 'var(--color-text-secondary)',
                    boxShadow: isActive ? '0 3px 12px rgba(99, 102, 241, 0.4)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {mins}m
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* ─── Select Subject / Project Tags ─── */}
      <div style={{ width: '100%', maxWidth: 440, marginBottom: 26 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 10,
            padding: '0 4px',
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: 'var(--color-text-tertiary)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            Select Subject / Project
          </span>
          <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)', fontWeight: 600 }}>
            Swipe →
          </span>
        </div>

        {/* Horizontal Chips Strip */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            overflowX: 'auto',
            paddingBottom: 4,
          }}
        >
          {/* Default Option */}
          <button
            onClick={() => setSelectedProjectId(null)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              borderRadius: 100,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              border: `1.5px solid ${selectedProjectId === null ? 'var(--color-accent)' : 'var(--color-border)'}`,
              background: selectedProjectId === null ? 'var(--color-accent-muted)' : 'var(--color-bg-elevated)',
              color: selectedProjectId === null ? 'var(--color-accent-text)' : 'var(--color-text-secondary)',
              boxShadow: selectedProjectId === null ? '0 2px 8px rgba(99,102,241,0.2)' : 'none',
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-accent)' }} />
            <span>General Focus</span>
          </button>

          {projects.map(p => {
            const isSelected = selectedProjectId === p.id
            const color = p.color || '#6366f1'
            return (
              <button
                key={p.id}
                onClick={() => setSelectedProjectId(p.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 16px',
                  borderRadius: 100,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  border: `1.5px solid ${isSelected ? color : 'var(--color-border)'}`,
                  background: isSelected ? `${color}18` : 'var(--color-bg-elevated)',
                  color: isSelected ? color : 'var(--color-text-secondary)',
                  boxShadow: isSelected ? `0 2px 8px ${color}33` : 'none',
                }}
              >
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                <span>{p.name}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ─── Massive Pill Start / Pause Button ─── */}
      <div style={{ width: '100%', maxWidth: 440, display: 'flex', gap: 12 }}>
        <button
          onClick={() => setIsRunning(r => !r)}
          style={{
            flex: 1,
            height: 60,
            borderRadius: 100,
            border: 'none',
            background: isRunning
              ? 'linear-gradient(135deg, #f59e0b, #d97706)'
              : 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            fontSize: 17,
            fontWeight: 800,
            fontFamily: "'Outfit', 'Inter', sans-serif",
            letterSpacing: '0.04em',
            cursor: 'pointer',
            boxShadow: isRunning
              ? '0 6px 24px rgba(245, 158, 11, 0.45)'
              : '0 8px 30px rgba(99, 102, 241, 0.45)',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          }}
          onMouseDown={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.98)' }}
          onMouseUp={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)' }}
        >
          {isRunning ? (
            <>
              <Pause size={22} fill="white" />
              <span>PAUSE</span>
            </>
          ) : (
            <>
              <Play size={22} fill="white" />
              <span>START</span>
            </>
          )}
        </button>

        {/* Reset Button */}
        <button
          onClick={() => {
            setIsRunning(false)
            if (mode === 'stopwatch') setStopwatchElapsed(0)
            else setTimeLeft(presetMin * 60)
          }}
          className="icon-btn"
          style={{
            width: 60,
            height: 60,
            borderRadius: 100,
            background: 'var(--color-bg-elevated)',
            border: '1.5px solid var(--color-border)',
            color: 'var(--color-text-secondary)',
          }}
          title="Reset Timer"
        >
          <RotateCcw size={20} />
        </button>
      </div>

      {/* ─── Sessions Completed Badge ─── */}
      {completedSessions > 0 && (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            marginTop: 24,
            padding: '8px 18px',
            borderRadius: 100,
            background: 'var(--color-success-muted)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            color: 'var(--color-success-text)',
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          <Award size={16} />
          <span>{completedSessions} focus session{completedSessions === 1 ? '' : 's'} completed today!</span>
        </div>
      )}
    </div>
  )
}
