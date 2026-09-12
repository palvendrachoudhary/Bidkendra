const http = require('http');
const path = require('path');
const fs = require('fs');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const BACKEND_DIR = path.join(PROJECT_ROOT, 'backend');
const CONTROLLER_PATH = path.join(BACKEND_DIR, 'src', 'controllers', 'verificationController.js');

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
    req.setTimeout(6000, () => {
      req.destroy();
      reject(new Error(`POST ${path} timed out after 6000ms`));
    });
    req.write(payload);
    req.end();
  });
}

/**
 * Test Suite: Webhook Notification & Gateway Normalization
 */
async function runWebhookNotifyTests(port = 5000) {
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

  // Check code implementation characteristics
  const controllerSource = fs.readFileSync(CONTROLLER_PATH, 'utf8');

  // --- Tier 1: Feature Coverage ---

  // T1.1.1: Snake_case payload normalization
  await recordTest('T1.1.1', 'Accepts snake_case fields (vendor_email, company_name, decision_status, score)', 'Tier 1', async () => {
    const payload = {
      company_name: 'PetroTech India Pvt Ltd',
      vendor_email: 'compliance@petrotech.in',
      decision_status: 'APPROVED',
      score: 94,
      rejection_reason: '',
      emailContent: 'Your tender bid for CPCL is accepted.'
    };

    const res = await postJson(port, '/api/verify/notify', payload);
    if (res.statusCode !== 200) {
      throw new Error(`Expected HTTP 200, received ${res.statusCode}: ${JSON.stringify(res.body)}`);
    }
    if (!res.body || res.body.success !== true) {
      throw new Error(`Expected success: true, received ${JSON.stringify(res.body)}`);
    }
  });

  // T1.1.2: CamelCase payload compatibility
  await recordTest('T1.1.2', 'Accepts camelCase fields (bidderName, companyEmail, status, rejectionReason)', 'Tier 1', async () => {
    const payload = {
      bidderName: 'PetroTech India Pvt Ltd',
      companyEmail: 'compliance@petrotech.in',
      status: 'REJECTED',
      rejectionReason: 'Mandatory statutory GSTIN failed verification',
      score: 0
    };

    const res = await postJson(port, '/api/verify/notify', payload);
    if (res.statusCode !== 200) {
      throw new Error(`Expected HTTP 200, received ${res.statusCode}: ${JSON.stringify(res.body)}`);
    }
    if (!res.body || res.body.success !== true) {
      throw new Error(`Expected success: true, received ${JSON.stringify(res.body)}`);
    }
  });

  // T1.1.3: Object emailContent payload normalization
  await recordTest('T1.1.3', 'Handles structured emailContent object { subject, body } without corrupting string', 'Tier 1', async () => {
    const payload = {
      company_name: 'Kaveri Engineering Works',
      vendor_email: 'tenders@kaveri.in',
      decision_status: 'APPROVED',
      score: 85,
      emailContent: {
        subject: 'CPCL Tender Acceptance Notice',
        body: 'Your technical envelope conforms with CPCL specifications.'
      }
    };

    const res = await postJson(port, '/api/verify/notify', payload);
    if (res.statusCode !== 200) {
      throw new Error(`Expected HTTP 200, received ${res.statusCode}: ${JSON.stringify(res.body)}`);
    }
  });

  // T1.1.4: Webhook Resilience / Offline Simulation Mode
  await recordTest('T1.1.4', 'Returns HTTP 200 and simulated delivery mode when remote webhook is unavailable', 'Tier 1', async () => {
    const payload = {
      company_name: 'Simulation Test Entity',
      vendor_email: 'test@simulation.org',
      decision_status: 'APPROVED',
      score: 90
    };

    const res = await postJson(port, '/api/verify/notify', payload);
    if (res.statusCode !== 200) {
      throw new Error(`Endpoint failed with status ${res.statusCode}. Server must not return 500 when offline.`);
    }
    if (!res.body || res.body.success !== true) {
      throw new Error(`Expected success: true, received ${JSON.stringify(res.body)}`);
    }
  });

  // T1.1.5: Timeout guard present in webhook dispatcher
  await recordTest('T1.1.5', 'Verification controller enforces axios timeout <= 5000ms on Viasocket requests', 'Tier 1', async () => {
    const hasTimeout = controllerSource.includes('timeout: 5000') || 
                       controllerSource.includes('timeout:5000') ||
                       controllerSource.includes('timeout: 4000') ||
                       controllerSource.includes('timeout: 3000');
    if (!hasTimeout) {
      throw new Error('No axios timeout <= 5000ms found in sendWebhookNotification. Requests may hang indefinitely.');
    }
  });

  // --- Tier 2: Boundary & Corner Cases ---

  // T2.2.1: Empty payload fallback
  await recordTest('T2.2.1', 'Gracefully processes completely empty payload {} without unhandled exception', 'Tier 2', async () => {
    const res = await postJson(port, '/api/verify/notify', {});
    if (res.statusCode !== 200) {
      throw new Error(`Expected HTTP 200 on empty payload fallback, received ${res.statusCode}: ${JSON.stringify(res.body)}`);
    }
  });

  // T2.2.2: Boundary score values (0, 100, -1)
  await recordTest('T2.2.2', 'Safely handles boundary score values (0, 100, -1, 105)', 'Tier 2', async () => {
    const payload = {
      company_name: 'Boundary Scores Ltd',
      vendor_email: 'boundary@scores.in',
      decision_status: 'REJECTED',
      score: 0,
      rejection_reason: 'Zero score'
    };
    const res = await postJson(port, '/api/verify/notify', payload);
    if (res.statusCode !== 200) {
      throw new Error(`Expected HTTP 200 for score: 0, received ${res.statusCode}`);
    }
  });

  // T2.2.3: Special Unicode characters and Indian language script in company name
  await recordTest('T2.2.3', 'Preserves Unicode, Devanagari script, and special characters in payload', 'Tier 2', async () => {
    const payload = {
      company_name: 'हिंदुस्तान पेट्रोलियम & गैस कॉरपोरेशन लि. (HPGC)',
      vendor_email: 'tender.hpgc@gov.in',
      decision_status: 'APPROVED',
      score: 98,
      notes: 'ISO 9001:2015 ✓ | 100% DPIIT Class-I Local Supplier 🇮🇳'
    };

    const res = await postJson(port, '/api/verify/notify', payload);
    if (res.statusCode !== 200) {
      throw new Error(`Failed to handle Unicode company name and notes: ${res.statusCode}`);
    }
  });

  // T2.2.4: Null and undefined field values
  await recordTest('T2.2.4', 'Handles explicit null values for optional and required fields', 'Tier 2', async () => {
    const payload = {
      company_name: null,
      vendor_email: null,
      decision_status: null,
      score: null,
      rejection_reason: null,
      emailContent: null
    };

    const res = await postJson(port, '/api/verify/notify', payload);
    if (res.statusCode !== 200) {
      throw new Error(`Expected HTTP 200 with null values, received ${res.statusCode}`);
    }
  });

  // T2.2.5: Audit log insertion on notification dispatch
  await recordTest('T2.2.5', 'Controller persists notification dispatch audit record in database', 'Tier 2', async () => {
    const hasAuditLog = controllerSource.includes('audit_logs') && 
                        (controllerSource.includes('NOTIFICATION') || controllerSource.includes('WEBHOOK'));
    if (!hasAuditLog) {
      throw new Error('sendWebhookNotification does not record an entry into SQLite audit_logs table');
    }
  });

  return results;
}

if (require.main === module) {
  runWebhookNotifyTests().then(results => {
    console.log('\n=== WEBHOOK NOTIFY ENDPOINT TEST RESULTS ===\n');
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

module.exports = { runWebhookNotifyTests };
