/**
 * Explainable AI Evidence Enricher Service
 * Enhances statutory verification results with granular regulatory references,
 * rule criteria, contextual matched text snippets (±80 chars), and confidence scores.
 */

const STATUTORY_RULES = {
  gst: {
    ruleCriteria: 'Valid 15-digit GSTIN with active regular registration and timely monthly return filings (GSTR-3B/1).',
    statutoryReference: 'Central Goods and Services Tax (CGST) Act 2017 Section 22',
    clauseNumber: 'Clause 4.1(a) - Statutory Taxpayer Registration',
    fallbackKeywords: ['gstin', 'gst', 'goods and services tax', 'gstr']
  },
  pan: {
    ruleCriteria: 'Valid 10-character alphanumeric CBDT PAN matching entity type (4th character C/P/H/F/A) in active status.',
    statutoryReference: 'Income Tax Act 1961 Section 139A & Rule 114',
    clauseNumber: 'Clause 4.1(b) - Permanent Account Number & KYC',
    fallbackKeywords: ['pan', 'permanent account number', 'income tax', 'cbdt']
  },
  udyam: {
    ruleCriteria: 'Active Udyam Registration Number (UDYAM-XX-00-0000000) for EMD exemption and tender purchase preference.',
    statutoryReference: 'MSMED Act 2006 Section 7 & Gazette Notification S.O. 2119(E)',
    clauseNumber: 'Clause 4.2(a) - Micro & Small Enterprise (MSE) Policy',
    fallbackKeywords: ['udyam', 'msme', 'enterprise classification', 'small enterprise', 'micro enterprise']
  },
  makeInIndia: {
    ruleCriteria: 'Self-declaration affidavit specifying >=50% local content for Class-I preference (or >=20% for Class-II) with location of value addition.',
    statutoryReference: 'DPIIT Public Procurement Order P-45021/2/2017-PP (BE-II)',
    clauseNumber: 'Clause 3(a) - Class-I / Class-II Local Supplier Preference',
    fallbackKeywords: ['local content', 'make in india', 'indigenous content', 'class-i local', 'purchase preference']
  },
  mca: {
    ruleCriteria: 'Valid 21-character Corporate Identity Number (CIN) starting with L or U registered with Ministry of Corporate Affairs.',
    statutoryReference: 'Companies Act 2013 Section 7 & MCA Master Data',
    clauseNumber: 'Clause 4.1(c) - Corporate Legal Entity Verification',
    fallbackKeywords: ['cin', 'corporate identity', 'incorporation', 'pvt ltd', 'limited']
  },
  incomeTax: {
    ruleCriteria: 'Audited annual turnover statements and ITR filing acknowledgments demonstrating minimum financial net worth.',
    statutoryReference: 'General Financial Rules (GFR) 2017 Rule 144(i) & Income Tax Act',
    clauseNumber: 'Clause 4.3(a) - Financial Capability & Audited Turnover',
    fallbackKeywords: ['turnover', 'itr-6', 'itr', 'annual turnover', 'crore', 'audited']
  },
  epfo: {
    ruleCriteria: 'Valid EPFO Establishment Code (e.g. TN/MAS/0045812/000) confirming employee provident fund remittances.',
    statutoryReference: "Employees' Provident Funds and Miscellaneous Provisions Act 1952",
    clauseNumber: 'Clause 4.4(a) - Statutory Social Security Compliance',
    fallbackKeywords: ['epfo', 'provident fund', 'establishment code', 'epf']
  },
  esic: {
    ruleCriteria: 'Valid 17-digit ESIC employer registration code confirming health insurance coverage for workforce.',
    statutoryReference: "Employees' State Insurance Act 1948 Section 2A",
    clauseNumber: 'Clause 4.4(b) - Employee State Insurance Scheme',
    fallbackKeywords: ['esic', 'state insurance', '31000', 'esi']
  },
  startup: {
    ruleCriteria: 'Valid DPIIT Startup Recognition Certificate for exemption from prior turnover and experience criteria.',
    statutoryReference: 'DPIIT Notification G.S.R. 127(E) & Startup India Initiative',
    clauseNumber: 'Clause 4.2(b) - Startup Procurement Relaxation',
    fallbackKeywords: ['startup india', 'dpiit recognized', 'startup recognition', 'dipp']
  },
  nsic: {
    ruleCriteria: 'Valid NSIC Single Point Registration Certificate granting waiver of Earnest Money Deposit (EMD).',
    statutoryReference: 'Government Store Purchase Programme (GSPP) / NSIC SPRS Scheme',
    clauseNumber: 'Clause 4.2(c) - Single Point Registration Scheme',
    fallbackKeywords: ['nsic', 'single point registration', 'sprs', 'national small industries']
  },
  oem: {
    ruleCriteria: 'Valid and verifiable OEM Authorization Letter/MAF directly from the original equipment manufacturer.',
    statutoryReference: 'GeM General Terms & Conditions (GTC) Clause 8 / CPCL GCC',
    clauseNumber: 'Clause 4.5(a) - Manufacturer Authorization Form (MAF)',
    fallbackKeywords: ['oem', 'original equipment manufacturer', 'authorization letter', 'maf']
  },
  blacklist: {
    ruleCriteria: 'Mandatory affidavit confirming entity and directors have not been debarred or blacklisted by GeM, CPCL, or CPSEs.',
    statutoryReference: 'Department of Expenditure Office Memorandum F.1/20/2018-PPD & GFR 151',
    clauseNumber: 'Clause 2.1 - Mandatory Non-Debarment Gate',
    fallbackKeywords: ['debarment', 'blacklisting', 'never been debarred', 'blacklisted', 'affidavit']
  },
  labourLicense: {
    ruleCriteria: 'Valid CLRA license from the licensing officer for deploying contract workforce on refinery premises.',
    statutoryReference: 'Contract Labour (Regulation and Abolition) Act 1970 Section 12',
    clauseNumber: 'Clause 4.4(c) - Statutory Labour Regulation License',
    fallbackKeywords: ['clra', 'contract labour', 'labour license', 'licensing officer']
  },
  digilocker: {
    ruleCriteria: 'Cryptographically verified digital signature certificate (DSC Class-3) or authenticated DigiLocker document marker.',
    statutoryReference: 'Information Technology Act 2000 Section 3A & Rule 9A',
    clauseNumber: 'Clause 1.2 - Digital Verification & Electronic Records',
    fallbackKeywords: ['digilocker', 'dsc', 'digital signature', 'digitally signed', 'class-3']
  }
};

/**
 * Extracts a ±80 character snippet around the matched value or relevant keyword.
 */
function extractContextSnippet(text, searchVal, fallbackKeywords = [], docName = 'document.pdf', checkName = '') {
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return `Scanned 0 characters in '${docName}'. Document contains no extractable text.`;
  }

  const cleanText = text;
  const lowerText = cleanText.toLowerCase();

  // 1. Try finding by extractedValue (e.g. 33AABCP1234F1Z5 or 72.4%)
  if (searchVal) {
    const cleanSearch = String(searchVal).trim().toLowerCase();
    // Also try without non-alphanumerics (e.g. for UDYAM or percentages)
    const candidates = [
      cleanSearch,
      cleanSearch.replace(/[^a-z0-9]/gi, ''),
      cleanSearch.split(' ')[0]
    ].filter(c => c && c.length >= 3);

    for (const cand of candidates) {
      const idx = lowerText.indexOf(cand);
      if (idx !== -1) {
        return buildSurroundingExcerpt(cleanText, idx, cand.length);
      }
    }
  }

  // 2. Try finding by fallback keywords
  for (const kw of fallbackKeywords) {
    const idx = lowerText.indexOf(kw.toLowerCase());
    if (idx !== -1) {
      return buildSurroundingExcerpt(cleanText, idx, kw.length);
    }
  }

  // 3. Fallback diagnostic when not found
  return `Scanned ${cleanText.length} characters in '${docName}'. No statutory pattern or reference found matching ${checkName || 'requirement'}.`;
}

function buildSurroundingExcerpt(text, matchIndex, matchLen) {
  const windowSize = 80;
  const start = Math.max(0, matchIndex - windowSize);
  const end = Math.min(text.length, matchIndex + matchLen + windowSize);

  let snippet = text.substring(start, end).replace(/\r?\n|\r/g, ' ').replace(/\s+/g, ' ').trim();
  if (start > 0) snippet = '...' + snippet;
  if (end < text.length) snippet = snippet + '...';

  return snippet;
}

/**
 * Enriches each check in checksDetail with explainable AI metadata.
 * @param {Object} checksDetail - Map of checkId to check result object
 * @param {string} extractedText - Full extracted text of the document
 * @param {string} documentName - Name of the source document
 * @returns {Object} checksDetail - Enriched checks detail
 */
function enrichChecksDetail(checksDetail, extractedText = '', documentName = 'Uploaded_Document.pdf') {
  if (!checksDetail || typeof checksDetail !== 'object') return checksDetail;

  for (const [checkId, check] of Object.entries(checksDetail)) {
    if (!check) continue;

    const rule = STATUTORY_RULES[checkId] || {
      ruleCriteria: 'General GeM procurement statutory requirement compliance.',
      statutoryReference: 'GeM General Terms and Conditions (GTC) / CPCL SBD',
      clauseNumber: 'Statutory Clause',
      fallbackKeywords: [check.checkName ? check.checkName.toLowerCase() : checkId]
    };

    const snippet = extractContextSnippet(
      extractedText,
      check.extractedValue,
      rule.fallbackKeywords,
      documentName,
      check.checkName || checkId
    );

    // Compute numerical confidence score
    let confidence = 0.05;
    if (check.checkStatus === 'VERIFIED') {
      confidence = check.method === 'API_CALL' ? 0.99 : 0.96;
    } else if (check.checkStatus === 'NEEDS_MANUAL_REVIEW') {
      confidence = 0.75;
    } else if (check.checkStatus === 'NOT_CONFIGURED') {
      confidence = 0.50;
    } else {
      confidence = 0.05;
    }

    check.evidence = {
      ...(check.evidence || {}),
      documentName,
      ruleCriteria: rule.ruleCriteria,
      statutoryReference: rule.statutoryReference,
      clauseNumber: rule.clauseNumber,
      matchedSnippet: snippet,
      confidence,
      isMandatory: Boolean(check.isMandatoryGate)
    };
  }

  return checksDetail;
}

module.exports = {
  STATUTORY_RULES,
  extractContextSnippet,
  enrichChecksDetail
};
