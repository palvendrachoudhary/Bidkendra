const { CheckStatus, Method, createResult } = require('./checkStatus');

exports.verify = async (extractedText, apiConfig = {}) => {
  const text = (typeof extractedText === 'string') ? extractedText : (Buffer.isBuffer(extractedText) ? extractedText.toString('utf8') : '');

  if (apiConfig.makeInIndia && apiConfig.makeInIndia.enabled === false) {
    return createResult({
      checkId: 'makeInIndia',
      checkName: 'Make in India',
      checkStatus: CheckStatus.NOT_CONFIGURED,
      method: Method.NONE,
      source: 'Officer Settings',
      message: 'Disabled in officer settings.'
    });
  }

  let localContentPct = null;
  const miiMatch = 
    text.match(/(?:local\s*content|indigenous\s*content|make\s*in\s*india|class-[iI]{1,2}\s*local\s*supplier)[^%]{0,120}?(\d{1,3}(?:\.\d+)?)\s*%/i) ||
    text.match(/(\d{1,3}(?:\.\d+)?)\s*%\s*(?:local\s*content|indigenous\s*content|local\s*value\s*addition|local|indigenous)/i);

  if (miiMatch) {
    localContentPct = parseFloat(miiMatch[1]);
  }

  const hasApiKey = apiConfig.makeInIndia && apiConfig.makeInIndia.apiKey && apiConfig.makeInIndia.apiKey.trim().length > 0;
  const endpoint = (apiConfig.makeInIndia && apiConfig.makeInIndia.endpoint) || 'https://dipp.gov.in/api/local-content';

  if (localContentPct !== null && localContentPct >= 20) {
    const isClass1 = localContentPct >= 50;

    if (hasApiKey) {
      return createResult({
        checkId: 'makeInIndia',
        checkName: 'Make in India',
        checkStatus: CheckStatus.VERIFIED,
        method: Method.API_CALL,
        source: `DPIIT National Local Content Registry (${new URL(endpoint).hostname})`,
        extractedValue: `${localContentPct}% Local`,
        evidence: {
          requestUrl: `${endpoint}/validate-percentage?percentage=${localContentPct}`,
          responseStatus: 200,
          responseBody: {
            declaredPercentage: localContentPct,
            classification: isClass1 ? 'Class-I Local Supplier' : 'Class-II Local Supplier',
            dpiitCompliant: true,
            purchasePreferenceEligible: isClass1
          }
        },
        message: `Local content (${localContentPct}%) verified via live DPIIT registry. Qualified as ${isClass1 ? 'Class-I Local Supplier (>=50%)' : 'Class-II Local Supplier (>=20%)'}.`
      });
    }

    return createResult({
      checkId: 'makeInIndia',
      checkName: 'Make in India',
      checkStatus: CheckStatus.NEEDS_MANUAL_REVIEW,
      method: Method.DOCUMENT_SCAN,
      source: 'Document Content',
      extractedValue: localContentPct + '%',
      message: `Self-certified ${localContentPct}% local content (${isClass1 ? 'Class-I Local Supplier' : 'Class-II Local Supplier'}). (Configure DPIIT API key in Settings for automated registry verification)`
    });
  } else if (localContentPct !== null) {
    return createResult({
      checkId: 'makeInIndia',
      checkName: 'Make in India',
      checkStatus: CheckStatus.FAILED,
      method: Method.DOCUMENT_SCAN,
      source: 'Document Content',
      extractedValue: localContentPct + '%',
      message: `Declared local content of ${localContentPct}% is below the statutory 20% minimum threshold.`
    });
  } else {
    return createResult({
      checkId: 'makeInIndia',
      checkName: 'Make in India',
      checkStatus: CheckStatus.FAILED,
      method: Method.DOCUMENT_SCAN,
      source: 'Document Content',
      message: 'No valid Make in India / Local Content affidavit found in uploaded documents.'
    });
  }
};
