from typing import Dict, Any, Tuple, List

class AIRecommendationService:
    """Generates AI-driven recommendations based on compliance data."""
    
    def __init__(self):
        pass

    def generate_recommendation(self, compliance_data: Dict[str, Any]) -> Tuple[str, List[str], Dict[str, Any]]:
        """
        Generates a professional recommendation text and structured analysis.
        """
        category_scores = compliance_data.get('category_results', {})
        
        strengths = []
        concerns = []
        steps = []
        
        # Analyze Authenticities
        if category_scores.get('document_authenticity', 0) > 90:
            strengths.append("High confidence in document authenticity across submissions.")
            steps.append("Verified digital signatures and document integrity.")
        elif category_scores.get('document_authenticity', 0) < 60:
            concerns.append("Suspicious document artifacts detected; manual review recommended.")
            steps.append("Flagged potential tampering in provided documents.")
            
        # Analyze Financials
        if category_scores.get('financial_health', 0) > 85:
            strengths.append("Strong financial indicators and consistent IT/GST returns.")
            steps.append("Cross-checked IT returns against GST turnover successfully.")
        elif category_scores.get('financial_health', 0) < 50:
            concerns.append("Financial discrepancies found between declared income and tax returns.")
            steps.append("Identified significant mismatch in financial declarations.")
            
        # Determine overall recommendation
        avg_score = sum(category_scores.values()) / len(category_scores) if category_scores else 0
        
        if avg_score >= 80:
            status = "Approve"
            summary = "The bidder meets all major compliance criteria and shows strong financial health."
        elif avg_score >= 60:
            status = "Conditional Approval"
            summary = "The bidder generally meets criteria, but minor inconsistencies require clarification."
        else:
            status = "Reject / Manual Review Required"
            summary = "Significant compliance risks or inconsistencies detected. Proceed with caution."
            
        recommendation_text = f"Recommendation: {status}\n\nSummary: {summary}"
        
        structured = {
            "summary": summary,
            "strengths": strengths,
            "concerns": concerns,
            "recommendation": status,
            "required_actions": ["Request clarification on financial mismatch"] if "Conditional" in status else []
        }
        
        return recommendation_text, steps, structured
