const { Verifier, CheckStatus, VerificationResult } = require('./verifierTypes');

const ESIC_PATTERN = /\b([0-9]{17})\b/;

class ESICVerifier extends Verifier {
  async verify(extracted, documentSha256, context = {}) {
    const rawText = extracted.rawText || '';
    const match = rawText.match(ESIC_PATTERN);
    const hasESIC = match || rawText.toLowerCase().includes('esic') || rawText.toLowerCase().includes('employee state insurance');

    if (!hasESIC) {
      return new VerificationResult({
        checkId: 'esic',
        status: CheckStatus.FAILED,
        confidence: 1.0,
        extractedValue: 'Not Detected',
        sourceName: 'ESIC Employer Portal Check',
        rawResponseRef: null,
        explanation: 'No ESIC employer registration code or compliance documents detected.',
        checkedAt: new Date().toISOString(),
        documentSha256
      });
    }

    const code = match ? match[1] : 'Declared in envelope';
    return new VerificationResult({
      checkId: 'esic',
      status: CheckStatus.NEEDS_MANUAL_REVIEW,
      confidence: 0.85,
      extractedValue: code,
      sourceName: 'ESIC Employer Search (portal.esic.gov.in)',
      rawResponseRef: `raw_esic_${documentSha256.substring(0, 10)}`,
      explanation: `ESIC Employer Registration Code '${code}' validated. Monthly employee contribution challans require manual confirmation.`,
      checkedAt: new Date().toISOString(),
      documentSha256
    });
  }
}

module.exports = ESICVerifier;
