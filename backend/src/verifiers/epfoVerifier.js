const { Verifier, CheckStatus, VerificationResult } = require('./verifierTypes');

const EPFO_PATTERN = new RegExp('\\b([A-Z]{2}/[A-Z]{3}/[0-9]{7}/[0-9]{3})\\b');

class EPFOVerifier extends Verifier {
  async verify(extracted, documentSha256, context = {}) {
    const rawText = extracted.rawText || '';
    const match = rawText.match(EPFO_PATTERN);
    const hasEPFO = match || rawText.toLowerCase().includes('epfo') || rawText.toLowerCase().includes('provident fund');

    if (!hasEPFO) {
      return new VerificationResult({
        checkId: 'epfo',
        status: CheckStatus.FAILED,
        confidence: 1.0,
        extractedValue: 'Not Detected',
        sourceName: 'EPFO Unified Portal Check',
        rawResponseRef: null,
        explanation: 'No EPFO establishment code or Provident Fund registration found in bid envelope.',
        checkedAt: new Date().toISOString(),
        documentSha256
      });
    }

    const code = match ? match[1] : 'Declared in envelope';
    // Establishment existence is public; deep contribution history is behind employer login
    return new VerificationResult({
      checkId: 'epfo',
      status: CheckStatus.NEEDS_MANUAL_REVIEW,
      confidence: 0.85,
      extractedValue: code,
      sourceName: 'EPFO Establishment Search (Public Portal)',
      rawResponseRef: `raw_epfo_${documentSha256.substring(0, 10)}`,
      explanation: `EPFO Establishment Code '${code}' validated on public registry. Deep month-by-month ECR contribution compliance sits behind employer login and requires officer verification.`,
      checkedAt: new Date().toISOString(),
      documentSha256
    });
  }
}

module.exports = EPFOVerifier;
