from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from app.models.document_classifier import DocumentClassifier
from app.models.forgery_detector import ForgeryDetector

router = APIRouter()
doc_classifier = DocumentClassifier()
forgery_detector = ForgeryDetector()

class DocumentData(BaseModel):
    text: Optional[str] = None
    image_base64: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class VerificationResult(BaseModel):
    document_type: str
    classification_confidence: float
    is_authentic: bool
    forgery_confidence: float
    flags: List[str]

class CrossCheckRequest(BaseModel):
    source1_data: Dict[str, Any]
    source2_data: Dict[str, Any]
    entity_type: str

class CrossCheckResult(BaseModel):
    is_consistent: bool
    inconsistencies: List[Dict[str, str]]
    match_score: float

@router.post("/document", response_model=VerificationResult)
async def verify_document(data: DocumentData):
    """
    Verify document authenticity by running classification and forgery detection.
    """
    if not data.text and not data.image_base64:
        raise HTTPException(status_code=400, detail="Must provide either text or image_base64")
    
    # 1. Classification
    doc_type, class_conf = "Unknown", 0.0
    if data.text:
        doc_type, class_conf = doc_classifier.classify(data.text)
    
    # 2. Forgery Detection
    is_authentic, forg_conf, flags = True, 1.0, []
    if data.image_base64:
        import base64
        try:
            image_bytes = base64.b64decode(data.image_base64)
            is_authentic, forg_conf, flags = forgery_detector.detect(image_bytes)
        except Exception:
            flags.append("Failed to process image data")
            is_authentic = False
            forg_conf = 0.0
    
    return VerificationResult(
        document_type=doc_type,
        classification_confidence=class_conf,
        is_authentic=is_authentic,
        forgery_confidence=forg_conf,
        flags=flags
    )

@router.post("/cross-check", response_model=CrossCheckResult)
async def cross_check(req: CrossCheckRequest):
    """
    Cross-check information across multiple sources to find inconsistencies.
    """
    inconsistencies = []
    
    # Simple cross-check logic for demo
    keys = set(req.source1_data.keys()).intersection(set(req.source2_data.keys()))
    match_count = 0
    total = len(keys)
    
    for k in keys:
        val1 = str(req.source1_data[k]).strip().lower()
        val2 = str(req.source2_data[k]).strip().lower()
        if val1 == val2:
            match_count += 1
        else:
            inconsistencies.append({
                "field": k,
                "source1": req.source1_data[k],
                "source2": req.source2_data[k]
            })
            
    match_score = (match_count / total * 100) if total > 0 else 0.0
    
    return CrossCheckResult(
        is_consistent=(len(inconsistencies) == 0),
        inconsistencies=inconsistencies,
        match_score=match_score
    )
