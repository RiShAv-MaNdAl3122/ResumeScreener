import time
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import JSONResponse
from resume_parser import extract_text_from_pdf, extract_text_from_docx
from details_extractor import extract_details
from preprocess import preprocess_text
from skill_extractor import extract_skills, compare_skills
from similarity import calculate_similarity
from scoring import calculate_final_score, get_resume_strength, calculate_keyword_bonus
from logger import logger
from utils.safe_execute import safe_execute

app = FastAPI(title="AI Resume Screener")

@app.post("/analyze")
async def analyze_resume(
    resume: UploadFile = File(...),
    jd: str = Form(...)
):
    start_time = time.perf_counter()
    logger.info(f"Resume uploaded: {resume.filename}")
    
    try:
        file_bytes = await resume.read()
    except Exception as e:
        logger.error(f"ERROR: Failed to read uploaded file - {str(e)}")
        return JSONResponse(status_code=400, content={"error": "Unable to process resume"})
        
    def process_logic():
        if not (resume.filename.endswith('.pdf') or resume.filename.endswith('.docx')):
            raise ValueError("Unsupported file format")
            
        # 1. Resume Parsing
        logger.info("Parsing started")
        if resume.filename.endswith('.pdf'):
            raw_resume_text = extract_text_from_pdf(file_bytes)
        else:
            raw_resume_text = extract_text_from_docx(file_bytes)
            
        if not raw_resume_text.strip():
            raise ValueError("Empty Resume")
            
        logger.info("Parsing success")
        logger.info(f"Characters extracted: {len(raw_resume_text)}")
        
        # 1b. Extract candidate contact info + photo
        candidate_info = extract_details(raw_resume_text, file_bytes=file_bytes, filename=resume.filename)
        logger.info(f"Candidate name: {candidate_info['candidate_name']}, email: {candidate_info['candidate_email']}")
        logger.info(f"Candidate photo extracted: {'yes' if candidate_info.get('candidate_photo') else 'no'}")
        
        # 2. NLP Processing
        clean_resume_text = preprocess_text(raw_resume_text)
        clean_jd_text = preprocess_text(jd)
        
        if not clean_jd_text.strip():
            raise ValueError("Empty JD")
        
        # 3. Skill Extraction
        resume_skills = extract_skills(raw_resume_text)
        jd_skills = extract_skills(jd)
        
        matched_skills, missing_skills = compare_skills(resume_skills, jd_skills)
        
        logger.info(f"Matched Skills: {matched_skills}")
        logger.info(f"Missing Skills: {missing_skills}")
        
        skill_match_percentage = 0.0
        if len(jd_skills) > 0:
            skill_match_percentage = round((len(matched_skills) / len(jd_skills)) * 100, 2)
        elif len(jd_skills) == 0 and len(resume_skills) >= 0:
            skill_match_percentage = 100.0
            
        # 4. Similarity Engine
        similarity_score = calculate_similarity(clean_resume_text, clean_jd_text)
        logger.info(f"Similarity generated: {round(similarity_score, 2)}")
        
        # 5. Final Score Formula & Keyword Bonus
        keyword_bonus = calculate_keyword_bonus(raw_resume_text)
        
        scoring_result = calculate_final_score(
            similarity_score=similarity_score,
            matched_skills_count=len(matched_skills),
            total_jd_skills_count=len(jd_skills),
            keyword_bonus=keyword_bonus
        )
        final_score = scoring_result["final_score"]
        score_breakdown = scoring_result["score_breakdown"]
        
        logger.info(f"Final score: {final_score}")
        
        # 6. Output format matching user requirements
        resume_strength = get_resume_strength(final_score)
        
        # 7. Generate Explanations
        explanation = [f"{skill.capitalize()} skill matched" for skill in matched_skills]
        explanation += [f"{skill.upper() if len(skill) <= 3 else skill.capitalize()} missing" for skill in missing_skills]
        
        return {
            "candidate_name": candidate_info["candidate_name"],
            "candidate_email": candidate_info["candidate_email"],
            "candidate_phone": candidate_info.get("candidate_phone"),
            "experience_years": candidate_info.get("experience_years"),
            "education": candidate_info.get("education"),
            "candidate_photo": candidate_info.get("candidate_photo"),
            "score": final_score,
            "score_breakdown": score_breakdown,
            "similarity": round(similarity_score, 2),
            "matched_skills": matched_skills,
            "missing_skills": missing_skills,
            "skill_match_percentage": skill_match_percentage,
            "resume_strength": resume_strength,
            "explanation": explanation
        }

    # Use safe_execute wrapper for stability
    result = safe_execute(process_logic, "ERROR:")
    
    end_time = time.perf_counter()
    logger.info(f"Resume processed in {end_time - start_time:.2f} seconds")
    
    if result is None:
        return JSONResponse(status_code=400, content={"error": "Unable to process resume"})
        
    return result
