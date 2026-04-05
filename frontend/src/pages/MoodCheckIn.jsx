import React, { useState, useEffect, useRef } from 'react'
import { submitMood } from "../api"

const MOODS = [
  {
    id: 'very happy',
    label: 'Very Happy',
    emoji: '🌟',
    score: 5,
    bg: 'rgba(250,204,21,0.12)',
    border: 'rgba(250,204,21,0.5)',
    glow: 'rgba(250,204,21,0.25)',
    dot: '#facc15',
    desc: 'Feeling on top of the world',
  },
  {
    id: 'happy',
    label: 'Happy',
    emoji: '😊',
    score: 4,
    bg: 'rgba(134,239,172,0.12)',
    border: 'rgba(134,239,172,0.5)',
    glow: 'rgba(134,239,172,0.25)',
    dot: '#4ade80',
    desc: 'Things feel good today',
  },
  {
    id: 'calm',
    label: 'Calm',
    emoji: '😌',
    score: 4,
    bg: 'rgba(125,211,252,0.12)',
    border: 'rgba(125,211,252,0.5)',
    glow: 'rgba(125,211,252,0.25)',
    dot: '#38bdf8',
    desc: 'Peaceful and at ease',
  },
  {
    id: 'neutral',
    label: 'Neutral',
    emoji: '😐',
    score: 3,
    bg: 'rgba(209,213,219,0.12)',
    border: 'rgba(209,213,219,0.5)',
    glow: 'rgba(209,213,219,0.2)',
    dot: '#9ca3af',
    desc: 'Neither good nor bad',
  },
  {
    id: 'anxious',
    label: 'Anxious',
    emoji: '😰',
    score: 2,
    bg: 'rgba(249,168,212,0.12)',
    border: 'rgba(249,168,212,0.5)',
    glow: 'rgba(249,168,212,0.25)',
    dot: '#f472b6',
    desc: 'Feeling uneasy or worried',
  },
  {
    id: 'sad',
    label: 'Sad',
    emoji: '😢',
    score: 2,
    bg: 'rgba(129,140,248,0.12)',
    border: 'rgba(129,140,248,0.5)',
    glow: 'rgba(129,140,248,0.25)',
    dot: '#818cf8',
    desc: 'Feeling low or heavy',
  },
  {
    id: 'angry',
    label: 'Angry',
    emoji: '😡',
    score: 1,
    bg: 'rgba(251,113,133,0.12)',
    border: 'rgba(251,113,133,0.5)',
    glow: 'rgba(251,113,133,0.25)',
    dot: '#fb7185',
    desc: 'Frustrated or irritated',
  },
  {
    id: 'very sad',
    label: 'Very Sad',
    emoji: '😞',
    score: 1,
    bg: 'rgba(99,102,241,0.12)',
    border: 'rgba(99,102,241,0.5)',
    glow: 'rgba(99,102,241,0.25)',
    dot: '#6366f1',
    desc: 'Going through something hard',
  },
]

const MAX_NOTE = 500

/* ── Soft pulsing ring on selected card ── */
const pulseStyle = `
  @keyframes moodPulse {
    0%, 100% { box-shadow: 0 0 0 0px var(--glow); }
    50%       { box-shadow: 0 0 0 8px transparent; }
  }
  @keyframes fadeSlideUp {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes successPop {
    0%   { transform: scale(0.8); opacity: 0; }
    60%  { transform: scale(1.08); }
    100% { transform: scale(1);   opacity: 1; }
  }
`

export default function MoodCheckIn() {
  const [selected, setSelected]   = useState(null)
  const [note, setNote]           = useState('')
  const [saving, setSaving]       = useState(false)
  const [saved, setSaved]         = useState(false)
  const [error, setError]         = useState(null)
  const containerRef              = useRef(null)
  const textareaRef               = useRef(null)

  const mood = MOODS.find(m => m.id === selected)

  /* ── Auto-fit height ── */
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const fit = () => {
      const rect = el.getBoundingClientRect()
      el.style.height = (window.innerHeight - rect.top) + 'px'
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(document.documentElement)
    window.addEventListener('resize', fit)
    return () => { ro.disconnect(); window.removeEventListener('resize', fit) }
  }, [])

  /* ── Auto-resize textarea ── */
  const handleNote = (e) => {
    setNote(e.target.value)
    const ta = textareaRef.current
    if (ta) {
      ta.style.height = 'auto'
      ta.style.height = Math.min(ta.scrollHeight, 180) + 'px'
    }
  }

  /* ── Submit ── */
  async function submit() {
    if (!selected) return
    setSaving(true)
    setError(null)
    try {
      await submitMood({ mood: selected, note })
      setSaved(true)
      setSelected(null)
      setNote('')
      if (textareaRef.current) textareaRef.current.style.height = 'auto'
      setTimeout(() => setSaved(false), 3500)
    } catch (err) {
      setError(err.message || 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <style>{pulseStyle}</style>

      <div
        ref={containerRef}
        className="w-full overflow-y-auto "
      >
        <div className="px-6 py-10 flex flex-col items-center">
          <div className="w-full max-w-4xl space-y-8">

            {/* ── Header ── */}
            <div className="text-center" style={{ animation: 'fadeSlideUp 0.5s ease both' }}>
              <div className="inline-flex items-center gap-2 bg-white border border-[#ede9fe] rounded-full px-4 py-1.5 text-xs font-medium text-[#7c3aed] shadow-sm mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-[#a855f7] animate-pulse" />
                Daily Check-In
              </div>
              <h1 className="text-3xl font-bold text-[#2d1b4e] mb-2">How are you feeling today?</h1>
              <p className="text-[#2d1b4e] text-sm max-w-md mx-auto">
                Take a moment to acknowledge your emotions. Every feeling is valid and worth noting.
              </p>
            </div>

            {/* ── Success banner ── */}
            {saved && (
              <div
                className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl px-5 py-4 text-green-700"
                style={{ animation: 'successPop 0.4s ease both' }}
              >
                <span className="text-xl">✅</span>
                <div>
                  <p className="font-semibold text-sm">Mood saved!</p>
                  <p className="text-xs text-green-600 mt-0.5">Your check-in has been recorded. Keep showing up for yourself. 💜</p>
                </div>
              </div>
            )}

            {/* ── Error banner ── */}
            {error && (
              <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl px-5 py-4 text-red-600 text-sm">
                <span>⚠️</span> {error}
              </div>
            )}

            {/* ── Mood grid ── */}
            <div
              className="bg-white rounded-2xl border border-[#f3e8ff] shadow-sm p-6"
              style={{ animation: 'fadeSlideUp 0.5s 0.1s ease both', opacity: 0 }}
            >
              <p className="text-xs font-semibold text-[#9ca3af] uppercase tracking-widest mb-5">Select your mood</p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {MOODS.map((m, i) => {
                  const isSelected = selected === m.id
                  return (
                    <button
                      key={m.id}
                      onClick={() => setSelected(isSelected ? null : m.id)}
                      style={{
                        '--glow': m.glow,
                        background: isSelected ? m.bg : 'transparent',
                        borderColor: isSelected ? m.border : 'rgba(243,232,255,0.8)',
                        animation: `fadeSlideUp 0.4s ${i * 0.04}s ease both`,
                        opacity: 0,
                        ...(isSelected && {
                          boxShadow: `0 0 0 3px ${m.border}, 0 4px 20px ${m.glow}`,
                          animation: `fadeSlideUp 0.4s ${i * 0.04}s ease both, moodPulse 2s ease infinite`,
                        }),
                      }}
                      className="relative flex flex-col items-center gap-2 px-3 py-4 rounded-2xl border-2 transition-all duration-200 hover:scale-[1.03] active:scale-95"
                    >
                      {/* Selected dot */}
                      {isSelected && (
                        <span
                          className="absolute top-2 right-2 w-2 h-2 rounded-full"
                          style={{ background: m.dot }}
                        />
                      )}

                      <span className="text-3xl leading-none">{m.emoji}</span>
                      <span className={`text-sm font-semibold ${isSelected ? 'text-[#4b2c82]' : 'text-[#6b7280]'}`}>
                        {m.label}
                      </span>
                      <span className="text-[10px] text-[#9ca3af] text-center leading-tight">
                        {m.desc}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* ── Selected mood summary ── */}
            {mood && (
              <div
                className="flex items-center gap-4 rounded-2xl px-5 py-4 border"
                style={{
                  background: '#ffffff',
                  borderColor: mood.border,
                  animation: 'fadeSlideUp 0.35s ease both',
                }}
              >
                <span className="text-3xl">{mood.emoji}</span>
                <div>
                  <p className="text-sm font-semibold text-[#4b2c82]">You're feeling <span style={{ color: mood.dot }}>{mood.label}</span></p>
                  <p className="text-xs text-[#9ca3af] mt-0.5">{mood.desc}. It's okay to feel this way.</p>
                </div>
              </div>
            )}

            {/* ── Note ── */}
            <div
              className="bg-white rounded-2xl border border-[#f3e8ff] shadow-sm p-6"
              style={{ animation: 'fadeSlideUp 0.5s 0.2s ease both', opacity: 100 }}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-[#9ca3af] uppercase tracking-widest">Add a note</p>
                <span className={`text-xs tabular-nums ${note.length > MAX_NOTE * 0.9 ? 'text-red-400' : 'text-[#c4b5fd]'}`}>
                  {note.length} / {MAX_NOTE}
                </span>
              </div>

              <textarea
                ref={textareaRef}
                value={note}
                onChange={handleNote}
                placeholder="What's on your mind? You can write as much or as little as you like…"
                maxLength={MAX_NOTE}
                rows={3}
                className="w-full bg-[#faf8ff] border border-[#ede9fe] rounded-xl p-4 text-sm text-[#4b2c82] placeholder-[#c4b5fd] resize-none outline-none transition-all duration-200 focus:border-[#a855f7] focus:shadow-[0_0_0_3px_rgba(168,85,247,0.12)]"
              />
            </div>

            {/* ── Submit ── */}
            <div style={{ animation: 'fadeSlideUp 0.5s 0.3s ease both', opacity: 0 }}>
              <button
                onClick={submit}
                disabled={!selected || saving}
                className="w-full py-4 rounded-2xl font-semibold text-sm transition-all duration-200 relative overflow-hidden"
                style={{
                  background: selected
                    ? 'linear-gradient(135deg, #7c3aed, #6b21a8)'
                    : '#e9d5ff',
                  color: selected ? '#fff' : '#c4b5fd',
                  boxShadow: selected ? '0 8px 30px rgba(107,33,168,0.25)' : 'none',
                  transform: selected ? 'none' : 'none',
                  cursor: selected ? 'pointer' : 'not-allowed',
                }}
              >
                {saving ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Saving…
                  </span>
                ) : (
                  'Save Check-In'
                )}
              </button>
            </div>

            {/* ── Footer note ── */}
            <p
              className="text-center text-xs text-[#c4b5fd] pb-4"
              style={{ animation: 'fadeSlideUp 0.5s 0.4s ease both', opacity: 0 }}
            >
              All emotions are valid. Acknowledging how you feel is an important step toward well-being. 💜
            </p>

          </div>
        </div>
      </div>
    </>
  )
}