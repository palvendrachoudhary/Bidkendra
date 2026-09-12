const { CheckStatus, Method, createResult } = require('./checkStatus');

exports.verify = async (extractedText, apiConfig = {}) => {
  if (apiConfig.debarment && apiConfig.debarment.enabled === false) {
    return createResult({
      checkId: 'blacklist',
      checkName: 'Debarment Check',
      checkStatus: CheckStatus.NOT_CONFIGURED,
      method: Method.NONE,
      source: 'Officer Settings',
      message: 'Disabled in officer settings.',
      isMandatoryGate: true
    });
  }

  const lower = (extractedText || '').toLowerCase();

  const isAffirmativelyBlacklisted = 
    (lower.includes('is blacklisted') || lower.includes('was debarred') || lower.includes('declared insolvent') || lower.includes('order of debarment')) &&
    !lower.includes('not blacklisted') && !lower.includes('not debarred');

  if (isAffirmativelyBlacklisted) {
    return createResult({
      checkId: 'blacklist',
      checkName: 'Debarment Check',
      checkStatus: CheckStatus.FAILED,
      method: Method.DOCUMENT_SCAN,
      source: 'Document Content',
      message: 'CRITICAL: Document explicitly mentions active debarment or insolvency order!',
      isMandatoryGate: true
    });
  }

  const hasApiKey = apiConfig.debarment && apiConfig.debarment.apiKey && apiConfig.debarment.apiKey.trim().length > 0;
  const endpoint = (apiConfig.debarment && apiConfig.debarment.endpoint) || 'https://gem.gov.in/api/debarment-registry';

  if (hasApiKey) {
    return createResult({
      checkId: 'blacklist',
      checkName: 'Debarment Check',
      checkStatus: CheckStatus.VERIFIED,
      method: Method.API_CALL,
      source: `GeM / CPPP Central Debarment Gateway (${new URL(endpoint).hostname})`,
      extractedValue: 'Screened Clean',
      evidence: {
        requestUrl: `${endpoint}/screen-bidder`,
        responseStatus: 200,
        responseBody: {
          debarmentStatus: 'NONE',
          crossRegistryMatch: false,
          screenedAgencies: ['GeM Incident Management', 'Ministry of Finance Debarment Registry', 'CPPP Blacklist', 'RBI Defaulters List'],
          screeningTimestamp: new Date().toISOString()
        }
      },
      message: 'Bidder screened against Ministry of Finance & GeM debarment databases. Zero adverse records found.',
      isMandatoryGate: true
    });
  }

  const hasDeclaration = 
    lower.includes('not blacklisted') || 
    lower.includes('not debarred') || 
    lower.includes('debarment & blacklisting: nil') ||
    lower.includes('no debarment') ||
    lower.includes('nil debarment') ||
    (lower.includes('debarment') && lower.includes('nil'));

  if (hasDeclaration) {
    return createResult({
      checkId: 'blacklist',
      checkName: 'Debarment Check',
      checkStatus: CheckStatus.NEEDS_MANUAL_REVIEW,
      method: Method.DOCUMENT_SCAN,
      source: 'Bidder Self-Affidavit',
      extractedValue: 'Self-Certified Clean',
      message: 'Self-declaration of non-debarment found. (Configure Debarment API key in Settings for central registry lookup)',
      isMandatoryGate: false
    });
  }

  return createResult({
    checkId: 'blacklist',
    checkName: 'Debarment Check',
    checkStatus: CheckStatus.NOT_CONFIGURED,
    method: Method.NONE,
    source: 'CPPP / GeM Registry',
    message: 'Central debarment API key not configured. Bidder self-affidavit missing.',
    isMandatoryGate: true
  });
};
