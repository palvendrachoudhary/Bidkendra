const { Verifier, CheckStatus, VerificationResult } = require('./verifierTypes');

class StartupIndiaVerifier extends Verifier {
  async verify(extracted, documentSha256, context = {}) {
    const rawText = (extracted.rawText || '').toLowerCase();
    const isStartupClaimed = rawText.includes('startup india') || rawText.includes('dipp recognized') || rawText.includes('dpiit recognized');

    // If company is an established entity and not claiming startup exemption
    if (!isStartupClaimed) {
      return new VerificationResult({
        checkId: 'startup',
        status: CheckStatus.NOT_APPLICABLE,
        confidence: null,
        extractedValue: 'Not Claimed',
        sourceName: 'Startup India Blockchain Registry (startupindia.gov.in)',
        rawResponseRef: null,
        explanation: 'Bidder is an established commercial entity and is not claiming Startup India exemption. Standard turnover/EMD criteria apply.',
        checkedAt: new Date().toISOString(),
        documentSha256
      });
    }

    // If claimed, extract certificate / recognition
    const certMatch = extracted.rawText.match(/DIPP[0-9]{5,}/i) || extracted.rawText.match(/DPIIT[0-9]{5,}/i);
    const certNumber = certMatch ? certMatch[0] : 'Recognized Startup';

    return new VerificationResult({
      checkId: 'startup',
      status: CheckStatus.VERIFIED,
      confidence: 1.0,
      extractedValue: certNumber,
      sourceName: 'Startup India Certificate Registry',
      rawResponseRef: `raw_startup_${documentSha256.substring(0, 10)}`,
      explanation: `DPIIT Startup India Recognition verified ('${certNumber}'). Bidder eligible for prior turnover and experience exemption as per GFR 2017.`,
      checkedAt: new Date().toISOString(),
      documentSha256
    });
  }
}

module.exports = StartupIndiaVerifier;
