from typing import Tuple
import re

class DocumentClassifier:
    """Classifies text into specific document types using heuristic patterns."""
    
    def __init__(self):
        self.doc_types = [
            "GST Certificate", "PAN Card", "Udyam Certificate", 
            "IT Return", "EPFO Registration", "Company Registration", 
            "OEM Authorization", "NSIC Certificate", "Other"
        ]
        
        self.keywords = {
            "GST Certificate": ["goods and services tax", "gstin", "registration certificate", "form gst"],
            "PAN Card": ["income tax department", "permanent account number", "signature"],
            "Udyam Certificate": ["udyam registration", "ministry of micro, small and medium enterprises", "msme"],
            "IT Return": ["itr", "income tax return", "assessment year", "total income"],
            "EPFO Registration": ["employees' provident fund", "epfo", "establishment code"],
            "Company Registration": ["certificate of incorporation", "ministry of corporate affairs", "cin"],
            "OEM Authorization": ["authorization letter", "authorized dealer", "original equipment manufacturer", "oem"],
            "NSIC Certificate": ["national small industries corporation", "nsic", "enlistment certificate"]
        }

    def classify(self, text: str) -> Tuple[str, float]:
        """
        Classifies the document text.
        Returns: Tuple of (document_type, confidence_score)
        """
        if not text:
            return "Other", 0.0
            
        text_lower = text.lower()
        scores = {doc_type: 0 for doc_type in self.doc_types}
        
        for doc_type, keywords in self.keywords.items():
            for kw in keywords:
                if kw in text_lower:
                    scores[doc_type] += 1
                    
        # Add PAN regex check
        if re.search(r'[A-Z]{5}[0-9]{4}[A-Z]', text):
            scores["PAN Card"] += 2
            
        # Add GST regex check
        if re.search(r'[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]', text):
            scores["GST Certificate"] += 2
            
        best_match = max(scores.items(), key=lambda x: x[1])
        
        if best_match[1] == 0:
            return "Other", 0.1
            
        # Simple confidence calculation
        confidence = min(0.4 + (best_match[1] * 0.15), 0.98)
        return best_match[0], confidence
