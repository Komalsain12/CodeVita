# ---------- IMPORTS ----------
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import google.generativeai as genai
import uvicorn
import os
import json
import PyPDF2
import io
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from typing import List, Optional

# ---------- CONFIG ----------
# Set your Google Gemini API key here or via environment variable
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "your_api_key_here")
genai.configure(api_key=GEMINI_API_KEY)

# Initialize the Gemini model
model = genai.GenerativeModel("gemini-1.5-flash")

# ---------- FASTAPI APP ----------
app = FastAPI(title="AI Assessment Backend", version="1.0")

# Add CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- DATA MODELS ----------
class AnswerRequest(BaseModel):
    question: str
    correct_answer: str
    student_answer: str

class SubjectiveAnswerRequest(BaseModel):
    question: str
    student_answer: str
    reference_answer: Optional[str] = None

class QuestionGenerationRequest(BaseModel):
    num_mcq: int = 3
    num_subjective: int = 2
    difficulty_level: int = 1

class LevelProgress(BaseModel):
    user_id: str
    current_level: int = 1
    completed_levels: list = []
    total_score: int = 0
    mcq_accuracy: float = 0.0
    subjective_avg_score: float = 0.0

# ---------- HELPER FUNCTIONS ----------
def extract_text_from_pdf(pdf_file: UploadFile) -> str:
    """
    Extract text content from uploaded PDF file.
    """
    try:
        pdf_content = pdf_file.file.read()
        pdf_file.file.seek(0)
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(pdf_content))

        text = ""
        for page_num in range(len(pdf_reader.pages)):
            page = pdf_reader.pages[page_num]
            text += page.extract_text() + "\n"

        if not text.strip():
            raise ValueError("No text could be extracted from the PDF")

        return text.strip()

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing PDF: {str(e)}")

# ---------- ENDPOINTS ----------

@app.post("/api/process-files")
async def process_files(file: UploadFile = File(...)):
    """
    Accepts a file upload (PDF, TXT, CSV) and returns extracted text or error.
    """
    try:
        filename = file.filename.lower()
        if filename.endswith(".pdf"):
            text = extract_text_from_pdf(file)
        elif filename.endswith(".txt"):
            text = (await file.read()).decode("utf-8")
        elif filename.endswith(".csv"):
            text = (await file.read()).decode("utf-8")
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type. Only PDF, TXT, CSV allowed.")

        return JSONResponse(content={"text": text})

    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=400)


@app.post("/answer")
def grade_answer(req: AnswerRequest):
    """
    Grade a student's answer using AI.
    """
    try:
        prompt = f"""
        Question: {req.question}
        Correct Answer: {req.correct_answer}
        Student Answer: {req.student_answer}

        Grade this as correct (1) or incorrect (0).
        If incorrect, explain why in one short sentence.
        Return JSON in this format:
        {{
          "score": 0 or 1,
          "feedback": "..."
        }}
        """

        response = model.generate_content(prompt)

        response_text = response.text.strip()
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        response_text = response_text.strip()

        result = json.loads(response_text)
        return result

    except Exception as e:
        return {"error": f"Failed to grade answer: {str(e)}", "type": type(e).__name__}


@app.post("/generate-from-pdf")
async def generate_questions_from_pdf(
    file: UploadFile = File(...),
    num_mcq: int = 3,
    num_subjective: int = 2,
    difficulty_level: int = 1
):
    """
    Generate both MCQ and subjective questions from uploaded PDF file using AI.
    """
    try:
        if not file.filename.lower().endswith(".pdf"):
            raise HTTPException(status_code=400, detail="Only PDF files are allowed")

        extracted_text = extract_text_from_pdf(file)
        if len(extracted_text) > 4000:
            extracted_text = extracted_text[:4000] + "..."

        mcq_prompt = f"""
        Based on this content:

        {extracted_text}

        Generate {num_mcq} MCQs at difficulty {difficulty_level}.
        Return JSON array with:
        - question
        - options (A-D)
        - answer
        - explanation
        - difficulty
        - type: "mcq"
        """

        subjective_prompt = f"""
        Based on this content:

        {extracted_text}

        Generate {num_subjective} subjective questions at difficulty {difficulty_level}.
        Return JSON array with:
        - question
        - sample_answer
        - keywords
        - difficulty
        - type: "subjective"
        """

        mcq_response = model.generate_content(mcq_prompt)
        subjective_response = model.generate_content(subjective_prompt)

        try:
            mcq_text = mcq_response.text.strip().removeprefix("```json").removesuffix("```").strip()
            subj_text = subjective_response.text.strip().removeprefix("```json").removesuffix("```").strip()

            mcq_questions = json.loads(mcq_text)
            subjective_questions = json.loads(subj_text)

            return {
                "questions": {
                    "mcq_questions": mcq_questions,
                    "subjective_questions": subjective_questions,
                    "total_questions": len(mcq_questions) + len(subjective_questions),
                },
                "extracted_text_preview": extracted_text[:200] + "..." if len(extracted_text) > 200 else extracted_text,
                "total_characters": len(extracted_text),
                "difficulty_level": difficulty_level,
            }
        except Exception as e:
            return {"error": f"JSON parsing failed: {str(e)}", "mcq_raw": mcq_response.text, "subjective_raw": subjective_response.text}

    except Exception as e:
        return {"error": f"Failed to process PDF and generate questions: {str(e)}", "type": type(e).__name__}


@app.post("/evaluate-subjective")
async def evaluate_subjective_answer(req: SubjectiveAnswerRequest):
    """
    Evaluate subjective answers using LLM grading and cosine similarity.
    """
    try:
        llm_prompt = f"""
        Evaluate this subjective answer:

        Question: {req.question}
        Student Answer: {req.student_answer}
        {f"Reference Answer: {req.reference_answer}" if req.reference_answer else ""}

        Give scores (0-10) for accuracy, depth, originality, clarity.
        Return JSON with:
        - accuracy_score
        - depth_score
        - originality_score
        - clarity_score
        - overall_score
        - feedback
        - strengths
        - improvements
        """

        llm_response = model.generate_content(llm_prompt)
        llm_text = llm_response.text.strip().removeprefix("```json").removesuffix("```").strip()

        try:
            llm_evaluation = json.loads(llm_text)
        except Exception:
            llm_evaluation = {"raw": llm_response.text, "error": "LLM parsing failed"}

        similarity_score = 0.0
        if req.reference_answer:
            try:
                vectorizer = TfidfVectorizer(stop_words="english")
                tfidf_matrix = vectorizer.fit_transform([req.student_answer.lower(), req.reference_answer.lower()])
                similarity_score = float(cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0])
            except:
                similarity_score = 0.0

        return {
            "llm_evaluation": llm_evaluation,
            "similarity_score": similarity_score,
            "final_score": (llm_evaluation.get("overall_score", 0) + similarity_score * 10) / 2 if req.reference_answer else llm_evaluation.get("overall_score", 0),
            "evaluation_method": "LLM + Cosine Similarity" if req.reference_answer else "LLM Only",
        }

    except Exception as e:
        return {"error": f"Failed to evaluate subjective answer: {str(e)}", "type": type(e).__name__}


@app.post("/level-progress")
async def update_level_progress(progress: LevelProgress):
    """
    Update user progress in the gamified level system.
    """
    try:
        can_advance = False
        if progress.current_level < 30:
            if progress.mcq_accuracy >= 0.7 and progress.subjective_avg_score >= 6.0:
                can_advance = True
                progress.current_level += 1
                progress.completed_levels.append(progress.current_level - 1)

        return {
            "user_progress": progress,
            "can_advance": can_advance,
            "next_level_unlocked": progress.current_level if can_advance else None,
            "total_levels": 30,
            "completion_percentage": len(progress.completed_levels) / 30 * 100,
        }

    except Exception as e:
        return {"error": f"Failed to update progress: {str(e)}", "type": type(e).__name__}


@app.get("/levels")
async def get_level_map():
    """
    Get the Candy-Crush-like level map with 30 levels.
    """
    try:
        levels = []
        for i in range(1, 31):
            levels.append({
                "level": i,
                "title": f"Level {i}",
                "description": f"Master level {i} concepts",
                "difficulty": "Easy" if i <= 10 else "Medium" if i <= 20 else "Hard",
                "mcq_count": min(3 + (i // 5), 10),
                "subjective_count": min(1 + (i // 10), 5),
                "required_accuracy": min(0.5 + (i * 0.01), 0.8),
                "unlock_criteria": {
                    "previous_level_completed": i > 1,
                    "min_mcq_accuracy": min(0.5 + ((i-1) * 0.01), 0.8),
                    "min_subjective_score": min(5 + ((i-1) * 0.1), 8),
                },
                "rewards": {"points": i * 100, "badge": f"Level {i} Master" if i % 5 == 0 else None},
            })

        return {"levels": levels, "total_levels": 30, "game_theme": "Educational Quest"}

    except Exception as e:
        return {"error": f"Failed to get level map: {str(e)}", "type": type(e).__name__}

# ---------- RUN LOCALLY ----------
if __name__ == "__main__":
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
