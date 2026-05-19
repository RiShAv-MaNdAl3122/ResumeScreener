import spacy

# Try to load the spacy model. If it's missing, it will be downloaded.
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    print("Downloading en_core_web_sm model...")
    import spacy.cli
    spacy.cli.download("en_core_web_sm")
    nlp = spacy.load("en_core_web_sm")

def preprocess_text(text: str) -> str:
    """
    Preprocess text using NLP techniques:
    - lowercase
    - stopword removal
    - punctuation removal
    - lemmatization
    """
    doc = nlp(text.lower())
    
    tokens = []
    for token in doc:
        # Keep non-stopwords, non-punctuation, and non-whitespace
        if not token.is_stop and not token.is_punct and not token.is_space:
            tokens.append(token.lemma_)
            
    return " ".join(tokens)
