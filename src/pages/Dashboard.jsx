import { useState } from "react";
import FileUpload from "../components/FileUpload";
import QuizGame from "../components/QuizGame";
import { Flame, Star, Award, Crown } from "lucide-react";

export default function Dashboard() {
  const [username] = useState("codevita_user123");
  const [levels, setLevels] = useState([]);
  const [currentLevel, setCurrentLevel] = useState(1);

  // Fake stats
  const [xp] = useState(240);
  const [rank] = useState("Bronze");
  const [badges] = useState(3);
  const [streak] = useState(5);

  const leaderboard = [
    { name: "Alice", score: 400 },
    { name: "Bob", score: 350 },
    { name: "Charlie", score: 280 },
    { name: "You", score: 240 },
  ];

  const handleDataProcessed = async () => {
    try {
      // Fetch levels from backend
      const resp = await fetch("http://localhost:8000/levels");
      const data = await resp.json();
      setLevels(data.levels || []);
    } catch (err) {
      console.error("Failed to load levels:", err);
    }
  };

  const handleLevelComplete = (isCorrect) => {
    if (isCorrect) {
      alert(`Level ${currentLevel} completed!`);
      setCurrentLevel((prev) => prev + 1);
    } else {
      alert("Incorrect answer, try again!");
    }
  };

  return (
    <div
      className="min-h-screen font-mono text-gray-100 bg-black"
      style={{
        backgroundImage: "url('/bg.gif')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Header */}
      <header className="flex items-center px-6 py-4 border-b border-gray-700 bg-black/80">
        <h1 className="text-2xl font-bold text-yellow-400">CodeVita</h1>
      </header>

      {/* Welcome */}
      <div className="max-w-5xl px-4 mx-auto mt-6">
        <div className="inline-block px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg shadow-md">
          <p className="text-gray-200">
            Welcome back, <span className="text-cyan-400">@{username}</span> 🚀
          </p>
        </div>
      </div>

      <main className="grid max-w-5xl grid-cols-1 gap-6 px-4 mx-auto mt-8 md:grid-cols-3">
        {/* Main Game/Upload Section */}
        <div className="space-y-6 md:col-span-2">
          {!levels.length ? (
            <div className="p-6 border border-gray-700 shadow-lg bg-gray-900/90 rounded-xl">
              <h2 className="mb-4 text-lg font-bold text-cyan-400">
                Upload & Prompt
              </h2>
              <FileUpload onDataProcessed={handleDataProcessed} />
            </div>
          ) : (
            <QuizGame
              level={currentLevel}
              onLevelComplete={handleLevelComplete}
            />
          )}
        </div>

        {/* Right section */}
        <div className="space-y-6">
          {/* Achievements */}
          <div className="p-6 border border-gray-700 shadow-lg bg-gray-900/90 rounded-xl">
            <h2 className="mb-4 text-lg font-bold text-cyan-400">Achievements</h2>
            <p className="mb-2">
              <Star className="inline w-5 h-5 mr-2 text-yellow-400" /> Total XP:{" "}
              {xp}
            </p>
            <p className="mb-2">
              <Crown className="inline w-5 h-5 mr-2 text-purple-400" /> Rank:{" "}
              {rank}
            </p>
            <p className="mb-2">
              <Award className="inline w-5 h-5 mr-2 text-cyan-400" /> Badges:{" "}
              {badges}
            </p>
            <p>
              <Flame className="inline w-5 h-5 mr-2 text-orange-500" /> Day
              Streak: {streak} 🔥
            </p>
          </div>

          {/* Leaderboard */}
          <div className="p-6 border border-gray-700 shadow-lg bg-gray-900/90 rounded-xl">
            <h2 className="mb-4 text-lg font-bold text-cyan-400">Leaderboard</h2>
            <ul className="space-y-2">
              {leaderboard.map((user, i) => (
                <li
                  key={i}
                  className="flex justify-between text-sm text-gray-200"
                >
                  <span>{user.name}</span>
                  <span className="font-bold text-yellow-400">
                    {user.score}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
