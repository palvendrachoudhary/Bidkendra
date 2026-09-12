const path = require('path');
const fs = require('fs');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const BACKEND_DIR = path.join(PROJECT_ROOT, 'backend');
const VERIFIERS_DIR = path.join(BACKEND_DIR, 'src', 'services', 'verification');

const gstVerifier = require(path.join(VERIFIERS_DIR, 'gstVerifier.js'));
const panVerifier = require(path.join(VERIFIERS_DIR, 'panVerifier.js'));
const mcaVerifier = require(path.join(VERIFIERS_DIR, 'mcaVerifier.js'));
const udyamVerifier = require(path.join(VERIFIERS_DIR, 'udyamVerifier.js'));
const makeInIndiaVerifier = require(path.join(VERIFIERS_DIR, 'makeInIndiaVerifier.js'));
const { CheckStatus } = require(path.join(VERIFIERS_DIR, 'checkStatus.js'));

/**
 * Test Suite: Statutory Verifiers (GST, PAN, CIN, Udyam, Make-In-India)
 */
async function runStatutoryVerifierTests() {
  const results = [];

  async function recordTest(id, name, tier, testFn) {
    const start = Date.now();
    try {
      await testFn();
      results.push({ id, name, tier, pass: true, durationMs: Date.now() - start });
    } catch (err) {
      results.push({ id, name, tier, pass: false, error: err.message, durationMs: Date.now() - start });
    }
  }

  // ==========================================
  // 1. GSTIN Verifier Tests
  // ==========================================

  // T1.5.1: Standard uppercase GSTIN
  await recordTest('T1.5.1', 'GSTIN Verifier passes valid 15-character uppercase GSTIN (33AABCP1234F1Z5)', 'Tier 1', async () => {
    const text = 'Registered under GST with GSTIN: 33AABCP1234F1Z5 in Tamil Nadu.';
    const res = await gstVerifier.verify(text, {});
    if (res.checkStatus !== CheckStatus.VERIFIED) {
      throw new Error(`Expected CheckStatus.VERIFIED, received '${res.checkStatus}'`);
    }
    if (res.extractedValue !== '33AABCP1234F1Z5') {
      throw new Error(`Expected extractedValue: '33AABCP1234F1Z5', received '${res.extractedValue}'`);
    }
  });

  // T2.2.1: Case-insensitivity (lowercase GSTIN from OCR)
  await recordTest('T2.2.1', 'GSTIN Verifier recognizes lowercase OCR text (33aabcp1234f1z5)', 'Tier 2', async () => {
    const text = 'Supplier tax identification: 33aabcp1234f1z5.';
    const res = await gstVerifier.verify(text, {});
    if (res.checkStatus !== CheckStatus.VERIFIED) {
      throw new Error(`Expected VERIFIED for lowercase GSTIN, but received '${res.checkStatus}'. Verifier regex lacks case-insensitivity (/i flag).`);
    }
  });

  // T2.2.2: Invalid state code GSTIN (e.g. 99)
  await recordTest('T2.2.2', 'GSTIN Verifier rejects invalid state code > 38 (99AABCP1234F1Z5)', 'Tier 2', async () => {
    const text = 'Tax registration: 99AABCP1234F1Z5';
    const res = await gstVerifier.verify(text, {});
    if (res.checkStatus === CheckStatus.VERIFIED) {
      throw new Error('GSTIN with state code 99 should have been rejected');
    }
  });

  // ==========================================
  // 2. PAN Verifier Tests
  // ==========================================

  // T1.5.2: Standard corporate PAN
  await recordTest('T1.5.2', 'PAN Verifier passes valid 10-character corporate PAN (AABCP1234F)', 'Tier 1', async () => {
    const text = 'Tax ID PAN: AABCP1234F attached with ITR-6';
    const res = await panVerifier.verify(text, {});
    if (res.checkStatus !== CheckStatus.VERIFIED) {
      throw new Error(`Expected CheckStatus.VERIFIED, received '${res.checkStatus}'`);
    }
    if (res.extractedValue !== 'AABCP1234F') {
      throw new Error(`Expected extractedValue: 'AABCP1234F', received '${res.extractedValue}'`);
    }
  });

  // T2.2.3: Lowercase PAN
  await recordTest('T2.2.3', 'PAN Verifier recognizes lowercase OCR text (aabcp1234f)', 'Tier 2', async () => {
    const text = 'Permanent account number: aabcp1234f';
    const res = await panVerifier.verify(text, {});
    if (res.checkStatus !== CheckStatus.VERIFIED) {
      throw new Error(`Expected VERIFIED for lowercase PAN, but received '${res.checkStatus}'. Verifier regex lacks case-insensitivity (/i flag).`);
    }
  });

  // T2.2.4: Non-corporate entity PAN (Partnership 'F', Individual 'P')
  await recordTest('T2.2.4', 'PAN Verifier recognizes partnership firm PAN entity type F (AAAFK1234F)', 'Tier 2', async () => {
    const text = 'Partnership Tax PAN: AAAFK1234F';
    const res = await panVerifier.verify(text, {});
    if (res.checkStatus !== CheckStatus.VERIFIED) {
      throw new Error(`Expected VERIFIED for partnership PAN entity 'F', received '${res.checkStatus}'`);
    }
  });

  // T2.2.5: Invalid PAN entity code
  await recordTest('T2.2.5', 'PAN Verifier rejects invalid 4th character entity type (AABXP1234F)', 'Tier 2', async () => {
    const text = 'PAN: AABXP1234F';
    const res = await panVerifier.verify(text, {});
    if (res.checkStatus === CheckStatus.VERIFIED) {
      throw new Error('PAN with invalid entity code X must not be verified');
    }
  });

  // ==========================================
  // 3. MCA CIN Verifier Tests
  // ==========================================

  // T1.5.3: Standard corporate CIN
  await recordTest('T1.5.3', 'MCA Verifier passes valid 21-character corporate CIN (U23201TN2018PTC123456)', 'Tier 1', async () => {
    const text = 'Corporate Registration CIN: U23201TN2018PTC123456 registered at RoC Chennai';
    const res = await mcaVerifier.verify(text, {});
    if (res.checkStatus !== CheckStatus.VERIFIED) {
      throw new Error(`Expected CheckStatus.VERIFIED, received '${res.checkStatus}'`);
    }
    if (res.extractedValue !== 'U23201TN2018PTC123456') {
      throw new Error(`Expected extractedValue: 'U23201TN2018PTC123456', received '${res.extractedValue}'`);
    }
  });

  // T2.2.6: Lowercase CIN
  await recordTest('T2.2.6', 'MCA Verifier recognizes lowercase CIN (u23201tn2018ptc123456)', 'Tier 2', async () => {
    const text = 'Corporate identification number: u23201tn2018ptc123456';
    const res = await mcaVerifier.verify(text, {});
    if (res.checkStatus !== CheckStatus.VERIFIED) {
      throw new Error(`Expected VERIFIED for lowercase CIN, but received '${res.checkStatus}'. Regex lacks case-insensitivity (/i flag).`);
    }
  });

  // T2.2.7: Non-corporate entity exemption (Partnership / Proprietorship without CIN)
  await recordTest('T2.2.7', 'Non-corporate entity without 21-char CIN does not trigger mandatory gate failure', 'Tier 2', async () => {
    const text = 'Kaveri Engineering Works is a Registered Partnership Firm with PAN AAAFK1234F and Udyam UDYAM-TN-08-0012345.';
    const res = await mcaVerifier.verify(text, {});
    // Non-corporate entity should not be marked as mandatory failure disqualifying bidder
    if (res.isMandatoryGate && res.checkStatus === CheckStatus.FAILED) {
      throw new Error('MCA verifier marks missing CIN as mandatory failure for non-corporate bidder, causing false disqualification.');
    }
  });

  // ==========================================
  // 4. MSME Udyam Verifier Tests
  // ==========================================

  // T1.5.4: Standard Udyam format
  await recordTest('T1.5.4', 'Udyam Verifier passes standard format (UDYAM-TN-02-0045812)', 'Tier 1', async () => {
    const text = 'Ministry of MSME Udyam Registration: UDYAM-TN-02-0045812 (Small Enterprise)';
    const res = await udyamVerifier.verify(text, {});
    if (res.checkStatus !== CheckStatus.VERIFIED) {
      throw new Error(`Expected CheckStatus.VERIFIED, received '${res.checkStatus}'`);
    }
    if (res.extractedValue !== 'UDYAM-TN-02-0045812') {
      throw new Error(`Expected extractedValue: 'UDYAM-TN-02-0045812', received '${res.extractedValue}'`);
    }
  });

  // T2.2.8: Lowercase Udyam registration
  await recordTest('T2.2.8', 'Udyam Verifier recognizes lowercase OCR text (udyam-tn-02-0045812)', 'Tier 2', async () => {
    const text = 'MSME certificate: udyam-tn-02-0045812';
    const res = await udyamVerifier.verify(text, {});
    if (res.checkStatus !== CheckStatus.VERIFIED) {
      throw new Error(`Expected VERIFIED for lowercase Udyam, received '${res.checkStatus}'. Regex lacks case-insensitivity.`);
    }
  });

  // ==========================================
  // 5. Make In India Verifier Tests
  // ==========================================

  // T1.5.5: Class-I Local Supplier (>=50%)
  await recordTest('T1.5.5', 'Make In India verifies Class-I Local Supplier declaration (72.4%)', 'Tier 1', async () => {
    const text = 'We solemnly declare that the Local Content for CPCL Tender is 72.4%. We are a Class-I Local Supplier.';
    const res = await makeInIndiaVerifier.verify(text, {});
    if (res.checkStatus === CheckStatus.FAILED) {
      throw new Error(`Expected non-FAILED status for 72.4% local content, received '${res.checkStatus}'`);
    }
    if (!res.extractedValue || !res.extractedValue.includes('72.4')) {
      throw new Error(`Expected extractedValue containing '72.4', received '${res.extractedValue}'`);
    }
  });

  // T2.3.1: Contextual matching - ignores standalone commercial percentages
  await recordTest('T2.3.1', 'Make In India ignores arbitrary percentages (10% advance, 18% GST) without local content context', 'Tier 2', async () => {
    const commercialInvoiceText = `
      COMMERCIAL PROPOSAL:
      Payment Terms: 10% advance, 90% against delivery.
      GST applicable at 18%.
      Retention money: 5% of order value.
    `;
    const res = await makeInIndiaVerifier.verify(commercialInvoiceText, {});
    // Must NOT latch onto 10% or 18% as local content percentage and fail on < 20%
    if (res.extractedValue && (res.extractedValue.includes('10%') || res.extractedValue.includes('18%') || res.extractedValue.includes('5%'))) {
      throw new Error(`Make In India falsely latched onto non-local percentage: '${res.extractedValue}'. Greedy regex fallback must be removed.`);
    }
    if (res.message && res.message.includes('10% is below the statutory 20%')) {
      throw new Error(`Make In India erroneously failed with: '${res.message}'`);
    }
  });

  // T2.3.2: Class-II Local Supplier boundary (exactly 20.0%)
  await recordTest('T2.3.2', 'Make In India accepts minimum statutory threshold (Local Content: 20.0%)', 'Tier 2', async () => {
    const text = 'We hereby certify local content in this tender bid is 20.0%.';
    const res = await makeInIndiaVerifier.verify(text, {});
    if (res.checkStatus === CheckStatus.FAILED) {
      throw new Error(`20.0% local content meets the minimum statutory threshold, but verifier marked it as FAILED: ${res.message}`);
    }
  });

  // T2.3.3: Below statutory threshold (<20%)
  await recordTest('T2.3.3', 'Make In India fails when local content is below 20% (Local Content: 18.5%)', 'Tier 2', async () => {
    const text = 'Indigenous content for offered items is 18.5%.';
    const res = await makeInIndiaVerifier.verify(text, {});
    if (res.checkStatus !== CheckStatus.FAILED) {
      throw new Error(`Expected FAILED for 18.5% local content (< 20%), received '${res.checkStatus}'`);
    }
  });

  return results;
}

if (require.main === module) {
  runStatutoryVerifierTests().then(results => {
    console.log('\n=== STATUTORY VERIFIERS TEST RESULTS ===\n');
    let passCount = 0;
    results.forEach(r => {
      const mark = r.pass ? '✅ PASS' : '❌ FAIL';
      if (r.pass) passCount++;
      console.log(`[${r.tier}] ${r.id}: ${r.name} -> ${mark} (${r.durationMs}ms)`);
      if (!r.pass) console.log(`   Error: ${r.error}`);
    });
    console.log(`\nTotal: ${results.length} | Passed: ${passCount} | Failed: ${results.length - passCount}\n`);
    process.exit(results.length === passCount ? 0 : 1);
  }).catch(err => {
    console.error('Fatal test runner failure:', err);
    process.exit(1);
  });
}

module.exports = { runStatutoryVerifierTests };
