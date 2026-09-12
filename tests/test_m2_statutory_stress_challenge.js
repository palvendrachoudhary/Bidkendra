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
const realOcrService = require(path.join(BACKEND_DIR, 'src', 'services', 'realOcrService.js'));

async function runStressVerification() {
  const results = [];
  let testCount = 0;

  async function test(suite, name, fn) {
    testCount++;
    const testId = 'STRESS-' + String(testCount).padStart(2, '0');
    const start = process.hrtime.bigint();
    try {
      await fn();
      const end = process.hrtime.bigint();
      const durationMs = Number((end - start) / 1000000n);
      results.push({ id: testId, suite, name, pass: true, durationMs });
    } catch (err) {
      const end = process.hrtime.bigint();
      const durationMs = Number((end - start) / 1000000n);
      results.push({ id: testId, suite, name, pass: false, error: err.message, durationMs });
    }
  }

  // =========================================================================
  // SUITE 1: GSTIN Permutations & Fuzzing
  // =========================================================================
  await test('GSTIN', 'Mixed case alternating (33aAbCp1234F1z5) normalized to uppercase', async () => {
    const res = await gstVerifier.verify('Supplier Tax: 33aAbCp1234F1z5 registered.');
    if (res.checkStatus !== CheckStatus.VERIFIED) throw new Error('Expected VERIFIED, got ' + res.checkStatus);
    if (res.extractedValue !== '33AABCP1234F1Z5') throw new Error('Expected canonical uppercase, got ' + res.extractedValue);
  });

  await test('GSTIN', 'Lower state code + uppercase body (07aaacr1234f1z5)', async () => {
    const res = await gstVerifier.verify('GST: 07aaacr1234f1z5 for Delhi unit.');
    if (res.checkStatus !== CheckStatus.VERIFIED) throw new Error('Expected VERIFIED, got ' + res.checkStatus);
    if (res.extractedValue !== '07AAACR1234F1Z5') throw new Error('Expected 07AAACR1234F1Z5, got ' + res.extractedValue);
  });

  await test('GSTIN', 'Valid boundary state codes: 01 (J&K) and 38 (Ladakh)', async () => {
    const res01 = await gstVerifier.verify('GSTIN: 01AABCP1234F1Z5');
    const res38 = await gstVerifier.verify('GSTIN: 38AABCP1234F1Z5');
    if (res01.checkStatus !== CheckStatus.VERIFIED) throw new Error('State code 01 failed: ' + res01.checkStatus);
    if (res38.checkStatus !== CheckStatus.VERIFIED) throw new Error('State code 38 failed: ' + res38.checkStatus);
  });

  await test('GSTIN', 'Invalid boundary state codes: 00, 39, and 99 rejected', async () => {
    const res00 = await gstVerifier.verify('GSTIN: 00AABCP1234F1Z5');
    const res39 = await gstVerifier.verify('GSTIN: 39AABCP1234F1Z5');
    const res99 = await gstVerifier.verify('GSTIN: 99AABCP1234F1Z5');
    if (res00.checkStatus === CheckStatus.VERIFIED) throw new Error('State code 00 must be rejected');
    if (res39.checkStatus === CheckStatus.VERIFIED) throw new Error('State code 39 must be rejected');
    if (res99.checkStatus === CheckStatus.VERIFIED) throw new Error('State code 99 must be rejected');
  });

  await test('GSTIN', 'Surrounding punctuation and quotes handling', async () => {
    const res = await gstVerifier.verify('Invoice details: [GSTIN: "33AABCP1234F1Z5"]; tax invoice.');
    if (res.checkStatus !== CheckStatus.VERIFIED) throw new Error('Punctuation hindered extraction: ' + res.checkStatus);
    if (res.extractedValue !== '33AABCP1234F1Z5') throw new Error('Extracted wrong value: ' + res.extractedValue);
  });

  await test('GSTIN', 'Malformed 14-char and invalid 14th char rejected', async () => {
    const res14 = await gstVerifier.verify('Invalid length: 33AABCP1234F1Z');
    const resNoZ = await gstVerifier.verify('Invalid 14th char: 33AABCP1234F1X5');
    if (res14.checkStatus === CheckStatus.VERIFIED) throw new Error('14-char GSTIN must fail');
    if (resNoZ.checkStatus === CheckStatus.VERIFIED) throw new Error('GSTIN without Z at char 14 must fail');
  });

  // =========================================================================
  // SUITE 2: PAN Permutations & Embedded GSTIN Recovery
  // =========================================================================
  await test('PAN', 'Mixed case PAN (aAbCp1234f) normalized to uppercase', async () => {
    const res = await panVerifier.verify('Vendor PAN number: aAbCp1234f.');
    if (res.checkStatus !== CheckStatus.VERIFIED) throw new Error('Expected VERIFIED, got ' + res.checkStatus);
    if (res.extractedValue !== 'AABCP1234F') throw new Error('Expected AABCP1234F, got ' + res.extractedValue);
  });

  await test('PAN', 'Valid CBDT entity types: C, P, H, F, A, T, B, L, J, G', async () => {
    const types = [
      { code: 'C', pan: 'AABCP1234F' },
      { code: 'P', pan: 'AABPP1234F' },
      { code: 'H', pan: 'AABHP1234F' },
      { code: 'F', pan: 'AABFP1234F' },
      { code: 'A', pan: 'AABAP1234F' },
      { code: 'T', pan: 'AABTP1234F' },
      { code: 'B', pan: 'AABBP1234F' },
      { code: 'L', pan: 'AABLP1234F' },
      { code: 'J', pan: 'AABJP1234F' },
      { code: 'G', pan: 'AABGP1234F' }
    ];
    for (const item of types) {
      const res = await panVerifier.verify('Tax PAN: ' + item.pan);
      if (res.checkStatus !== CheckStatus.VERIFIED) {
        throw new Error('Valid entity type ' + item.code + ' in ' + item.pan + ' failed verification');
      }
    }
  });

  await test('PAN', 'Invalid entity types rejected (X, E, and numeric)', async () => {
    const invalidPans = ['AABCX1234F', 'AABCE1234F', 'AAB1P1234F'];
    for (const p of invalidPans) {
      const res = await panVerifier.verify('Tax PAN: ' + p);
      if (res.checkStatus === CheckStatus.VERIFIED) {
        throw new Error('Invalid PAN ' + p + ' was erroneously verified');
      }
    }
  });

  await test('PAN', 'Extract embedded PAN from standalone uppercase GSTIN', async () => {
    const text = 'Vendor submitted tax document with GSTIN 27AAACR1234F1Z5. Standalone PAN was omitted.';
    const res = await panVerifier.verify(text);
    if (res.checkStatus !== CheckStatus.VERIFIED) throw new Error('Embedded PAN extraction failed: ' + res.checkStatus);
    if (res.extractedValue !== 'AAACR1234F') throw new Error('Expected AAACR1234F, got ' + res.extractedValue);
  });

  await test('PAN', 'Extract embedded PAN from lowercase GSTIN (33aabcp1234f1z5)', async () => {
    const text = 'Invoice notes gstin: 33aabcp1234f1z5 without separate PAN entry.';
    const res = await panVerifier.verify(text);
    if (res.checkStatus !== CheckStatus.VERIFIED) throw new Error('Embedded lowercase PAN extraction failed: ' + res.checkStatus);
    if (res.extractedValue !== 'AABCP1234F') throw new Error('Expected uppercase AABCP1234F, got ' + res.extractedValue);
  });

  await test('PAN', 'Fallback to embedded GSTIN when standalone PAN is invalid entity type', async () => {
    const text = 'Referencing internal code AABCX1234F and GSTIN 33AABCP1234F1Z5.';
    const res = await panVerifier.verify(text);
    if (res.checkStatus !== CheckStatus.VERIFIED) throw new Error('Fallback to GSTIN PAN failed: ' + res.checkStatus);
    if (res.extractedValue !== 'AABCP1234F') throw new Error('Expected AABCP1234F recovered from GSTIN, got ' + res.extractedValue);
  });

  // =========================================================================
  // SUITE 3: MCA CIN & Non-Corporate Exemptions
  // =========================================================================
  await test('MCA', 'Valid Listed (L) and Unlisted (U) corporate CINs in mixed case', async () => {
    const resU = await mcaVerifier.verify('CIN: u23201tn2018ptc123456 in Chennai');
    const resL = await mcaVerifier.verify('CIN: l17110mh1973plc019786 listed company');
    if (resU.checkStatus !== CheckStatus.VERIFIED || resU.extractedValue !== 'U23201TN2018PTC123456') {
      throw new Error('Unlisted lowercase CIN failed: ' + JSON.stringify(resU));
    }
    if (resL.checkStatus !== CheckStatus.VERIFIED || resL.extractedValue !== 'L17110MH1973PLC019786') {
      throw new Error('Listed lowercase CIN failed: ' + JSON.stringify(resL));
    }
  });

  await test('MCA', 'LLPIN with irregular spacing and mixed case (aaa - 1234)', async () => {
    const res = await mcaVerifier.verify('Registered under MCA LLPIN: aaa  -  1234 active.');
    if (res.checkStatus !== CheckStatus.VERIFIED) throw new Error('LLPIN failed: ' + res.checkStatus);
    if (res.extractedValue !== 'AAA-1234') throw new Error('Expected normalized AAA-1234, got ' + res.extractedValue);
  });

  await test('MCA', 'Non-corporate exemption: Partnership firm declaration', async () => {
    const text = 'Bidder: Sri Krishna Engineering Works, a registered Partnership firm in Coimbatore.';
    const res = await mcaVerifier.verify(text);
    if (res.checkStatus !== CheckStatus.VERIFIED) throw new Error('Expected VERIFIED, got ' + res.checkStatus);
    if (res.isMandatoryGate !== false) throw new Error('Expected isMandatoryGate: false, got ' + res.isMandatoryGate);
  });

  await test('MCA', 'Non-corporate exemption: Partnership Firm PAN with entity code F (AAAFK1234F)', async () => {
    const text = 'Bid submitted by Kaveri Industrial Supplies with Firm PAN AAAFK1234F.';
    const res = await mcaVerifier.verify(text);
    if (res.checkStatus !== CheckStatus.VERIFIED) throw new Error('Firm PAN failed non-corporate match: ' + res.checkStatus);
    if (res.isMandatoryGate !== false) throw new Error('Firm PAN must have isMandatoryGate: false');
  });

  await test('MCA', 'Non-corporate exemption: Sole Proprietorship declaration and Individual PAN (AAAPK1234F)', async () => {
    const text = 'Bidder is a Sole Proprietorship firm owned by S. Raman, PAN: AAAPK1234F.';
    const res = await mcaVerifier.verify(text);
    if (res.checkStatus !== CheckStatus.VERIFIED) throw new Error('Proprietorship failed: ' + res.checkStatus);
    if (res.isMandatoryGate !== false) throw new Error('Proprietorship must have isMandatoryGate: false');
  });

  await test('MCA', 'Corporate entity without CIN fails with mandatory gate', async () => {
    const text = 'Apex Technologies Private Limited submitted technical proposal.';
    const res = await mcaVerifier.verify(text);
    if (res.checkStatus !== CheckStatus.FAILED) throw new Error('Expected FAILED for missing CIN, got ' + res.checkStatus);
    if (res.isMandatoryGate !== true) throw new Error('Corporate missing CIN must have isMandatoryGate: true');
  });

  // =========================================================================
  // SUITE 4: MSME Udyam Verifier
  // =========================================================================
  await test('Udyam', 'Mixed case Udyam (uDyAm-Tn-02-0045812) normalized to uppercase', async () => {
    const res = await udyamVerifier.verify('Certificate No: uDyAm-Tn-02-0045812 registered.');
    if (res.checkStatus !== CheckStatus.VERIFIED) throw new Error('Expected VERIFIED, got ' + res.checkStatus);
    if (res.extractedValue !== 'UDYAM-TN-02-0045812') throw new Error('Expected canonical uppercase, got ' + res.extractedValue);
  });

  await test('Udyam', 'Irregular spacing around hyphens (UDYAM  -   KA  -  03  -  1234567)', async () => {
    const res = await udyamVerifier.verify('MSME Registration: UDYAM   -   KA   -   03   -   1234567');
    if (res.checkStatus !== CheckStatus.VERIFIED) throw new Error('Spaced Udyam failed: ' + res.checkStatus);
    if (res.extractedValue !== 'UDYAM-KA-03-1234567') throw new Error('Expected UDYAM-KA-03-1234567, got ' + res.extractedValue);
  });

  await test('Udyam', 'Malformed Udyam numbers rejected (wrong digit counts or missing parts)', async () => {
    const malformed = [
      'UDYAM-TN-2-0045812',
      'UDYAM-TN-02-004581',
      'UDYAM-TN-02-00458123',
      'UDYAMTN020045812'
    ];
    for (const u of malformed) {
      const res = await udyamVerifier.verify('MSME: ' + u);
      if (res.checkStatus === CheckStatus.VERIFIED) {
        throw new Error('Malformed Udyam ' + u + ' was verified');
      }
    }
  });

  // =========================================================================
  // SUITE 5: Make In India Contextual Matching & Precise Boundaries
  // =========================================================================
  await test('MII', 'Boundary check: 19.9% fails below statutory 20% minimum', async () => {
    const text = 'We solemnly declare Local Content for this tender bid is 19.9%.';
    const res = await makeInIndiaVerifier.verify(text);
    if (res.checkStatus !== CheckStatus.FAILED) throw new Error('19.9% should fail statutory threshold, got ' + res.checkStatus);
    if (!res.message.includes('below the statutory 20% minimum threshold')) {
      throw new Error('Message did not indicate below threshold: ' + res.message);
    }
  });

  await test('MII', 'Boundary check: 19.99% fails below statutory 20% minimum', async () => {
    const text = 'Indigenous content certified at 19.99%.';
    const res = await makeInIndiaVerifier.verify(text);
    if (res.checkStatus !== CheckStatus.FAILED) throw new Error('19.99% should fail statutory threshold, got ' + res.checkStatus);
  });

  await test('MII', 'Boundary check: exactly 20.0% passes as Class-II Local Supplier', async () => {
    const text = 'Local content declaration: 20.0% as per DPIIT order.';
    const res = await makeInIndiaVerifier.verify(text);
    if (res.checkStatus === CheckStatus.FAILED) throw new Error('20.0% must not fail: ' + res.message);
    if (!res.message.includes('Class-II Local Supplier')) {
      throw new Error('Expected Class-II classification in message, got: ' + res.message);
    }
  });

  await test('MII', 'Boundary check: 20.01% passes as Class-II Local Supplier', async () => {
    const text = 'We declare 20.01% local content for offered items.';
    const res = await makeInIndiaVerifier.verify(text);
    if (res.checkStatus === CheckStatus.FAILED) throw new Error('20.01% must not fail: ' + res.message);
  });

  await test('MII', 'Boundary check: 49.9% is Class-II vs 50.0% is Class-I Local Supplier', async () => {
    const res49 = await makeInIndiaVerifier.verify('Local content is 49.9%.');
    const res50 = await makeInIndiaVerifier.verify('Local content is 50.0%.');
    if (res49.checkStatus === CheckStatus.FAILED) throw new Error('49.9% should pass: ' + res49.message);
    if (!res49.message.includes('Class-II')) throw new Error('49.9% should be Class-II, got: ' + res49.message);
    if (res50.checkStatus === CheckStatus.FAILED) throw new Error('50.0% should pass: ' + res50.message);
    if (!res50.message.includes('Class-I')) throw new Error('50.0% should be Class-I, got: ' + res50.message);
  });

  await test('MII', 'Commercial percentages (10%, 18%, 5%, 15%, 3%) completely ignored without keywords', async () => {
    const commercialOnly = 'COMMERCIAL AND PAYMENT TERMS:\n1. Advance payment: 10% on signing of purchase order.\n2. Taxes: GST applicable @ 18% extra at actuals.\n3. Security deposit: 3% of total contract value.\n4. Retention money: 5% held until defect liability period.\n5. Trade discount: 15% on standard list price.';
    const res = await makeInIndiaVerifier.verify(commercialOnly);
    if (res.extractedValue) {
      throw new Error('Verifier falsely extracted commercial percentage: ' + res.extractedValue);
    }
    if (res.message !== 'No valid Make in India / Local Content affidavit found in uploaded documents.') {
      throw new Error('Expected no affidavit message, got: ' + res.message);
    }
  });

  await test('MII', 'Mixed document with both commercial terms and valid 65% local content', async () => {
    const mixedDoc = 'COMMERCIAL PROPOSAL:\nPayment terms: 10% advance, 90% against dispatch.\nGST: 18% additional.\nLiquidated damages: 0.5% per week up to 5%.\n\nSTATUTORY DECLARATION:\nUnder Public Procurement (Preference to Make in India) Order,\nwe hereby certify that the Local Content of offered equipment is 65.5%.\nThe bidder is a Class-I Local Supplier.';
    const res = await makeInIndiaVerifier.verify(mixedDoc);
    if (res.checkStatus === CheckStatus.FAILED) throw new Error('Mixed document should pass, failed: ' + res.message);
    if (res.extractedValue !== '65.5%') throw new Error('Expected extractedValue 65.5%, got: ' + res.extractedValue);
    if (!res.message.includes('Class-I Local Supplier')) throw new Error('Expected Class-I, got: ' + res.message);
  });

  await test('MII', 'Reverse phrasing: percentage preceding keywords (75% indigenous content)', async () => {
    const text = 'Bidder guarantees 75% indigenous content across all manufacturing stages.';
    const res = await makeInIndiaVerifier.verify(text);
    if (res.checkStatus === CheckStatus.FAILED) throw new Error('Reverse phrasing failed: ' + res.message);
    if (res.extractedValue !== '75%') throw new Error('Expected 75%, got: ' + res.extractedValue);
  });

  await test('MII', 'Declared 0% local content fails with below 20% message', async () => {
    const text = 'Make in India declaration: 0% local content.';
    const res = await makeInIndiaVerifier.verify(text);
    if (res.checkStatus !== CheckStatus.FAILED) throw new Error('0% should fail, got ' + res.checkStatus);
    if (!res.message.includes('below the statutory 20% minimum threshold')) {
      throw new Error('Expected below 20% message, got: ' + res.message);
    }
  });

  // =========================================================================
  // SUITE 6: Extreme Inputs, ReDoS Resistance, Memory & Crash Immunity
  // =========================================================================
  await test('CrashImmunity', 'Falsy & Empty Input Safety: null, undefined, empty, whitespace across all verifiers', async () => {
    const verifiers = [
      { name: 'gst', v: gstVerifier },
      { name: 'pan', v: panVerifier },
      { name: 'mca', v: mcaVerifier },
      { name: 'udyam', v: udyamVerifier },
      { name: 'mii', v: makeInIndiaVerifier }
    ];
    const falsyInputs = [null, undefined, '', '   \n\t  ', '       '];

    for (const verifier of verifiers) {
      for (const input of falsyInputs) {
        try {
          const res = await verifier.v.verify(input);
          if (!res || typeof res !== 'object') {
            throw new Error('Verifier ' + verifier.name + ' returned non-object for falsy input');
          }
          if (res.checkStatus !== CheckStatus.FAILED) {
            throw new Error('Verifier ' + verifier.name + ' should return FAILED for empty input, got ' + res.checkStatus);
          }
        } catch (e) {
          throw new Error('Verifier ' + verifier.name + ' crashed on falsy input: ' + e.message);
        }
      }
    }
  });

  await test('ReDoS', 'Massive 200,000 character string does not cause catastrophic backtracking', async () => {
    const massiveNoise = 'The quick brown fox jumps over the lazy dog. 1234567890!@#$%^&*() '.repeat(3000);
    const textWithCredentials = massiveNoise + '\nGSTIN: 33AABCP1234F1Z5\nPAN: AABCP1234F\nUDYAM-TN-02-0045812\nLocal content: 60%\nCIN: U23201TN2018PTC123456\n' + massiveNoise;

    const t0 = Date.now();
    const g = await gstVerifier.verify(textWithCredentials);
    const p = await panVerifier.verify(textWithCredentials);
    const m = await mcaVerifier.verify(textWithCredentials);
    const u = await udyamVerifier.verify(textWithCredentials);
    const mii = await makeInIndiaVerifier.verify(textWithCredentials);
    const elapsed = Date.now() - t0;

    if (g.checkStatus !== CheckStatus.VERIFIED) throw new Error('GSTIN not found in massive text');
    if (p.checkStatus !== CheckStatus.VERIFIED) throw new Error('PAN not found in massive text');
    if (m.checkStatus !== CheckStatus.VERIFIED) throw new Error('CIN not found in massive text');
    if (u.checkStatus !== CheckStatus.VERIFIED) throw new Error('Udyam not found in massive text');
    if (mii.extractedValue !== '60%') throw new Error('MII not found in massive text');
    if (elapsed > 1000) {
      throw new Error('ReDoS vulnerability suspected: verification took ' + elapsed + 'ms (> 1000ms limit)');
    }
  });

  await test('CrashImmunity', 'Adversarial repetitive token strings (UDYAM-, 33AABCP, local content)', async () => {
    const adversarialText = 'UDYAM-'.repeat(2000) + ' ' + '33AABCP'.repeat(2000) + ' ' + 'local content '.repeat(2000) + ' 10%';
    const t0 = Date.now();
    await Promise.all([
      gstVerifier.verify(adversarialText),
      panVerifier.verify(adversarialText),
      mcaVerifier.verify(adversarialText),
      udyamVerifier.verify(adversarialText),
      makeInIndiaVerifier.verify(adversarialText)
    ]);
    const elapsed = Date.now() - t0;
    if (elapsed > 1000) {
      throw new Error('Adversarial repetitive string caused performance degradation: ' + elapsed + 'ms');
    }
  });

  await test('CrashImmunity', 'SQL injection & XSS attack payloads handled safely', async () => {
    const maliciousPayload = "'; DROP TABLE vendors; DROP TABLE audit_log; --\n<script>alert(document.cookie);</script>\n\" OR \"1\"=\"1\nGSTIN: 33AABCP1234F1Z5\nLocal Content: 55%";
    const resGst = await gstVerifier.verify(maliciousPayload);
    const resMii = await makeInIndiaVerifier.verify(maliciousPayload);
    if (resGst.checkStatus !== CheckStatus.VERIFIED) throw new Error('Legitimate GSTIN failed due to injection strings');
    if (resMii.extractedValue !== '55%') throw new Error('Legitimate MII failed due to injection strings');
  });

  // =========================================================================
  // SUITE 7: End-to-End Real OCR Pipeline Integration
  // =========================================================================
  await test('RealOCR', 'Dummy text without statutory numbers returns 0% score and NOT_ELIGIBLE verdict', async () => {
    const dummyText = 'This is a sample tender document with no legal registrations.';
    const res = await realOcrService.scanAndVerifyDocument(Buffer.from(dummyText), 'dummy.pdf');
    if (res.overallScore !== 0) throw new Error('Expected score 0, got ' + res.overallScore);
    if (res.isCompliant !== false) throw new Error('Expected isCompliant false');
    if (res.riskLevel !== 'Critical') throw new Error('Expected riskLevel Critical, got ' + res.riskLevel);
    if (!res.hasMandatoryFailure) throw new Error('Expected hasMandatoryFailure true');
    if (!res.verdict.startsWith('NOT_ELIGIBLE')) throw new Error('Expected NOT_ELIGIBLE, got ' + res.verdict);
  });

  await test('RealOCR', 'Partnership firm without CIN achieves compliance without mandatory failure', async () => {
    const partnershipDoc = 'COMMERCIAL BID & COMPLIANCE DOSSIER\nBidder: Kaveri Engineering Works\nEntity: Registered Partnership Firm\nFirm PAN: AAAFK1234F\nGSTIN: 33AAAFK1234F1Z5\nMSME Udyam: UDYAM-TN-02-0045812\nMake in India Declaration: Local content is 65.0% (Class-I Local Supplier)\nPF Code: TN/MAS/0012345/000\nESI Code: 51-00-123456-000-0001\nDigiLocker Verified: True';
    const res = await realOcrService.scanAndVerifyDocument(Buffer.from(partnershipDoc), 'partnership_bid.pdf');
    if (res.hasMandatoryFailure) {
      throw new Error('Partnership firm wrongly flagged with mandatory failure: ' + JSON.stringify(res.checksDetail.mca));
    }
    if (res.checksDetail.mca.checkStatus !== CheckStatus.VERIFIED) {
      throw new Error('MCA check should be VERIFIED for partnership, got ' + res.checksDetail.mca.checkStatus);
    }
    if (res.overallScore === 0) {
      throw new Error('Partnership firm overallScore must be > 0, got ' + res.overallScore);
    }
  });

  await test('RealOCR', 'Proprietorship firm with individual PAN achieves compliance without mandatory failure', async () => {
    const propDoc = 'BIDDER COMPLIANCE SUBMISSION\nEntity Name: Raman Electricals\nConstitution: Sole Proprietorship\nProprietor PAN: AAAPK1234F\nGSTIN: 33AAAPK1234F1Z5\nUdyam Registration: UDYAM-TN-08-0098765\nLocal Content for tender: 52% Make In India\nDigiLocker Verified: True';
    const res = await realOcrService.scanAndVerifyDocument(Buffer.from(propDoc), 'proprietor_bid.pdf');
    if (res.hasMandatoryFailure) {
      throw new Error('Proprietorship wrongly flagged with mandatory failure: ' + JSON.stringify(res.checksDetail.mca));
    }
    if (res.checksDetail.mca.checkStatus !== CheckStatus.VERIFIED) {
      throw new Error('MCA check should be VERIFIED for proprietorship, got ' + res.checksDetail.mca.checkStatus);
    }
  });

  await test('RealOCR', 'Document with only GSTIN successfully extracts PAN in pipeline', async () => {
    const gstinOnlyDoc = 'TAX REGISTRATION SLIP\nGST Identification Number: 33AABCP1234F1Z5\nRegistered at Tamil Nadu.';
    const res = await realOcrService.scanAndVerifyDocument(Buffer.from(gstinOnlyDoc), 'tax_slip.pdf');
    if (res.extractedEntities.pan !== 'AABCP1234F') {
      throw new Error('Failed to extract embedded PAN in real OCR pipeline, got: ' + res.extractedEntities.pan);
    }
    if (res.checksDetail.pan.checkStatus !== CheckStatus.VERIFIED) {
      throw new Error('PAN check in pipeline should be VERIFIED via embedded GSTIN, got: ' + res.checksDetail.pan.checkStatus);
    }
  });

  await test('RealOCR', 'Fully compliant corporate proposal passes with ELIGIBLE verdict', async () => {
    const compliantDoc = 'CHENNAI PETROLEUM CORPORATION LIMITED (CPCL)\nTENDER COMPLIANCE ENVELOPE\nBidder: Southern Industrial Valves Limited\nCIN: U23201TN2018PTC123456\nPAN: AABCP1234F\nGSTIN: 33AABCP1234F1Z5\nUdyam: UDYAM-TN-02-0045812\nMake in India: 75% local content (Class-I Local Supplier)\nEPFO: TN/MAS/0054321/000\nESIC: 51-00-654321-000-0001\nIncome Tax: Valid ITR acknowledgment verified\nOEM Authorization: Valid OEM authorized distributor\nNon-Debarment: Certified non-debarred on GeM / CPPP\nDigiLocker: Verified document certificate';
    const res = await realOcrService.scanAndVerifyDocument(Buffer.from(compliantDoc), 'compliant_proposal.pdf');
    if (res.hasMandatoryFailure) {
      const failed = Object.entries(res.checksDetail)
        .filter(([k, v]) => v.isMandatoryGate && v.checkStatus === CheckStatus.FAILED)
        .map(([k, v]) => k + ': ' + v.message);
      throw new Error('Compliant proposal suffered mandatory failure in: ' + failed.join('; '));
    }
    if (!res.isCompliant) {
      throw new Error('Expected isCompliant true, got score ' + res.overallScore + '%, riskLevel ' + res.riskLevel);
    }
    if (!res.verdict.startsWith('ELIGIBLE')) {
      throw new Error('Expected ELIGIBLE verdict, got: ' + res.verdict);
    }
  });

  return results;
}

if (require.main === module) {
  runStressVerification().then(results => {
    console.log('\n=============================================================');
    console.log('  CHALLENGER 1: STATUTORY VERIFIERS EMPIRICAL STRESS RESULTS');
    console.log('=============================================================\n');

    let passCount = 0;
    const suiteStats = {};

    results.forEach(r => {
      suiteStats[r.suite] = suiteStats[r.suite] || { total: 0, pass: 0 };
      suiteStats[r.suite].total++;

      const mark = r.pass ? '✅ PASS' : '❌ FAIL';
      if (r.pass) {
        passCount++;
        suiteStats[r.suite].pass++;
      }
      console.log(`[${r.id}] [${r.suite.padEnd(13)}] ${r.name} -> ${mark} (${r.durationMs}ms)`);
      if (!r.pass) console.log(`   ❌ ERROR: ${r.error}`);
    });

    console.log('\n--- SUITE BREAKDOWN ---');
    Object.entries(suiteStats).forEach(([s, st]) => {
      console.log(`  ${s.padEnd(15)}: ${st.pass}/${st.total} (${Math.round((st.pass / st.total) * 100)}%)`);
    });

    console.log(`\nOVERALL: ${passCount}/${results.length} Passed (${Math.round((passCount / results.length) * 100)}%)\n`);
    process.exit(results.length === passCount ? 0 : 1);
  }).catch(err => {
    console.error('Fatal test runner failure:', err);
    process.exit(1);
  });
}

module.exports = { runStressVerification };
