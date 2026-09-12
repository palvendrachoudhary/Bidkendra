const { COMPLIANCE_CATEGORIES, RISK_LEVELS } = require('../config/constants');

// Calculate sub-scores and overall score based on fetched results
exports.calculateScores = (verificationResults) => {
  const weights = {
    [COMPLIANCE_CATEGORIES.UDYAM]: 10,
    [COMPLIANCE_CATEGORIES.GST]: 15,
    [COMPLIANCE_CATEGORIES.PAN_IT]: 15,
    [COMPLIANCE_CATEGORIES.MAKE_IN_INDIA]: 10,
    [COMPLIANCE_CATEGORIES.EPFO]: 10,
    [COMPLIANCE_CATEGORIES.ESIC]: 5,
    [COMPLIANCE_CATEGORIES.STARTUP]: 5,
    [COMPLIANCE_CATEGORIES.NSIC]: 5,
    [COMPLIANCE_CATEGORIES.OEM]: 10,
    [COMPLIANCE_CATEGORIES.BLACKLIST]: 15
  };

  let totalScore = 0;
  let maxPossibleScore = 0;
  const categoryScores = {};
  
  // Logic to evaluate each result and assign a score out of the weight
  for (const [category, result] of Object.entries(verificationResults)) {
    if (!weights[category]) continue;
    
    maxPossibleScore += weights[category];
    let score = 0;
    
    switch (category) {
      case COMPLIANCE_CATEGORIES.BLACKLIST:
        score = result.blacklisted ? 0 : weights[category];
        break;
      default:
        score = result.verified ? weights[category] : 0;
        
        // Minor deductions for compliance issues even if verified
        if (result.complianceStatus && result.complianceStatus !== 'Compliant') {
           score = score * 0.5; // Half points if there are compliance warnings
        }
        break;
    }
    
    categoryScores[category] = score;
    totalScore += score;
  }
  
  // Normalize to 100 if all categories weren't checked
  const normalizedScore = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;
  
  let riskLevel = RISK_LEVELS.LOW;
  if (normalizedScore < 50) riskLevel = RISK_LEVELS.CRITICAL;
  else if (normalizedScore < 70) riskLevel = RISK_LEVELS.HIGH;
  else if (normalizedScore < 85) riskLevel = RISK_LEVELS.MEDIUM;
  
  // Blacklisted overrides
  if (verificationResults[COMPLIANCE_CATEGORIES.BLACKLIST]?.blacklisted) {
    riskLevel = RISK_LEVELS.CRITICAL;
  }

  return {
    overallScore: normalizedScore,
    categoryScores,
    riskLevel
  };
};

exports.generateRecommendation = (scores, results) => {
  if (scores.riskLevel === RISK_LEVELS.CRITICAL) {
    return 'Bidder is considered CRITICAL risk with a score of ' + scores.overallScore.toFixed(1) + '/100. Verification failed on major compliance items or bidder is blacklisted. Recommend immediate rejection.';
  }
  
  let recommendation = 'Bidder has a compliance score of ' + scores.overallScore.toFixed(1) + '/100 (' + scores.riskLevel + ' Risk). ';
  
  const issues = [];
  if (results[COMPLIANCE_CATEGORIES.GST] && !results[COMPLIANCE_CATEGORIES.GST].verified) issues.push('GST verification failed');
  if (results[COMPLIANCE_CATEGORIES.EPFO] && results[COMPLIANCE_CATEGORIES.EPFO].complianceStatus !== 'Compliant') issues.push('EPFO contributions are pending');
  
  if (issues.length > 0) {
    recommendation += 'However, ' + issues.join(' and ') + '. Recommend conditional approval with compliance follow-up.';
  } else {
    recommendation += 'All major compliance checks passed successfully. Recommend approval.';
  }
  
  return recommendation;
};
