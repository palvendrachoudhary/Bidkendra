const path = require('path');
const assert = require('assert');

const gstVerifier = require('../backend/src/services/verification/gstVerifier');
const panVerifier = require('../backend/src/services/verification/panVerifier');
const mcaVerifier = require('../backend/src/services/verification/mcaVerifier');
const udyamVerifier = require('../backend/src/services/verification/udyamVerifier');
const makeInIndiaVerifier = require('../backend/src/services/verification/makeInIndiaVerifier');
const aiService = require('../backend/src/services/aiService');
const { scanAndVerifyDocument } = require('../backend/src/services/realOcrService');
const { CheckStatus } = require('../backend/src/services/verification/checkStatus');

async function runReviewerAudit() {
  console.log('================================================================');
  console.log('REVIEWER 1 INDEPENDENT ADVERSARIAL & AUDIT SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  async function test(name, fn) {
    total++;
    try {
      await fn();
      passed++;
      console.log(`[PASS] ${name}`);
    } catch (e) {
      console.error(`[FAIL] ${name}: ${e.message}`);
    }
  }

  // Focus 1: Regex Case-Insensitivity & Normalization
  console.log('--- FOCUS 1: REGEX CASE-INSENSITIVITY & NORMALIZATION ---');
  await test('GSTIN lowercase 33aabcp1234f1z5 normalized to uppercase', async () => {
    const res = await gstVerifier.verify('Invoice GSTIN: 33aabcp1234f1z5');
    assert.strictEqual(res.checkStatus, CheckStatus.VERIFIED);
    assert.strictEqual(res.extractedValue, '33AABCP1234F1Z5');
  });

  await test('GSTIN mixed-case 33AaBcP1234f1Z5 normalized to uppercase', async () => {
    const res = await gstVerifier.verify('Invoice GSTIN: 33AaBcP1234f1Z5');
    assert.strictEqual(res.checkStatus, CheckStatus.VERIFIED);
    assert.strictEqual(res.extractedValue, '33AABCP1234F1Z5');
  });

  await test('PAN lowercase aabcp1234f normalized to uppercase', async () => {
    const res = await panVerifier.verify('PAN: aabcp1234f');
    assert.strictEqual(res.checkStatus, CheckStatus.VERIFIED);
    assert.strictEqual(res.extractedValue, 'AABCP1234F');
  });

  await test('CIN lowercase u23201tn2018ptc123456 normalized to uppercase', async () => {
    const res = await mcaVerifier.verify('CIN: u23201tn2018ptc123456');
    assert.strictEqual(res.checkStatus, CheckStatus.VERIFIED);
    assert.strictEqual(res.extractedValue, 'U23201TN2018PTC123456');
  });

  await test('Udyam lowercase udyam-tn-02-0045812 normalized to uppercase', async () => {
    const res = await udyamVerifier.verify('MSME: udyam-tn-02-0045812');
    assert.strictEqual(res.checkStatus, CheckStatus.VERIFIED);
    assert.strictEqual(res.extractedValue, 'UDYAM-TN-02-0045812');
  });

  await test('Udyam with internal spaces udyam - tn - 02 - 0045812 normalized cleanly', async () => {
    const res = await udyamVerifier.verify('MSME: udyam - tn - 02 - 0045812');
    assert.strictEqual(res.checkStatus, CheckStatus.VERIFIED);
    assert.strictEqual(res.extractedValue, 'UDYAM-TN-02-0045812');
  });

  // Focus 2: PAN Extraction from text and embedded GSTIN
  console.log('\n--- FOCUS 2: PAN EXTRACTION (DIRECT & EMBEDDED GSTIN) ---');
  await test('PAN extracted directly from text', async () => {
    const res = await panVerifier.verify('Permanent Account Number is AABCP1234F.');
    assert.strictEqual(res.checkStatus, CheckStatus.VERIFIED);
    assert.strictEqual(res.extractedValue, 'AABCP1234F');
  });

  await test('PAN extracted from embedded GSTIN when standalone PAN missing', async () => {
    const res = await panVerifier.verify('Supplier Tax ID: GSTIN 27AAACK1234F1Z3. No other tax ID listed.');
    assert.strictEqual(res.checkStatus, CheckStatus.VERIFIED);
    assert.strictEqual(res.extractedValue, 'AAACK1234F');
  });

  await test('PAN extracted from embedded lowercase GSTIN', async () => {
    const res = await panVerifier.verify('Tax id: 27aaack1234f1z3');
    assert.strictEqual(res.checkStatus, CheckStatus.VERIFIED);
    assert.strictEqual(res.extractedValue, 'AAACK1234F');
  });

  // Focus 3: Contextual Matching in Make In India
  console.log('\n--- FOCUS 3: CONTEXTUAL MATCHING IN MAKE IN INDIA ---');
  await test('Make In India ignores commercial percentages (10% advance, 18% GST, 5% retention)', async () => {
    const text = 'Commercial quote: 10% advance upon purchase order, 18% GST extra, 5% retention for 1 year warranty.';
    const res = await makeInIndiaVerifier.verify(text);
    assert.strictEqual(res.checkStatus, CheckStatus.FAILED);
    assert.ok(res.message.includes('No valid Make in India / Local Content affidavit found'));
    assert.strictEqual(res.extractedValue, null);
  });

  await test('Make In India extracts local content amidst commercial percentages', async () => {
    const text = 'Payment: 10% advance. GST 18%. Retention 5%. Make in India Declaration: Local Content is 65.5%.';
    const res = await makeInIndiaVerifier.verify(text);
    assert.notStrictEqual(res.checkStatus, CheckStatus.FAILED);
    assert.strictEqual(res.extractedValue, '65.5%');
    assert.ok(res.message.includes('Class-I Local Supplier'));
  });

  await test('Make In India statutory threshold boundary (20.0% is Class-II)', async () => {
    const text = 'Declaration of Local Content: 20.0% for supplied goods.';
    const res = await makeInIndiaVerifier.verify(text);
    assert.notStrictEqual(res.checkStatus, CheckStatus.FAILED);
    assert.strictEqual(res.extractedValue, '20%');
    assert.ok(res.message.includes('Class-II Local Supplier'));
  });

  await test('Make In India below statutory threshold (19.9% fails)', async () => {
    const text = 'Declaration of Local Content: 19.9% for supplied goods.';
    const res = await makeInIndiaVerifier.verify(text);
    assert.strictEqual(res.checkStatus, CheckStatus.FAILED);
    assert.ok(res.message.includes('below the statutory 20% minimum threshold'));
  });

  // Focus 4: Non-Corporate Entity Handling in MCA Verifier
  console.log('\n--- FOCUS 4: NON-CORPORATE ENTITY MCA EXEMPTION ---');
  await test('Partnership firm is exempted from mandatory CIN failure', async () => {
    const text = 'Shree Krishna Enterprises is a Registered Partnership Firm. PAN: AAAFK1234F.';
    const res = await mcaVerifier.verify(text);
    assert.strictEqual(res.checkStatus, CheckStatus.VERIFIED);
    assert.strictEqual(res.isMandatoryGate, false);
    assert.ok(res.message.includes('MCA Corporate CIN exemption applied'));
  });

  await test('Sole Proprietorship is exempted from mandatory CIN failure', async () => {
    const text = 'Rajesh Kumar, Proprietor of Kumar Instruments. PAN: AAAPK1234F.';
    const res = await mcaVerifier.verify(text);
    assert.strictEqual(res.checkStatus, CheckStatus.VERIFIED);
    assert.strictEqual(res.isMandatoryGate, false);
    assert.ok(res.message.includes('MCA Corporate CIN exemption applied'));
  });

  await test('LLP with LLPIN is verified with mandatory gate', async () => {
    const text = 'Apex Dynamics LLP, LLPIN: AAB-1234.';
    const res = await mcaVerifier.verify(text);
    assert.strictEqual(res.checkStatus, CheckStatus.VERIFIED);
    assert.strictEqual(res.isMandatoryGate, true);
  });

  await test('Corporate entity without CIN triggers mandatory gate failure', async () => {
    const text = 'Global Energy Technologies Private Limited. Registered office in Mumbai.';
    const res = await mcaVerifier.verify(text);
    assert.strictEqual(res.checkStatus, CheckStatus.FAILED);
    assert.strictEqual(res.isMandatoryGate, true);
  });

  // Focus 5: aiService line 39 property access
  console.log('\n--- FOCUS 5: AI SERVICE EMAIL DRAFT PROPERTY ACCESS ---');
  await test('aiService handles checkStatus property', async () => {
    const result = {
      verdict: 'NOT_ELIGIBLE',
      checksDetail: {
        gst: { checkName: 'GST Registration', checkStatus: 'FAILED', message: 'Missing GSTIN' }
      }
    };
    const draft = await aiService.generateEmailDraft(result, 'Acme Corp');
    assert.ok(draft.body.includes('- GST Registration: Missing GSTIN'));
  });

  await test('aiService handles legacy status property', async () => {
    const result = {
      verdict: 'NOT_ELIGIBLE',
      checksDetail: {
        pan: { checkName: 'PAN Verification', status: 'FAILED', message: 'Invalid PAN format' }
      }
    };
    const draft = await aiService.generateEmailDraft(result, 'Acme Corp');
    assert.ok(draft.body.includes('- PAN Verification: Invalid PAN format'));
  });

  await test('aiService handles null check gracefully without crashing', async () => {
    const result = {
      verdict: 'NOT_ELIGIBLE',
      checksDetail: {
        gst: null,
        pan: { checkName: 'PAN Verification', checkStatus: 'FAILED', message: 'Missing PAN' }
      }
    };
    const draft = await aiService.generateEmailDraft(result, 'Acme Corp');
    assert.ok(draft.body.includes('- PAN Verification: Missing PAN'));
  });

  await test('aiService handles empty checksDetail gracefully', async () => {
    const result = {
      verdict: 'NOT_ELIGIBLE',
      checksDetail: {}
    };
    const draft = await aiService.generateEmailDraft(result, 'Acme Corp');
    assert.ok(draft.subject.includes('Action Required'));
  });

  // Focus 6: Dummy PDF rejection and scoring
  console.log('\n--- FOCUS 6: DUMMY PDF ZERO-SCORE STRUCTURED VERDICT ---');
  await test('scanAndVerifyDocument on dummy text produces 0% score and NOT_ELIGIBLE verdict', async () => {
    const dummyText = 'This is a test invoice. Thank you for your business. Total amount: $500. No taxes.';
    const res = await scanAndVerifyDocument(Buffer.from(dummyText), 'dummy.txt', 'text/plain');
    assert.strictEqual(res.overallScore, 0);
    assert.strictEqual(res.riskLevel, 'Critical');
    assert.strictEqual(res.isCompliant, false);
    assert.strictEqual(res.hasMandatoryFailure, true);
    assert.ok(res.verdict.startsWith('NOT_ELIGIBLE: Failed mandatory statutory compliance gates.'));
  });

  await test('scanAndVerifyDocument on zero-byte buffer produces 0% score safely', async () => {
    const res = await scanAndVerifyDocument(Buffer.from(''), 'empty.pdf', 'application/pdf');
    assert.strictEqual(res.overallScore, 0);
    assert.strictEqual(res.riskLevel, 'Critical');
    assert.strictEqual(res.isCompliant, false);
    assert.strictEqual(res.hasMandatoryFailure, true);
  });

  console.log('\n================================================================');
  console.log(`AUDIT COMPLETE: ${passed}/${total} Passed (${Math.round((passed/total)*100)}%)`);
  console.log('================================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runReviewerAudit().catch(err => {
  console.error('Fatal error in reviewer audit:', err);
  process.exit(1);
});
