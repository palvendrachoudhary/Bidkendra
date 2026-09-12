from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict, Any
from app.models.compliance_scorer import ComplianceScorer
from app.models.anomaly_detector import AnomalyDetector
from app.services.ai_recommendation import AIRecommendationService

router = APIRouter()
scorer = ComplianceScorer()
anomaly_detector = AnomalyDetector()
recommender = AIRecommendationService()

class ComplianceData(BaseModel):
    category_results: Dict[str, float]
    verification_results: Dict[str, Any]

class ScoreResponse(BaseModel):
    overall_score: float
    risk_level: str
    breakdown: Dict[str, float]

class RecommendationResponse(BaseModel):
    recommendation_text: str
    reasoning_steps: List[str]
    structured_sections: Dict[str, Any]

class AnomalyResponse(BaseModel):
    anomalies: List[Dict[str, Any]]

@router.post("/score", response_model=ScoreResponse)
async def calculate_score(data: ComplianceData):
    """
    Calculate an overall compliance score and risk level.
    """
    overall_score, risk_level, breakdown = scorer.calculate_score(data.category_results)
    return ScoreResponse(
        overall_score=overall_score,
        risk_level=risk_level,
        breakdown=breakdown
    )

@router.post("/recommend", response_model=RecommendationResponse)
async def generate_recommendation(data: ComplianceData):
    """
    Generate an AI recommendation based on all compliance checks.
    """
    text, steps, sections = recommender.generate_recommendation(data.model_dump())
    return RecommendationResponse(
        recommendation_text=text,
        reasoning_steps=steps,
        structured_sections=sections
    )

@router.post("/anomalies", response_model=AnomalyResponse)
async def detect_anomalies(bidder_data: Dict[str, Any]):
    """
    Detect anomalies and inconsistencies in bidder profile data across portals.
    """
    anomalies = anomaly_detector.detect_anomalies(bidder_data)
    return AnomalyResponse(anomalies=anomalies)
