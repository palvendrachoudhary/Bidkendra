from datetime import datetime
import re

def format_date(date_str: str) -> str:
    """Standardize date strings to YYYY-MM-DD format."""
    try:
        # Try DD/MM/YYYY
        if '/' in date_str:
            return datetime.strptime(date_str, "%d/%m/%Y").strftime("%Y-%m-%d")
        # Try DD-MM-YYYY
        elif '-' in date_str:
            return datetime.strptime(date_str, "%d-%m-%Y").strftime("%Y-%m-%d")
    except ValueError:
        pass
    return date_str

def clean_text(text: str) -> str:
    """Clean extracted OCR text."""
    # Remove excessive newlines and spaces
    text = re.sub(r'\n+', '\n', text)
    text = re.sub(r' +', ' ', text)
    return text.strip()

def calculate_confidence_weighted_average(values_with_confidence: list) -> float:
    """Calculate an average weighted by confidence scores."""
    total_val = 0.0
    total_conf = 0.0
    for val, conf in values_with_confidence:
        total_val += val * conf
        total_conf += conf
        
    if total_conf == 0:
        return 0.0
    return total_val / total_conf
