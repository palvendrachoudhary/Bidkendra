from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional
from app.services.ocr_service import OCRService

router = APIRouter()
ocr_service = OCRService()

class OCRResponse(BaseModel):
    text: str
    confidence: float
    language: str

class FieldExtractResponse(BaseModel):
    document_type: str
    fields: Dict[str, Any]

@router.post("/extract", response_model=OCRResponse)
async def extract_text(file: UploadFile = File(...)):
    """
    Extract text from an uploaded document image (PDF or Image).
    Uses Tesseract OCR if available, otherwise falls back to a realistic mock.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded")
    
    try:
        content = await file.read()
        text, confidence = ocr_service.process_image(content)
        return OCRResponse(
            text=text,
            confidence=confidence,
            language="eng"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OCR extraction failed: {str(e)}")

@router.post("/extract-fields", response_model=FieldExtractResponse)
async def extract_fields(
    file: UploadFile = File(...),
    document_type: str = Form(...)
):
    """
    Extract specific structured fields from a document based on its type.
    Valid document types: gst_certificate, pan_card, udyam_certificate, etc.
    """
    try:
        content = await file.read()
        text, _ = ocr_service.process_image(content)
        fields = ocr_service.extract_fields(text, document_type)
        
        return FieldExtractResponse(
            document_type=document_type,
            fields=fields
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Field extraction failed: {str(e)}")
