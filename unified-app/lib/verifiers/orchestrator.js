/**
 * Verification Orchestrator & Aggregation Engine
 * Section 7: Computes Compliance %, Automation Coverage %, and evaluates Mandatory Gates.
 */

const { CheckStatus } = require('./verifierTypes');
const UdyamVerifier = require('./udyamVerifier');
const GSTVerifier = require('./gstVerifier');
const PANVerifier = require('./panVerifier');
const DigiLockerVerifier = require('./digilockerVerifier');
const IncomeTaxVerifier = require('./incomeTaxVerifier');
const MakeInIndiaVerifier = require('./makeInIndiaVerifier');
const EPFOVerifier = require('./epfoVerifier');
const ESICVerifier = require('./esicVerifier');
const StartupIndiaVerifier = require('./startupIndiaVerifier');
const NSICVerifier = require('./nsicVerifier');
const OEMVerifier = require('./oemVerifier');
const DebarmentVerifier = require('./debarmentVerifier');
const MCAVerifier = require('./mcaVerifier');
const LabourLicenseVerifier = require('./labourLicenseVerifier');

// Statutory criticality weights for Compliance % (§7)
const CHECK_WEIGHTS = {
  gst: 20,          // Mandatory Gate
  pan: 20,          // Mandatory Gate
  mca: 15,          // Mandatory Gate
  blacklist: 20,    // Mandatory Gate
  udyam: 10,
  makeInIndia: 10,
  incomeTax: 10,
  epfo: 5,
  esic: 5,
  oem: 5,
  digilocker: 5,
  startup: 2,
  nsic: 2,
  labourLicense: 3
};

// 4 Mandatory Statutory Gates (§7)
const MANDATORY_GATES = ['gst', 'pan', 'mca', 'blacklist'];

class VerificationOrchestrator {
  constructor() {
    this.verifiers = {
      digilocker: new DigiLockerVerifier(),
      udyam: new UdyamVerifier(),
      gst: new GSTVerifier(),
      pan: new PANVerifier(),
      incomeTax: new IncomeTaxVerifier(),
      makeInIndia: new MakeInIndiaVerifier(),
      epfo: new EPFOVerifier(),
      esic: new ESICVerifier(),
      startup: new StartupIndiaVerifier(),
      nsic: new NSICVerifier(),
      oem: new OEMVerifier(),
      blacklist: new DebarmentVerifier(),
      mca: new MCAVerifier(),
      labourLicense: new LabourLicenseVerifier()
    };
  }

  /**
   * Runs all 14 verifiers and computes Section 7 metrics
   */
  async runVerification(extractedEntities, documentSha256, context = {}) {
    const results = {};
    const checksArray = Object.keys(this.verifiers);

    for (const checkId of checksArray) {
      const verifier = this.verifiers[checkId];
      try {
        results[checkId] = await verifier.verify(extractedEntities, documentSha256, context);
      } catch (err) {
        results[checkId] = {
          checkId,
          status: CheckStatus.FAILED,
          confidence: 0,
          extractedValue: null,
          sourceName: 'System Error',
          rawResponseRef: null,
          explanation: 'Internal verifier exception: ' + err.message,
          checkedAt: new Date().toISOString(),
          documentSha256
        };
      }
    }

    // Section 7: Metric 1 — Compliance %
    // compliance_pct = Sum(weight[i] * passed[i]) / Sum(weight[i]) * 100
    // over i where status[i] in {VERIFIED, FAILED}
    let resolvedWeightSum = 0;
    let passedWeightSum = 0;

    // Section 7: Metric 2 — Automation Coverage %
    // automation_pct = count(status in {VERIFIED, FAILED}) / count(status != NOT_APPLICABLE) * 100
    let resolvedCount = 0;
    let applicableCount = 0;

    // Mandatory Gates Status
    const gatesStatus = {};
    let allGatesPassed = true;
    let failedGateNames = [];

    for (const checkId of checksArray) {
      const res = results[checkId];
      const weight = CHECK_WEIGHTS[checkId] || 5;

      if (res.status !== CheckStatus.NOT_APPLICABLE) {
        applicableCount++;
      }

      if (res.status === CheckStatus.VERIFIED || res.status === CheckStatus.FAILED) {
        resolvedCount++;
        resolvedWeightSum += weight;
        if (res.status === CheckStatus.VERIFIED) {
          passedWeightSum += weight;
        }
      }

      // Check Mandatory Gates
      if (MANDATORY_GATES.includes(checkId)) {
        const passed = (res.status === CheckStatus.VERIFIED);
        gatesStatus[checkId] = {
          status: res.status,
          passed
        };
        if (res.status === CheckStatus.FAILED) {
          allGatesPassed = false;
          failedGateNames.push(checkId.toUpperCase());
        }
      }
    }

    const compliancePct = resolvedWeightSum > 0 
      ? Math.round((passedWeightSum / resolvedWeightSum) * 100) 
      : 0;

    const automationPct = applicableCount > 0 
      ? Math.round((resolvedCount / applicableCount) * 100) 
      : 0;

    // Determine Final Eligibility (§7)
    let isEligible = allGatesPassed && (compliancePct >= 75);
    let riskLevel = 'Low';
    let verdict = '';

    if (!allGatesPassed) {
      isEligible = false;
      riskLevel = 'Critical';
      verdict = `NOT ELIGIBLE: Mandatory statutory gate failure (${failedGateNames.join(', ')}). Immediate disqualification under procurement rules.`;
    } else if (compliancePct < 60) {
      isEligible = false;
      riskLevel = 'Critical';
      verdict = 'NOT ELIGIBLE: Overall statutory compliance is below minimum threshold (60%). Significant compliance gaps detected.';
    } else if (compliancePct < 80 || automationPct < 60) {
      riskLevel = 'Medium';
      verdict = 'CONDITIONAL / MANUAL REVIEW REQUIRED: Mandatory gates cleared, but document contains unresolved manual-assist requirements (CA UDIN, OEM Auth, or Labour licensing).';
    } else {
      riskLevel = 'Low';
      verdict = 'ELIGIBLE FOR COMMERCIAL EVALUATION: All mandatory statutory gates passed, and compliance checks authenticated.';
    }

    return {
      documentSha256,
      compliancePct,
      automationPct,
      isEligible,
      allGatesPassed,
      gatesStatus,
      riskLevel,
      verdict,
      checks: results,
      totalChecks: checksArray.length,
      resolvedCount,
      applicableCount
    };
  }
}

module.exports = new VerificationOrchestrator();
