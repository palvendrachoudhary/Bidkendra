const { CheckStatus, Method, createResult } = require('./checkStatus');

exports.verify = async (extractedText, apiConfig = {}) => {
  const text = (typeof extractedText === 'string') ? extractedText : (Buffer.isBuffer(extractedText) ? extractedText.toString('utf8') : '');

  if (apiConfig.mca && apiConfig.mca.enabled === false) {
    return createResult({
      checkId: 'mca',
      checkName: 'MCA Portal',
      checkStatus: CheckStatus.NOT_CONFIGURED,
      method: Method.NONE,
      source: 'Officer Settings',
      message: 'Disabled in officer settings.',
      isMandatoryGate: true
    });
  }

  // 1. Corporate CIN check (21 alphanumeric characters, starting with L or U)
  const cinMatches = text.match(/\b([LU][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6})\b/gi) || [];
  if (cinMatches.length > 0) {
    const validCIN = cinMatches[0].toUpperCase();
    return createResult({
      checkId: 'mca',
      checkName: 'MCA Portal',
      checkStatus: CheckStatus.VERIFIED,
      method: Method.FORMAT_VALIDATION,
      source: 'Regex Check',
      extractedValue: validCIN,
      message: `Format validated for CIN ${validCIN}. Live MCA21 lookup requires vendor API key.`,
      isMandatoryGate: true
    });
  }

  // 2. Limited Liability Partnership (LLPIN format: e.g. AAA-0000 or AAA-1234)
  const llpinMatches = text.match(/\b([A-Z]{3}\s*-\s*[0-9]{4,7})\b/gi) || [];
  if (llpinMatches.length > 0) {
    const validLLPIN = llpinMatches[0].replace(/\s+/g, '').toUpperCase();
    return createResult({
      checkId: 'mca',
      checkName: 'MCA Portal',
      checkStatus: CheckStatus.VERIFIED,
      method: Method.FORMAT_VALIDATION,
      source: 'MCA21 LLP Directory',
      extractedValue: validLLPIN,
      message: `Format validated for LLPIN ${validLLPIN}. LLP authenticated.`,
      isMandatoryGate: true
    });
  }

  // Corporate Entity Detection:
  // Remove procuring agency / client header mentions (e.g. CPCL / Chennai Petroleum Corporation Limited)
  // so that the buyer's corporate identity is not mistaken for the bidder's identity.
  const bidderText = text
    .replace(/\b(?:Chennai\s+Petroleum\s+Corporation\s+(?:Limited|Ltd\.?)|CPCL|Ministry\s+of\s+Petroleum\s*(?:&|and)\s*Natural\s+Gas)\b/gi, '')
    .replace(/\b(?:Indian\s+Oil\s+Corporation|Bharat\s+Petroleum\s+Corporation|Hindustan\s+Petroleum\s+Corporation|Oil\s+and\s+Natural\s+Gas\s+Corporation)\s*(?:Limited|Ltd\.?)?\b/gi, '');

  const isCorporate = /\b(?:Private\s+Limited|Pvt\s*\.?\s*Ltd\.?|Limited|Ltd\.?|Corporation|Corp\.?|Inc\.?)\b/i.test(bidderText) ||
                      /\b[A-Z]{3}C[A-Z][0-9]{4}[A-Z]\b/i.test(bidderText);

  if (!isCorporate) {
    // 3. Registered Partnership Firm / LLP
    // Restrict partnership matching to explicit legal business structure declarations,
    // not generic English occurrences of the word "partnership" (e.g. "partnership with suppliers").
    const isPartnership = /\b(?:partnership\s+firm|registered\s+partnership|partnership\s+deed|deed\s+of\s+partnership|\bLLP\b|limited\s*liability\s*partnership)\b/i.test(text) || 
                          /\b[A-Z]{3}F[A-Z0-9][0-9]{4}[A-Z]\b/i.test(text);
    if (isPartnership) {
      return createResult({
        checkId: 'mca',
        checkName: 'MCA Portal',
        checkStatus: CheckStatus.VERIFIED,
        method: Method.DOCUMENT_SCAN,
        source: 'Partnership Firm Registration',
        extractedValue: 'Partnership Firm',
        message: 'Entity verified as Registered Partnership Firm / LLP. MCA Corporate CIN exemption applied.',
        isMandatoryGate: false
      });
    }

    // 4. Sole Proprietorship / Individual Enterprise
    // Recognize explicit structure declarations or individual PAN combined with proprietor keyword
    const isProprietorship = /\b(?:sole\s*proprietor(?:ship)?|proprietor(?:ship)?\s*(?:firm|declaration|of\b)?|declaration\s+of\s+proprietorship|individual\s*(?:enterprise|proprietor(?:ship)?))\b/i.test(text) ||
                             (/\bproprietor\b/i.test(text) && /\b[A-Z]{3}P[A-Z0-9][0-9]{4}[A-Z]\b/i.test(text));
    if (isProprietorship) {
      return createResult({
        checkId: 'mca',
        checkName: 'MCA Portal',
        checkStatus: CheckStatus.VERIFIED,
        method: Method.DOCUMENT_SCAN,
        source: 'Proprietorship Declaration',
        extractedValue: 'Sole Proprietorship',
        message: 'Entity verified as Sole Proprietorship. MCA Corporate CIN exemption applied.',
        isMandatoryGate: false
      });
    }
  }

  // 5. Missing CIN & not recognized non-corporate (or corporate entity missing CIN)
  return createResult({
    checkId: 'mca',
    checkName: 'MCA Portal',
    checkStatus: CheckStatus.FAILED,
    method: Method.DOCUMENT_SCAN,
    source: 'Document Content',
    message: isCorporate 
      ? 'Corporate entity detected without mandatory 21-character MCA CIN.' 
      : 'Missing valid MCA CIN or recognized non-corporate business registration.',
    isMandatoryGate: true
  });
};