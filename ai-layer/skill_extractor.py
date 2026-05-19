import re
import csv
import os
import logging
from typing import List, Tuple

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Alias mapping system
SKILL_ALIASES = {
    "nodejs": ["node.js", "node js"],
    "javascript": ["js"],
    "machine learning": ["ml"],
    "artificial intelligence": ["ai"],
    "react": ["reactjs", "react.js"]
}

def load_skills_from_db(filepath: str = "skills_database.csv") -> List[str]:
    """
    Dynamically loads skills from the skills database CSV.
    """
    skills = []
    # Resolve absolute path relative to this script
    base_dir = os.path.dirname(os.path.abspath(__file__))
    full_path = os.path.join(base_dir, filepath)
    
    try:
        with open(full_path, mode='r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            for row in reader:
                if 'skill' in row:
                    skills.append(row['skill'].lower().strip())
    except Exception as e:
        logger.error(f"Failed to load skills database: {e}")
        # Fallback in case of error
        skills = ["python", "java", "sql", "react", "nodejs", "aws", "docker"]
        
    return skills

def extract_skills(text: str) -> List[str]:
    """
    Extracts skills from text based on the dynamic database and alias mapping.
    """
    text_lower = text.lower()
    
    # Load canonical skills
    canonical_skills = load_skills_from_db()
    extracted_skills = set()
    
    # Check for aliases first
    for canonical, aliases in SKILL_ALIASES.items():
        # Also check the canonical name itself
        all_variations = [canonical] + aliases
        for variation in all_variations:
            # Using (?<!\w) ... (?!\w) to handle word boundaries properly for variations ending in non-words like '.js'
            pattern = r'(?<!\w)' + re.escape(variation) + r'(?!\w)'
            if re.search(pattern, text_lower):
                extracted_skills.add(canonical)
                
    # Check for other canonical skills
    for skill in canonical_skills:
        if skill not in extracted_skills: # Optimization
            pattern = r'(?<!\w)' + re.escape(skill) + r'(?!\w)'
            if re.search(pattern, text_lower):
                extracted_skills.add(skill)
                
    return list(extracted_skills)

def compare_skills(resume_skills: List[str], jd_skills: List[str]) -> Tuple[List[str], List[str]]:
    """
    Compare skills to find matched and missing skills relative to the Job Description.
    """
    resume_set = set(resume_skills)
    jd_set = set(jd_skills)
    
    matched_skills = list(jd_set.intersection(resume_set))
    missing_skills = list(jd_set.difference(resume_set))
    
    return matched_skills, missing_skills
