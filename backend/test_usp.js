/**
 * Comprehensive USP Features & Backend Verification Test
 * Tests Features 20, 21, 22, 23, 24
 */

const http = require('http');

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, headers: res.headers, body: parsed, raw: body });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, body, raw: body });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (postData) {
      const dataStr = typeof postData === 'string' ? postData : JSON.stringify(postData);
      req.setHeader('Content-Type', 'application/json');
      req.setHeader('Content-Length', Buffer.byteLength(dataStr));
      req.write(dataStr);
    }
    req.end();
  });
}

async function runTests(port = 5000) {
  console.log(`\n========================================`);
  console.log(`🧪 Running BidVerify AI USP Endpoints Test against Port ${port}`);
  console.log(`========================================\n`);

  let allPassed = true;
  const results = [];

  function record(name, passed, detail) {
    if (!passed) allPassed = false;
    results.push({ name, passed, detail });
    console.log(`${passed ? '✅ PASS' : '❌ FAIL'}: ${name} - ${detail}`);
  }

  // 1. Health Check
  try {
    const res = await makeRequest({ host: 'localhost', port, path: '/api/health', method: 'GET' });
    record('Health Check', res.status === 200 && res.body.success, `Status: ${res.status}, msg: ${res.body.message}`);
  } catch (e) {
    record('Health Check', false, e.message);
  }

  // 2. Twilio Status
  try {
    const res = await makeRequest({ host: 'localhost', port, path: '/api/twilio/status', method: 'GET' });
    record('Twilio Status API', res.status === 200 && res.body.success, `Mode: ${res.body.mode}, Loaded: ${res.body.twilioLoaded}`);
  } catch (e) {
    record('Twilio Status API', false, e.message);
  }

  // 3. Feature 20: Twilio Call API (/api/twilio/call)
  try {
    const res = await makeRequest({
      host: 'localhost',
      port,
      path: '/api/twilio/call',
      method: 'POST'
    }, {
      phoneNumber: '+919876543210',
      vendorName: 'PetroTech India Pvt Ltd',
      missingDocuments: ['Statutory GSTIN Verification', 'Class-I Local Content Certificate'],
      tenderNumber: 'CPCL-2026-T1001'
    });
    const valid = res.status === 200 && res.body.success && res.body.callSid && res.body.details && res.body.details.twiml.includes('Say');
    record('Feature 20: Twilio Voice Call (/api/twilio/call)', valid, `Mode: ${res.body.mode}, SID: ${res.body.callSid}, Status: ${res.body.status}`);
  } catch (e) {
    record('Feature 20: Twilio Voice Call (/api/twilio/call)', false, e.message);
  }

  // 4. Feature 20 Alias: Voice Call API (/api/voice/call)
  try {
    const res = await makeRequest({
      host: 'localhost',
      port,
      path: '/api/voice/call',
      method: 'POST'
    }, {
      phoneNumber: '+919876543211',
      vendorName: 'Global Energy Traders',
      missingDocuments: ['Make in India Local Content Declaration (>=50%)']
    });
    const valid = res.status === 200 && res.body.success && res.body.callSid;
    record('Feature 20 Alias: Voice Call (/api/voice/call)', valid, `Mode: ${res.body.mode}, SID: ${res.body.callSid}`);
  } catch (e) {
    record('Feature 20 Alias: Voice Call (/api/voice/call)', false, e.message);
  }

  // 5. Feature 21: Alert Timeline Query (/api/alerts/timeline)
  try {
    const res = await makeRequest({ host: 'localhost', port, path: '/api/alerts/timeline', method: 'GET' });
    const valid = res.status === 200 && res.body.success && Array.isArray(res.body.alerts) && res.body.alerts.length >= 3;
    record('Feature 21: Alert Timeline Query (/api/alerts/timeline)', valid, `Found ${res.body.count || 0} alert entries in timeline`);
  } catch (e) {
    record('Feature 21: Alert Timeline Query (/api/alerts/timeline)', false, e.message);
  }

  // 6. Feature 21: Alert Timeline Filtered Query (?vendor_name=...)
  try {
    const res = await makeRequest({ host: 'localhost', port, path: '/api/alerts/timeline?vendor_name=PetroTech', method: 'GET' });
    const valid = res.status === 200 && res.body.success && res.body.alerts.length > 0;
    record('Feature 21: Alert Timeline Filter by Vendor', valid, `Found ${res.body.alerts.length} alerts for PetroTech`);
  } catch (e) {
    record('Feature 21: Alert Timeline Filter by Vendor', false, e.message);
  }

  // 7. Feature 21: Manual Active Bid Curing Trigger (/api/alerts/curing)
  try {
    const res = await makeRequest({
      host: 'localhost',
      port,
      path: '/api/alerts/curing',
      method: 'POST'
    }, {
      vendor_name: 'Apex Industrial Valves',
      vendor_email: 'amit@apexvalves.in',
      phone_number: '+919876543212',
      flagged_items: ['ISO 9001:2015 Recertification', 'Statutory GSTIN'],
      severity: 'CRITICAL',
      title: 'Manual Active Bid Curing Trigger',
      message: 'Please update GST certificate within 48h'
    });
    const valid = res.status === 200 && res.body.success && res.body.alertId;
    record('Feature 21: Manual Active Bid Curing Trigger (/api/alerts/curing)', valid, `Alert ID: ${res.body.alertId}, Delivery: ${res.body.deliveryMode}`);
  } catch (e) {
    record('Feature 21: Manual Active Bid Curing Trigger (/api/alerts/curing)', false, e.message);
  }

  // 8. Feature 22 & 21: Explainable AI Evidence Enrichment & Auto Curing on Document Verification
  try {
    const res = await makeRequest({
      host: 'localhost',
      port,
      path: '/api/verify/document',
      method: 'POST'
    }, {
      isSample: true,
      fileName: 'CPCL_Pipeline_Technical_Spec_PetroTech.pdf',
      companyName: 'PetroTech India Pvt Ltd'
    });

    const data = res.body?.data || res.body || {};
    const checks = data?.checksDetail || {};
    const checkCount = Object.keys(checks).length;
    let enrichedCount = 0;
    let snippetCount = 0;

    for (const [id, c] of Object.entries(checks)) {
      if (c.evidence && c.evidence.ruleCriteria && c.evidence.statutoryReference && c.evidence.confidence !== undefined) {
        enrichedCount++;
      }
      if (c.evidence && c.evidence.matchedSnippet) {
        snippetCount++;
      }
    }

    const validEnrichment = checkCount === 14 && enrichedCount === 14 && snippetCount === 14;
    record(
      'Feature 22: Explainable AI Evidence Enrichment',
      validEnrichment,
      `All ${enrichedCount}/14 checks enriched with statutory rules, matched snippets, and confidence scores`
    );
  } catch (e) {
    record('Feature 22: Explainable AI Evidence Enrichment', false, e.message);
  }

  // 9. Feature 21 Auto-Trigger: Active Bid Curing Dispatched on Mandatory Gate Failure
  try {
    const res = await makeRequest({
      host: 'localhost',
      port,
      path: '/api/verify/document',
      method: 'POST'
    }, {
      text: 'Generic vendor technical presentation. No GSTIN, no PAN, no Udyam numbers.',
      fileName: 'Non_Compliant_Document.txt',
      companyName: 'NonCompliant Bidders Corp',
      vendorEmail: 'defects@noncompliant.com'
    });

    const data = res.body?.data || res.body || {};
    const hasFailure = data?.hasMandatoryFailure === true;
    const curingAuto = data?.curingAlert && data.curingAlert.dispatched === true;
    record(
      'Feature 21: Active Bid Curing Auto-Trigger on Scan Failure',
      hasFailure && curingAuto,
      `Mandatory Failure: ${hasFailure}, Curing Alert Dispatched: ${curingAuto}, Items: ${(data?.curingAlert?.flaggedItems || []).length}`
    );
  } catch (e) {
    record('Feature 21: Active Bid Curing Auto-Trigger on Scan Failure', false, e.message);
  }

  // 10. Feature 23: Vendor Portal Open Tenders (/api/vendor/tenders)
  try {
    const res = await makeRequest({ host: 'localhost', port, path: '/api/vendor/tenders', method: 'GET' });
    const valid = res.status === 200 && res.body.success && Array.isArray(res.body.tenders) && res.body.tenders.length >= 3;
    record('Feature 23: Vendor Portal Open Tenders (/api/vendor/tenders)', valid, `Found ${res.body.count} active tenders`);
  } catch (e) {
    record('Feature 23: Vendor Portal Open Tenders (/api/vendor/tenders)', false, e.message);
  }

  // 11. Feature 23: Vendor Portal Pre-Screening Verification with Matching Credentials
  try {
    const res = await makeRequest({
      host: 'localhost',
      port,
      path: '/api/vendor/verify',
      method: 'POST'
    }, {
      companyName: 'PetroTech India Pvt Ltd',
      gstin: '33AABCP1234F1Z5',
      pan: 'AABCP1234F',
      udyam: 'UDYAM-TN-02-0045812',
      email: 'ramesh@petrotech.in',
      phone: '+919876543210'
    });

    const valid = res.status === 200 &&
      res.body.success &&
      res.body.crossValidation &&
      res.body.crossValidation.passed === true &&
      res.body.crossValidation.gstinMatch === true &&
      res.body.crossValidation.panMatch === true &&
      res.body.crossValidation.udyamMatch === true &&
      Array.isArray(res.body.curingGuidance);

    record(
      'Feature 23: Vendor Pre-Screening Cross-Validation (Match)',
      valid,
      `Score: ${res.body.overallScore}%, Cross-Validation Passed: ${res.body?.crossValidation?.passed}`
    );
  } catch (e) {
    record('Feature 23: Vendor Pre-Screening Cross-Validation (Match)', false, e.message);
  }

  // 12. Feature 23: Vendor Portal Pre-Screening with Discrepancy Detection & Remediation Guidance
  try {
    const res = await makeRequest({
      host: 'localhost',
      port,
      path: '/api/vendor/verify',
      method: 'POST'
    }, {
      companyName: 'PetroTech India Pvt Ltd',
      text: 'CIN: U23201TN2018PTC123456 GSTIN: 33AABCP1234F1Z5 PAN: AABCP1234F Udyam: UDYAM-TN-02-0045812 Local Content: 72.4%',
      gstin: '24KLMNO9012P1Z8',       // Form mismatch vs 33AABCP1234F1Z5
      pan: 'KLMNO9012P',              // Form mismatch vs AABCP1234F
      udyam: 'UDYAM-GJ-03-1112233'     // Form mismatch vs UDYAM-TN-02-0045812
    });

    const hasDiscrepancies = res.body &&
      res.body.crossValidation &&
      res.body.crossValidation.passed === false &&
      res.body.crossValidation.discrepancies.length >= 3;

    const hasCuringGuidance = res.body &&
      Array.isArray(res.body.curingGuidance) &&
      res.body.curingGuidance.some(g => g.type === 'DISCREPANCY');

    record(
      'Feature 23: Discrepancy Detection & Remediation Guidance',
      hasDiscrepancies && hasCuringGuidance,
      `Detected ${res.body?.crossValidation?.discrepancies?.length} discrepancies, ${res.body?.curingGuidance?.length} curing guidance items`
    );
  } catch (e) {
    record('Feature 23: Discrepancy Detection & Remediation Guidance', false, e.message);
  }

  // 13. Feature 23: Vendor Alerts API (/api/vendor/alerts)
  try {
    const res = await makeRequest({ host: 'localhost', port, path: '/api/vendor/alerts?vendorName=PetroTech', method: 'GET' });
    const valid = res.status === 200 && res.body.success && Array.isArray(res.body.alerts);
    record('Feature 23: Vendor Alerts (/api/vendor/alerts)', valid, `Returned ${res.body.count} alerts for vendor`);
  } catch (e) {
    record('Feature 23: Vendor Alerts (/api/vendor/alerts)', false, e.message);
  }

  // 14. Feature 23: Vendor Profile Save (/api/vendor/profile)
  try {
    const res = await makeRequest({
      host: 'localhost',
      port,
      path: '/api/vendor/profile',
      method: 'POST'
    }, {
      companyName: 'New Horizon Engineering Ltd',
      gstin: '07AAACH1234F1Z1',
      pan: 'AAACH1234F',
      udyam: 'UDYAM-DL-01-9999999',
      email: 'info@newhorizon.in',
      phone: '9876543219'
    });
    const valid = res.status === 200 && res.body.success && res.body.vendor && res.body.vendor.id;
    record('Feature 23: Vendor Profile Save (/api/vendor/profile)', valid, `Vendor ID: ${res.body?.vendor?.id}`);
  } catch (e) {
    record('Feature 23: Vendor Profile Save (/api/vendor/profile)', false, e.message);
  }

  console.log(`\n========================================`);
  console.log(`Summary: ${results.filter(r => r.passed).length} / ${results.length} tests PASSED`);
  console.log(`Overall Result: ${allPassed ? '🎉 ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  console.log(`========================================\n`);

  return allPassed;
}

if (require.main === module) {
  // If run directly, run tests against port 5000 (or first arg)
  const targetPort = parseInt(process.argv[2], 10) || 5000;
  runTests(targetPort).then(ok => {
    process.exit(ok ? 0 : 1);
  }).catch(err => {
    console.error('Fatal error running tests:', err);
    process.exit(1);
  });
}

module.exports = { runTests };
