import re
from typing import Tuple, Dict, Any

class OCRService:
    """Service to handle text extraction from document images."""
    
    def __init__(self):
        # Could initialize pytesseract here
        pass

    def process_image(self, image_bytes: bytes) -> Tuple[str, float]:
        """
        Extract text from image bytes.
        Returns: (extracted_text, confidence)
        """
        # In a real environment, we would use:
        # image = Image.open(io.BytesIO(image_bytes))
        # text = pytesseract.image_to_string(image)
        
        # Mock OCR output based on simple byte length hashing for demo
        val = len(image_bytes) % 3
        if val == 0:
            text = "GOVERNMENT OF INDIA\nMINISTRY OF CORPORATE AFFAIRS\nCertificate of Incorporation\nCIN: U12345MH2023PTC123456\nPAN: ABCDE1234F"
        elif val == 1:
            text = "Form GST REG-06\nRegistration Certificate\nGSTIN: 27ABCDE1234F1Z5\nLegal Name: MOCK TECH SOLUTIONS"
        else:
            text = "INCOME TAX DEPARTMENT\nPERMANENT ACCOUNT NUMBER\nABCDE1234F\nName: MOCK TECH SOLUTIONS"
            
        return text, 0.92

    def extract_fields(self, text: str, doc_type: str) -> Dict[str, Any]:
        """Extract specific fields based on document type."""
        fields = {}
        
        if doc_type == "gst_certificate":
            gst_match = re.search(r'[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]', text)
            if gst_match:
                fields['gstin'] = gst_match.group(0)
            
            # Simple name extraction heuristic
            if "Legal Name:" in text:
                parts = text.split("Legal Name:")
                if len(parts) > 1:
                    fields['legal_name'] = parts[1].split('\n')[0].strip()
                    
        elif doc_type == "pan_card":
            pan_match = re.search(r'[A-Z]{5}[0-9]{4}[A-Z]', text)
            if pan_match:
                fields['pan_number'] = pan_match.group(0)
                
        elif doc_type == "company_registration":
            cin_match = re.search(r'[UL][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}', text)
            if cin_match:
                fields['cin'] = cin_match.group(0)

        return fields
