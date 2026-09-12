"""
Mock data for testing and demonstration purposes.
"""

MOCK_BIDDER_DATA = {
    "bidder_1": {
        "legal_name": "TechCorp India Pvt Ltd",
        "gst_turnover_lakhs": 450.5,
        "itr_income_lakhs": 445.0,
        "epfo_employee_count": 120,
        "declared_employee_count": 125,
        "years_since_incorporation": 5,
        "tender_value_lakhs": 100,
        "addresses": {
            "gst": "123 Tech Park, Phase 1, Bangalore 560001",
            "mca": "123 Tech Park, Phase 1, Bangalore 560001"
        }
    },
    "bidder_2_anomalous": {
        "legal_name": "NewWave Solutions",
        "gst_turnover_lakhs": 15.0,
        "itr_income_lakhs": 850.0,  # Huge mismatch
        "epfo_employee_count": 5,
        "declared_employee_count": 200, # Discrepancy
        "years_since_incorporation": 0.5, # New company
        "tender_value_lakhs": 2000, # Large tender
        "addresses": {
            "gst": "Shop 4, Local Market, Delhi 110001",
            "mca": "Flat 202, Residential Complex, Noida 201301" # Address mismatch
        }
    }
}

MOCK_COMPLIANCE_RESULTS = {
    "good_profile": {
        "category_results": {
            "document_authenticity": 95.0,
            "financial_health": 88.5,
            "past_performance": 90.0,
            "statutory_compliance": 92.0
        },
        "verification_results": {}
    },
    "risky_profile": {
        "category_results": {
            "document_authenticity": 65.0,
            "financial_health": 45.0,
            "past_performance": 70.0,
            "statutory_compliance": 55.0
        },
        "verification_results": {}
    }
}
