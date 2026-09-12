/**
 * Verifier Interface & Status Enums
 * Adhering to Section 6 of the BidVerify Real Verification Engine Specification.
 */

const CheckStatus = Object.freeze({
  VERIFIED: 'VERIFIED',
  FAILED: 'FAILED',
  NEEDS_MANUAL_REVIEW: 'NEEDS_MANUAL_REVIEW',
  NOT_APPLICABLE: 'NOT_APPLICABLE',
  NOT_CONFIGURED: 'NOT_CONFIGURED' // credentials/API missing — never silently becomes VERIFIED
});

class VerificationResult {
  constructor({
    checkId,
    status,
    confidence = null,
    extractedValue = null,
    sourceName,
    rawResponseRef = null,
    explanation,
    checkedAt = new Date().toISOString(),
    documentSha256
  }) {
    if (!Object.values(CheckStatus).includes(status)) {
      throw new Error('Invalid CheckStatus: ' + status);
    }
    this.checkId = checkId;
    this.status = status;
    this.confidence = (status === CheckStatus.VERIFIED || status === CheckStatus.FAILED) ? confidence : null;
    this.extractedValue = extractedValue;
    this.sourceName = sourceName;
    this.rawResponseRef = rawResponseRef;
    this.explanation = explanation;
    this.checkedAt = checkedAt;
    this.documentSha256 = documentSha256;
  }
}

class Verifier {
  /**
   * @param {Object} extracted - Extracted document entities and metadata
   * @param {string} documentSha256 - Cryptographic hash of the uploaded document
   * @param {Object} context - Optional tender and officer configuration context
   * @returns {Promise<VerificationResult>}
   */
  async verify(extracted, documentSha256, context = {}) {
    throw new Error('Method verify() must be implemented by subclass.');
  }
}

module.exports = {
  CheckStatus,
  VerificationResult,
  Verifier
};
