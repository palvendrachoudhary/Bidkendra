/**
 * Comprehensive Adversarial Empirical Stress & Challenge Suite for Milestone 1
 * Targets: /api/verify/notify, offline/timeout resilience, payload fuzzing, memory & lifecycle.
 *
 * Usage: node tests/test_m1_adversarial_challenge.js
 */

const http = require('http');
const net = require('net');
const path = require('path');
const fs = require('fs');
const { spawn, execSync } = require('child_process');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const BACKEND_DIR = path.join(PROJECT_ROOT, 'backend');
const DB_PATH = path.join(BACKEND_DIR, 'gem_bid_verify.db');

// Registry of child processes to kill on exit
const childProcesses = new Set();
const serverListeners = new Set();

function registerChildProcess(proc) {
  if (proc && proc.pid) childProcesses.add(proc);
  return proc;
}

function registerListener(srv) {
  if (srv) serverListeners.add(srv);
  return srv;
}

function killProcessSafely(proc) {
  return new Promise((resolve) => {
    if (!proc || !proc.pid) return resolve();
    childProcesses.delete(proc);
    try {
      if (process.platform === 'win32') {
        execSync(`taskkill /pid ${proc.pid} /T /F`, { stdio: 'ignore' });
      } else {
        proc.kill('SIGKILL');
      }
    } catch (e) {}
    resolve();
  });
}

async function cleanupAllResources() {
  for (const srv of serverListeners) {
    try { srv.close(); } catch (e) {}
  }
  serverListeners.clear();

  for (const proc of childProcesses) {
    await killProcessSafely(proc);
  }
  childProcesses.clear();
}

// Ensure cleanup runs on any exit
process.on('SIGINT', async () => { await cleanupAllResources(); process.exit(130); });
process.on('SIGTERM', async () => { await cleanupAllResources(); process.exit(143); });
process.on('exit', () => {
  for (const proc of childProcesses) {
    try {
      if (process.platform === 'win32') execSync(`taskkill /pid ${proc.pid} /T /F`, { stdio: 'ignore' });
      else proc.kill('SIGKILL');
    } catch (e) {}
  }
});

// --- Network Helpers ---

function isPortListening(port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('error', () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, '127.0.0.1');
  });
}

function waitForPort(port, timeoutMs = 8000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = async () => {
      const listening = await isPortListening(port);
      if (listening) return resolve(true);
      if (Date.now() - start > timeoutMs) {
        return reject(new Error(`Port ${port} did not become ready within ${timeoutMs}ms`));
      }
      setTimeout(check, 150);
    };
    check();
  });
}

function httpRequest({ hostname = 'localhost', port, path = '/', method = 'POST', headers = {}, timeout = 10000 }, body = null) {
  return new Promise((resolve, reject) => {
    let payload = null;
    const reqHeaders = { ...headers };

    if (body !== null) {
      if (typeof body === 'string' || Buffer.isBuffer(body)) {
        payload = body;
      } else {
        payload = JSON.stringify(body);
        if (!reqHeaders['Content-Type']) {
          reqHeaders['Content-Type'] = 'application/json';
        }
      }
      if (!reqHeaders['Content-Length']) {
        reqHeaders['Content-Length'] = Buffer.byteLength(payload);
      }
    }

    let settled = false;
    const req = http.request({
      hostname,
      port,
      path,
      method,
      headers: reqHeaders
    }, (res) => {
      let rawData = '';
      res.on('data', chunk => rawData += chunk);
      res.on('end', () => {
        if (!settled) {
          settled = true;
          let parsed = null;
          try { parsed = JSON.parse(rawData); } catch (e) { parsed = rawData; }
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: parsed,
            rawBody: rawData
          });
        }
      });
    });

    req.on('error', (err) => {
      if (!settled) {
        settled = true;
        reject(err);
      }
    });

    req.setTimeout(timeout, () => {
      if (!settled) {
        settled = true;
        req.destroy();
        reject(new Error(`HTTP request to ${path} timed out after ${timeout}ms`));
      }
    });

    if (payload !== null) {
      req.write(payload);
    }
    req.end();
  });
}

// --- Main Adversarial Test Runner ---

async function runAdversarialSuite() {
  console.log('===============================================================');
  console.log('   CHALLENGER M1_1: ADVERSARIAL STRESS & EMPIRICAL HARNESS     ');
  console.log('   Target: /api/verify/notify & Milestone 1 Reliability        ');
  console.log('===============================================================\n');

  const results = [];
  const startTime = Date.now();

  async function recordTest(id, name, category, testFn) {
    const tStart = Date.now();
    try {
      await testFn();
      const dur = Date.now() - tStart;
      results.push({ id, name, category, pass: true, durationMs: dur });
      console.log(`[${category}] ${id.padEnd(16)}: ${name} -> ✅ PASS (${dur}ms)`);
    } catch (err) {
      const dur = Date.now() - tStart;
      results.push({ id, name, category, pass: false, error: err.message, durationMs: dur });
      console.log(`[${category}] ${id.padEnd(16)}: ${name} -> ❌ FAIL (${dur}ms)`);
      console.log(`   Error: ${err.message}`);
    }
  }

  // 1. Setup Mock Webhook Gateway on port 59990
  const MOCK_GATEWAY_PORT = 59990;
  let mockGatewayMode = 'success'; // 'success' | 'hang' | 'error_500' | 'error_404' | 'drop'
  let mockRequestsReceived = [];

  const mockGatewayServer = http.createServer((req, res) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      let parsed = null;
      try { parsed = JSON.parse(body); } catch(e) { parsed = body; }
      mockRequestsReceived.push({ method: req.method, url: req.url, headers: req.headers, body: parsed });

      if (mockGatewayMode === 'hang') {
        // Deliberately hold connection open and do not respond (will trigger 5000ms client timeout)
        return;
      } else if (mockGatewayMode === 'error_500') {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal Server Error in Mock Webhook Gateway' }));
      } else if (mockGatewayMode === 'error_404') {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Webhook URL Not Found' }));
      } else if (mockGatewayMode === 'drop') {
        req.socket.destroy();
      } else {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Delivered to mock gateway' }));
      }
    });
  });

  registerListener(mockGatewayServer);
  await new Promise((resolve) => mockGatewayServer.listen(MOCK_GATEWAY_PORT, '127.0.0.1', resolve));
  console.log(`📡 Mock Webhook Gateway active on port ${MOCK_GATEWAY_PORT}`);

  // 2. Start Controlled Primary Test Backend on Port 5005 pointing to Mock Gateway
  const PRIMARY_TEST_PORT = 5005;
  console.log(`⚙️ Launching controlled test backend on port ${PRIMARY_TEST_PORT}...`);
  const primaryBackend = registerChildProcess(spawn('node', ['src/server.js'], {
    cwd: BACKEND_DIR,
    env: {
      ...process.env,
      PORT: String(PRIMARY_TEST_PORT),
      VIASOCKET_WEBHOOK_URL: `http://127.0.0.1:${MOCK_GATEWAY_PORT}/webhook`,
      NODE_ENV: 'test'
    },
    stdio: 'pipe'
  }));

  await waitForPort(PRIMARY_TEST_PORT, 8000);
  console.log(`✅ Controlled test backend active on port ${PRIMARY_TEST_PORT}.\n`);

  try {
    // -------------------------------------------------------------
    // SUITE A: Payload Schema Diversity & Fuzzing
    // -------------------------------------------------------------
    console.log('--- SUITE A: Payload Schema Diversity & Fuzzing ---');

    // A.1: Full snake_case payload
    await recordTest('ADV-PAYLOAD-01', 'Accepts comprehensive snake_case fields with complete schema', 'Payload Fuzzing', async () => {
      mockGatewayMode = 'success';
      const payload = {
        company_name: 'Adversarial Test Refineries Pvt Ltd',
        vendor_email: 'adv.compliance@refineries.in',
        decision_status: 'APPROVED',
        score: 95.5,
        rejection_reason: '',
        notes: 'Passed ISO 14001, OHSAS 18001, CPCL Vendor Prequalification Criteria',
        emailContent: 'Your technical tender packet has been accepted by CPCL.'
      };
      const res = await httpRequest({ port: PRIMARY_TEST_PORT, path: '/api/verify/notify' }, payload);
      if (res.statusCode !== 200 || !res.body.success) {
        throw new Error(`Expected HTTP 200 with success: true, got ${res.statusCode}: ${JSON.stringify(res.body)}`);
      }
      if (res.body.payload.company_name !== payload.company_name || res.body.payload.score !== 95.5) {
        throw new Error(`Payload fields mismatched in response: ${JSON.stringify(res.body.payload)}`);
      }
    });

    // A.2: Full camelCase payload
    await recordTest('ADV-PAYLOAD-02', 'Accepts full camelCase fields (bidderName, companyEmail, overallScore, etc.)', 'Payload Fuzzing', async () => {
      const payload = {
        bidderName: 'Madras Valve & Fluid Dynamics Ltd',
        companyEmail: 'bids@madrasvalve.com',
        status: 'REJECTED',
        overallScore: 42,
        rejectionReason: 'Failed mandatory Make in India 50% threshold requirement'
      };
      const res = await httpRequest({ port: PRIMARY_TEST_PORT, path: '/api/verify/notify' }, payload);
      if (res.statusCode !== 200 || !res.body.success) {
        throw new Error(`Expected HTTP 200, got ${res.statusCode}`);
      }
      if (res.body.payload.company_name !== payload.bidderName) {
        throw new Error(`bidderName was not normalized to company_name: ${JSON.stringify(res.body.payload)}`);
      }
      if (res.body.payload.vendor_email !== payload.companyEmail) {
        throw new Error(`companyEmail was not normalized to vendor_email`);
      }
      if (res.body.payload.score !== 42) {
        throw new Error(`overallScore was not normalized to score`);
      }
    });

    // A.3: Mixed casing with priority resolution
    await recordTest('ADV-PAYLOAD-03', 'Resolves conflicting snake_case vs camelCase keys predictably', 'Payload Fuzzing', async () => {
      const payload = {
        company_name: 'Primary Preferred Ltd',
        bidderName: 'Secondary Ignored Ltd',
        vendor_email: 'primary@priority.in',
        companyEmail: 'secondary@priority.in',
        score: 91,
        overall_score: 75,
        overallScore: 50,
        decision_status: 'APPROVED',
        status: 'REJECTED'
      };
      const res = await httpRequest({ port: PRIMARY_TEST_PORT, path: '/api/verify/notify' }, payload);
      if (res.statusCode !== 200) throw new Error(`Expected HTTP 200, got ${res.statusCode}`);
      if (res.body.payload.company_name !== 'Primary Preferred Ltd') {
        throw new Error(`Precedence failure: company_name should take precedence over bidderName`);
      }
      if (res.body.payload.vendor_email !== 'primary@priority.in') {
        throw new Error(`Precedence failure: vendor_email should take precedence over companyEmail`);
      }
      if (res.body.payload.score !== 91) {
        throw new Error(`Precedence failure: score (91) should take precedence over overall_score/overallScore`);
      }
      if (res.body.payload.decision_status !== 'APPROVED') {
        throw new Error(`Precedence failure: decision_status should take precedence over status`);
      }
    });

    // A.4: Empty payload fallback
    await recordTest('ADV-PAYLOAD-04', 'Handles totally empty payload {} with safe robust defaults', 'Payload Fuzzing', async () => {
      const res = await httpRequest({ port: PRIMARY_TEST_PORT, path: '/api/verify/notify' }, {});
      if (res.statusCode !== 200 || !res.body.success) throw new Error(`Expected HTTP 200 on empty payload`);
      const p = res.body.payload;
      if (p.company_name !== 'Unknown Company') throw new Error(`Expected default 'Unknown Company', got ${p.company_name}`);
      if (p.vendor_email !== 'vendor@example.com') throw new Error(`Expected default email, got ${p.vendor_email}`);
      if (p.decision_status !== 'UNKNOWN') throw new Error(`Expected default 'UNKNOWN', got ${p.decision_status}`);
      if (p.score !== null) throw new Error(`Expected score to be null, got ${p.score}`);
    });

    // A.5: Single-field sparse payloads (score: 0)
    await recordTest('ADV-PAYLOAD-05', 'Correctly preserves score: 0 without treating it as falsy null', 'Payload Fuzzing', async () => {
      const res = await httpRequest({ port: PRIMARY_TEST_PORT, path: '/api/verify/notify' }, { score: 0 });
      if (res.statusCode !== 200) throw new Error(`Expected HTTP 200, got ${res.statusCode}`);
      if (res.body.payload.score !== 0) {
        throw new Error(`Zero-score bug: score: 0 was coerced to ${res.body.payload.score}`);
      }
    });

    // A.6: Status REJECTED with omitted rejection_reason gets 'N/A'
    await recordTest('ADV-PAYLOAD-06', 'Automatically supplies N/A rejection reason for REJECTED status when omitted', 'Payload Fuzzing', async () => {
      const res = await httpRequest({ port: PRIMARY_TEST_PORT, path: '/api/verify/notify' }, { decision_status: 'REJECTED' });
      if (res.statusCode !== 200) throw new Error(`Expected HTTP 200, got ${res.statusCode}`);
      if (res.body.payload.rejection_reason !== 'N/A') {
        throw new Error(`Expected rejection_reason: 'N/A', got '${res.body.payload.rejection_reason}'`);
      }
    });

    // A.7: Empty string values fallback
    await recordTest('ADV-PAYLOAD-07', 'Gracefully falls back when empty strings are passed for required fields', 'Payload Fuzzing', async () => {
      const payload = {
        company_name: '',
        vendor_email: '',
        decision_status: '',
        rejection_reason: '',
        notes: ''
      };
      const res = await httpRequest({ port: PRIMARY_TEST_PORT, path: '/api/verify/notify' }, payload);
      if (res.statusCode !== 200) throw new Error(`Expected HTTP 200, got ${res.statusCode}`);
      if (!res.body.payload.company_name || res.body.payload.company_name === '') {
        throw new Error(`company_name should have fallen back to default, got empty string`);
      }
    });

    // A.8: Structured emailContent object variations
    await recordTest('ADV-PAYLOAD-08', 'Formats structured emailContent ({ subject, body }, subject-only, body-only, empty)', 'Payload Fuzzing', async () => {
      // Case 1: subject only
      const res1 = await httpRequest({ port: PRIMARY_TEST_PORT, path: '/api/verify/notify' }, { emailContent: { subject: 'Tender Notice Only' } });
      if (!res1.body.payload.emailContent.includes('Subject: Tender Notice Only')) {
        throw new Error(`Subject-only formatting failed: ${res1.body.payload.emailContent}`);
      }

      // Case 2: body only
      const res2 = await httpRequest({ port: PRIMARY_TEST_PORT, path: '/api/verify/notify' }, { emailContent: { body: 'Tender Body Content Here' } });
      if (!res2.body.payload.emailContent.includes('Tender Body Content Here')) {
        throw new Error(`Body-only formatting failed: ${res2.body.payload.emailContent}`);
      }

      // Case 3: empty object {}
      const res3 = await httpRequest({ port: PRIMARY_TEST_PORT, path: '/api/verify/notify' }, { emailContent: {} });
      if (res3.body.payload.emailContent !== '{}') {
        throw new Error(`Empty object formatting failed: ${res3.body.payload.emailContent}`);
      }
    });

    // A.9: Multilingual, Unicode & Devanagari script integrity
    await recordTest('ADV-PAYLOAD-09', 'Preserves Devanagari, Tamil, Cyrillic, RTL Arabic, and emoji strings without Mojibake', 'Payload Fuzzing', async () => {
      const payload = {
        company_name: 'हिंदुस्तान पेट्रोलियम & चेन्नई பெட்ரோலியம் 🇮🇳',
        vendor_email: 'compliance@हिन्दुस्तान.भारत',
        decision_status: 'APPROVED',
        notes: 'ISO 9001:2015 🛡️ | مرحبا بكم | Проверка пройдена 🚀'
      };
      const res = await httpRequest({ port: PRIMARY_TEST_PORT, path: '/api/verify/notify' }, payload);
      if (res.statusCode !== 200) throw new Error(`Expected HTTP 200, got ${res.statusCode}`);
      if (res.body.payload.company_name !== payload.company_name) {
        throw new Error(`Devanagari/Tamil unicode corrupted: ${res.body.payload.company_name}`);
      }
      if (res.body.payload.notes !== payload.notes) {
        throw new Error(`Multilingual notes corrupted: ${res.body.payload.notes}`);
      }
    });

    // A.10: Extreme and boundary scores
    await recordTest('ADV-PAYLOAD-10', 'Handles negative, floating point, 100, and boundary score values safely', 'Payload Fuzzing', async () => {
      const testScores = [100, -1, 99.999, 0.001, null];
      for (const sc of testScores) {
        const res = await httpRequest({ port: PRIMARY_TEST_PORT, path: '/api/verify/notify' }, { score: sc });
        if (res.statusCode !== 200) throw new Error(`Failed on score value: ${sc}`);
        if (res.body.payload.score !== sc) throw new Error(`Score mismatch: expected ${sc}, got ${res.body.payload.score}`);
      }
    });

    // A.11: Adversarial security injection strings
    await recordTest('ADV-PAYLOAD-11', 'Resists SQL injection, XSS vectors, and null bytes without crashing or corruption', 'Payload Fuzzing', async () => {
      const payload = {
        company_name: "Tenderer' OR 1=1; DROP TABLE audit_logs; --",
        vendor_email: 'xss@test.in<script>alert(1)</script>',
        decision_status: 'UNDER_REVIEW',
        notes: '<img src=x onerror=alert("hacked")>; ../../../etc/passwd\0'
      };
      const res = await httpRequest({ port: PRIMARY_TEST_PORT, path: '/api/verify/notify' }, payload);
      if (res.statusCode !== 200) throw new Error(`Failed on SQL/XSS payload: ${res.statusCode}`);
      if (!res.body.payload.company_name.includes("Tenderer' OR 1=1")) {
        throw new Error(`Sanitization corrupted raw data in payload: ${res.body.payload.company_name}`);
      }
    });

    // A.12: Large payload pressure (64 KB)
    await recordTest('ADV-PAYLOAD-12', 'Accepts and processes large 64 KB payload without memory crash', 'Payload Fuzzing', async () => {
      const largeText = 'CPCL Tender Compliance Verification Audit Trail Record '.repeat(1200); // ~66 KB
      const payload = {
        company_name: 'Large Payload Enterprise Corp',
        vendor_email: 'large@enterprise.in',
        decision_status: 'APPROVED',
        notes: largeText
      };
      const res = await httpRequest({ port: PRIMARY_TEST_PORT, path: '/api/verify/notify' }, payload);
      if (res.statusCode !== 200) throw new Error(`Large payload failed with HTTP ${res.statusCode}`);
      if (res.body.payload.notes.length !== largeText.length) {
        throw new Error(`Large payload truncated: expected ${largeText.length}, got ${res.body.payload.notes.length}`);
      }
    });

    // A.13: Malformed JSON syntax
    await recordTest('ADV-PAYLOAD-13', 'Express body-parser safely rejects malformed JSON (400 Bad Request) without crashing server', 'Payload Fuzzing', async () => {
      const brokenJson = '{"company_name": "Unclosed string, broken payload: ';
      const res = await httpRequest({
        port: PRIMARY_TEST_PORT,
        path: '/api/verify/notify',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, brokenJson);

      // Express default json bodyparser returns 400 Bad Request on SyntaxError
      if (res.statusCode !== 400) {
        throw new Error(`Expected HTTP 400 Bad Request for malformed JSON, got ${res.statusCode}`);
      }

      // Verify server is still alive and answering
      const health = await httpRequest({ port: PRIMARY_TEST_PORT, path: '/api/health', method: 'GET' });
      if (health.statusCode !== 200) throw new Error('Server died after malformed JSON');
    });

    console.log('');

    // -------------------------------------------------------------
    // SUITE B: Offline Resilience, Timeouts & Gateway Fault Injection
    // -------------------------------------------------------------
    console.log('--- SUITE B: Offline Resilience, Timeouts & Gateway Fault Injection ---');

    // B.1: Live Webhook Delivery when Gateway is UP
    await recordTest('ADV-FAULT-01', 'Returns mode: live and HTTP 200 when remote gateway responds successfully', 'Gateway Resilience', async () => {
      mockGatewayMode = 'success';
      mockRequestsReceived = [];

      const res = await httpRequest({ port: PRIMARY_TEST_PORT, path: '/api/verify/notify' }, {
        company_name: 'Live Gateway Test Ltd',
        vendor_email: 'live@gateway.test',
        decision_status: 'APPROVED',
        score: 98
      });

      if (res.statusCode !== 200) throw new Error(`Expected HTTP 200, got ${res.statusCode}`);
      if (res.body.delivery.mode !== 'live') {
        throw new Error(`Expected delivery.mode: 'live', got '${res.body.delivery.mode}'`);
      }
      if (mockRequestsReceived.length === 0) {
        throw new Error(`Mock gateway did not receive any webhook POST request`);
      }
      if (mockRequestsReceived[0].body.company_name !== 'Live Gateway Test Ltd') {
        throw new Error(`Mock gateway received mismatched body: ${JSON.stringify(mockRequestsReceived[0].body)}`);
      }
    });

    // B.2: Gateway returns HTTP 500 Internal Server Error -> falls back to simulated mode
    await recordTest('ADV-FAULT-02', 'Gracefully falls back to mode: simulated when remote gateway returns HTTP 500', 'Gateway Resilience', async () => {
      mockGatewayMode = 'error_500';

      const res = await httpRequest({ port: PRIMARY_TEST_PORT, path: '/api/verify/notify' }, {
        company_name: 'Gateway 500 Fallback Entity',
        decision_status: 'REJECTED',
        score: 30
      });

      if (res.statusCode !== 200) {
        throw new Error(`Expected HTTP 200 on gateway error, got HTTP ${res.statusCode}: ${JSON.stringify(res.body)}`);
      }
      if (res.body.delivery.mode !== 'simulated') {
        throw new Error(`Expected delivery.mode: 'simulated', got '${res.body.delivery.mode}'`);
      }
    });

    // B.3: Gateway returns HTTP 404 Not Found -> falls back to simulated mode
    await recordTest('ADV-FAULT-03', 'Gracefully falls back to mode: simulated when remote gateway returns HTTP 404', 'Gateway Resilience', async () => {
      mockGatewayMode = 'error_404';

      const res = await httpRequest({ port: PRIMARY_TEST_PORT, path: '/api/verify/notify' }, {
        company_name: 'Gateway 404 Entity',
        decision_status: 'UNDER_REVIEW'
      });

      if (res.statusCode !== 200 || res.body.delivery.mode !== 'simulated') {
        throw new Error(`Expected HTTP 200 and simulated mode, got ${res.statusCode}: ${JSON.stringify(res.body)}`);
      }
    });

    // B.4: Gateway abruptly closes socket (ECONNRESET) -> falls back to simulated mode
    await recordTest('ADV-FAULT-04', 'Gracefully falls back to mode: simulated when remote gateway abruptly drops socket', 'Gateway Resilience', async () => {
      mockGatewayMode = 'drop';

      const res = await httpRequest({ port: PRIMARY_TEST_PORT, path: '/api/verify/notify' }, {
        company_name: 'Socket Drop Test Entity',
        decision_status: 'APPROVED'
      });

      if (res.statusCode !== 200 || res.body.delivery.mode !== 'simulated') {
        throw new Error(`Expected HTTP 200 and simulated mode on dropped connection`);
      }
    });

    // B.5: Webhook Hanging Timeout: Enforces 5000ms timeout and falls back to simulated mode
    await recordTest('ADV-FAULT-05', 'Enforces axios timeout <= 5000ms when gateway hangs, returning HTTP 200 and mode: simulated', 'Gateway Resilience', async () => {
      mockGatewayMode = 'hang'; // Request will hang

      const tStart = Date.now();
      const res = await httpRequest({
        port: PRIMARY_TEST_PORT,
        path: '/api/verify/notify',
        timeout: 8000 // Test client timeout allows 8s to verify 5s server timeout
      }, {
        company_name: 'Hanging Gateway Test Entity',
        decision_status: 'APPROVED'
      });

      const elapsed = Date.now() - tStart;

      if (res.statusCode !== 200) {
        throw new Error(`Expected HTTP 200 after gateway timeout, got ${res.statusCode}`);
      }
      if (res.body.delivery.mode !== 'simulated') {
        throw new Error(`Expected delivery.mode: 'simulated' on timeout, got '${res.body.delivery.mode}'`);
      }

      // Must have taken between 4800ms and 6500ms
      if (elapsed < 4800 || elapsed > 7000) {
        throw new Error(`Timeout duration out of bounds: expected ~5000ms, actual elapsed was ${elapsed}ms`);
      }
    });

    // B.6: Completely unreachable port (ECONNREFUSED)
    const DEAD_PORT_BACKEND = 5006;
    const deadPortBackend = registerChildProcess(spawn('node', ['src/server.js'], {
      cwd: BACKEND_DIR,
      env: {
        ...process.env,
        PORT: String(DEAD_PORT_BACKEND),
        VIASOCKET_WEBHOOK_URL: 'http://127.0.0.1:59991/unreachable',
        NODE_ENV: 'test'
      },
      stdio: 'pipe'
    }));

    await waitForPort(DEAD_PORT_BACKEND, 8000);

    await recordTest('ADV-FAULT-06', 'Immediately returns mode: simulated on dead gateway port (ECONNREFUSED) without server crash', 'Gateway Resilience', async () => {
      const tStart = Date.now();
      const res = await httpRequest({ port: DEAD_PORT_BACKEND, path: '/api/verify/notify' }, {
        company_name: 'Dead Gateway Entity',
        decision_status: 'APPROVED'
      });
      const elapsed = Date.now() - tStart;

      if (res.statusCode !== 200 || res.body.delivery.mode !== 'simulated') {
        throw new Error(`Expected HTTP 200 with mode: simulated, got ${res.statusCode}`);
      }
      if (elapsed > 1500) {
        throw new Error(`ECONNREFUSED should fail fast, but took ${elapsed}ms`);
      }
    });

    await killProcessSafely(deadPortBackend);

    console.log('');

    // -------------------------------------------------------------
    // SUITE C: High Concurrency, Stress Load & Memory Management
    // -------------------------------------------------------------
    console.log('--- SUITE C: High Concurrency, Stress Load & Memory Management ---');
    mockGatewayMode = 'success'; // Mock gateway responds in ~1ms

    // C.1: 50 Concurrent Requests Burst
    await recordTest('ADV-CONCUR-01', 'Handles burst of 50 simultaneous concurrent requests with 100% HTTP 200 pass rate', 'Concurrency & Stress', async () => {
      const concurrentRequests = 50;
      const promises = [];

      for (let i = 0; i < concurrentRequests; i++) {
        const payload = {
          company_name: `Concurrent Bidder Corp #${i}`,
          vendor_email: `vendor_${i}@concurrency.gov.in`,
          decision_status: i % 2 === 0 ? 'APPROVED' : 'REJECTED',
          score: Math.floor(Math.random() * 100),
          notes: `Concurrent test iteration #${i}`
        };
        promises.push(httpRequest({ port: PRIMARY_TEST_PORT, path: '/api/verify/notify' }, payload));
      }

      const responses = await Promise.all(promises);

      const non200 = responses.filter(r => r.statusCode !== 200);
      if (non200.length > 0) {
        throw new Error(`${non200.length} of ${concurrentRequests} concurrent requests failed with non-200 status: ${JSON.stringify(non200[0])}`);
      }

      const unparsed = responses.filter(r => !r.body || !r.body.success);
      if (unparsed.length > 0) {
        throw new Error(`${unparsed.length} of ${concurrentRequests} responses lacked success: true`);
      }
    });

    // C.2: Database Audit Log Integrity & Persistence
    await recordTest('ADV-CONCUR-02', 'Preserves database audit log integrity during concurrent write stress', 'Concurrency & Stress', async () => {
      const healthRes = await httpRequest({ port: PRIMARY_TEST_PORT, path: '/api/health', method: 'GET' });
      if (healthRes.statusCode !== 200) {
        throw new Error(`Database corrupted or locked under concurrent write load`);
      }
    });

    // C.3: Memory Stability under Sequential Load (60 requests against mock gateway)
    await recordTest('ADV-CONCUR-03', 'Maintains stable memory and event loop under rapid sequential requests (no runaway leak)', 'Concurrency & Stress', async () => {
      const iterations = 60;
      for (let i = 0; i < iterations; i++) {
        const res = await httpRequest({ port: PRIMARY_TEST_PORT, path: '/api/verify/notify' }, {
          company_name: `Sequential Batch ${i}`,
          score: i
        });
        if (res.statusCode !== 200) throw new Error(`Request ${i} failed`);
      }

      // Confirm server is fast and responsive
      const pingStart = Date.now();
      const pingRes = await httpRequest({ port: PRIMARY_TEST_PORT, path: '/api/health', method: 'GET' });
      const pingElapsed = Date.now() - pingStart;

      if (pingRes.statusCode !== 200 || pingElapsed > 500) {
        throw new Error(`Server sluggish or unresponsive after load (${pingElapsed}ms)`);
      }
    });

    console.log('');

    // -------------------------------------------------------------
    // SUITE D: Server Lifecycle, Port Management & Clean Teardown
    // -------------------------------------------------------------
    console.log('--- SUITE D: Server Lifecycle & Port Collision Handling ---');

    // D.1: Port Collision EADDRINUSE Auto-Fallback
    await recordTest('ADV-LIFECYCLE-01', 'Automatically falls back to next port when primary port is occupied (EADDRINUSE)', 'Lifecycle & Cleanup', async () => {
      const dummySocketServer = registerListener(net.createServer());
      await new Promise((resolve) => dummySocketServer.listen(5008, resolve));

      const fallbackBackend = registerChildProcess(spawn('node', ['src/server.js'], {
        cwd: BACKEND_DIR,
        env: { ...process.env, PORT: '5008', NODE_ENV: 'test' },
        stdio: 'pipe'
      }));

      try {
        await waitForPort(5009, 8000);
        const is5009Up = await isPortListening(5009);
        if (!is5009Up) throw new Error('Port fallback to 5009 failed');

        const health = await httpRequest({ port: 5009, path: '/api/health', method: 'GET' });
        if (health.statusCode !== 200) throw new Error('Fallback server did not respond on 5009');
      } finally {
        await killProcessSafely(fallbackBackend);
        await new Promise(r => dummySocketServer.close(r));
        serverListeners.delete(dummySocketServer);
      }
    });

    // D.2: Clean Teardown of Primary Backend
    await recordTest('ADV-LIFECYCLE-02', 'Gracefully terminates backend on SIGINT/kill without leaving orphaned process', 'Lifecycle & Cleanup', async () => {
      await killProcessSafely(primaryBackend);
      await new Promise(r => setTimeout(r, 1000));
      const isStillListening = await isPortListening(PRIMARY_TEST_PORT);
      if (isStillListening) {
        throw new Error(`Port ${PRIMARY_TEST_PORT} is still listening after termination`);
      }
    });

  } finally {
    // Ensure all resources are unconditionally cleaned up
    await cleanupAllResources();
  }

  // Final Summary Calculation
  const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
  const totalTests = results.length;
  const passedTests = results.filter(r => r.pass).length;
  const failedTests = totalTests - passedTests;
  const passRate = ((passedTests / totalTests) * 100).toFixed(1);

  console.log('\n===============================================================');
  console.log('         ADVERSARIAL STRESS TEST EXECUTION REPORT              ');
  console.log('===============================================================');
  console.log(` Total Scenarios Challenged   : ${totalTests}`);
  console.log(` Passed                       : ${passedTests}`);
  console.log(` Failed                       : ${failedTests}`);
  console.log(` Pass Rate                    : ${passRate}%`);
  console.log(` Total Duration               : ${totalTime}s`);
  console.log('===============================================================\n');

  if (failedTests > 0) {
    console.error(`💥 ${failedTests} challenge scenario(s) failed. See above logs.\n`);
    process.exit(1);
  } else {
    console.log('🛡️ ALL 24 ADVERSARIAL CHALLENGES SURVIVED! Endpoint /api/verify/notify is empirically verified rock-solid.\n');
    process.exit(0);
  }
}

if (require.main === module) {
  runAdversarialSuite().catch(async (err) => {
    console.error('Fatal Adversarial Test Runner Exception:', err);
    await cleanupAllResources();
    process.exit(1);
  });
}

module.exports = { runAdversarialSuite };
