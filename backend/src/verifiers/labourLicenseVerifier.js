const { Verifier, CheckStatus, VerificationResult } = require('./verifierTypes');

class LabourLicenseVerifier extends Verifier {
  async verify(extracted, documentSha256, context = {}) {
    const rawText = (extracted.rawText || '').toLowerCase();
    const hasLicense = rawText.includes('labour license') || rawText.includes('clra') || rawText.includes('contract labour') || rawText.includes('shram suvidha');

    if (!hasLicense) {
      return new VerificationResult({
        checkId: 'labourLicense',
        status: CheckStatus.FAILED,
        confidence: 1.0,
        extractedValue: 'Not Detected',
        sourceName: 'Shram Suvidha & State Labour Portals',
        rawResponseRef: null,
        explanation: 'No Contract Labour (Regulation & Abolition) Act 1970 registration detected in bid envelope.',
        checkedAt: new Date().toISOString(),
        documentSha256
      });
    }

    // Section 5 Row 14: Labour licensing is fragmented by state. Extract and route to officer confirmation.
    return new VerificationResult({
      checkId: 'labourLicense',
      status: CheckStatus.NEEDS_MANUAL_REVIEW,
      confidence: 0.75,
      extractedValue: 'CLRA Labour License Document Detected',
      sourceName: 'Shram Suvidha Portal (shramsuvidha.gov.in)',
      rawResponseRef: `raw_labour_${documentSha256.substring(0, 10)}`,
      explanation: 'Labour license declarations detected under CLRA Act 1970. Jurisdiction is state-fragmented; officer must confirm validity on state labour portal or Shram Suvidha LIN.',
      checkedAt: new Date().toISOString(),
      documentSha256
    });
  }
}

module.exports = LabourLicenseVerifier;
