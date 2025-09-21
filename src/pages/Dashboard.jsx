"use client"

import { useState } from "react"
import  FileUpload  from "../components/FileUpload"
import { Flame, Star, Award, Crown } from "lucide-react"

export default function Dashboard() {
  const [username] = useState("codevita_user123")
  const [prompt, setPrompt] = useState("")

  // Fake user stats
  const [xp] = useState(240)
  const [rank] = useState("Bronze")
  const [badges] = useState(3)
  const [streak] = useState(5)

  // Fake leaderboard
  const leaderboard = [
    { name: "Alice", score: 400 },
    { name: "Bob", score: 350 },
    { name: "Charlie", score: 280 },
    { name: "You", score: 240 },
  ]

  return (
    <div
      className="min-h-screen bg-black text-gray-100 font-mono"
      style={{
        backgroundImage: "url('/bg.gif')", // put your GIF in public/bg.gif
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Header */}
      <header className="px-6 py-4 flex items-center bg-black/80 border-b border-gray-700">
        <h1 className="text-2xl font-bold text-yellow-400">CodeVita</h1>
      </header>

      {/* Welcome Bar */}
      <div className="max-w-5xl mx-auto mt-6 px-4">
        <div className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 shadow-md inline-block">
          <p className="text-gray-200">
            Welcome back, <span className="text-cyan-400">@{username}</span>! Let’s get it. 🚀
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <main className="max-w-5xl mx-auto mt-8 px-4 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Section (Upload + Prompt) */}
        <div className="md:col-span-2 space-y-6">
          {/* Upload */}
          <div className="bg-gray-900/90 border border-gray-700 rounded-xl p-6 shadow-lg">
            <h2 className="text-lg font-bold mb-4 text-cyan-400">Upload & Prompt</h2>
            <FileUpload onDataProcessed={() => {}} />

            {/* Prompt Box */}
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Tell AI what to do (e.g., Analyze student performance...)"
              className="w-full mt-4 p-3 rounded-lg bg-gray-800 border border-gray-600 text-gray-100 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              rows={3}
            />
            <button
              className="mt-3 px-5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg"
              onClick={() => {
                if (prompt.trim()) {
                  alert(`AI will process: ${prompt}`)
                  setPrompt("")
                }
              }}
            >
              Submit Prompt
            </button>
          </div>
        </div>

        {/* Right Section (Achievements + Leaderboard) */}
        <div className="space-y-6">
          {/* Achievements */}
          <div className="bg-gray-900/90 border border-gray-700 rounded-xl p-6 shadow-lg">
            <h2 className="text-lg font-bold mb-4 text-cyan-400">Achievements</h2>
            <p className="mb-2"><Star className="inline h-5 w-5 text-yellow-400 mr-2" /> Total XP: {xp}</p>
            <p className="mb-2"><Crown className="inline h-5 w-5 text-purple-400 mr-2" /> Rank: {rank}</p>
            <p className="mb-2"><Award className="inline h-5 w-5 text-cyan-400 mr-2" /> Badges: {badges}</p>
            <p><Flame className="inline h-5 w-5 text-orange-500 mr-2" /> Day Streak: {streak} 🔥</p>
          </div>

          {/* Leaderboard */}
          <div className="bg-gray-900/90 border border-gray-700 rounded-xl p-6 shadow-lg">
            <h2 className="text-lg font-bold mb-4 text-cyan-400">Leaderboard</h2>
            <ul className="space-y-2">
              {leaderboard.map((user, i) => (
                <li key={i} className="flex justify-between text-sm text-gray-200">
                  <span>{user.name}</span>
                  <span className="font-bold text-yellow-400">{user.score}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}
