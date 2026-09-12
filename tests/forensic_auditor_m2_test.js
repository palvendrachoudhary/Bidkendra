/**
 * Independent Forensic Audit Test Suite for Milestone 2
 * Auditor: teamwork_preview_auditor_m2_1
 * Role: Forensic Integrity Auditor
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');

const gstVerifier = require('../backend/src/services/verification/gstVerifier');
const panVerifier = require('../backend/src/services/verification/panVerifier');
const mcaVerifier = require('../backend/src/services/verification/mcaVerifier');
const udyamVerifier = require('../backend/src/services/verification/udyamVerifier');
const makeInIndiaVerifier = require('../backend/src/services/verification/makeInIndiaVerifier');
const aiService = require('../backend/src/services/aiService');
const { scanAndVerifyDocument } = require('../backend/src/services/realOcrService');
const { CheckStatus } = require('../backend/src/services/verification/checkStatus');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const testResults = [];

async function runCheck(id, description, category, fn) {
  totalTests++;
  const start = Date.now();
  try {
    await fn();
    const duration = Date.now() - start;
    passedTests++;
    testResults.push({ id, description, category, status: 'PASS', duration });
    console.log(`[${category}] ${id}: ${description} -> PASS (${duration}ms)`);
  } catch (err) {
    const duration = Date.now() - start;
    failedTests++;
    testResults.push({ id, description, category, status: 'FAIL', duration, error: err.message });
    console.error(`[${category}] ${id}: ${description} -> FAIL (${duration}ms): ${err.message}`);
  }
}

async function runAllForensicChecks() {
  console.log('================================================================');
  console.log('STARTING FORENSIC INTEGRITY AUDIT SUITE — MILESTONE 2');
  console.log('================================================================\n');

  // -------------------------------------------------------------
  // 1. CHEATING DETECTION: Arbitrary Non-PetroTech Data
  // -------------------------------------------------------------
  console.log('--- CHECK 1: CHEATING & HARDCODING DETECTION ---');

  await runCheck('FC1.1', 'GSTIN verifier accepts newly generated valid GSTIN for arbitrary state and company (27AAACH1234F1Z8)', 'CheatingDetection', async () => {
    const res = await gstVerifier.verify('Supplier Tax Invoice. GSTIN: 27AAACH1234F1Z8. Authorized signatory.');
    assert.strictEqual(res.checkStatus, CheckStatus.VERIFIED);
    assert.strictEqual(res.extractedValue, '27AAACH1234F1Z8');
  });

  await runCheck('FC1.2', 'PAN verifier accepts newly generated arbitrary individual PAN (AAAPZ9876K)', 'CheatingDetection', async () => {
    const res = await panVerifier.verify('Proprietor Income Tax PAN Number: aaapz9876k.');
    assert.strictEqual(res.checkStatus, CheckStatus.VERIFIED);
    assert.strictEqual(res.extractedValue, 'AAAPZ9876K');
  });

  await runCheck('FC1.3', 'MCA verifier accepts newly generated arbitrary CIN for Bangalore tech firm (L72200KA2020PLC098765)', 'CheatingDetection', async () => {
    const res = await mcaVerifier.verify('Company CIN: l72200ka2020plc098765. Registered in Karnataka.');
    assert.strictEqual(res.checkStatus, CheckStatus.VERIFIED);
    assert.strictEqual(res.extractedValue, 'L72200KA2020PLC098765');
  });

  await runCheck('FC1.4', 'Udyam verifier accepts newly generated arbitrary Haryana enterprise (UDYAM-HR-03-0099887)', 'CheatingDetection', async () => {
    const res = await udyamVerifier.verify('Enterprise registration: udyam - hr - 03 - 0099887.');
    assert.strictEqual(res.checkStatus, CheckStatus.VERIFIED);
    assert.strictEqual(res.extractedValue, 'UDYAM-HR-03-0099887');
  });

  await runCheck('FC1.5', 'Make In India verifier calculates arbitrary percentage (61.8%) correctly without hardcoded values', 'CheatingDetection', async () => {
    const res = await makeInIndiaVerifier.verify('We certify indigenous content is 61.8% for all supplied equipment.');
    assert.strictEqual(res.checkStatus, CheckStatus.NEEDS_MANUAL_REVIEW); // No API key configured
    assert.strictEqual(res.extractedValue, '61.8%');
    assert.ok(res.message.includes('Class-I Local Supplier'));
  });

  // -------------------------------------------------------------
  // 2. DUMMY / FACADE DETECTION: Statutory Boundary & Logic Tests
  // -------------------------------------------------------------
  console.log('\n--- CHECK 2: DUMMY / FACADE DETECTION ---');

  await runCheck('FC2.1', 'GSTIN: Rejects state code 00 (below valid range 01-38)', 'FacadeDetection', async () => {
    const res = await gstVerifier.verify('GSTIN: 00AAACH1234F1Z8');
    assert.strictEqual(res.checkStatus, CheckStatus.FAILED);
    assert.strictEqual(res.isMandatoryGate, true);
  });

  await runCheck('FC2.2', 'GSTIN: Rejects state code 39 (above valid range 01-38)', 'FacadeDetection', async () => {
    const res = await gstVerifier.verify('GSTIN: 39AAACH1234F1Z8');
    assert.strictEqual(res.checkStatus, CheckStatus.FAILED);
    assert.strictEqual(res.isMandatoryGate, true);
  });

  await runCheck('FC2.3', 'GSTIN: Rejects invalid 14th character (must be Z)', 'FacadeDetection', async () => {
    const res = await gstVerifier.verify('GSTIN: 27AAACH1234F1A8');
    assert.strictEqual(res.checkStatus, CheckStatus.FAILED);
  });

  await runCheck('FC2.4', 'PAN: Rejects invalid 4th character entity type (e.g. X, E, Z)', 'FacadeDetection', async () => {
    const res = await panVerifier.verify('Income Tax PAN: ABCDX1234F');
    assert.strictEqual(res.checkStatus, CheckStatus.FAILED);
  });

  await runCheck('FC2.5', 'PAN: Accepts all legitimate CBDT entity types (C, P, H, F, A, T, B, L, J, G)', 'FacadeDetection', async () => {
    const entityTypes = ['C', 'P', 'H', 'F', 'A', 'T', 'B', 'L', 'J', 'G'];
    for (const entity of entityTypes) {
      const pan = `ABC${entity}S1234K`;
      const res = await panVerifier.verify(`Tax ID: ${pan}`);
      assert.strictEqual(res.checkStatus, CheckStatus.VERIFIED, `Failed for entity type ${entity}`);
      assert.strictEqual(res.extractedValue, pan);
    }
  });

  await runCheck('FC2.6', 'PAN: Fallback extraction from GSTIN substring(2, 12) functions dynamically', 'FacadeDetection', async () => {
    // 07AAACT9999K1Z2 -> Embedded PAN is AAACT9999K (Trust entity 'T')
    const res = await panVerifier.verify('Notice: Vendor quotes GSTIN: 07AAACT9999K1Z2. No other PAN specified.');
    assert.strictEqual(res.checkStatus, CheckStatus.VERIFIED);
    assert.strictEqual(res.extractedValue, 'AAACT9999K');
  });

  await runCheck('FC2.7', 'MCA: Partnerships and LLPs are exempted from mandatory gate CIN failure', 'FacadeDetection', async () => {
    const res = await mcaVerifier.verify('Business Type: Registered Partnership Firm. Operating under Indian Partnership Act.');
    assert.strictEqual(res.checkStatus, CheckStatus.VERIFIED);
    assert.strictEqual(res.isMandatoryGate, false);
    assert.ok(res.message.includes('exemption applied'));
  });

  await runCheck('FC2.8', 'MCA: Sole proprietorships are exempted from mandatory gate CIN failure', 'FacadeDetection', async () => {
    const res = await mcaVerifier.verify('Declaration of Proprietorship: Enterprise is an individual proprietorship.');
    assert.strictEqual(res.checkStatus, CheckStatus.VERIFIED);
    assert.strictEqual(res.isMandatoryGate, false);
    assert.ok(res.message.includes('exemption applied'));
  });

  await runCheck('FC2.9', 'MCA: Corporate entity missing CIN triggers mandatory gate failure', 'FacadeDetection', async () => {
    const res = await mcaVerifier.verify('Vendor tender bid without any company registration numbers.');
    assert.strictEqual(res.checkStatus, CheckStatus.FAILED);
    assert.strictEqual(res.isMandatoryGate, true);
  });

  await runCheck('FC2.10', 'Make In India: Commercial percentages (advance 15%, GST 18%) do not trigger false MII matches', 'FacadeDetection', async () => {
    const res = await makeInIndiaVerifier.verify('Commercial terms: Payment terms 15% advance against bank guarantee, GST extra at 18%, retention 5%.');
    assert.strictEqual(res.checkStatus, CheckStatus.FAILED);
    assert.ok(res.message.includes('No valid Make in India / Local Content affidavit found'));
  });

  await runCheck('FC2.11', 'Make In India: Exactly 20.0% statutory boundary qualifies as Class-II Local Supplier', 'FacadeDetection', async () => {
    const res = await makeInIndiaVerifier.verify('Make in India declaration: Verified local content is 20.0%.');
    assert.strictEqual(res.checkStatus, CheckStatus.NEEDS_MANUAL_REVIEW);
    assert.strictEqual(res.extractedValue, '20%');
    assert.ok(res.message.includes('Class-II Local Supplier'));
  });

  await runCheck('FC2.12', 'Make In India: Local content 19.9% fails statutory 20% minimum threshold', 'FacadeDetection', async () => {
    const res = await makeInIndiaVerifier.verify('Make in India declaration: Local content is 19.9%.');
    assert.strictEqual(res.checkStatus, CheckStatus.FAILED);
    assert.ok(res.message.includes('below the statutory 20% minimum threshold'));
  });

  // -------------------------------------------------------------
  // 3. INTEGRITY VERIFICATION: Dynamic Rejection Email Generation
  // -------------------------------------------------------------
  console.log('\n--- CHECK 3: INTEGRITY VERIFICATION ---');

  await runCheck('FC3.1', 'aiService generates dynamic rejection email itemizing exact failed check names and messages', 'IntegrityVerification', async () => {
    const syntheticChecks = {
      gst: {
        checkId: 'gst',
        checkName: 'GST Registration & Filing',
        checkStatus: 'FAILED',
        message: 'Missing or invalid 15-character statutory GSTIN.'
      },
      pan: {
        checkId: 'pan',
        checkName: 'PAN & KYC',
        checkStatus: 'FAILED',
        message: 'No valid 10-character statutory CBDT PAN format found.'
      },
      makeInIndia: {
        checkId: 'makeInIndia',
        checkName: 'Make in India',
        checkStatus: 'NEEDS_MANUAL_REVIEW',
        message: 'Self-certified 35% local content (Class-II Local Supplier).'
      },
      epfo: {
        checkId: 'epfo',
        checkName: 'EPFO Compliance',
        checkStatus: 'VERIFIED',
        message: 'EPFO establishment verified.'
      }
    };

    const email = await aiService.generateEmailDraft(
      { verdict: 'NOT_ELIGIBLE', checksDetail: syntheticChecks },
      'Dynamic Test Vendor Pvt Ltd'
    );

    assert.ok(email.subject.includes('Dynamic Test Vendor Pvt Ltd'), 'Subject does not include vendor name');
    assert.ok(email.body.includes('Dynamic Test Vendor Pvt Ltd'), 'Body does not include vendor name');
    assert.ok(email.body.includes('GST Registration & Filing: Missing or invalid 15-character statutory GSTIN.'), 'Body missing GST failure');
    assert.ok(email.body.includes('PAN & KYC: No valid 10-character statutory CBDT PAN format found.'), 'Body missing PAN failure');
    assert.ok(email.body.includes('Make in India: Self-certified 35% local content'), 'Body missing MII review item');
    assert.strictEqual(email.body.includes('EPFO Compliance'), false, 'Body incorrectly itemizes passing checks');
  });

  await runCheck('FC3.2', 'aiService generates approval email when verdict is ELIGIBLE', 'IntegrityVerification', async () => {
    const email = await aiService.generateEmailDraft(
      { verdict: 'ELIGIBLE', checksDetail: {} },
      'Compliant Bidder Ltd'
    );
    assert.ok(email.subject.includes('Congratulations: Bid Verification Successful for Compliant Bidder Ltd'));
    assert.ok(email.body.includes("marked as 'Eligible' and will proceed to the financial evaluation stage"));
  });

  // -------------------------------------------------------------
  // 4. ERROR HANDLING & DUMMY PDF VERIFICATION
  // -------------------------------------------------------------
  console.log('\n--- CHECK 4: ERROR HANDLING & PIPELINE SCORING ---');

  await runCheck('FC4.1', 'Dummy text without statutory credentials produces overallScore 0, Critical risk, and NOT_ELIGIBLE verdict', 'ErrorHandling', async () => {
    const res = await scanAndVerifyDocument(Buffer.from('Lorem ipsum dolor sit amet dummy proposal without tax numbers'), 'dummy.pdf');
    assert.strictEqual(res.overallScore, 0);
    assert.strictEqual(res.isCompliant, false);
    assert.strictEqual(res.riskLevel, 'Critical');
    assert.strictEqual(res.hasMandatoryFailure, true);
    assert.strictEqual(res.verdict, 'NOT_ELIGIBLE: Failed mandatory statutory compliance gates.');
  });

  await runCheck('FC4.2', 'Corrupted binary stream is handled safely without throwing uncaught exception', 'ErrorHandling', async () => {
    const randomBytes = Buffer.from([0x00, 0xFF, 0xFE, 0x12, 0x99, 0xAA, 0xBB, 0xCC]);
    const res = await scanAndVerifyDocument(randomBytes, 'corrupt.pdf');
    assert.strictEqual(res.overallScore, 0);
    assert.strictEqual(res.hasMandatoryFailure, true);
    assert.strictEqual(res.verdict, 'NOT_ELIGIBLE: Failed mandatory statutory compliance gates.');
  });

  await runCheck('FC4.3', 'Empty buffer is handled safely without crashing', 'ErrorHandling', async () => {
    const res = await scanAndVerifyDocument(Buffer.from(''), 'empty.pdf');
    assert.strictEqual(res.overallScore, 0);
    assert.strictEqual(res.hasMandatoryFailure, true);
    assert.strictEqual(res.verdict, 'NOT_ELIGIBLE: Failed mandatory statutory compliance gates.');
  });

  await runCheck('FC4.4', 'Fully compliant synthetic document authenticates genuine statutory pipeline', 'ErrorHandling', async () => {
    const syntheticDoc = `
      BHARAT PETROTECH WORKFORCE COOPERATIVE
      CIN: L12345MH2019PLC789012
      GSTIN: 27AAACW9876K1Z1
      PAN: AAACW9876K
      UDYAM: UDYAM-MH-01-0012345
      Make in India Local Content Declaration: We hereby declare that local content is 85.5%.
      EPFO Establishment: MH/BAN/0012345/000
      ESIC: 31000123450000101
      ISO 9001:2015 Certified
      Original Equipment Manufacturer Authorization Attached
      Startup India Recognized
      NSIC Registered
      CLRA License Attached
      Debarment: None
      DigiLocker Verification Marker: digilocker://gov.in/doc/bpw-2026
    `;
    const res = await scanAndVerifyDocument(Buffer.from(syntheticDoc), 'synthetic_compliant.txt', 'text/plain');
    assert.strictEqual(res.hasMandatoryFailure, false);
    assert.ok(res.overallScore >= 80, `Expected score >= 80, got ${res.overallScore}`);
    assert.strictEqual(res.isCompliant, true);
    assert.strictEqual(res.riskLevel, 'Low');
    assert.strictEqual(res.verdict, 'ELIGIBLE: Statutory compliance documents authenticated as per GeM/CPCL guidelines.');
  });

  console.log('\n================================================================');
  console.log(`FORENSIC AUDIT SUMMARY: Total: ${totalTests} | Passed: ${passedTests} | Failed: ${failedTests}`);
  console.log(`VERDICT: ${failedTests === 0 ? 'CLEAN (No integrity violations detected)' : 'INTEGRITY VIOLATION'}`);
  console.log('================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runAllForensicChecks().catch(err => {
  console.error('Unhandled audit error:', err);
  process.exit(1);
});
