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
from typing import Optional

# ---------- CONFIG ----------
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "your_api_key_here")
genai.configure(api_key=GEMINI_API_KEY)

# Initialize Gemini model
model = genai.GenerativeModel("gemini-1.5-flash")

# ---------- FASTAPI APP ----------
app = FastAPI(title="AI Assessment Backend", version="1.0")

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

class LevelProgress(BaseModel):
    user_id: str
    current_level: int = 1
    completed_levels: list = []
    total_score: int = 0
    mcq_accuracy: float = 0.0
    subjective_avg_score: float = 0.0

# ---------- HELPERS ----------
def extract_text_from_pdf(pdf_file: UploadFile) -> str:
    try:
        pdf_content = pdf_file.file.read()
        pdf_file.file.seek(0)
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(pdf_content))

        text = ""
        for page in pdf_reader.pages:
            extracted = page.extract_text()
            if extracted:
                text += extracted + "\n"

        if not text.strip():
            raise ValueError("No text could be extracted from the PDF")

        return text.strip()

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing PDF: {str(e)}")

# ---------- ENDPOINTS ----------

@app.post("/api/process-files")
async def process_files(file: UploadFile = File(...)):
    """
    Accepts PDF, TXT, CSV and returns extracted text.
    """
    try:
        filename = file.filename.lower()
        if filename.endswith(".pdf"):
            text = extract_text_from_pdf(file)
        elif filename.endswith(".txt") or filename.endswith(".csv"):
            raw = await file.read()
            text = raw.decode("utf-8", errors="ignore")
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
        Return JSON in format:
        {{ "score": 0 or 1, "feedback": "..." }}
        """
        response = model.generate_content(prompt)
        response_text = response.text.strip()
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        return json.loads(response_text.strip())
    except Exception as e:
        return {"error": f"Failed to grade answer: {str(e)}", "type": type(e).__name__}


@app.post("/generate-questions")
async def generate_questions(
    file: UploadFile = File(...),
    num_mcq: int = 3,
    num_subjective: int = 2,
    num_coding: int = 1,
    difficulty_level: int = 1
):
    """
    Generate MCQ, Subjective, and Coding questions from PDF.
    """
    try:
        if not file.filename.lower().endswith(".pdf"):
            raise HTTPException(status_code=400, detail="Only PDF files are allowed")

        extracted_text = extract_text_from_pdf(file)
        if len(extracted_text) > 4000:
            extracted_text = extracted_text[:4000] + "..."

        # --- MCQ Prompt ---
        mcq_prompt = f"""
        Based on this content:

        {extracted_text}

        Generate {num_mcq} MCQs at difficulty {difficulty_level}.
        JSON keys:
        - question
        - options
        - answer
        - explanation
        - difficulty
        - type: "mcq"
        """

        # --- Subjective Prompt ---
        subj_prompt = f"""
        Based on this content:

        {extracted_text}

        Generate {num_subjective} subjective/essay questions at difficulty {difficulty_level}.
        JSON keys:
        - question
        - sample_answer
        - keywords
        - difficulty
        - type: "subjective"
        """

        # --- Coding Prompt ---
        coding_prompt = f"""
        Based on this content:

        {extracted_text}

        Generate {num_coding} coding challenges at difficulty {difficulty_level}.
        Each must have:
        - question
        - input_format
        - output_format
        - constraints
        - examples (at least 2 with input and expected output)
        - starter_code (Python)
        - difficulty
        - type: "coding"
        """

        mcq_resp = model.generate_content(mcq_prompt)
        subj_resp = model.generate_content(subj_prompt)
        coding_resp = model.generate_content(coding_prompt)

        try:
            mcq = json.loads(mcq_resp.text.strip().removeprefix("```json").removesuffix("```").strip())
            subj = json.loads(subj_resp.text.strip().removeprefix("```json").removesuffix("```").strip())
            coding = json.loads(coding_resp.text.strip().removeprefix("```json").removesuffix("```").strip())
            return {
                "mcq_questions": mcq,
                "subjective_questions": subj,
                "coding_questions": coding,
                "total": len(mcq) + len(subj) + len(coding),
                "preview": extracted_text[:200] + "..." if len(extracted_text) > 200 else extracted_text
            }
        except Exception as e:
            return {
                "error": f"JSON parsing failed: {str(e)}",
                "mcq_raw": mcq_resp.text,
                "subj_raw": subj_resp.text,
                "coding_raw": coding_resp.text
            }

    except Exception as e:
        return {"error": f"Failed to generate questions: {str(e)}", "type": type(e).__name__}


@app.post("/evaluate-subjective")
async def evaluate_subjective_answer(req: SubjectiveAnswerRequest):
    """
    Evaluate subjective answers using LLM and cosine similarity.
    """
    try:
        llm_prompt = f"""
        Evaluate this answer:

        Question: {req.question}
        Student Answer: {req.student_answer}
        {f"Reference Answer: {req.reference_answer}" if req.reference_answer else ""}

        Return JSON:
        - accuracy_score
        - depth_score
        - originality_score
        - clarity_score
        - overall_score
        - feedback
        - strengths
        - improvements
        """
        llm_resp = model.generate_content(llm_prompt)
        llm_text = llm_resp.text.strip().removeprefix("```json").removesuffix("```").strip()
        try:
            llm_eval = json.loads(llm_text)
        except Exception:
            llm_eval = {"raw": llm_resp.text, "error": "LLM parsing failed"}

        similarity_score = 0.0
        if req.reference_answer:
            try:
                vec = TfidfVectorizer(stop_words="english")
                tfidf = vec.fit_transform([req.student_answer.lower(), req.reference_answer.lower()])
                similarity_score = float(cosine_similarity(tfidf[0:1], tfidf[1:2])[0][0])
            except:
                similarity_score = 0.0

        return {
            "llm_evaluation": llm_eval,
            "similarity_score": similarity_score,
            "final_score": (llm_eval.get("overall_score", 0) + similarity_score * 10) / 2 if req.reference_answer else llm_eval.get("overall_score", 0),
            "method": "LLM+Cosine" if req.reference_answer else "LLM Only"
        }
    except Exception as e:
        return {"error": f"Failed to evaluate subjective answer: {str(e)}", "type": type(e).__name__}


@app.post("/adaptive-next-level")
async def adaptive_next_level(progress: LevelProgress):
    """
    Adaptive Difficulty Engine: RL-inspired level progression.
    """
    try:
        next_level = progress.current_level
        if progress.mcq_accuracy >= 0.8 and progress.subjective_avg_score >= 7:
            next_level += 1
        elif progress.mcq_accuracy < 0.5 or progress.subjective_avg_score < 5:
            next_level = max(1, next_level - 1)
        else:
            next_level = progress.current_level
        next_level = min(next_level, 30)
        return {
            "current_level": progress.current_level,
            "next_level": next_level,
            "decision": (
                "increased" if next_level > progress.current_level
                else "decreased" if next_level < progress.current_level
                else "unchanged"
            )
        }
    except Exception as e:
        return {"error": f"Adaptive engine failed: {str(e)}", "type": type(e).__name__}


@app.get("/levels")
async def get_level_map():
    """
    Static map of 30 levels.
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
                "coding_count": min(1 + (i // 15), 3),
                "unlock_criteria": {
                    "min_mcq_accuracy": min(0.5 + ((i-1) * 0.01), 0.8),
                    "min_subjective_score": min(5 + ((i-1) * 0.1), 8)
                },
                "rewards": {"points": i * 100, "badge": f"Level {i} Master" if i % 5 == 0 else None}
            })
        return {"levels": levels, "total_levels": 30, "theme": "Educational Quest"}
    except Exception as e:
        return {"error": f"Failed to get level map: {str(e)}", "type": type(e).__name__}


# ---------- RUN LOCALLY ----------
if __name__ == "__main__":
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
