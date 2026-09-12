from typing import Dict, Any, List

class AnomalyDetector:
    """Detects anomalies and inconsistencies in bidder data."""
    
    def __init__(self):
        pass
        
    def detect_anomalies(self, bidder_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Run multiple checks on bidder data to find anomalies.
        """
        anomalies = []
        
        # 1. Turnover vs IT Return mismatch
        gst_turnover = bidder_data.get('gst_turnover_lakhs', 0)
        itr_income = bidder_data.get('itr_income_lakhs', 0)
        if gst_turnover > 0 and itr_income > 0:
            diff = abs(gst_turnover - itr_income) / max(gst_turnover, itr_income)
            if diff > 0.3:  # 30% difference
                anomalies.append({
                    "type": "Financial Mismatch",
                    "severity": "high",
                    "description": "Significant mismatch between GST Turnover and IT Return declared income.",
                    "evidence": f"GST Turnover: {gst_turnover}L, ITR Income: {itr_income}L"
                })
                
        # 2. EPFO vs Company Size inconsistency
        epfo_count = bidder_data.get('epfo_employee_count', -1)
        declared_size = bidder_data.get('declared_employee_count', -1)
        if epfo_count >= 0 and declared_size >= 0:
            if declared_size > 50 and epfo_count < (declared_size * 0.2):
                anomalies.append({
                    "type": "Employee Count Discrepancy",
                    "severity": "medium",
                    "description": "Declared employee count is much higher than EPFO registered count.",
                    "evidence": f"Declared: {declared_size}, EPFO: {epfo_count}"
                })
                
        # 3. New Company Large Tender Check
        incorporation_years = bidder_data.get('years_since_incorporation', 10)
        tender_value = bidder_data.get('tender_value_lakhs', 0)
        if incorporation_years < 1 and tender_value > 500:
            anomalies.append({
                "type": "New Entity Risk",
                "severity": "critical",
                "description": "Recently incorporated entity bidding for very high value tender.",
                "evidence": f"Age: {incorporation_years} years, Tender Value: {tender_value}L"
            })
            
        # 4. Address Mismatches
        addresses = bidder_data.get('addresses', {})
        if len(set(addresses.values())) > 1 and len(addresses) > 1:
            anomalies.append({
                "type": "Address Mismatch",
                "severity": "low",
                "description": "Addresses across documents do not match exactly.",
                "evidence": str(addresses)
            })

        return anomalies
