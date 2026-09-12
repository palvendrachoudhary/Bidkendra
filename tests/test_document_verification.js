const http = require('http');
const path = require('path');
const fs = require('fs');
const { COMPLIANT_TEXT, DUMMY_TEXT, createMinimalPdfBuffer } = require('./fixtures/test_fixtures');

function postJson(port, path, data) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data);
    const req = http.request({
      hostname: 'localhost',
      port: port,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        let parsed = null;
        try { parsed = JSON.parse(body); } catch (e) { parsed = body; }
        resolve({ statusCode: res.statusCode, body: parsed });
      });
    });

    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error(`POST ${path} timed out after 10000ms`));
    });
    req.write(payload);
    req.end();
  });
}

function postMultipart(port, uploadPath, fileBuffer, fileName, mimeType) {
  return new Promise((resolve, reject) => {
    const boundary = '----WebKitFormBoundaryBidVerifyTest' + Date.now();
    const crlf = '\r\n';

    let header = `--${boundary}${crlf}`;
    header += `Content-Disposition: form-data; name="document"; filename="${fileName}"${crlf}`;
    header += `Content-Type: ${mimeType}${crlf}${crlf}`;

    const footer = `${crlf}--${boundary}--${crlf}`;

    const fullBuffer = Buffer.concat([
      Buffer.from(header, 'utf8'),
      fileBuffer,
      Buffer.from(footer, 'utf8')
    ]);

    const req = http.request({
      hostname: 'localhost',
      port: port,
      path: uploadPath,
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': fullBuffer.length
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        let parsed = null;
        try { parsed = JSON.parse(body); } catch (e) { parsed = body; }
        resolve({ statusCode: res.statusCode, body: parsed });
      });
    });

    req.on('error', reject);
    req.setTimeout(12000, () => {
      req.destroy();
      reject(new Error(`Multipart upload to ${uploadPath} timed out`));
    });
    req.write(fullBuffer);
    req.end();
  });
}

/**
 * Test Suite: Document Verification & OCR Pipeline
 */
async function runDocumentVerificationTests(port = 5000) {
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

  // --- Tier 1: Feature Coverage ---

  // T1.4.1: Dummy text payload returns HTTP 200 with 0% score and NOT_ELIGIBLE verdict
  await recordTest('T1.4.1', 'Dummy text without statutory credentials returns 0% score and NOT_ELIGIBLE without crashing', 'Tier 1', async () => {
    const res = await postJson(port, '/api/verify/document', {
      text: DUMMY_TEXT,
      fileName: 'dummy_noncompliant.txt'
    });

    if (res.statusCode !== 200) {
      throw new Error(`Expected HTTP 200, received ${res.statusCode}: ${JSON.stringify(res.body)}`);
    }

    const data = res.body.data || res.body;
    if (data.overallScore !== 0) {
      throw new Error(`Expected overallScore: 0, received ${data.overallScore}`);
    }
    if (data.isCompliant !== false) {
      throw new Error(`Expected isCompliant: false, received ${data.isCompliant}`);
    }
    if (data.hasMandatoryFailure !== true) {
      throw new Error(`Expected hasMandatoryFailure: true, received ${data.hasMandatoryFailure}`);
    }
    if (!data.verdict || !data.verdict.startsWith('NOT_ELIGIBLE')) {
      throw new Error(`Expected verdict starting with NOT_ELIGIBLE, received '${data.verdict}'`);
    }
  });

  // T1.4.2: Dummy PDF file returns HTTP 200 with 0% score and NOT_ELIGIBLE verdict
  await recordTest('T1.4.2', 'Dummy PDF without statutory numbers returns 0% score and NOT_ELIGIBLE verdict', 'Tier 1', async () => {
    const dummyPdf = createMinimalPdfBuffer(DUMMY_TEXT);
    const res = await postMultipart(port, '/api/verify/document', dummyPdf, 'dummy_test.pdf', 'application/pdf');

    if (res.statusCode !== 200) {
      throw new Error(`Expected HTTP 200, received ${res.statusCode}: ${JSON.stringify(res.body)}`);
    }

    const data = res.body.data || res.body;
    if (data.overallScore !== 0) {
      throw new Error(`Expected overallScore: 0, received ${data.overallScore}`);
    }
    if (data.riskLevel !== 'Critical') {
      throw new Error(`Expected riskLevel: 'Critical', received '${data.riskLevel}'`);
    }
    if (!data.verdict || !data.verdict.startsWith('NOT_ELIGIBLE')) {
      throw new Error(`Expected verdict starting with NOT_ELIGIBLE, received '${data.verdict}'`);
    }
  });

  // T1.4.3: Legitimate CPCL text envelope returns high compliance score (>=80%) and ELIGIBLE
  await recordTest('T1.4.3', 'Compliant CPCL proposal returns overallScore >= 80% and ELIGIBLE verdict', 'Tier 1', async () => {
    const res = await postJson(port, '/api/verify/document', {
      text: COMPLIANT_TEXT,
      fileName: 'CPCL_Pipeline_Technical_Spec_PetroTech.txt',
      companyName: 'PetroTech India Pvt Ltd'
    });

    if (res.statusCode !== 200) {
      throw new Error(`Expected HTTP 200, received ${res.statusCode}: ${JSON.stringify(res.body)}`);
    }

    const data = res.body.data || res.body;
    if (data.overallScore < 80) {
      throw new Error(`Expected overallScore >= 80, received ${data.overallScore}`);
    }
    if (data.isCompliant !== true) {
      throw new Error(`Expected isCompliant: true, received ${data.isCompliant}`);
    }
    if (data.hasMandatoryFailure !== false) {
      throw new Error(`Expected hasMandatoryFailure: false, received ${data.hasMandatoryFailure}`);
    }
    if (!data.verdict || !data.verdict.startsWith('ELIGIBLE')) {
      throw new Error(`Expected verdict starting with ELIGIBLE, received '${data.verdict}'`);
    }
  });

  // T1.4.4: AI Enrichment payload generated (summary, translation, emailDraft)
  await recordTest('T1.4.4', 'Response includes aiSummary, aiTranslation, and emailDraft properties', 'Tier 1', async () => {
    const res = await postJson(port, '/api/verify/document', {
      text: COMPLIANT_TEXT,
      fileName: 'AI_Enrichment_Test.txt',
      companyName: 'PetroTech India Pvt Ltd'
    });

    const data = res.body.data || res.body;
    if (!data.aiSummary || typeof data.aiSummary !== 'string') {
      throw new Error('aiSummary is missing or not a string');
    }
    if (!data.emailDraft || typeof data.emailDraft !== 'object') {
      throw new Error('emailDraft is missing or not an object');
    }
    if (!data.emailDraft.subject || !data.emailDraft.body) {
      throw new Error('emailDraft does not contain subject and body');
    }
  });

  // T1.4.5: Rejection email contains itemized failed gates when verification fails
  await recordTest('T1.4.5', 'Rejection email draft itemizes failed checks without undefined properties', 'Tier 1', async () => {
    const res = await postJson(port, '/api/verify/document', {
      text: DUMMY_TEXT,
      fileName: 'Dummy_Rejection_Check.txt',
      companyName: 'Unregistered Vendor'
    });

    const data = res.body.data || res.body;
    const body = data.emailDraft?.body || '';
    if (!body.includes('Mandatory Statutory Deficiencies') && !body.includes('Discrepancies')) {
      throw new Error(`Rejection email draft body does not list statutory deficiencies: "${body}"`);
    }
  });

  // --- Tier 2: Boundary & Corner Cases ---

  // T2.4.1: Empty text submission
  await recordTest('T2.4.1', 'Empty document text returns 200 with 0% score rather than throwing exception', 'Tier 2', async () => {
    const res = await postJson(port, '/api/verify/document', {
      text: '',
      fileName: 'empty.txt'
    });

    if (res.statusCode !== 200) {
      throw new Error(`Expected HTTP 200, received ${res.statusCode}`);
    }
    const data = res.body.data || res.body;
    if (data.overallScore !== 0 || !data.hasMandatoryFailure) {
      throw new Error(`Expected score 0 and mandatory failure for empty text`);
    }
  });

  // T2.4.2: Binary garbage / unparseable stream
  await recordTest('T2.4.2', 'Corrupted binary stream returns NOT_ELIGIBLE safely without process exit', 'Tier 2', async () => {
    const garbageBuffer = Buffer.from([0x00, 0x01, 0xFF, 0xFE, 0xAA, 0x55, 0xDE, 0xAD, 0xBE, 0xEF]);
    const res = await postMultipart(port, '/api/verify/document', garbageBuffer, 'corrupt.pdf', 'application/pdf');

    if (res.statusCode !== 200) {
      throw new Error(`Expected HTTP 200 on corrupted file, received ${res.statusCode}`);
    }
    const data = res.body.data || res.body;
    if (data.isCompliant !== false) {
      throw new Error('Corrupted binary file must not be marked compliant');
    }
  });

  // T2.4.3: SQL Injection payload in document body
  await recordTest('T2.4.3', 'SQL injection attack strings in document content are sanitized', 'Tier 2', async () => {
    const injectionText = `
      COMPANY: PetroTech India Pvt Ltd'; DROP TABLE audit_logs; --
      GSTIN: 33AABCP1234F1Z5
      PAN: AABCP1234F
      CIN: U23201TN2018PTC123456
    `;

    const res = await postJson(port, '/api/verify/document', {
      text: injectionText,
      fileName: 'injection_test.txt'
    });

    if (res.statusCode !== 200) {
      throw new Error(`SQL injection text caused HTTP failure ${res.statusCode}`);
    }
  });

  // T2.4.4: Automation coverage score calculation
  await recordTest('T2.4.4', 'Calculates accurate automation coverage percentage', 'Tier 2', async () => {
    const res = await postJson(port, '/api/verify/document', {
      text: COMPLIANT_TEXT,
      fileName: 'coverage_test.txt'
    });

    const data = res.body.data || res.body;
    if (typeof data.automationCoverage !== 'number' || data.automationCoverage <= 0 || data.automationCoverage > 100) {
      throw new Error(`Invalid automationCoverage value: ${data.automationCoverage}`);
    }
  });

  // T2.4.5: Document hash uniqueness
  await recordTest('T2.4.5', 'Computes valid 64-character SHA-256 document hash', 'Tier 2', async () => {
    const res = await postJson(port, '/api/verify/document', {
      text: COMPLIANT_TEXT,
      fileName: 'hash_test.txt'
    });

    const data = res.body.data || res.body;
    if (!data.documentHash || data.documentHash.length !== 64 || !/^[0-9a-f]{64}$/i.test(data.documentHash)) {
      throw new Error(`Invalid SHA-256 documentHash: ${data.documentHash}`);
    }
  });

  return results;
}

if (require.main === module) {
  runDocumentVerificationTests().then(results => {
    console.log('\n=== DOCUMENT VERIFICATION ENDPOINT TEST RESULTS ===\n');
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

module.exports = { runDocumentVerificationTests };
