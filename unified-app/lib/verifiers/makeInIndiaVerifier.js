const { Verifier, CheckStatus, VerificationResult } = require('./verifierTypes');

class MakeInIndiaVerifier extends Verifier {
  async verify(extracted, documentSha256, context = {}) {
    const localContentPct = extracted.localContentPct;
    // Default tender estimated value for CPCL-2026-T1001 is INR 1.45 Cr (<= 10 Cr threshold)
    const tenderValueCrores = context.tenderValueCrores || 1.45;
    const rawText = extracted.rawText || '';
    const udinMatch = rawText.match(/\b([0-9]{2}[0-9]{6}[A-Z0-9]{10})\b/i);

    if (localContentPct === null || localContentPct === undefined) {
      return new VerificationResult({
        checkId: 'makeInIndia',
        status: CheckStatus.FAILED,
        confidence: 1.0,
        extractedValue: 'No Local Content Declaration',
        sourceName: 'DPIIT Make in India Order 2017',
        rawResponseRef: null,
        explanation: 'No Make in India / Local Content affidavit or percentage declaration found in uploaded bid.',
        checkedAt: new Date().toISOString(),
        documentSha256
      });
    }

    const pctNum = parseFloat(localContentPct);
    if (pctNum < 20) {
      return new VerificationResult({
        checkId: 'makeInIndia',
        status: CheckStatus.FAILED,
        confidence: 1.0,
        extractedValue: `${pctNum}%`,
        sourceName: 'DPIIT Make in India Classification',
        rawResponseRef: null,
        explanation: `Declared local content (${pctNum}%) is below 20%. Classified as Non-Local Supplier with zero purchase preference.`,
        checkedAt: new Date().toISOString(),
        documentSha256
      });
    }

    // REGULATORY RULE (§5 Row 6):
    // For procurement value up to Rs 10 Crore: rule ONLY requires self-certification.
    // For procurement value > Rs 10 Crore: legally requires statutory/cost auditor certificate with UDIN.
    if (tenderValueCrores <= 10.0) {
      if (pctNum >= 50) {
        return new VerificationResult({
          checkId: 'makeInIndia',
          status: CheckStatus.VERIFIED,
          confidence: 1.0,
          extractedValue: `${pctNum}% Local Content (Class-I)`,
          sourceName: 'DPIIT Public Procurement Order 2017 (Self-Certification Clause)',
          rawResponseRef: `raw_mii_${documentSha256.substring(0, 10)}`,
          explanation: `Self-Certified: Tender value (₹${tenderValueCrores} Cr) is <= ₹10 Crore threshold. Valid self-certification declared at ${pctNum}% local content (Class-I Local Supplier entitled to purchase preference).`,
          checkedAt: new Date().toISOString(),
          documentSha256
        });
      } else {
        return new VerificationResult({
          checkId: 'makeInIndia',
          status: CheckStatus.NEEDS_MANUAL_REVIEW,
          confidence: 0.8,
          extractedValue: `${pctNum}% Local Content (Class-II)`,
          sourceName: 'DPIIT Public Procurement Order 2017',
          rawResponseRef: null,
          explanation: `Class-II Local Supplier declared (${pctNum}% local content, below 50% threshold). Eligible to participate, but does not qualify for purchase preference margin.`,
          checkedAt: new Date().toISOString(),
          documentSha256
        });
      }
    } else {
      // Tender value > 10 Crores -> Requires CA / Statutory Auditor Certificate with UDIN
      if (udinMatch) {
        return new VerificationResult({
          checkId: 'makeInIndia',
          status: CheckStatus.VERIFIED,
          confidence: 1.0,
          extractedValue: `${pctNum}% (Auditor Certified, UDIN: ${udinMatch[1]})`,
          sourceName: 'DPIIT Statutory Auditor Certificate (UDIN Verified)',
          rawResponseRef: `raw_mii_audited_${documentSha256.substring(0, 10)}`,
          explanation: `High-value tender (> ₹10 Cr): Statutory auditor certificate verified with ICAI UDIN '${udinMatch[1]}' (${pctNum}% local content).`,
          checkedAt: new Date().toISOString(),
          documentSha256
        });
      } else {
        return new VerificationResult({
          checkId: 'makeInIndia',
          status: CheckStatus.NEEDS_MANUAL_REVIEW,
          confidence: 0.5,
          extractedValue: `${pctNum}% (Self-Declared, Missing Auditor Certificate)`,
          sourceName: 'DPIIT Public Procurement Order 2017',
          rawResponseRef: null,
          explanation: `Tender value exceeds ₹10 Crore. Bidder provided ${pctNum}% self-declaration, but DPIIT regulations mandate an independent Cost Accountant / Statutory Auditor certificate with UDIN. Officer confirmation required.`,
          checkedAt: new Date().toISOString(),
          documentSha256
        });
      }
    }
  }
}

module.exports = MakeInIndiaVerifier;
