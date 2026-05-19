import re
from typing import Dict, Union

PROFESSIONAL_KEYWORDS = [
    "experience",
    "developer",
    "engineer",
    "backend",
    "frontend",
    "api",
    "aws",
    "cloud",
    "production",
    "deployment",
    "microservices",
    "database"
]

def calculate_keyword_bonus(resume_text: str) -> int:
    """
    Calculate bonus score based on professional keywords in the resume.
    Only counts unique keywords to prevent exploits.
    +2 score for each keyword found, max 15 points.
    """
    text_lower = resume_text.lower()
    found_keywords = set()
    
    for keyword in PROFESSIONAL_KEYWORDS:
        pattern = r'\b' + re.escape(keyword) + r'\b'
        if re.search(pattern, text_lower):
            found_keywords.add(keyword)
            
    keyword_bonus = min(len(found_keywords) * 2, 15)
    return keyword_bonus

def calculate_final_score(similarity_score: float, matched_skills_count: int, total_jd_skills_count: int, keyword_bonus: int = 0) -> Dict[str, Union[float, dict]]:
    """
    Calculates final score and provides a breakdown.
    """
    # Skill matching score (0 to 1)
    if total_jd_skills_count == 0:
        skill_ratio = 1.0 # If JD has no skills, give full credit for skill matching
    else:
        skill_ratio = matched_skills_count / total_jd_skills_count
        
    # Better Skill Match Weighting
    if total_jd_skills_count <= 3:
        skill_weight = 40
    else:
        skill_weight = 35
        
    skill_score = skill_ratio * skill_weight
    
    # Improve Semantic Scoring
    adjusted_similarity = (similarity_score * 0.8) + (skill_ratio * 0.2)
    semantic_score = adjusted_similarity * 50
    
    # Final score
    final_score = semantic_score + skill_score + keyword_bonus
    
    # Cap at 100 and round to 2 decimals
    final_score = min(final_score, 100.0)
    
    return {
        "final_score": round(final_score, 2),
        "score_breakdown": {
            "semantic_score": round(semantic_score, 2),
            "skill_score": round(skill_score, 2),
            "keyword_bonus": keyword_bonus
        }
    }

def get_resume_strength(score: float) -> str:
    """
    Categorize the resume strength based on the final score.
    90+ = Excellent Match
    75-89 = Strong Match
    50-74 = Good Match
    30-49 = Weak Match
    Below 30 = Not a Match
    """
    if score >= 90:
        return "Excellent Match"
    elif score >= 75:
        return "Strong Match"
    elif score >= 50:
        return "Good Match"
    elif score >= 30:
        return "Weak Match"
    else:
        return "Not a Match"
