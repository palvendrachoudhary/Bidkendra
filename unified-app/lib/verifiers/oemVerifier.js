const { Verifier, CheckStatus, VerificationResult } = require('./verifierTypes');

class OEMVerifier extends Verifier {
  async verify(extracted, documentSha256, context = {}) {
    const rawText = (extracted.rawText || '').toLowerCase();
    const hasOEM = rawText.includes('oem authorization') || 
                   rawText.includes('manufacturer authorization') ||
                   rawText.includes('maf attached') ||
                   extracted.hasOEM;

    if (!hasOEM) {
      return new VerificationResult({
        checkId: 'oem',
        status: CheckStatus.FAILED,
        confidence: 1.0,
        extractedValue: 'Missing Authorization Letter',
        sourceName: 'Tender Equipment Manufacturer Verification',
        rawResponseRef: null,
        explanation: 'No Manufacturer / OEM Authorization Form (MAF) detected in the bid envelope.',
        checkedAt: new Date().toISOString(),
        documentSha256
      });
    }

    // Section 5 Row 11: Private manufacturer document, no government database exists.
    // Treat as document authenticity work, route to officer confirmation. Never show "Verified 100%".
    return new VerificationResult({
      checkId: 'oem',
      status: CheckStatus.NEEDS_MANUAL_REVIEW,
      confidence: 0.75,
      extractedValue: 'Manufacturer Authorization Letter Attached',
      sourceName: 'Private OEM Document Examination',
      rawResponseRef: `raw_oem_${documentSha256.substring(0, 10)}`,
      explanation: 'Manufacturer Authorization Letter (MAF) detected with warranty endorsement. Under tender integrity rules, this is a private non-government document; Nodal Officer must confirm signatory validity directly with OEM for high-value tenders.',
      checkedAt: new Date().toISOString(),
      documentSha256
    });
  }
}

module.exports = OEMVerifier;
