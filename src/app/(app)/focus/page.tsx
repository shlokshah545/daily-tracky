'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Play, Pause, RotateCcw, Volume2, VolumeX, Maximize2, Minimize2,
  CheckCircle2, Sparkles, Flame, Clock, Tag, Plus, Share2, Award, Check, X
} from 'lucide-react'
import { useUIStore } from '@/lib/store'
import type { Project } from '@/types'

type TimerMode = 'focus' | 'stopwatch' | 'short_break'

const STANDARD_PRESETS = [15, 25, 33, 45, 60]

export default function FocusTimerPage() {
  const [mode, setMode] = useState<TimerMode>('focus')
  const [presetMin, setPresetMin] = useState<number>(25)
  const [isCustomActive, setIsCustomActive] = useState<boolean>(false)
  const [showCustomInput, setShowCustomInput] = useState<boolean>(false)
  const [customInputVal, setCustomInputVal] = useState<string>('')
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

  // Handle ambient sound
  useEffect(() => {
    if (soundEnabled && isRunning) {
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        const ctx = new AudioCtx()
        audioCtxRef.current = ctx

        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(136.1, ctx.currentTime)
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

  // Standard preset change handler
  const handlePresetChange = (mins: number) => {
    setIsRunning(false)
    setIsCustomActive(false)
    setShowCustomInput(false)
    setPresetMin(mins)
    setTimeLeft(mins * 60)
  }

  // Apply custom time
  const handleApplyCustomTime = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const val = parseInt(customInputVal, 10)
    if (!isNaN(val) && val > 0 && val <= 360) {
      setIsRunning(false)
      setPresetMin(val)
      setTimeLeft(val * 60)
      setIsCustomActive(true)
      setShowCustomInput(false)
    }
  }

  // Format MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

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

  // Progress percentage (responsive radius 92)
  const totalSecs = mode === 'short_break' ? 5 * 60 : presetMin * 60
  const progressPct = mode === 'stopwatch' ? 100 : ((totalSecs - timeLeft) / totalSecs) * 100
  const radius = 92
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (progressPct / 100) * circumference

  return (
    <div
      className="page"
      style={{
        maxWidth: 680,
        margin: '0 auto',
        padding: '16px 16px 140px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {/* ─── Mode Switcher Segmented Pills ─── */}
      <div
        style={{
          display: 'inline-flex',
          padding: 4,
          background: 'var(--color-bg-subtle)',
          borderRadius: 100,
          border: '1px solid var(--color-border)',
          marginBottom: 16,
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
                padding: '7px 16px',
                borderRadius: 100,
                fontSize: 12,
                fontWeight: 800,
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
          marginBottom: 20,
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
            fontWeight: 700,
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
            fontWeight: 700,
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
            width: 36,
            height: 36,
            borderRadius: 100,
            background: soundEnabled ? 'var(--color-accent-muted)' : 'var(--color-bg-subtle)',
            color: soundEnabled ? 'var(--color-accent-text)' : 'var(--color-text-tertiary)',
            border: '1px solid var(--color-border)',
          }}
          title={soundEnabled ? 'Disable Ambience' : 'Enable Calm Focus Tone'}
        >
          {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>

        <button
          onClick={toggleFullscreen}
          className="icon-btn"
          style={{
            width: 36,
            height: 36,
            borderRadius: 100,
            background: 'var(--color-bg-subtle)',
            color: 'var(--color-text-tertiary)',
            border: '1px solid var(--color-border)',
          }}
          title="Toggle Fullscreen"
        >
          {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
      </div>

      {/* ─── Hero Circular Timer Display Card ─── */}
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: 440,
          padding: '26px 20px 24px',
          borderRadius: 28,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
          background: 'var(--color-bg-elevated)',
          border: '1px solid var(--color-border)',
          boxShadow: '0 8px 30px rgba(0,0,0,0.04)',
          marginBottom: 20,
        }}
      >
        {/* Circular Progress with Digits */}
        <div style={{ position: 'relative', width: 216, height: 216, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="216" height="216" viewBox="0 0 216 216" style={{ transform: 'rotate(-90deg)' }}>
            <circle
              cx="108"
              cy="108"
              r={radius}
              stroke="var(--color-border)"
              strokeWidth="9"
              fill="transparent"
            />
            <circle
              cx="108"
              cy="108"
              r={radius}
              stroke="var(--color-accent)"
              strokeWidth="9"
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
                  fontSize: 48,
                  fontWeight: 900,
                  color: 'var(--color-text-primary)',
                  letterSpacing: '-0.04em',
                  lineHeight: 1,
                }}
              >
                {formatTime(stopwatchElapsed)}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
                <span
                  style={{
                    fontFamily: "'Outfit', 'Inter', sans-serif",
                    fontSize: 64,
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
                    fontSize: 24,
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
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--color-text-tertiary)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginTop: 4,
              }}
            >
              {isRunning ? (mode === 'short_break' ? 'Break Time' : 'Flow State') : 'Ready'}
            </div>
          </div>
        </div>

        {/* ─── Duration Preset Chips with Custom Option (Focus Mode Only) ─── */}
        {mode === 'focus' && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 14 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                flexWrap: 'wrap',
                justifyContent: 'center',
              }}
            >
              {STANDARD_PRESETS.map(mins => {
                const isActive = !isCustomActive && presetMin === mins
                return (
                  <button
                    key={mins}
                    onClick={() => handlePresetChange(mins)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 100,
                      fontSize: 12.5,
                      fontWeight: isActive ? 800 : 600,
                      cursor: 'pointer',
                      border: `1.5px solid ${isActive ? 'var(--color-accent)' : 'var(--color-border)'}`,
                      background: isActive ? 'var(--color-accent)' : 'var(--color-bg-subtle)',
                      color: isActive ? '#ffffff' : 'var(--color-text-secondary)',
                      boxShadow: isActive ? '0 3px 10px rgba(99, 102, 241, 0.35)' : 'none',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {mins}m
                  </button>
                )
              })}

              {/* Custom Duration Button */}
              <button
                onClick={() => setShowCustomInput(s => !s)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 100,
                  fontSize: 12.5,
                  fontWeight: isCustomActive ? 800 : 600,
                  cursor: 'pointer',
                  border: `1.5px solid ${isCustomActive ? 'var(--color-accent)' : 'var(--color-border)'}`,
                  background: isCustomActive ? 'var(--color-accent)' : 'var(--color-bg-subtle)',
                  color: isCustomActive ? '#ffffff' : 'var(--color-text-secondary)',
                  boxShadow: isCustomActive ? '0 3px 10px rgba(99, 102, 241, 0.35)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                {isCustomActive ? `${presetMin}m (Custom)` : 'Custom'}
              </button>
            </div>

            {/* Custom Input Inline Form */}
            {showCustomInput && (
              <form
                onSubmit={handleApplyCustomTime}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginTop: 12,
                  padding: '5px 10px',
                  borderRadius: 100,
                  background: 'var(--color-bg-subtle)',
                  border: '1.5px solid var(--color-accent)',
                  boxShadow: '0 2px 8px rgba(99, 102, 241, 0.2)',
                }}
              >
                <input
                  type="number"
                  min="1"
                  max="360"
                  autoFocus
                  placeholder="Minutes (e.g. 50)"
                  value={customInputVal}
                  onChange={e => setCustomInputVal(e.target.value)}
                  style={{
                    width: 140,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--color-text-primary)',
                    padding: '4px 6px',
                  }}
                />
                <button
                  type="submit"
                  className="btn btn-sm"
                  style={{
                    borderRadius: 100,
                    padding: '4px 10px',
                    fontSize: 12,
                    fontWeight: 700,
                    background: 'var(--color-accent)',
                    color: '#ffffff',
                    border: 'none',
                  }}
                >
                  Set
                </button>
                <button
                  type="button"
                  onClick={() => setShowCustomInput(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--color-text-tertiary)',
                    padding: 2,
                  }}
                >
                  <X size={14} />
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* ─── Select Subject / Project Tags ─── */}
      <div style={{ width: '100%', maxWidth: 440, marginBottom: 22 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 8,
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

        {/* Horizontal Chips Strip with rounded pills */}
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
              fontSize: 12.5,
              fontWeight: 700,
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
            const color = p.color || '#10b981'
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
                  fontSize: 12.5,
                  fontWeight: 700,
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
            height: 56,
            borderRadius: 100,
            border: 'none',
            background: isRunning
              ? 'linear-gradient(135deg, #f59e0b, #d97706)'
              : 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            fontSize: 16,
            fontWeight: 800,
            fontFamily: "'Outfit', 'Inter', sans-serif",
            letterSpacing: '0.04em',
            cursor: 'pointer',
            boxShadow: isRunning
              ? '0 6px 20px rgba(245, 158, 11, 0.4)'
              : '0 8px 26px rgba(16, 185, 129, 0.45)',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          }}
          onMouseDown={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.98)' }}
          onMouseUp={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)' }}
        >
          {isRunning ? (
            <>
              <Pause size={20} fill="white" />
              <span>PAUSE</span>
            </>
          ) : (
            <>
              <Play size={20} fill="white" />
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
            width: 56,
            height: 56,
            borderRadius: 100,
            background: 'var(--color-bg-elevated)',
            border: '1.5px solid var(--color-border)',
            color: 'var(--color-text-secondary)',
          }}
          title="Reset Timer"
        >
          <RotateCcw size={18} />
        </button>
      </div>

      {/* ─── Sessions Completed Badge ─── */}
      {completedSessions > 0 && (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            marginTop: 20,
            padding: '8px 18px',
            borderRadius: 100,
            background: 'var(--color-success-muted)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            color: 'var(--color-success-text)',
            fontSize: 12.5,
            fontWeight: 700,
          }}
        >
          <Award size={15} />
          <span>{completedSessions} focus session{completedSessions === 1 ? '' : 's'} completed today!</span>
        </div>
      )}
    </div>
  )
}
