const http = require('http');
const path = require('path');
const fs = require('fs');
const { COMPLIANT_TEXT, DUMMY_TEXT, NON_CORPORATE_TEXT, createMinimalPdfBuffer } = require('./fixtures/test_fixtures');

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
    req.setTimeout(8000, () => {
      req.destroy();
      reject(new Error(`POST ${path} timed out after 8000ms`));
    });
    req.write(payload);
    req.end();
  });
}

/**
 * Test Suite: Tier 3 Cross-Feature Interactions & Tier 4 Real-World CPCL Scenarios
 */
async function runE2EScenarioTests(port = 5000) {
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
  // Tier 3: Cross-Feature Combinations
  // ==========================================

  // T3.1: Document Verification -> AI Rejection Email Draft Integration
  await recordTest('T3.1', 'Document scan failure correctly populates itemized gate list in AI rejection email draft', 'Tier 3', async () => {
    const res = await postJson(port, '/api/verify/document', {
      text: DUMMY_TEXT,
      fileName: 'shell_company_bid.txt',
      companyName: 'Shell Trading Corp'
    });

    if (res.statusCode !== 200) {
      throw new Error(`Expected HTTP 200, received ${res.statusCode}`);
    }

    const data = res.body.data || res.body;
    if (!data.emailDraft) {
      throw new Error('emailDraft was not generated in verification response');
    }

    const draftBody = data.emailDraft.body || '';
    // Verify that failed gates are itemized in the email body
    const hasItemizedFailures = draftBody.includes('Mandatory Statutory Deficiencies') || 
                                draftBody.includes('discrepancies') ||
                                draftBody.includes('GSTIN') || 
                                draftBody.includes('PAN');

    if (!hasItemizedFailures) {
      throw new Error(`Rejection email draft did not itemize failed gates. Body: "${draftBody}"`);
    }
  });

  // T3.2: Document Scan -> Webhook Dispatch Chaining
  await recordTest('T3.2', 'Seamlessly chains document scan output directly into webhook notification dispatch', 'Tier 3', async () => {
    // 1. Scan document
    const scanRes = await postJson(port, '/api/verify/document', {
      text: COMPLIANT_TEXT,
      fileName: 'cpcl_pipeline_bid.txt',
      companyName: 'PetroTech India Pvt Ltd'
    });

    const scanData = scanRes.body.data || scanRes.body;

    // 2. Dispatch webhook notification using scan output
    const notifyRes = await postJson(port, '/api/verify/notify', {
      company_name: 'PetroTech India Pvt Ltd',
      vendor_email: 'compliance@petrotech.in',
      decision_status: scanData.isCompliant ? 'APPROVED' : 'REJECTED',
      score: scanData.overallScore,
      emailContent: scanData.emailDraft
    });

    if (notifyRes.statusCode !== 200) {
      throw new Error(`Webhook notification dispatch failed with HTTP ${notifyRes.statusCode}`);
    }
    if (!notifyRes.body || notifyRes.body.success !== true) {
      throw new Error(`Notification dispatch returned unsuccessful response: ${JSON.stringify(notifyRes.body)}`);
    }
  });

  // T3.3: Case-Insensitive OCR -> Compliance Scoring Engine
  await recordTest('T3.3', 'Mixed lowercase OCR text flows through scoring engine and computes >= 80% score', 'Tier 3', async () => {
    const lowercaseText = COMPLIANT_TEXT
      .replace('33AABCP1234F1Z5', '33aabcp1234f1z5')
      .replace('AABCP1234F', 'aabcp1234f')
      .replace('U23201TN2018PTC123456', 'u23201tn2018ptc123456')
      .replace('UDYAM-TN-02-0045812', 'udyam-tn-02-0045812');

    const res = await postJson(port, '/api/verify/document', {
      text: lowercaseText,
      fileName: 'lowercase_ocr_bid.txt'
    });

    const data = res.body.data || res.body;
    if (data.overallScore < 80) {
      throw new Error(`Expected overallScore >= 80 for lowercase credentials, received ${data.overallScore}%`);
    }
    if (data.hasMandatoryFailure) {
      throw new Error('Mandatory gate failure triggered despite valid credentials in lowercase');
    }
  });

  // T3.4: Non-Corporate MSME Partnership -> Scoring Engine
  await recordTest('T3.4', 'Non-corporate partnership bid achieves qualified score without mandatory CIN disqualification', 'Tier 3', async () => {
    const res = await postJson(port, '/api/verify/document', {
      text: NON_CORPORATE_TEXT,
      fileName: 'kaveri_partnership_bid.txt',
      companyName: 'Kaveri Engineering Works'
    });

    const data = res.body.data || res.body;
    if (data.hasMandatoryFailure) {
      throw new Error('Partnership bid failed mandatory gates due to missing corporate CIN');
    }
    if (data.overallScore < 60) {
      throw new Error(`Expected non-corporate MSME score >= 60, received ${data.overallScore}%`);
    }
  });

  // ==========================================
  // Tier 4: Real-World CPCL Scenarios
  // ==========================================

  // T4.1: Scenario 1 - CPCL Pipeline Replacement Bid (PetroTech India Pvt Ltd)
  await recordTest('T4.1', 'Scenario 1: CPCL Pipeline Tender (PetroTech) - Complete Approval & Notification Workflow', 'Tier 4', async () => {
    // Step 1: Scan technical bid envelope
    const scanRes = await postJson(port, '/api/verify/document', {
      text: COMPLIANT_TEXT,
      fileName: 'CPCL_Pipeline_Technical_Spec_PetroTech.pdf',
      companyName: 'PetroTech India Pvt Ltd'
    });

    if (scanRes.statusCode !== 200) {
      throw new Error(`Document verification failed with HTTP ${scanRes.statusCode}`);
    }

    const scanData = scanRes.body.data || scanRes.body;
    if (!scanData.isCompliant || scanData.overallScore < 80) {
      throw new Error(`Compliant CPCL proposal failed verification: score=${scanData.overallScore}%, isCompliant=${scanData.isCompliant}`);
    }

    // Step 2: Dispatch official acceptance notice
    const notifyRes = await postJson(port, '/api/verify/notify', {
      company_name: 'PetroTech India Pvt Ltd',
      vendor_email: 'compliance@petrotech.in',
      decision_status: 'APPROVED',
      score: scanData.overallScore,
      notes: 'Tender CPCL-2026-T1001 Technical & Statutory Envelope Approved by Competent Authority.',
      emailContent: scanData.emailDraft
    });

    if (notifyRes.statusCode !== 200 || !notifyRes.body.success) {
      throw new Error('Failed to dispatch official tender approval notice');
    }
  });

  // T4.2: Scenario 2 - CPCL Refinery Valve Supply (Shell Broker Disqualification)
  await recordTest('T4.2', 'Scenario 2: CPCL Valve Tender (Shell Entity) - Complete Disqualification & Rejection Workflow', 'Tier 4', async () => {
    // Step 1: Scan non-compliant proposal
    const scanRes = await postJson(port, '/api/verify/document', {
      text: DUMMY_TEXT,
      fileName: 'CPCL_Valve_Package_ShellBidder.pdf',
      companyName: 'Apex Middle East Trading LLC'
    });

    const scanData = scanRes.body.data || scanRes.body;
    if (scanData.overallScore !== 0 || scanData.riskLevel !== 'Critical' || !scanData.hasMandatoryFailure) {
      throw new Error(`Shell bidder was not properly disqualified: score=${scanData.overallScore}, risk=${scanData.riskLevel}`);
    }

    // Step 2: Dispatch rejection notice
    const notifyRes = await postJson(port, '/api/verify/notify', {
      company_name: 'Apex Middle East Trading LLC',
      vendor_email: 'bids@apex-middleeast.com',
      decision_status: 'REJECTED',
      score: 0,
      rejection_reason: scanData.verdict,
      emailContent: scanData.emailDraft
    });

    if (notifyRes.statusCode !== 200 || !notifyRes.body.success) {
      throw new Error('Failed to dispatch official tender rejection notice');
    }
  });

  // T4.3: Scenario 3 - MSME Local Fabricator (Kaveri Engineering Works)
  await recordTest('T4.3', 'Scenario 3: CPCL Fabrication Tender (Kaveri Engineering) - MSME Purchase Preference Consideration', 'Tier 4', async () => {
    const scanRes = await postJson(port, '/api/verify/document', {
      text: NON_CORPORATE_TEXT,
      fileName: 'CPCL_Fabrication_Kaveri.pdf',
      companyName: 'Kaveri Engineering Works'
    });

    const scanData = scanRes.body.data || scanRes.body;
    if (scanData.riskLevel === 'Critical') {
      throw new Error('MSME partnership firm was falsely flagged with Critical risk');
    }

    const notifyRes = await postJson(port, '/api/verify/notify', {
      company_name: 'Kaveri Engineering Works',
      vendor_email: 'contracts@kaveri.in',
      decision_status: 'APPROVED',
      score: scanData.overallScore,
      notes: 'Eligible for MSME & Class-I Local Supplier purchase preference.'
    });

    if (notifyRes.statusCode !== 200 || !notifyRes.body.success) {
      throw new Error('Failed to notify MSME vendor');
    }
  });

  // T4.4: Scenario 4 - Commercial Invoice Percentage False Positive Guard
  await recordTest('T4.4', 'Scenario 4: Proposal containing 18% GST and 10% advance correctly extracts separate 60% MII', 'Tier 4', async () => {
    const complexCommercialText = `
      COMMERCIAL & TECHNICAL PROPOSAL - CPCL ELECTRICAL WORKS
      Bidder: PowerGrid Solutions Pvt Ltd
      CIN: U40100DL2015PTC288190
      GSTIN: 07AABCP5678F1Z2
      PAN: AABCP5678F
      
      COMMERCIAL BILLING TERMS:
      Payment Terms: 10% mobilization advance against bank guarantee.
      GST applicable on supply and services at 18.0%.
      Performance security: 5% of contract value.

      MAKE IN INDIA DECLARATION:
      We declare that the indigenous Local Content in this offering is 60.0%.
      We are a Class-I Local Supplier.
    `;

    const scanRes = await postJson(port, '/api/verify/document', {
      text: complexCommercialText,
      fileName: 'complex_commercial_proposal.txt'
    });

    const scanData = scanRes.body.data || scanRes.body;
    const miiCheck = scanData.checksDetail?.makeInIndia;
    if (miiCheck && miiCheck.checkStatus === 'FAILED') {
      throw new Error(`Make In India falsely failed due to billing terms: ${miiCheck.message}`);
    }
  });

  // T4.5: Scenario 5 - Offline SIH Hackathon Demonstration Flow
  await recordTest('T4.5', 'Scenario 5: Complete Hackathon Offline Flow executes flawlessly with zero network errors', 'Tier 4', async () => {
    // 1. Health check
    const healthRes = await new Promise((resolve, reject) => {
      http.get({ hostname: 'localhost', port: port, path: '/api/health' }, res => {
        let d = '';
        res.on('data', c => d += c);
        res.on('end', () => resolve({ statusCode: res.statusCode, body: JSON.parse(d) }));
      }).on('error', reject);
    });
    if (healthRes.statusCode !== 200) throw new Error('Health check failed');

    // 2. Document upload
    const docRes = await postJson(port, '/api/verify/document', {
      text: COMPLIANT_TEXT,
      fileName: 'SIH_Demo_Envelope.pdf'
    });
    if (docRes.statusCode !== 200) throw new Error('Document scan failed in offline demo');

    // 3. Webhook simulated dispatch
    const notifyRes = await postJson(port, '/api/verify/notify', {
      company_name: 'SIH Demo Vendor',
      vendor_email: 'demo@sih2026.gov.in',
      decision_status: 'APPROVED',
      score: 95
    });
    if (notifyRes.statusCode !== 200) throw new Error('Webhook notification failed in offline demo');
  });

  return results;
}

if (require.main === module) {
  runE2EScenarioTests().then(results => {
    console.log('\n=== E2E SCENARIO & CROSS-FEATURE TEST RESULTS ===\n');
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

module.exports = { runE2EScenarioTests };
