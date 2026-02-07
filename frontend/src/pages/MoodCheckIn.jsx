import React, { useState } from 'react'
import { submitMood } from "../api"

const MOODS = [
  { id: 'happy', label: 'Happy', emoji: '😊', color: 'bg-yellow-400' },
  { id: 'calm', label: 'Calm', emoji: '😌', color: 'bg-sky-400' },
  { id: 'neutral', label: 'Neutral', emoji: '😐', color: 'bg-gray-400' },
  { id: 'anxious', label: 'Anxious', emoji: '😰', color: 'bg-pink-400' },
  { id: 'sad', label: 'Sad', emoji: '😢', color: 'bg-indigo-600' },
  { id: 'angry', label: 'Angry', emoji: '😡', color: 'bg-rose-500' }
]

export default function MoodCheckIn() {
  const [selected, setSelected] = useState(null)
  const [note, setNote] = useState('')

  async function submit() {
    if (!selected) return alert("Select a mood")

    try {
      await submitMood({ mood: selected, note })
      alert("Mood saved ✅")
      setSelected(null)
      setNote("")
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="card">
        <h2 className="text-4xl font-semibold text-center huge-hero mb-2">Daily Mood Check-In</h2>
        <p className="text-center text-[#6b21a8]/80 mb-6">How are you feeling today? Take a moment to acknowledge your emotions.</p>

        <h4 className="text-lg font-semibold mb-4">Select Your Mood</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
          {MOODS.map(m => (
            <button
              key={m.id}
              onClick={() => setSelected(m.id)}
              className={`mood-card transition-all ${
                selected === m.id ? 'ring-4 ring-[#6b21a8] scale-105' : ''
              }`}
            >
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center ${m.color} text-3xl`}
              >
                {m.emoji}
              </div>
              <div className="font-medium text-[#4b2c82] mt-2">{m.label}</div>
            </button>
          ))}
        </div>

        <h4 className="text-lg font-semibold mb-2">Add a Note (Optional)</h4>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="What's on your mind?"
          maxLength={500}
          className="w-full border border-[#f0e6ff] rounded-lg p-4 mb-4 min-h-[120px] resize-none"
        />

        <div className="flex items-center justify-between gap-4">
          <button onClick={submit} className="btn-primary w-full">Save Check-In</button>
        </div>

        <div className="mt-6 p-4 border border-[#f3e2ff] rounded-lg text-center text-[#6b21a8]">
          <strong>Remember:</strong> All emotions are valid. Acknowledging how you feel is an important step toward well-being.
        </div>
      </div>
    </div>
  )
}
