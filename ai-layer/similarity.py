from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

def calculate_similarity(resume_text: str, jd_text: str) -> float:
    """
    Calculate the semantic similarity between the resume text and JD text
    using TF-IDF and Cosine Similarity.
    """
    # Create the vectorizer
    vectorizer = TfidfVectorizer()
    
    # Fit and transform the texts
    try:
        tfidf_matrix = vectorizer.fit_transform([resume_text, jd_text])
        # The matrix has 2 rows. Row 0 is resume, Row 1 is JD.
        # Compute cosine similarity between the two documents
        similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])
        return float(similarity[0][0])
    except ValueError:
        # In case texts are empty or contain only stop words
        return 0.0
