import os
import csv
from resume_parser import extract_text_from_pdf, extract_text_from_docx
from preprocess import preprocess_text
from skill_extractor import extract_skills, compare_skills
from similarity import calculate_similarity
from scoring import calculate_final_score, get_resume_strength, calculate_keyword_bonus
from utils.safe_execute import safe_execute

JD_TEXT = "We are looking for a software engineer with Python, SQL, React, AWS, Node.js, and Machine Learning experience. Must be a backend developer with cloud and database deployment skills."

def process_single_resume(filepath: str, jd: str):
    def process_logic():
        with open(filepath, "rb") as f:
            file_bytes = f.read()
            
        if filepath.endswith('.pdf'):
            raw_resume_text = extract_text_from_pdf(file_bytes)
        else:
            raw_resume_text = extract_text_from_docx(file_bytes)
            
        if not raw_resume_text.strip():
            raise ValueError("Empty Resume")
            
        clean_resume_text = preprocess_text(raw_resume_text)
        clean_jd_text = preprocess_text(jd)
        
        resume_skills = extract_skills(raw_resume_text)
        jd_skills = extract_skills(jd)
        
        matched_skills, missing_skills = compare_skills(resume_skills, jd_skills)
        similarity_score = calculate_similarity(clean_resume_text, clean_jd_text)
        keyword_bonus = calculate_keyword_bonus(raw_resume_text)
        
        scoring_result = calculate_final_score(
            similarity_score=similarity_score,
            matched_skills_count=len(matched_skills),
            total_jd_skills_count=len(jd_skills),
            keyword_bonus=keyword_bonus
        )
        final_score = scoring_result["final_score"]
        resume_strength = get_resume_strength(final_score)
        
        return {
            "score": final_score,
            "matched_skills": matched_skills,
            "missing_skills": missing_skills,
            "resume_strength": resume_strength
        }
        
    return safe_execute(process_logic, f"ERROR processing {filepath}:", None)

def main():
    resumes_dir = "test_resumes"
    if not os.path.exists(resumes_dir):
        print(f"Directory {resumes_dir} not found.")
        return
        
    results = []
    
    for filename in os.listdir(resumes_dir):
        if filename.endswith(".pdf") or filename.endswith(".docx"):
            filepath = os.path.join(resumes_dir, filename)
            res = process_single_resume(filepath, JD_TEXT)
            if res:
                results.append({
                    "candidate_name": filename.rsplit('.', 1)[0],
                    "original_ext": filename.rsplit('.', 1)[1],
                    "score": res["score"],
                    "matched_skills": res["matched_skills"],
                    "missing_skills": res["missing_skills"],
                    "resume_strength": res["resume_strength"]
                })
                
    # Sort descending
    results.sort(key=lambda x: x["score"], reverse=True)
    
    print("====================================")
    print("AI Resume Ranking")
    print("====================================\n")
    
    # Export to CSV and print
    with open("batch_results.csv", mode="w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["rank", "candidate_name", "score", "matched_skills", "missing_skills", "resume_strength"])
        
        for idx, r in enumerate(results, 1):
            name = r["candidate_name"]
            ext = r["original_ext"]
            score = r["score"]
            strength = r["resume_strength"]
            matched_list = r["matched_skills"]
            missing_list = r["missing_skills"]
            
            matched = ", ".join(matched_list)
            missing = ", ".join(missing_list)
            
            # Print to console
            print(f"{idx}. {name}.{ext} \u2192 {score}")
            print(f"   Strength: {strength}")
            if matched:
                print("   Matched:")
                print(f"   {matched}")
            print("")
            
            # Write to CSV
            writer.writerow([idx, name, score, matched, missing, strength])

if __name__ == "__main__":
    main()
