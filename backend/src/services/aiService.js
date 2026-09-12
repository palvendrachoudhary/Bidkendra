class AIService {
  constructor() {
    this.isConfigured = false; // We can flip this if they add a key in settings later
  }

  async generateSummary(extractedText) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Simple heuristic summary if not real AI
    const hasPan = extractedText && extractedText.toLowerCase().includes('pan');
    const hasGst = extractedText && extractedText.toLowerCase().includes('gst');
    
    return `This document appears to be a vendor compliance submission. ` +
           `It contains ${extractedText ? extractedText.length : 0} characters of raw text. ` +
           (hasPan ? `PAN details were detected. ` : ``) +
           (hasGst ? `GSTIN details were detected. ` : ``) +
           `The document structure suggests it is a standard tender envelope.`;
  }

  async translateDocument(extractedText, targetLang = 'hi') {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (targetLang === 'hi') {
      return "[Hindi Translation Preview]\nयह दस्तावेज़ एक विक्रेता अनुपालन प्रस्तुतीकरण प्रतीत होता है। इसमें व्यावसायिक पहचान संख्या और निविदा विवरण शामिल हैं। (This is a simulated translation. Full document translation requires an active AI API key).";
    } else if (targetLang === 'mr') {
        return "[Marathi Translation Preview]\nहा दस्तऐवज विक्रेता अनुपालन सबमिशन असल्याचे दिसते. (This is a simulated translation).";
    }
    
    return `[${targetLang.toUpperCase()} Translation Preview]\nSimulated translation. Please configure API keys for full text translation.`;
  }

  async generateEmailDraft(verificationResult, companyName = "Vendor") {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const { verdict, checksDetail } = verificationResult;

    const sanitizeVendorMessage = (msg) => {
      if (!msg || typeof msg !== 'string') return '';
      return msg
        .replace(/\s*\([^)]*configure[^)]*in settings[^)]*\)/gi, '')
        .replace(/\s*\([^)]*requires.*api key[^)]*\)/gi, '')
        .replace(/\s*Live .* requires vendor API key\.?/gi, '')
        .trim();
    };
    
    // For mandatory rejections (NOT_ELIGIBLE), hard statutory failures (FAILED) are primary deficiencies.
    // Self-certified or manual review items (NEEDS_MANUAL_REVIEW) are itemized as secondary review discrepancies.
    const failedChecks = Object.entries(checksDetail || {})
        .filter(([key, check]) => check && (check.checkStatus === 'FAILED' || check.status === 'FAILED'))
        .map(([key, check]) => `- ${check.checkName || key}: ${sanitizeVendorMessage(check.message)}`);

    const manualReviewChecks = Object.entries(checksDetail || {})
        .filter(([key, check]) => check && (check.checkStatus === 'NEEDS_MANUAL_REVIEW' || check.status === 'NEEDS_MANUAL_REVIEW'))
        .map(([key, check]) => `- ${check.checkName || key}: ${sanitizeVendorMessage(check.message)}`);

    const reviewChecks = Object.entries(checksDetail || {})
        .filter(([key, check]) => 
          check && (
            check.checkStatus === 'NEEDS_MANUAL_REVIEW' || check.status === 'NEEDS_MANUAL_REVIEW' ||
            check.checkStatus === 'FAILED' || check.status === 'FAILED'
          )
        )
        .map(([key, check]) => `- ${check.checkName || key}: ${sanitizeVendorMessage(check.message)}`);

    const isNotEligible = verdict && (verdict === 'NOT_ELIGIBLE' || verdict.startsWith('NOT_ELIGIBLE'));
    const isNeedsReview = verdict && (verdict === 'NEEDS_REVIEW' || verdict.startsWith('NEEDS_REVIEW'));

    if (isNotEligible) {
      let body = `Dear ${companyName} Representative,\n\n` +
            `Thank you for participating in the recent tender process. Upon automated verification of your submitted documents, we identified critical compliance failures that render your bid ineligible at this stage.\n\n` +
            `Mandatory Statutory Deficiencies Identified:\n` +
            `${failedChecks.join('\n')}\n\n`;

      if (manualReviewChecks.length > 0) {
        body += `Additional Review Items / Discrepancies:\n` +
                `${manualReviewChecks.join('\n')}\n\n`;
      }

      body += `Please address these shortcomings and submit a revised profile if you wish to participate in upcoming tenders.\n\n` +
              `Sincerely,\nProcurement Team`;

      return {
        subject: `URGENT: Action Required - Bid Rejection for ${companyName}`,
        body: body
      };
    } else if (isNeedsReview) {
      return {
        subject: `Update: Bid Review in Progress for ${companyName}`,
        body: `Dear ${companyName} Representative,\n\n` +
              `We have received your bid documents. While most standard checks have passed, some elements require manual review by our procurement officers.\n\n` +
              `Pending Review Items / Discrepancies:\n` +
              `${reviewChecks.join('\n')}\n\n` +
              `No further action is required from you at this time. We will reach out if additional clarification is needed.\n\n` +
              `Sincerely,\nProcurement Team`
      };
    } else {
      return {
        subject: `Congratulations: Bid Verification Successful for ${companyName}`,
        body: `Dear ${companyName} Representative,\n\n` +
              `We are pleased to inform you that your submitted documents have successfully passed all automated compliance checks.\n\n` +
              `Your profile is marked as 'Eligible' and will proceed to the financial evaluation stage. Thank you for your prompt submission.\n\n` +
              `Sincerely,\nProcurement Team`
      };
    }
  }
}

module.exports = new AIService();
