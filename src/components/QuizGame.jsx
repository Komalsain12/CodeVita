import React, { useState, useEffect } from "react";
import axios from "axios";
import robotGif from "../assets/robot.png"; // 👈 Add a small walking robot gif/png in /src/assets

const API_BASE_URL = "http://localhost:8000";

const QuizGenerator = () => {
  const [file, setFile] = useState(null);
  const [questions, setQuestions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [levels, setLevels] = useState([]);
  const [currentLevel, setCurrentLevel] = useState(1);

  // Fetch levels
  useEffect(() => {
    const fetchLevels = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/levels`);
        setLevels(response.data.levels);
      } catch (error) {
        console.error("Error fetching levels:", error);
      }
    };
    fetchLevels();
  }, []);

  const handleFileUpload = async () => {
    if (!file) {
      alert("Please select a PDF file");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("num_mcq", "3");
      formData.append("num_subjective", "2");
      formData.append("difficulty_level", currentLevel.toString());

      const response = await axios.post(`${API_BASE_URL}/generate-from-pdf`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setQuestions(response.data);
    } catch (error) {
      console.error("Error generating questions:", error);
      alert("Error generating questions. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (isCorrect) => {
    if (isCorrect) {
      alert(`✅ Correct! Moving to Level ${currentLevel + 1}`);
      setCurrentLevel((prev) => Math.min(prev + 1, 30));
    } else {
      alert("❌ Incorrect, try again!");
    }
  };

  // Predefined zig-zag tile positions
  const tilePositions = Array.from({ length: 30 }, (_, i) => ({
    x: 100 + (i % 6) * 150 + (i % 12 >= 6 ? 50 : 0), // zig-zag effect
    y: 100 + Math.floor(i / 6) * 120,
    level: i + 1,
  }));

  return (
    <div
      style={{
        backgroundImage: "url('/forest-bg.jpg')", // 👈 put your forest image in public/ as forest-bg.jpg
        backgroundSize: "cover",
        backgroundPosition: "center",
        minHeight: "100vh",
        padding: "20px",
      }}
    >
      <h1 style={{ color: "white", textAlign: "center" }}>🤖 AI Quiz Adventure</h1>

      {/* Upload */}
      <div style={{ margin: "20px auto", maxWidth: "500px", padding: "20px", background: "#222", borderRadius: "10px", color: "white" }}>
        <h3>📄 Upload PDF</h3>
        <input type="file" accept=".pdf" onChange={(e) => setFile(e.target.files[0])} />
        <button
          onClick={handleFileUpload}
          disabled={!file || loading}
          style={{ marginLeft: "10px", padding: "10px 15px" }}
        >
          {loading ? "⏳ Generating..." : "🚀 Generate Questions"}
        </button>
      </div>

      {/* Game Map */}
      <div style={{ position: "relative", width: "100%", height: "600px" }}>
        {tilePositions.map((tile) => (
          <div
            key={tile.level}
            style={{
              position: "absolute",
              left: tile.x,
              top: tile.y,
              width: "80px",
              height: "60px",
              background: tile.level <= currentLevel ? "#28a745" : "#6c757d",
              color: "white",
              borderRadius: "8px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              fontSize: "14px",
              fontWeight: "bold",
              border: "2px solid black",
            }}
          >
            {tile.level}
          </div>
        ))}

        {/* Robot Avatar */}
        {tilePositions[currentLevel - 1] && (
          <img
            src={robotGif}
            alt="robot"
            style={{
              position: "absolute",
              left: tilePositions[currentLevel - 1].x + 20,
              top: tilePositions[currentLevel - 1].y - 40,
              width: "50px",
              transition: "all 0.5s ease-in-out",
            }}
          />
        )}
      </div>

      {/* Questions Section */}
      {questions && (
        <div style={{ marginTop: "30px", background: "white", padding: "20px", borderRadius: "10px" }}>
          <h2>Questions (Level {currentLevel})</h2>
          {questions.questions.mcq_questions?.map((q, index) => (
            <div key={index} style={{ marginBottom: "20px" }}>
              <p><strong>{q.question}</strong></p>
              {Object.entries(q.options).map(([key, value]) => (
                <button
                  key={key}
                  style={{ display: "block", margin: "5px 0", padding: "8px" }}
                  onClick={() => handleAnswer(key === q.answer)}
                >
                  {key}: {value}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuizGenerator;
