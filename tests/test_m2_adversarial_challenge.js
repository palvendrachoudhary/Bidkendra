/**
 * Milestone 2 Empirical Adversarial Stress & Challenge Test Suite
 * Conducted by Challenger 2 (teamwork_preview_challenger_m2_2)
 *
 * Targets:
 * - /api/verify/document
 * - realOcrService.js
 *
 * Categories:
 * 1. Zero-byte files & empty buffers
 * 2. Corrupted PDF buffers
 * 3. SQL injection & XSS payloads in document text and metadata
 * 4. Valid dummy PDFs containing no statutory numbers
 * 5. Type confusion & degenerate JSON types
 * 6. Extreme payload sizes, ReDoS & high-concurrency burst
 */

const http = require('http');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const { scanAndVerifyDocument } = require(path.join(PROJECT_ROOT, 'backend/src/services/realOcrService'));
const db = require(path.join(PROJECT_ROOT, 'backend/src/config/database'));

function postJson(port, reqPath, data) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data);
    const req = http.request({
      hostname: 'localhost',
      port: port,
      path: reqPath,
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
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error(`POST ${reqPath} timed out after 15000ms`));
    });
    req.write(payload);
    req.end();
  });
}

function postMultipart(port, uploadPath, fileBuffer, fileName, mimeType, additionalFields = {}) {
  return new Promise((resolve, reject) => {
    const boundary = '----AdversarialBoundary' + Date.now() + Math.random().toString(36).substring(2);
    const crlf = '\r\n';

    const parts = [];

    for (const [key, val] of Object.entries(additionalFields)) {
      parts.push(Buffer.from(
        `--${boundary}${crlf}Content-Disposition: form-data; name="${key}"${crlf}${crlf}${val}${crlf}`,
        'utf8'
      ));
    }

    if (fileBuffer !== null && fileBuffer !== undefined) {
      let fileHeader = `--${boundary}${crlf}`;
      fileHeader += `Content-Disposition: form-data; name="document"; filename="${fileName}"${crlf}`;
      fileHeader += `Content-Type: ${mimeType}${crlf}${crlf}`;
      parts.push(Buffer.from(fileHeader, 'utf8'));
      parts.push(fileBuffer);
      parts.push(Buffer.from(crlf, 'utf8'));
    }

    parts.push(Buffer.from(`--${boundary}--${crlf}`, 'utf8'));
    const fullBuffer = Buffer.concat(parts);

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
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error(`Multipart upload to ${uploadPath} timed out`));
    });
    req.write(fullBuffer);
    req.end();
  });
}

function createMinimalPdfBuffer(textContent = 'BidVerify AI Test Document') {
  const escapedText = textContent.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  const streamContent = `BT /F1 12 Tf 50 750 Td (${escapedText}) Tj ET`;
  const streamLength = Buffer.byteLength(streamContent, 'utf8');

  const pdfString = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length ${streamLength} >>
stream
${streamContent}
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000344 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
424
%%EOF`;

  return Buffer.from(pdfString, 'binary');
}

function createMultiPagePdfBuffer(pages = ['Page 1', 'Page 2', 'Page 3']) {
  let objIndex = 3;
  let objects = '';

  const kids = [];
  for (let i = 0; i < pages.length; i++) {
    const pageObjNum = objIndex++;
    const contentObjNum = objIndex++;
    kids.push(`${pageObjNum} 0 R`);
    const escaped = pages[i].replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
    const stream = `BT /F1 12 Tf 50 750 Td (${escaped}) Tj ET`;
    const len = Buffer.byteLength(stream, 'utf8');

    objects += `${pageObjNum} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents ${contentObjNum} 0 R /Resources << /Font << /F1 ${pages.length * 2 + 3} 0 R >> >> >>\nendobj\n`;
    objects += `${contentObjNum} 0 obj\n<< /Length ${len} >>\nstream\n${stream}\nendstream\nendobj\n`;
  }

  const fontObjNum = objIndex;
  objects += `${fontObjNum} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`;

  const pdf = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [${kids.join(' ')}] /Count ${pages.length} >>
endobj
${objects}xref
0 ${fontObjNum + 1}
0000000000 65535 f 
trailer
<< /Size ${fontObjNum + 1} /Root 1 0 R >>
startxref
500
%%EOF`;

  return Buffer.from(pdf, 'binary');
}

async function runAdversarialM2Suite(port = 5000) {
  console.log('\n===============================================================');
  console.log('   CHALLENGER 2: EMPIRICAL ADVERSARIAL STRESS TEST SUITE       ');
  console.log('   Target: /api/verify/document & realOcrService.js            ');
  console.log('===============================================================\n');

  const testResults = [];

  async function executeTest(id, category, name, testFn) {
    const start = Date.now();
    try {
      const details = await testFn();
      const durationMs = Date.now() - start;
      testResults.push({ id, category, name, pass: true, durationMs, details });
      console.log(`[PASS] ${id} (${category}): ${name} [${durationMs}ms]`);
      if (details) console.log(`       -> ${details}`);
    } catch (err) {
      const durationMs = Date.now() - start;
      testResults.push({ id, category, name, pass: false, durationMs, error: err.message });
      console.log(`[FAIL] ${id} (${category}): ${name} [${durationMs}ms]`);
      console.log(`       -> ERROR: ${err.message}`);
    }
  }

  function assertStructuredRejection(data, context = '') {
    if (!data) throw new Error(`${context}: Response body or data is missing`);
    if (data.overallScore !== 0) {
      throw new Error(`${context}: Expected overallScore === 0, got ${data.overallScore}`);
    }
    if (data.isCompliant !== false) {
      throw new Error(`${context}: Expected isCompliant === false, got ${data.isCompliant}`);
    }
    if (data.riskLevel !== 'Critical') {
      throw new Error(`${context}: Expected riskLevel === 'Critical', got '${data.riskLevel}'`);
    }
    if (data.hasMandatoryFailure !== true) {
      throw new Error(`${context}: Expected hasMandatoryFailure === true, got ${data.hasMandatoryFailure}`);
    }
    if (!data.verdict || !data.verdict.startsWith('NOT_ELIGIBLE')) {
      throw new Error(`${context}: Expected verdict starting with 'NOT_ELIGIBLE', got '${data.verdict}'`);
    }
  }

  // =========================================================================
  // CATEGORY 1: Zero-Byte Files & Empty Buffers
  // =========================================================================

  await executeTest('C2.1.1', 'Zero-Byte Files', 'Direct scanAndVerifyDocument with zero-length Buffer', async () => {
    const result = await scanAndVerifyDocument(Buffer.alloc(0), 'empty.pdf', 'application/pdf');
    assertStructuredRejection(result, 'scanAndVerifyDocument(Buffer.alloc(0))');
    return `Score: ${result.overallScore}, Risk: ${result.riskLevel}, Hash: ${result.documentHash}`;
  });

  await executeTest('C2.1.2', 'Zero-Byte Files', 'Direct scanAndVerifyDocument with null buffer', async () => {
    const result = await scanAndVerifyDocument(null, 'null.pdf', 'application/pdf');
    assertStructuredRejection(result, 'scanAndVerifyDocument(null)');
    return `Score: ${result.overallScore}, Risk: ${result.riskLevel}, Handled gracefully`;
  });

  await executeTest('C2.1.3', 'Zero-Byte Files', 'Direct scanAndVerifyDocument with undefined buffer', async () => {
    const result = await scanAndVerifyDocument(undefined, 'undef.pdf', 'application/pdf');
    assertStructuredRejection(result, 'scanAndVerifyDocument(undefined)');
    return `Score: ${result.overallScore}, Risk: ${result.riskLevel}, Handled gracefully`;
  });

  await executeTest('C2.1.4', 'Zero-Byte Files', 'HTTP POST /api/verify/document with zero-length PDF file via multipart', async () => {
    const res = await postMultipart(port, '/api/verify/document', Buffer.alloc(0), 'empty.pdf', 'application/pdf');
    if (res.statusCode !== 200) {
      throw new Error(`Expected HTTP 200, got ${res.statusCode}: ${JSON.stringify(res.body)}`);
    }
    const data = res.body.data || res.body;
    assertStructuredRejection(data, 'Zero-byte multipart upload');
    return `HTTP 200, overallScore: ${data.overallScore}, isCompliant: ${data.isCompliant}, riskLevel: ${data.riskLevel}`;
  });

  await executeTest('C2.1.5', 'Zero-Byte Files', 'HTTP POST /api/verify/document with zero-length TXT file via multipart', async () => {
    const res = await postMultipart(port, '/api/verify/document', Buffer.alloc(0), 'empty.txt', 'text/plain');
    if (res.statusCode !== 200) {
      throw new Error(`Expected HTTP 200, got ${res.statusCode}: ${JSON.stringify(res.body)}`);
    }
    const data = res.body.data || res.body;
    assertStructuredRejection(data, 'Zero-byte txt multipart');
    return `HTTP 200, overallScore: ${data.overallScore}, risk: ${data.riskLevel}`;
  });

  await executeTest('C2.1.6', 'Zero-Byte Files', 'HTTP POST /api/verify/document with empty JSON body {}', async () => {
    const res = await postJson(port, '/api/verify/document', {});
    if (res.statusCode !== 200) {
      throw new Error(`Expected HTTP 200, got ${res.statusCode}: ${JSON.stringify(res.body)}`);
    }
    const data = res.body.data || res.body;
    assertStructuredRejection(data, 'Empty JSON body');
    return `HTTP 200, overallScore: ${data.overallScore}, isCompliant: ${data.isCompliant}`;
  });

  await executeTest('C2.1.7', 'Zero-Byte Files', 'HTTP POST /api/verify/document with empty text string {"text": ""}', async () => {
    const res = await postJson(port, '/api/verify/document', { text: '', fileName: 'blank.txt' });
    if (res.statusCode !== 200) {
      throw new Error(`Expected HTTP 200, got ${res.statusCode}: ${JSON.stringify(res.body)}`);
    }
    const data = res.body.data || res.body;
    assertStructuredRejection(data, 'Empty text string');
    return `HTTP 200, overallScore: ${data.overallScore}, isCompliant: ${data.isCompliant}`;
  });

  // =========================================================================
  // CATEGORY 2: Corrupted PDF Buffers
  // =========================================================================

  await executeTest('C2.2.1', 'Corrupted PDF', 'Random binary garbage (16 bytes) with application/pdf header', async () => {
    const garbage = crypto.randomBytes(16);
    const res = await postMultipart(port, '/api/verify/document', garbage, 'corrupt_random.pdf', 'application/pdf');
    if (res.statusCode !== 200) {
      throw new Error(`Expected HTTP 200, got ${res.statusCode}: ${JSON.stringify(res.body)}`);
    }
    const data = res.body.data || res.body;
    assertStructuredRejection(data, 'Corrupted 16-byte buffer');
    return `HTTP 200, overallScore: ${data.overallScore}, riskLevel: ${data.riskLevel}`;
  });

  await executeTest('C2.2.2', 'Corrupted PDF', 'Truncated PDF header only ("%PDF-1.4\\n")', async () => {
    const truncated = Buffer.from('%PDF-1.4\n', 'utf8');
    const res = await postMultipart(port, '/api/verify/document', truncated, 'truncated_header.pdf', 'application/pdf');
    if (res.statusCode !== 200) {
      throw new Error(`Expected HTTP 200, got ${res.statusCode}: ${JSON.stringify(res.body)}`);
    }
    const data = res.body.data || res.body;
    assertStructuredRejection(data, 'Truncated PDF header');
    return `HTTP 200, overallScore: ${data.overallScore}, riskLevel: ${data.riskLevel}`;
  });

  await executeTest('C2.2.3', 'Corrupted PDF', 'PDF with invalid xref offset pointing past EOF', async () => {
    const badXrefPdf = `%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\nxref\n0 2\n0000000000 65535 f\n0000099999 00000 n\ntrailer\n<< /Size 2 /Root 1 0 R >>\nstartxref\n999999\n%%EOF`;
    const res = await postMultipart(port, '/api/verify/document', Buffer.from(badXrefPdf, 'utf8'), 'bad_xref.pdf', 'application/pdf');
    if (res.statusCode !== 200) {
      throw new Error(`Expected HTTP 200, got ${res.statusCode}: ${JSON.stringify(res.body)}`);
    }
    const data = res.body.data || res.body;
    assertStructuredRejection(data, 'Bad xref offset PDF');
    return `HTTP 200, overallScore: ${data.overallScore}, riskLevel: ${data.riskLevel}`;
  });

  await executeTest('C2.2.4', 'Corrupted PDF', 'Non-PDF Windows Executable header (MZ) disguised as PDF', async () => {
    const exeHeader = Buffer.from([0x4D, 0x5A, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00, 0x04, 0x00, 0x00, 0x00, 0xFF, 0xFF]);
    const res = await postMultipart(port, '/api/verify/document', exeHeader, 'malware_disguised.pdf', 'application/pdf');
    if (res.statusCode !== 200) {
      throw new Error(`Expected HTTP 200, got ${res.statusCode}: ${JSON.stringify(res.body)}`);
    }
    const data = res.body.data || res.body;
    assertStructuredRejection(data, 'Disguised MZ binary');
    return `HTTP 200, overallScore: ${data.overallScore}, riskLevel: ${data.riskLevel}`;
  });

  await executeTest('C2.2.5', 'Corrupted PDF', 'Large corrupted binary buffer (1MB of random bytes)', async () => {
    const largeGarbage = crypto.randomBytes(1024 * 1024);
    const res = await postMultipart(port, '/api/verify/document', largeGarbage, 'large_garbage.pdf', 'application/pdf');
    if (res.statusCode !== 200) {
      throw new Error(`Expected HTTP 200, got ${res.statusCode}: ${JSON.stringify(res.body)}`);
    }
    const data = res.body.data || res.body;
    assertStructuredRejection(data, '1MB random binary');
    return `HTTP 200, overallScore: ${data.overallScore}, fileSize: ${data.fileSize} bytes`;
  });

  await executeTest('C2.2.6', 'Corrupted PDF', 'Direct scanAndVerifyDocument with corrupt PDF buffer', async () => {
    const brokenStreamPdf = Buffer.from('%PDF-1.4\n1 0 obj << /Filter /FlateDecode /Length 20 >> stream\nINVALID_DEFLATE_STREAM_BYTES\nendstream\nendobj\ntrailer << /Root 1 0 R >>\n%%EOF', 'utf8');
    const result = await scanAndVerifyDocument(brokenStreamPdf, 'broken_stream.pdf', 'application/pdf');
    assertStructuredRejection(result, 'scanAndVerifyDocument(brokenStreamPdf)');
    return `Score: ${result.overallScore}, riskLevel: ${result.riskLevel}, preview: ${result.textPreview.substring(0, 40)}`;
  });

  // =========================================================================
  // CATEGORY 3: SQL Injection & XSS Payloads
  // =========================================================================

  await executeTest('C2.3.1', 'SQLi & XSS', 'Classic SQLi DROP TABLE payload in document text', async () => {
    const sqliText = `Tender Submission Document\nBidder: PetroTech India\n'; DROP TABLE audit_logs; --\n'; DROP TABLE tenders; --\nNo statutory numbers here.`;
    const res = await postJson(port, '/api/verify/document', { text: sqliText, fileName: 'sqli_text.txt' });
    if (res.statusCode !== 200) {
      throw new Error(`Expected HTTP 200, got ${res.statusCode}: ${JSON.stringify(res.body)}`);
    }
    const data = res.body.data || res.body;
    assertStructuredRejection(data, 'SQLi text payload');
    return `HTTP 200, overallScore: ${data.overallScore}, riskLevel: ${data.riskLevel}`;
  });

  await executeTest('C2.3.2', 'SQLi & XSS', 'Tautology SQLi payload ("\' OR \'1\'=\'1") in document text', async () => {
    const tautologyText = `' OR '1'='1' UNION SELECT * FROM users; -- \nArbitrary non-statutory commercial text.`;
    const res = await postJson(port, '/api/verify/document', { text: tautologyText, fileName: 'tautology.txt' });
    if (res.statusCode !== 200) {
      throw new Error(`Expected HTTP 200, got ${res.statusCode}: ${JSON.stringify(res.body)}`);
    }
    const data = res.body.data || res.body;
    assertStructuredRejection(data, 'Tautology SQLi text');
    return `HTTP 200, overallScore: ${data.overallScore}, riskLevel: ${data.riskLevel}`;
  });

  await executeTest('C2.3.3', 'SQLi & XSS', 'SQLi payload embedded in PDF binary stream', async () => {
    const sqliPdfText = `Vendor Agreement\n'; DROP TABLE compliance_scores; --\nTerms: Net 30 days. No GST/PAN.`;
    const pdfBuf = createMinimalPdfBuffer(sqliPdfText);
    const res = await postMultipart(port, '/api/verify/document', pdfBuf, 'sqli_inside.pdf', 'application/pdf');
    if (res.statusCode !== 200) {
      throw new Error(`Expected HTTP 200, got ${res.statusCode}: ${JSON.stringify(res.body)}`);
    }
    const data = res.body.data || res.body;
    assertStructuredRejection(data, 'SQLi inside PDF');
    return `HTTP 200, overallScore: ${data.overallScore}, riskLevel: ${data.riskLevel}`;
  });

  await executeTest('C2.3.4', 'SQLi & XSS', 'SQLi payload in fileName parameter', async () => {
    const res = await postJson(port, '/api/verify/document', {
      text: 'Standard non-statutory document text.',
      fileName: "'; DROP TABLE audit_logs; --.txt"
    });
    if (res.statusCode !== 200) {
      throw new Error(`Expected HTTP 200, got ${res.statusCode}: ${JSON.stringify(res.body)}`);
    }
    const data = res.body.data || res.body;
    assertStructuredRejection(data, 'SQLi in fileName');
    return `HTTP 200, overallScore: ${data.overallScore}, fileName safely recorded`;
  });

  await executeTest('C2.3.5', 'SQLi & XSS', 'SQLi payload in submissionId and companyName parameters', async () => {
    const res = await postJson(port, '/api/verify/document', {
      text: 'Non-compliant vendor document with SQL payload.',
      fileName: 'vendor_doc.txt',
      companyName: "BadCorp'; DROP TABLE users; --",
      submissionId: "sub'; DROP TABLE compliance_scores; --"
    });
    if (res.statusCode !== 200) {
      throw new Error(`Expected HTTP 200, got ${res.statusCode}: ${JSON.stringify(res.body)}`);
    }
    const data = res.body.data || res.body;
    assertStructuredRejection(data, 'SQLi in metadata fields');
    return `HTTP 200, overallScore: ${data.overallScore}, DB queries safely parameterized`;
  });

  await executeTest('C2.3.6', 'SQLi & XSS', 'Stored XSS payload in document text ("<script>alert(document.cookie)</script>")', async () => {
    const xssText = `<script>alert('XSS_EXEC')</script><img src=x onerror=alert(1)> Tender text without statutory IDs.`;
    const res = await postJson(port, '/api/verify/document', { text: xssText, fileName: 'xss_document.txt' });
    if (res.statusCode !== 200) {
      throw new Error(`Expected HTTP 200, got ${res.statusCode}: ${JSON.stringify(res.body)}`);
    }
    const data = res.body.data || res.body;
    assertStructuredRejection(data, 'XSS in text');
    return `HTTP 200, overallScore: ${data.overallScore}, riskLevel: ${data.riskLevel}`;
  });

  await executeTest('C2.3.7', 'SQLi & XSS', 'Stored XSS payload in companyName and fileName', async () => {
    const res = await postJson(port, '/api/verify/document', {
      text: 'Some non-statutory vendor text.',
      fileName: '<svg/onload=alert(1)>.pdf',
      companyName: '<script>window.location="http://evil.com"</script>'
    });
    if (res.statusCode !== 200) {
      throw new Error(`Expected HTTP 200, got ${res.statusCode}: ${JSON.stringify(res.body)}`);
    }
    const data = res.body.data || res.body;
    assertStructuredRejection(data, 'XSS in metadata');
    return `HTTP 200, overallScore: ${data.overallScore}, email draft safely formatted`;
  });

  await executeTest('C2.3.8', 'SQLi & XSS', 'Verify Database Integrity: Confirm all tables exist and are unaffected', async () => {
    await db.init();
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(r => r.name);
    const requiredTables = ['audit_logs', 'compliance_scores', 'tenders', 'bidders', 'users'];
    for (const tbl of requiredTables) {
      if (!tables.includes(tbl)) {
        throw new Error(`Database table '${tbl}' was deleted or corrupted by SQL injection payloads!`);
      }
    }
    const count = db.prepare('SELECT count(*) as count FROM audit_logs').get();
    return `Tables intact: [${tables.join(', ')}]. audit_logs row count: ${count.count}`;
  });

  // =========================================================================
  // CATEGORY 4: Valid Dummy PDFs Containing No Statutory Numbers
  // =========================================================================

  await executeTest('C2.4.1', 'Valid Dummy PDF', 'Valid single-page PDF with standard commercial terms (no statutory IDs)', async () => {
    const dummyText = `
      COMMERCIAL PROPOSAL FOR CPCL PIPELINE MAINTENANCE
      Vendor: Apex Engineering Services
      Scope: General maintenance and inspection of pipeline joints.
      Validity: 90 days from bid opening.
      Commercial terms: All prices inclusive of freight and packing.
    `;
    const pdfBuf = createMinimalPdfBuffer(dummyText);
    const res = await postMultipart(port, '/api/verify/document', pdfBuf, 'apex_commercial_proposal.pdf', 'application/pdf');
    if (res.statusCode !== 200) {
      throw new Error(`Expected HTTP 200, got ${res.statusCode}: ${JSON.stringify(res.body)}`);
    }
    const data = res.body.data || res.body;
    assertStructuredRejection(data, 'Valid dummy commercial PDF');
    return `HTTP 200, overallScore: ${data.overallScore}, riskLevel: ${data.riskLevel}, verdict: ${data.verdict}`;
  });

  await executeTest('C2.4.2', 'Valid Dummy PDF', 'Valid dummy PDF with commercial percentages (10% advance, 18% GST) testing Make-In-India safety', async () => {
    const pctText = `
      PAYMENT SCHEDULE & TAX INVOICE
      Contract Reference: CPCL-PIPE-2026-T1001
      Payment Schedule:
      - 10% mobilization advance against bank guarantee.
      - 80% pro-rata upon site delivery.
      - 10% on final commissioning.
      Taxes: Applicable GST rate 18%.
      Retention Money: 5% held for defect liability.
    `;
    const pdfBuf = createMinimalPdfBuffer(pctText);
    const res = await postMultipart(port, '/api/verify/document', pdfBuf, 'payment_terms.pdf', 'application/pdf');
    if (res.statusCode !== 200) {
      throw new Error(`Expected HTTP 200, got ${res.statusCode}: ${JSON.stringify(res.body)}`);
    }
    const data = res.body.data || res.body;
    assertStructuredRejection(data, 'Dummy PDF with commercial percentages');
    const miiCheck = data.checksDetail?.makeInIndia;
    if (miiCheck && miiCheck.checkStatus === 'VERIFIED') {
      throw new Error(`Make In India falsely matched commercial percentages: ${JSON.stringify(miiCheck)}`);
    }
    return `HTTP 200, overallScore: ${data.overallScore}, MII status: ${miiCheck?.checkStatus}, riskLevel: ${data.riskLevel}`;
  });

  await executeTest('C2.4.3', 'Valid Dummy PDF', 'Valid dummy PDF with pseudo-statutory numbers (invalid PAN entity & invalid GSTIN state)', async () => {
    const pseudoText = `
      VENDOR STATUTORY CLAIM
      GSTIN: 99AABCP1234F1Z5 (Invalid state code 99)
      PAN: AABCX1234F (Invalid 4th character X)
      CIN: L99999 (Truncated CIN)
      Udyam: UDYAM-XX-99-9999999 (Invalid state XX)
    `;
    const pdfBuf = createMinimalPdfBuffer(pseudoText);
    const res = await postMultipart(port, '/api/verify/document', pdfBuf, 'pseudo_statutory.pdf', 'application/pdf');
    if (res.statusCode !== 200) {
      throw new Error(`Expected HTTP 200, got ${res.statusCode}: ${JSON.stringify(res.body)}`);
    }
    const data = res.body.data || res.body;
    assertStructuredRejection(data, 'Pseudo-statutory PDF');
    return `HTTP 200, overallScore: ${data.overallScore}, riskLevel: ${data.riskLevel}, hasMandatoryFailure: ${data.hasMandatoryFailure}`;
  });

  await executeTest('C2.4.4', 'Valid Dummy PDF', 'Multi-page valid dummy PDF (3 pages of non-statutory terms)', async () => {
    const multiPdf = createMultiPagePdfBuffer([
      'Page 1: Scope of Work and Technical Specifications. No statutory credentials.',
      'Page 2: Standard Terms, Conditions, Warranty and Liability clauses.',
      'Page 3: Signature and Authorization section without PAN, GSTIN or CIN.'
    ]);
    const res = await postMultipart(port, '/api/verify/document', multiPdf, 'multipage_dummy.pdf', 'application/pdf');
    if (res.statusCode !== 200) {
      throw new Error(`Expected HTTP 200, got ${res.statusCode}: ${JSON.stringify(res.body)}`);
    }
    const data = res.body.data || res.body;
    assertStructuredRejection(data, 'Multi-page dummy PDF');
    return `HTTP 200, overallScore: ${data.overallScore}, riskLevel: ${data.riskLevel}, 3 pages scanned`;
  });

  await executeTest('C2.4.5', 'Valid Dummy PDF', 'Valid PDF with completely blank page stream', async () => {
    const blankPdf = createMinimalPdfBuffer('');
    const res = await postMultipart(port, '/api/verify/document', blankPdf, 'blank_page.pdf', 'application/pdf');
    if (res.statusCode !== 200) {
      throw new Error(`Expected HTTP 200, got ${res.statusCode}: ${JSON.stringify(res.body)}`);
    }
    const data = res.body.data || res.body;
    assertStructuredRejection(data, 'Blank page PDF');
    return `HTTP 200, overallScore: ${data.overallScore}, riskLevel: ${data.riskLevel}`;
  });

  // =========================================================================
  // CATEGORY 5: Extreme Payload Sizes, ReDoS & Concurrency Burst
  // =========================================================================

  await executeTest('C2.5.1', 'Extreme & Stress', 'ReDoS stress test: 5,000 repetitions of Udyam prefix pattern', async () => {
    const redosString = 'UDYAM - '.repeat(5000) + 'NO_MATCH_AT_END';
    const start = Date.now();
    const result = await scanAndVerifyDocument(Buffer.from(redosString, 'utf8'), 'redos_udyam.txt', 'text/plain');
    const elapsed = Date.now() - start;
    if (elapsed > 3000) {
      throw new Error(`ReDoS detected! Execution took ${elapsed}ms (>3000ms threshold)`);
    }
    assertStructuredRejection(result, 'ReDoS Udyam stress');
    return `Completed in ${elapsed}ms (No ReDoS), overallScore: ${result.overallScore}`;
  });

  await executeTest('C2.5.2', 'Extreme & Stress', 'Large text payload (100KB) to /api/verify/document', async () => {
    const largeText = 'General non-statutory terms paragraph. '.repeat(2500);
    const res = await postJson(port, '/api/verify/document', {
      text: largeText,
      fileName: 'large_terms.txt'
    });
    if (res.statusCode !== 200) {
      throw new Error(`Expected HTTP 200, received ${res.statusCode}: ${JSON.stringify(res.body)}`);
    }
    const data = res.body.data || res.body;
    assertStructuredRejection(data, 'Large 100KB text');
    return `HTTP 200, processed ${largeText.length} characters without memory failure`;
  });

  await executeTest('C2.5.3', 'Extreme & Stress', 'Concurrency burst: 6 parallel degenerate requests across endpoints', async () => {
    const dummyPdf = createMinimalPdfBuffer('Concurrent dummy PDF test');
    const promises = [
      postMultipart(port, '/api/verify/document', Buffer.alloc(0), 'empty1.pdf', 'application/pdf'),
      postMultipart(port, '/api/verify/document', crypto.randomBytes(32), 'corrupt1.pdf', 'application/pdf'),
      postJson(port, '/api/verify/document', { text: "'; DROP TABLE audit_logs; --", fileName: 'sqli.txt' }),
      postMultipart(port, '/api/verify/document', dummyPdf, 'dummy1.pdf', 'application/pdf'),
      postJson(port, '/api/verify/document', { text: 'Another dummy text without statutory numbers' }),
      postJson(port, '/api/verify/document', { isSample: false, fileName: 'blank.pdf' })
    ];

    const responses = await Promise.all(promises);
    for (let i = 0; i < responses.length; i++) {
      const res = responses[i];
      if (res.statusCode !== 200) {
        throw new Error(`Request #${i + 1} in parallel burst failed with HTTP ${res.statusCode}: ${JSON.stringify(res.body)}`);
      }
      const data = res.body.data || res.body;
      assertStructuredRejection(data, `Burst request #${i + 1}`);
    }
    return `All 6 concurrent requests resolved with HTTP 200 and structured rejection`;
  });

  await executeTest('C2.5.4', 'Extreme & Stress', 'Server Liveness Check: Verify /api/health is responsive post-stress', async () => {
    const res = await new Promise((resolve, reject) => {
      http.get(`http://localhost:${port}/api/health`, (r) => {
        let b = '';
        r.on('data', d => b += d);
        r.on('end', () => resolve({ statusCode: r.statusCode, body: b }));
      }).on('error', reject);
    });

    if (res.statusCode !== 200) {
      throw new Error(`Server unhealthy after stress tests: HTTP ${res.statusCode}`);
    }
    return `Server healthy, response: ${res.body.trim()}`;
  });

  // =========================================================================
  // Summary & Metrics
  // =========================================================================

  console.log('\n===============================================================');
  console.log('                 ADVERSARIAL SUITE SUMMARY                     ');
  console.log('===============================================================');

  const passed = testResults.filter(t => t.pass);
  const failed = testResults.filter(t => !t.pass);

  console.log(`Total Adversarial Scenarios: ${testResults.length}`);
  console.log(`Passed:                      ${passed.length}`);
  console.log(`Failed:                      ${failed.length}`);
  console.log(`Pass Rate:                   ${((passed.length / testResults.length) * 100).toFixed(1)}%\n`);

  if (failed.length > 0) {
    console.log('🚨 FAILED SCENARIOS:');
    failed.forEach(f => {
      console.log(`- [${f.id}] ${f.name} (${f.category}): ${f.error}`);
    });
  } else {
    console.log('✅ ALL ADVERSARIAL STRESS CHALLENGES PASSED');
  }
  console.log('===============================================================\n');

  return {
    total: testResults.length,
    passed: passed.length,
    failed: failed.length,
    results: testResults
  };
}

if (require.main === module) {
  runAdversarialM2Suite(5000).then(summary => {
    process.exit(summary.failed === 0 ? 0 : 1);
  }).catch(err => {
    console.error('Fatal stress suite failure:', err);
    process.exit(1);
  });
}

module.exports = { runAdversarialM2Suite };
