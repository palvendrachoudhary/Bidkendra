from typing import Dict, Tuple

class ComplianceScorer:
    """Calculates overall compliance score based on category results."""
    
    def __init__(self):
        self.category_weights = {
            "document_authenticity": 0.30,
            "financial_health": 0.25,
            "past_performance": 0.20,
            "statutory_compliance": 0.25
        }

    def calculate_score(self, category_results: Dict[str, float]) -> Tuple[float, str, Dict[str, float]]:
        """
        Calculate weighted score and risk level.
        Each category in category_results should be a float 0-100.
        """
        overall_score = 0.0
        breakdown = {}
        total_weight = 0.0
        
        for category, weight in self.category_weights.items():
            if category in category_results:
                score = category_results[category]
                breakdown[category] = score
                overall_score += score * weight
                total_weight += weight
                
        # Normalize if some categories are missing
        if total_weight > 0:
            overall_score = overall_score / total_weight
        else:
            overall_score = 0.0
            
        # Determine risk level
        if overall_score >= 80:
            risk_level = "Low Risk"
        elif overall_score >= 60:
            risk_level = "Medium Risk"
        elif overall_score >= 40:
            risk_level = "High Risk"
        else:
            risk_level = "Critical Risk"
            
        return round(overall_score, 2), risk_level, breakdown
