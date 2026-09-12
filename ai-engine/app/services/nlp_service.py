import re
from typing import List, Dict, Any

class NLPService:
    """Natural Language Processing utilities for document text."""
    
    def __init__(self):
        pass
        
    def extract_entities(self, text: str) -> List[Dict[str, str]]:
        """Extract named entities like PAN, GST, CIN from text using regex."""
        entities = []
        
        # PAN
        for match in re.finditer(r'\b[A-Z]{5}[0-9]{4}[A-Z]\b', text):
            entities.append({"type": "PAN", "value": match.group(0)})
            
        # GST
        for match in re.finditer(r'\b[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]\b', text):
            entities.append({"type": "GSTIN", "value": match.group(0)})
            
        # UDYAM
        for match in re.finditer(r'\bUDYAM-[A-Z]{2}-[0-9]{2}-[0-9]{7}\b', text):
            entities.append({"type": "UDYAM", "value": match.group(0)})
            
        # CIN
        for match in re.finditer(r'\b[UL][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}\b', text):
            entities.append({"type": "CIN", "value": match.group(0)})
            
        return entities

    def analyze_sentiment(self, text: str) -> float:
        """
        Analyze sentiment/tone of a document (e.g., for reviews or legal notices).
        Returns a score between -1.0 and 1.0
        """
        # Very rudimentary mock for demo purposes
        positive_words = ['certified', 'authorized', 'valid', 'compliant', 'approved']
        negative_words = ['rejected', 'fraud', 'invalid', 'expired', 'notice', 'penalty']
        
        text_lower = text.lower()
        pos_count = sum(1 for word in positive_words if word in text_lower)
        neg_count = sum(1 for word in negative_words if word in text_lower)
        
        total = pos_count + neg_count
        if total == 0:
            return 0.0
            
        return (pos_count - neg_count) / total
