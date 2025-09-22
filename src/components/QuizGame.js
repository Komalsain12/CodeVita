// Sample React Component for Testing API Integration
// Save this as: src/components/QuizGenerator.js

import React, { useState } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const QuizGenerator = () => {
  const [file, setFile] = useState(null);
  const [questions, setQuestions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [levels, setLevels] = useState([]);
  const [selectedLevel, setSelectedLevel] = useState(1);

  // Load levels on component mount
  React.useEffect(() => {
    const fetchLevels = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/levels`);
        setLevels(response.data.levels);
      } catch (error) {
        console.error('Error fetching levels:', error);
      }
    };
    fetchLevels();
  }, []);

  const handleFileUpload = async () => {
    if (!file) {
      alert('Please select a PDF file');
      return;
    }
    
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('num_mcq', '3');
      formData.append('num_subjective', '2');
      formData.append('difficulty_level', selectedLevel.toString());
      
      const response = await axios.post(`${API_BASE_URL}/generate-from-pdf`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setQuestions(response.data);
    } catch (error) {
      console.error('Error generating questions:', error);
      alert('Error generating questions. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const gradeSubjectiveAnswer = async (question, answer) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/evaluate-subjective`, {
        question: question,
        student_answer: answer,
        reference_answer: null
      });
      
      alert(`Score: ${response.data.final_score}/10\nMethod: ${response.data.evaluation_method}`);
    } catch (error) {
      console.error('Error grading answer:', error);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>🎓 Educational Quiz Generator</h1>
      
      {/* Level Selection */}
      <div style={{ marginBottom: '20px' }}>
        <h3>Select Difficulty Level:</h3>
        <select 
          value={selectedLevel} 
          onChange={(e) => setSelectedLevel(parseInt(e.target.value))}
          style={{ padding: '5px', fontSize: '16px' }}
        >
          {levels.slice(0, 10).map(level => (
            <option key={level.level} value={level.level}>
              Level {level.level} - {level.difficulty}
            </option>
          ))}
        </select>
      </div>

      {/* PDF Upload */}
      <div style={{ marginBottom: '20px', padding: '20px', border: '2px dashed #ccc', borderRadius: '8px' }}>
        <h3>📄 Upload PDF:</h3>
        <input 
          type="file" 
          accept=".pdf"
          onChange={(e) => setFile(e.target.files[0])}
          style={{ marginBottom: '10px' }}
        />
        <br />
        <button 
          onClick={handleFileUpload} 
          disabled={!file || loading}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: loading ? '#ccc' : '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? '⏳ Generating Questions...' : '🚀 Generate Questions'}
        </button>
      </div>

      {/* Display Questions */}
      {questions && (
        <div>
          <h2>✅ Generated Questions:</h2>
          
          {/* MCQ Questions */}
          {questions.questions.mcq_questions && (
            <div style={{ marginBottom: '30px' }}>
              <h3>🎯 Multiple Choice Questions:</h3>
              {questions.questions.mcq_questions.map((q, index) => (
                <div key={index} style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                  <p><strong>Q{index + 1}:</strong> {q.question}</p>
                  <div style={{ marginLeft: '20px' }}>
                    {Object.entries(q.options).map(([key, value]) => (
                      <p key={key} style={{ 
                        color: key === q.answer ? 'green' : 'black',
                        fontWeight: key === q.answer ? 'bold' : 'normal'
                      }}>
                        {key}: {value} {key === q.answer && '✅'}
                      </p>
                    ))}
                  </div>
                  <p><strong>Explanation:</strong> {q.explanation}</p>
                </div>
              ))}
            </div>
          )}

          {/* Subjective Questions */}
          {questions.questions.subjective_questions && (
            <div>
              <h3>📝 Subjective Questions:</h3>
              {questions.questions.subjective_questions.map((q, index) => (
                <div key={index} style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#fff3cd', borderRadius: '8px' }}>
                  <p><strong>Q{index + 1}:</strong> {q.question}</p>
                  <textarea 
                    placeholder="Type your answer here..."
                    style={{ width: '100%', height: '100px', padding: '10px', margin: '10px 0' }}
                    onBlur={(e) => {
                      if (e.target.value.trim()) {
                        gradeSubjectiveAnswer(q.question, e.target.value);
                      }
                    }}
                  />
                  <details>
                    <summary style={{ cursor: 'pointer', color: '#007bff' }}>👁️ View Sample Answer</summary>
                    <p style={{ marginTop: '10px', fontStyle: 'italic' }}>{q.sample_answer}</p>
                  </details>
                </div>
              ))}
            </div>
          )}

          {/* Metadata */}
          <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#e9ecef', borderRadius: '8px' }}>
            <h4>📊 Generation Info:</h4>
            <p>Difficulty Level: {questions.difficulty_level}</p>
            <p>Total Questions: {questions.questions.total_questions}</p>
            <p>Characters Processed: {questions.total_characters}</p>
            <details>
              <summary style={{ cursor: 'pointer', color: '#007bff' }}>📖 Text Preview</summary>
              <p style={{ marginTop: '10px', fontSize: '14px' }}>{questions.extracted_text_preview}</p>
            </details>
          </div>
        </div>
      )}

      {/* Level Map Preview */}
      {levels.length > 0 && (
        <div style={{ marginTop: '40px' }}>
          <h3>🗺️ Level Map Preview:</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', maxWidth: '400px' }}>
            {levels.slice(0, 15).map(level => (
              <div 
                key={level.level}
                style={{ 
                  padding: '10px', 
                  textAlign: 'center', 
                  backgroundColor: level.level <= selectedLevel ? '#28a745' : '#6c757d',
                  color: 'white', 
                  borderRadius: '5px',
                  fontSize: '12px'
                }}
              >
                L{level.level}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizGenerator;