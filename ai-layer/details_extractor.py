import re
import io
import base64

# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _collapse_spaced_letters(text: str) -> str:
    """
    Fixes PyPDF2's spaced-character extraction artifact for certain PDF fonts.

    Some PDF renderers emit every character separated by a space, producing
    strings like "J o h n  D o e". This function detects that pattern and
    collapses the letters back into words.

    Strategy
    --------
    - Split on 2+ consecutive spaces to get 'word groups'.
    - If every token inside a group is 1–2 characters long, treat the group as
      a spaced-letter artifact and join its tokens without spaces.
    - Otherwise keep the group unchanged.
    - Rejoin all groups with a single space.

    Examples
    --------
    >>> _collapse_spaced_letters("J o h n  D o e")
    'John Doe'
    >>> _collapse_spaced_letters("John Doe")
    'John Doe'
    """
    parts = re.split(r'  +', text.strip())
    collapsed = []
    for part in parts:
        tokens = part.split(' ')
        if tokens and all(len(t) <= 2 for t in tokens):
            collapsed.append(''.join(tokens))
        else:
            collapsed.append(part)
    return ' '.join(collapsed)


def _normalize_name(raw: str) -> str:
    """
    Normalises a candidate name string:

    1. Collapse any spaced-letter PDF artifact  (e.g. "J o h n  D o e").
    2. Title-case every word                    (e.g. "JOHN DOE" -> "John Doe").
    3. Collapse multiple internal spaces        -> exactly one space between words.

    Parameters
    ----------
    raw : str
        The raw name string extracted from resume text.

    Returns
    -------
    str
        The cleaned, title-cased name with words separated by a single space.

    Examples
    --------
    >>> _normalize_name("J o h n  D o e")
    'John Doe'
    >>> _normalize_name("JANE   SMITH")
    'Jane Smith'
    >>> _normalize_name("  alice   wonder  ")
    'Alice Wonder'
    """
    # Step 1 – fix PDF spaced-letter artifacts
    name = _collapse_spaced_letters(raw)
    # Step 2 – title-case
    name = name.title()
    # Step 3 – collapse any remaining multiple spaces into exactly one space
    name = re.sub(r' {2,}', ' ', name).strip()
    return name


def _resize_to_thumbnail(image_bytes: bytes) -> str | None:
    """
    Resizes raw image bytes to a 200x200 JPEG thumbnail and returns a
    base64-encoded string. Returns None on any error.

    Parameters
    ----------
    image_bytes : bytes
        Raw image data (any format Pillow can open: JPEG, PNG, BMP, …).

    Returns
    -------
    str | None
        Base64-encoded JPEG string, or None if processing fails.
    """
    try:
        from PIL import Image
    except ImportError:
        return None

    try:
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        img = img.resize((200, 200), Image.LANCZOS)
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=90)
        return base64.b64encode(buf.getvalue()).decode("utf-8")
    except Exception:
        return None


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def extract_email(text: str) -> str | None:
    """
    Finds and returns the first valid email address in *text*.

    Parameters
    ----------
    text : str
        Raw text content extracted from a resume.

    Returns
    -------
    str | None
        The first email found, or ``None`` if no email is present.
    """
    pattern = r'[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}'
    match = re.search(pattern, text)
    return match.group(0) if match else None


def extract_phone(text: str) -> str | None:
    """
    Finds and returns the first valid phone number in *text*.
    """
    pattern = r'\+?[0-9\-\s\(\)\.]{10,20}'
    matches = re.findall(pattern, text)
    for m in matches:
        cleaned = re.sub(r'\D', '', m)
        if 10 <= len(cleaned) <= 15:
            return m.strip()
    return None


def extract_experience_years(text: str) -> int | None:
    """
    Extracts the candidate's years of experience.
    """
    patterns = [
        r'(\d{1,2})\+?\s*(?:years?|yrs?)\s*(?:of\s*)?(?:experience|exp|work)',
        r'(?:experience|exp|work):?\s*(\d{1,2})\+?\s*(?:years?|yrs?)',
    ]
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return int(match.group(1))
    return None


def extract_education(text: str) -> str | None:
    """
    Extracts candidate's highest degree or education credentials.
    """
    degrees = [
        r"(?:Bachelor|B\.\s*A\.|B\.\s*S\.|B\.\s*Tech|B\.\s*E\.|B\.\s*C\.\s*A\.|B\.\s*B\.\s*A\.)\s+(?:of|in)?\s*[A-Za-z\s]{3,30}",
        r"(?:Master|M\.\s*A\.|M\.\s*S\.|M\.\s*Tech|M\.\s*E\.|M\.\s*C\.\s*A\.|M\.\s*B\.\s*A\.)\s+(?:of|in)?\s*[A-Za-z\s]{3,30}",
        r"Ph\.\s*D\.|Doctor\s+of\s+Philosophy",
        r"B\.\s*S\.\s*[A-Za-z\s]{3,30}",
        r"B\.\s*Tech",
        r"M\.\s*Tech",
        r"B\.\s*E\.",
        r"M\.\s*E\.",
        r"BCA",
        r"MCA",
        r"BSc",
        r"MSc",
        r"MBA"
    ]
    for deg_pat in degrees:
        match = re.search(deg_pat, text, re.IGNORECASE)
        if match:
            return match.group(0).strip()
    return None


def extract_name(text: str) -> str | None:
    """
    Attempts to extract the candidate's full name from raw resume text.

    Heuristic
    ---------
    - Scans the first 10 non-empty lines of the text (names almost always
      appear at the very top of a resume).
    - Skips lines that contain ``@``, ``http``, or long digit sequences
      (emails, URLs, phone numbers).
    - Accepts lines whose content matches a 'plausible name' pattern:
      starts with a letter, contains only letters / spaces / dots / hyphens,
      and is between 3 and 50 characters long, with at least 2 words.
    - The accepted line is then passed through :func:`_normalize_name` to
      ensure consistent formatting (title-case, single spaces).

    Parameters
    ----------
    text : str
        Raw text content extracted from a resume.

    Returns
    -------
    str | None
        The normalised candidate name, or ``None`` if one cannot be found.
    """
    name_pattern = re.compile(r'^[A-Za-z][a-zA-Z\s\.\-]{2,50}$')

    lines = [line.strip() for line in text.splitlines() if line.strip()]

    for line in lines[:10]:
        # Skip lines that look like emails, URLs, or contain long digit runs
        if '@' in line or 'http' in line or re.search(r'\d{5,}', line):
            continue

        words = line.split()
        # Must have at least 2 words and match the name character pattern
        if len(words) > 1 and name_pattern.match(line):
            return _normalize_name(line)

    return None


def _score_image(w: int, h: int) -> float:
    """
    Scores an image based on dimensions to determine if it is likely a profile photo.
    - Square-ish aspect ratio gets bonus.
    - Typical profile photo sizes (100x100 to 600x600) get bonus.
    - Tiny icons (<50) or massive background/banners (>800) are penalized.
    """
    if w <= 0 or h <= 0:
        return -9999.0
    
    aspect_ratio = w / h
    score = 0.0
    
    # Check aspect ratio
    if 0.75 <= aspect_ratio <= 1.35:
        score += 30.0
    elif 0.6 <= aspect_ratio <= 1.6:
        score += 15.0
    else:
        score -= 20.0
        
    # Check size
    if 100 <= w <= 600 and 100 <= h <= 600:
        score += 40.0
    elif 60 <= w <= 800 and 60 <= h <= 800:
        score += 20.0
    
    # Penalize icons
    if w < 50 or h < 50:
        score -= 50.0
        
    # Penalize banners/backgrounds
    if w > 800 or h > 800:
        score -= 30.0
        
    # Add small area bonus to prefer higher resolution over tiny images, capped
    area = w * h
    score += min(area, 250000) / 250000 * 10.0
    
    return score


def extract_photo(file_bytes: bytes, filename: str) -> str | None:
    """
    Attempts to extract the best candidate photo from a PDF or DOCX resume
    and returns it as a base64-encoded 32×32 JPEG string.
    Uses image size scoring to filter out small icons/logos.

    Parameters
    ----------
    file_bytes : bytes
        Raw file content of the uploaded resume.
    filename : str
        Original filename (used to detect file type via extension).

    Returns
    -------
    str | None
        Base64-encoded JPEG thumbnail string, or ``None`` if:
        - No embedded image was found.
        - Required libraries (PyMuPDF, Pillow) are not installed.
        - Any processing error occurs.
    """
    from logger import logger
    ext = filename.lower().rsplit('.', 1)[-1] if '.' in filename else ''

    if ext == 'pdf':
        try:
            import fitz  # PyMuPDF
        except ImportError:
            logger.error("PyMuPDF (fitz) is not installed")
            return None

        try:
            doc = fitz.open(stream=file_bytes, filetype="pdf")
            if doc.page_count == 0:
                return None
            
            best_image_bytes = None
            best_score = -9999.0
            
            # Check up to first 3 pages
            pages_to_check = min(doc.page_count, 3)
            for page_idx in range(pages_to_check):
                page = doc[page_idx]
                image_list = page.get_images(full=True)
                for img_info in image_list:
                    xref = img_info[0]
                    try:
                        base_image = doc.extract_image(xref)
                        if not base_image:
                            continue
                        img_data = base_image.get("image")
                        if not img_data:
                            continue
                        w = base_image.get("width", 0)
                        h = base_image.get("height", 0)
                        
                        score = _score_image(w, h)
                        logger.info(f"Found PDF image on page {page_idx}: size={w}x{h}, score={score:.2f}")
                        if score > best_score and score > 0:
                            best_score = score
                            best_image_bytes = img_data
                    except Exception as e:
                        logger.warning(f"Error extracting PDF image xref {xref}: {e}")
                        continue
            
            if best_image_bytes:
                logger.info(f"Selected best PDF photo with score {best_score:.2f}")
                return _resize_to_thumbnail(best_image_bytes)
            else:
                logger.info("No suitable photo found in PDF")
        except Exception as e:
            logger.error(f"Error parsing PDF for photos: {e}")
            return None

    elif ext == 'docx':
        try:
            from docx import Document
        except ImportError:
            logger.error("python-docx is not installed")
            return None

        try:
            from PIL import Image
            doc = Document(io.BytesIO(file_bytes))
            best_image_bytes = None
            best_score = -9999.0
            
            # Iterate through all relationships in the document part to catch floating images
            for i, rel in enumerate(doc.part.rels.values()):
                if "image" in rel.reltype.lower():
                    try:
                        img_data = rel.target_part.blob
                        img = Image.open(io.BytesIO(img_data))
                        w, h = img.size
                        score = _score_image(w, h)
                        logger.info(f"Found DOCX image in rel {i}: size={w}x{h}, score={score:.2f}")
                        if score > best_score and score > 0:
                            best_score = score
                            best_image_bytes = img_data
                    except Exception as e:
                        logger.warning(f"Error parsing DOCX image rel {i}: {e}")
                        continue
            
            if best_image_bytes:
                logger.info(f"Selected best DOCX photo with score {best_score:.2f}")
                return _resize_to_thumbnail(best_image_bytes)
            else:
                logger.info("No suitable photo found in DOCX")
        except Exception as e:
            logger.error(f"Error parsing DOCX for photos: {e}")
            return None

    return None


def extract_details(text: str, file_bytes: bytes | None = None, filename: str = '') -> dict:
    """
    Extracts key candidate details from raw resume text and (optionally)
    from the raw file bytes for photo extraction.
    """
    photo = extract_photo(file_bytes, filename) if file_bytes else None

    return {
        "candidate_name": extract_name(text),
        "candidate_email": extract_email(text),
        "candidate_phone": extract_phone(text),
        "experience_years": extract_experience_years(text),
        "education": extract_education(text),
        "candidate_photo": photo,
    }
