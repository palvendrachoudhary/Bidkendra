/**
 * Empirical Verification & Stress Test Suite: Milestone 6 Concurrency & Data Integrity
 * Role: Challenger 2 (Empirical Challenger)
 * 
 * Objectives:
 * 1. Test POST /api/verify/document: verify that all 14 statutory checks return non-null
 *    evidence.matchedSnippet, evidence.ruleCriteria, and evidence.documentName.
 * 2. Test concurrency: fire 10 concurrent requests to /api/twilio/call and /api/alerts/timeline.
 * 3. Verify alert_timeline correctly stores and retrieves events across calls.
 */

const http = require('http');
const assert = require('assert');

const PORT = parseInt(process.env.TEST_PORT || process.argv[2] || 5000, 10);
const HOST = 'localhost';

function makeRequest({ path, method = 'GET', headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
    const postData = body ? (typeof body === 'string' ? body : JSON.stringify(body)) : null;
    const reqHeaders = { ...headers };
    if (postData && !reqHeaders['Content-Type']) {
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request({
      hostname: HOST,
      port: PORT,
      path,
      method,
      headers: reqHeaders
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {
          json = data;
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: json,
          raw: data
        });
      });
    });

    req.on('error', reject);
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error(`Request timed out: ${method} ${path}`));
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

const STATUTORY_14_CHECKS = [
  'gst',
  'pan',
  'udyam',
  'makeInIndia',
  'mca',
  'incomeTax',
  'epfo',
  'esic',
  'startup',
  'nsic',
  'oem',
  'blacklist',
  'labourLicense',
  'digilocker'
];

async function runEmpiricalSuite() {
  console.log(`=============================================================`);
  console.log(`🚀 CHALLENGER 2 EMPIRICAL VERIFICATION HARNESS`);
  console.log(`Target: http://${HOST}:${PORT}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`=============================================================\n`);

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;
  const testResults = [];

  async function test(name, fn) {
    totalTests++;
    const start = Date.now();
    try {
      await fn();
      const elapsed = Date.now() - start;
      passedTests++;
      testResults.push({ name, pass: true, elapsed });
      console.log(`  ✅ PASS: ${name} (${elapsed}ms)`);
    } catch (err) {
      const elapsed = Date.now() - start;
      failedTests++;
      testResults.push({ name, pass: false, error: err.message, elapsed });
      console.error(`  ❌ FAIL: ${name} (${elapsed}ms)`);
      console.error(`     Reason: ${err.message}`);
    }
  }

  // =========================================================================
  // SECTION 1: Explainable AI Statutory Evidence Integrity on /api/verify/document
  // =========================================================================
  console.log(`--- [Section 1] Explainable AI Evidence Integrity on /api/verify/document ---`);

  await test('1.1: Verify Document with Sample PDF (All 14 Statutory Checks Non-Null Evidence)', async () => {
    const res = await makeRequest({
      path: '/api/verify/document',
      method: 'POST',
      body: {
        isSample: true,
        fileName: 'CPCL_Pipeline_Technical_Spec_PetroTech.pdf',
        companyName: 'PetroTech India Pvt Ltd'
      }
    });

    assert.strictEqual(res.statusCode, 200, `Expected status 200, got ${res.statusCode}`);
    assert.strictEqual(res.body.success, true, 'Expected success: true');
    const data = res.body.data || res.body;
    assert.ok(data.checksDetail, 'Expected data.checksDetail to exist');

    for (const checkId of STATUTORY_14_CHECKS) {
      const check = data.checksDetail[checkId];
      assert.ok(check, `Check '${checkId}' missing from checksDetail`);
      assert.ok(check.evidence, `Evidence object missing for check '${checkId}'`);
      assert.ok(typeof check.evidence === 'object', `Evidence is not an object for '${checkId}'`);

      // matchedSnippet non-null and string
      assert.ok(check.evidence.matchedSnippet !== null, `'matchedSnippet' is null for '${checkId}'`);
      assert.ok(check.evidence.matchedSnippet !== undefined, `'matchedSnippet' is undefined for '${checkId}'`);
      assert.strictEqual(typeof check.evidence.matchedSnippet, 'string', `'matchedSnippet' is not a string for '${checkId}'`);
      assert.ok(check.evidence.matchedSnippet.length > 0, `'matchedSnippet' is empty for '${checkId}'`);

      // ruleCriteria non-null and string
      assert.ok(check.evidence.ruleCriteria !== null, `'ruleCriteria' is null for '${checkId}'`);
      assert.ok(check.evidence.ruleCriteria !== undefined, `'ruleCriteria' is undefined for '${checkId}'`);
      assert.strictEqual(typeof check.evidence.ruleCriteria, 'string', `'ruleCriteria' is not a string for '${checkId}'`);
      assert.ok(check.evidence.ruleCriteria.length > 0, `'ruleCriteria' is empty for '${checkId}'`);

      // documentName non-null and string
      assert.ok(check.evidence.documentName !== null, `'documentName' is null for '${checkId}'`);
      assert.ok(check.evidence.documentName !== undefined, `'documentName' is undefined for '${checkId}'`);
      assert.strictEqual(typeof check.evidence.documentName, 'string', `'documentName' is not a string for '${checkId}'`);
      assert.ok(check.evidence.documentName.length > 0, `'documentName' is empty for '${checkId}'`);
      assert.strictEqual(check.evidence.documentName, 'CPCL_Pipeline_Technical_Spec_PetroTech.pdf', `DocumentName mismatch for '${checkId}'`);

      // Extra verification on confidence and statutoryReference
      assert.ok(typeof check.evidence.confidence === 'number', `Confidence not a number for '${checkId}'`);
      assert.ok(check.evidence.confidence >= 0 && check.evidence.confidence <= 1, `Confidence out of bounds for '${checkId}'`);
      assert.ok(check.evidence.statutoryReference, `statutoryReference missing for '${checkId}'`);
    }
  });

  await test('1.2: Verify Document with Generic/Non-Compliant Text (Diagnostic Fallbacks Non-Null)', async () => {
    const docName = 'Non_Compliant_Test_Doc.txt';
    const res = await makeRequest({
      path: '/api/verify/document',
      method: 'POST',
      body: {
        text: 'This is a brochure without any statutory numbers or certificates.',
        fileName: docName,
        companyName: 'Adversarial Corp'
      }
    });

    assert.strictEqual(res.statusCode, 200, `Expected status 200, got ${res.statusCode}`);
    const data = res.body.data || res.body;

    for (const checkId of STATUTORY_14_CHECKS) {
      const check = data.checksDetail[checkId];
      assert.ok(check, `Check '${checkId}' missing from checksDetail`);
      assert.ok(check.evidence, `Evidence object missing for check '${checkId}'`);

      assert.ok(check.evidence.matchedSnippet !== null && check.evidence.matchedSnippet !== undefined, `'matchedSnippet' is null/undefined for '${checkId}'`);
      assert.ok(typeof check.evidence.matchedSnippet === 'string' && check.evidence.matchedSnippet.length > 0, `'matchedSnippet' is empty string for '${checkId}'`);
      assert.ok(check.evidence.matchedSnippet.includes(docName), `'matchedSnippet' did not reference document name for '${checkId}'`);

      assert.ok(check.evidence.ruleCriteria !== null && check.evidence.ruleCriteria !== undefined, `'ruleCriteria' is null/undefined for '${checkId}'`);
      assert.ok(typeof check.evidence.ruleCriteria === 'string' && check.evidence.ruleCriteria.length > 0, `'ruleCriteria' is empty string for '${checkId}'`);

      assert.ok(check.evidence.documentName !== null && check.evidence.documentName !== undefined, `'documentName' is null/undefined for '${checkId}'`);
      assert.strictEqual(check.evidence.documentName, docName, `DocumentName mismatch for '${checkId}'`);
    }
  });

  await test('1.3: Verify Document with Completely Empty Text (Zero-Char Fallback Non-Null)', async () => {
    const emptyDocName = 'Empty_ZeroLength.txt';
    const res = await makeRequest({
      path: '/api/verify/document',
      method: 'POST',
      body: {
        text: '',
        fileName: emptyDocName
      }
    });

    assert.strictEqual(res.statusCode, 200, `Expected status 200, got ${res.statusCode}`);
    const data = res.body.data || res.body;

    for (const checkId of STATUTORY_14_CHECKS) {
      const check = data.checksDetail[checkId];
      assert.ok(check.evidence, `Evidence missing for '${checkId}'`);
      assert.ok(check.evidence.matchedSnippet !== null && check.evidence.matchedSnippet !== undefined);
      assert.ok(typeof check.evidence.matchedSnippet === 'string' && check.evidence.matchedSnippet.length > 0);
      assert.ok(check.evidence.ruleCriteria !== null && check.evidence.ruleCriteria !== undefined);
      assert.ok(check.evidence.documentName !== null && check.evidence.documentName !== undefined);
    }
  });

  await test('1.4: Verify Document with Partial Target Matches', async () => {
    const res = await makeRequest({
      path: '/api/verify/document',
      method: 'POST',
      body: {
        text: 'PAN Number: AABCP1234F is registered. Udyam: UDYAM-TN-02-0045812. No other credentials.',
        fileName: 'Partial_Credentials.txt'
      }
    });

    assert.strictEqual(res.statusCode, 200);
    const data = res.body.data || res.body;

    // Check that matched items actually have excerpt around the value
    const panCheck = data.checksDetail.pan;
    assert.ok(panCheck.evidence.matchedSnippet.includes('AABCP1234F'), 'PAN snippet should include matched value');
    assert.strictEqual(panCheck.evidence.documentName, 'Partial_Credentials.txt');

    const udyamCheck = data.checksDetail.udyam;
    assert.ok(udyamCheck.evidence.matchedSnippet.toLowerCase().includes('udyam'), 'Udyam snippet should contain udyam text');

    // And missing items also have non-null diagnostics
    const gstCheck = data.checksDetail.gst;
    assert.ok(gstCheck.evidence.matchedSnippet !== null && gstCheck.evidence.matchedSnippet.length > 0);
    assert.ok(gstCheck.evidence.ruleCriteria !== null && gstCheck.evidence.ruleCriteria.length > 0);
    assert.ok(gstCheck.evidence.documentName !== null && gstCheck.evidence.documentName.length > 0);
  });

  // =========================================================================
  // SECTION 2: Concurrency Stress-Testing (10 Concurrent Calls)
  // =========================================================================
  console.log(`\n--- [Section 2] Concurrency Stress-Testing (10 Concurrent Calls) ---`);

  await test('2.1: 10 Concurrent Requests to POST /api/twilio/call', async () => {
    const timestamp = Date.now();
    const concurrentRequests = Array.from({ length: 10 }, (_, i) => {
      const idx = i + 1;
      return makeRequest({
        path: '/api/twilio/call',
        method: 'POST',
        body: {
          phoneNumber: `+9198765432${idx.toString().padStart(2, '0')}`,
          vendorName: `Concurrent_Test_Vendor_${timestamp}_${idx}`,
          vendorEmail: `concurrent_${timestamp}_${idx}@example.com`,
          missingDocuments: [`Missing Doc Alpha ${idx}`, `Missing Doc Beta ${idx}`],
          tenderNumber: `CPCL-2026-CONCUR-${idx}`
        }
      });
    });

    const results = await Promise.all(concurrentRequests);
    assert.strictEqual(results.length, 10, 'Expected exactly 10 responses');

    const callSids = new Set();
    for (let i = 0; i < results.length; i++) {
      const res = results[i];
      assert.strictEqual(res.statusCode, 200, `Concurrent Twilio call #${i + 1} returned status ${res.statusCode}`);
      assert.strictEqual(res.body.success, true, `Concurrent Twilio call #${i + 1} success is not true`);
      assert.ok(res.body.callSid, `Concurrent Twilio call #${i + 1} missing callSid`);
      assert.ok(res.body.status, `Concurrent Twilio call #${i + 1} missing status`);
      callSids.add(res.body.callSid);
    }

    console.log(`     10 concurrent voice calls executed. Status: 200 for all 10. Unique CallSids: ${callSids.size}/10`);

    // Verify all 10 events were recorded in alert_timeline
    const timelineRes = await makeRequest({
      path: `/api/alerts/timeline?vendor_name=Concurrent_Test_Vendor_${timestamp}&limit=20`,
      method: 'GET'
    });

    assert.strictEqual(timelineRes.statusCode, 200);
    assert.strictEqual(timelineRes.body.success, true);
    assert.strictEqual(timelineRes.body.alerts.length, 10, `Expected 10 logged alerts in timeline for Concurrent_Test_Vendor_${timestamp}, got ${timelineRes.body.alerts.length}`);
  });

  await test('2.2: 10 Concurrent Requests to GET /api/alerts/timeline', async () => {
    const concurrentGets = Array.from({ length: 10 }, (_, i) => {
      return makeRequest({
        path: `/api/alerts/timeline?limit=15`,
        method: 'GET'
      });
    });

    const results = await Promise.all(concurrentGets);
    assert.strictEqual(results.length, 10, 'Expected 10 GET responses');

    const expectedCount = results[0].body.count;
    for (let i = 0; i < results.length; i++) {
      const res = results[i];
      assert.strictEqual(res.statusCode, 200, `GET timeline #${i + 1} status was ${res.statusCode}`);
      assert.strictEqual(res.body.success, true, `GET timeline #${i + 1} success was not true`);
      assert.ok(Array.isArray(res.body.alerts), `GET timeline #${i + 1} alerts not an array`);
      assert.strictEqual(res.body.count, expectedCount, `GET timeline #${i + 1} count mismatch: ${res.body.count} vs ${expectedCount}`);
    }
  });

  await test('2.3: 10 Mixed Concurrent Read/Write Operations on alert_timeline', async () => {
    const runId = Date.now();
    const operations = [];

    // 5 writes
    for (let i = 1; i <= 5; i++) {
      operations.push(
        makeRequest({
          path: '/api/alerts/timeline',
          method: 'POST',
          body: {
            vendor_name: `Mixed_Concurrency_Vendor_${runId}`,
            vendor_email: `mixed_${i}@test.com`,
            alert_type: 'CONCURRENT_TEST',
            severity: 'INFO',
            title: `Mixed Concurrency Test Event ${i}`,
            message: `Event body ${i}`,
            flagged_items: [`Defect ${i}`]
          }
        })
      );
    }

    // 5 reads
    for (let i = 1; i <= 5; i++) {
      operations.push(
        makeRequest({
          path: '/api/alerts/timeline?limit=5',
          method: 'GET'
        })
      );
    }

    const results = await Promise.all(operations);
    assert.strictEqual(results.length, 10);

    const writeResults = results.slice(0, 5);
    const readResults = results.slice(5, 10);

    for (let i = 0; i < 5; i++) {
      assert.strictEqual(writeResults[i].statusCode, 201, `Write #${i + 1} status was ${writeResults[i].statusCode}`);
      assert.strictEqual(writeResults[i].body.success, true);
      assert.ok(writeResults[i].body.alertId);
    }

    for (let i = 0; i < 5; i++) {
      assert.strictEqual(readResults[i].statusCode, 200, `Read #${i + 1} status was ${readResults[i].statusCode}`);
      assert.strictEqual(readResults[i].body.success, true);
    }

    // Verify all 5 written events are retrievable
    const verifyRes = await makeRequest({
      path: `/api/alerts/timeline?vendor_name=Mixed_Concurrency_Vendor_${runId}&limit=10`,
      method: 'GET'
    });
    assert.strictEqual(verifyRes.body.alerts.length, 5, `Expected 5 stored records, got ${verifyRes.body.alerts.length}`);
  });

  // =========================================================================
  // SECTION 3: alert_timeline Storage & Retrieval Integrity Across Calls
  // =========================================================================
  console.log(`\n--- [Section 3] alert_timeline Storage & Retrieval Across Calls ---`);

  await test('3.1: Store and Retrieve Custom Alert with Exact Field Integrity', async () => {
    const testVendor = `Integrity_Vendor_${Date.now()}`;
    const postPayload = {
      vendor_name: testVendor,
      vendor_email: 'compliance_audit@vendor.co.in',
      phone_number: '+919123456780',
      bidder_id: 'b-custom-999',
      alert_type: 'CUSTOM_AUDIT_NOTICE',
      severity: 'CRITICAL',
      title: 'Statutory Blacklisting Warning Notice',
      message: 'Debarment affidavit missing in CPCL-2026-T1001 submission envelope.',
      flagged_items: ['Mandatory Non-Debarment Affidavit GFR 151', 'Class-3 DSC Signature'],
      status: 'DELIVERED',
      delivery_mode: 'live'
    };

    const postRes = await makeRequest({
      path: '/api/alerts/timeline',
      method: 'POST',
      body: postPayload
    });

    assert.strictEqual(postRes.statusCode, 201, `Expected status 201, got ${postRes.statusCode}`);
    assert.strictEqual(postRes.body.success, true);
    assert.ok(postRes.body.alertId);
    const createdAlertId = postRes.body.alertId;

    // Retrieve by vendor name
    const getRes = await makeRequest({
      path: `/api/alerts/timeline?vendor_name=${encodeURIComponent(testVendor)}`,
      method: 'GET'
    });

    assert.strictEqual(getRes.statusCode, 200);
    assert.strictEqual(getRes.body.success, true);
    assert.strictEqual(getRes.body.count, 1, `Expected 1 alert found, got ${getRes.body.count}`);

    const retrieved = getRes.body.alerts[0];
    assert.strictEqual(retrieved.id, createdAlertId, 'Alert ID mismatch');
    assert.strictEqual(retrieved.vendor_name, testVendor, 'Vendor name mismatch');
    assert.strictEqual(retrieved.vendor_email, postPayload.vendor_email, 'Vendor email mismatch');
    assert.strictEqual(retrieved.phone_number, postPayload.phone_number, 'Phone number mismatch');
    assert.strictEqual(retrieved.bidder_id, postPayload.bidder_id, 'Bidder ID mismatch');
    assert.strictEqual(retrieved.alert_type, postPayload.alert_type, 'Alert type mismatch');
    assert.strictEqual(retrieved.severity, postPayload.severity, 'Severity mismatch');
    assert.strictEqual(retrieved.title, postPayload.title, 'Title mismatch');
    assert.strictEqual(retrieved.message, postPayload.message, 'Message mismatch');
    assert.deepStrictEqual(retrieved.flagged_items, postPayload.flagged_items, 'Flagged items mismatch');
    assert.strictEqual(retrieved.status, postPayload.status, 'Status mismatch');
    assert.strictEqual(retrieved.delivery_mode, postPayload.delivery_mode, 'Delivery mode mismatch');
    assert.ok(retrieved.created_at, 'created_at timestamp is missing');
  });

  await test('3.2: Store Curing Alert via /api/alerts/curing and Retrieve from Timeline', async () => {
    const curingVendor = `Curing_Target_${Date.now()}`;
    const curingPayload = {
      vendor_name: curingVendor,
      vendor_email: 'curing@target.in',
      phone_number: '+919988776655',
      bidder_id: 'b-cure-100',
      flagged_items: ['GSTIN Return Missing', 'OEM MAF Incomplete'],
      severity: 'CRITICAL',
      title: `Active Curing: ${curingVendor}`,
      message: 'Rectify statutory documents within 48h.',
      tender_number: 'CPCL-2026-T1001'
    };

    const cureRes = await makeRequest({
      path: '/api/alerts/curing',
      method: 'POST',
      body: curingPayload
    });

    assert.strictEqual(cureRes.statusCode, 200);
    assert.strictEqual(cureRes.body.success, true);
    assert.ok(cureRes.body.alertId);
    assert.ok(cureRes.body.deliveryMode);

    const checkRes = await makeRequest({
      path: `/api/alerts/timeline?vendor_name=${encodeURIComponent(curingVendor)}`,
      method: 'GET'
    });

    assert.strictEqual(checkRes.statusCode, 200);
    assert.strictEqual(checkRes.body.alerts.length, 1);
    const item = checkRes.body.alerts[0];
    assert.strictEqual(item.id, cureRes.body.alertId);
    assert.strictEqual(item.vendor_name, curingVendor);
    assert.strictEqual(item.alert_type, 'WEBHOOK_CURING');
    assert.deepStrictEqual(item.flagged_items, curingPayload.flagged_items);
  });

  await test('3.3: Ordering and Limit Integrity on /api/alerts/timeline across Distinct Timestamps', async () => {
    const batchVendor = `Batch_Order_${Date.now()}`;
    // Insert 3 sequential alerts with delay to span distinct second boundaries
    for (let i = 1; i <= 3; i++) {
      await makeRequest({
        path: '/api/alerts/timeline',
        method: 'POST',
        body: {
          vendor_name: batchVendor,
          title: `Sequential Event ${i}`,
          message: `Sequence ${i}`,
          alert_type: 'ORDER_CHECK',
          flagged_items: [`Seq-${i}`]
        }
      });
      if (i < 3) {
        await new Promise(r => setTimeout(r, 1100)); // 1.1s delay for SQLite second-resolution created_at
      }
    }

    // Limit query to 2
    const limitedRes = await makeRequest({
      path: `/api/alerts/timeline?vendor_name=${encodeURIComponent(batchVendor)}&limit=2`,
      method: 'GET'
    });

    assert.strictEqual(limitedRes.statusCode, 200);
    assert.strictEqual(limitedRes.body.alerts.length, 2, 'Limit 2 not respected');

    // Retrieve all 3 and verify ordering
    const allRes = await makeRequest({
      path: `/api/alerts/timeline?vendor_name=${encodeURIComponent(batchVendor)}&limit=10`,
      method: 'GET'
    });

    assert.strictEqual(allRes.body.alerts.length, 3, 'Expected 3 records total');
    // Descending order check: newest should be first
    const titles = allRes.body.alerts.map(a => a.title);
    assert.deepStrictEqual(titles, ['Sequential Event 3', 'Sequential Event 2', 'Sequential Event 1'], 'Order not descending by created_at across distinct seconds');
  });

  await test('3.4: Sub-Second Burst Behavior on /api/alerts/timeline (Documenting 1-Second Resolution Caveat)', async () => {
    const burstVendor = `Burst_Order_${Date.now()}`;
    // Fire 3 inserts in immediate succession (< 50ms)
    for (let i = 1; i <= 3; i++) {
      await makeRequest({
        path: '/api/alerts/timeline',
        method: 'POST',
        body: {
          vendor_name: burstVendor,
          title: `Burst Event ${i}`,
          message: `Burst ${i}`,
          alert_type: 'BURST_CHECK',
          flagged_items: [`Burst-${i}`]
        }
      });
    }

    const burstRes = await makeRequest({
      path: `/api/alerts/timeline?vendor_name=${encodeURIComponent(burstVendor)}&limit=10`,
      method: 'GET'
    });

    assert.strictEqual(burstRes.body.alerts.length, 3, 'All 3 burst alerts must be persisted');
    // Note: Because SQLite datetime('now') has 1s resolution, timestamps are equal.
    const timestamps = burstRes.body.alerts.map(a => a.created_at);
    assert.strictEqual(timestamps[0], timestamps[1], 'Burst timestamps should share the same second');
    console.log(`     Observed: All 3 burst events stored with identical timestamp (${timestamps[0]}).`);
  });

  // =========================================================================
  // SUMMARY
  // =========================================================================
  console.log(`\n=============================================================`);
  console.log(`📊 TEST RESULTS SUMMARY`);
  console.log(`Total Tests Run: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${failedTests}`);
  console.log(`Status: ${failedTests === 0 ? '🎉 ALL EMPIRICAL CHECKS PASSED' : '❌ SOME TESTS FAILED'}`);
  console.log(`=============================================================\n`);

  return failedTests === 0;
}

if (require.main === module) {
  runEmpiricalSuite()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(err => {
      console.error('Fatal suite execution error:', err);
      process.exit(1);
    });
}

module.exports = { runEmpiricalSuite };
