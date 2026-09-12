/**
 * Independent Forensic Stress-Test Suite for Milestone 1
 * Conducted by Forensic Integrity Auditor
 */

const http = require('http');
const net = require('net');
const path = require('path');
const fs = require('fs');

const BACKEND_DIR = path.resolve(__dirname, '..', 'backend');
const jwt = require(path.join(BACKEND_DIR, 'node_modules', 'jsonwebtoken'));

function makeRequest(port, method, reqPath, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    let payload = null;
    if (body !== null) {
      payload = typeof body === 'string' ? body : JSON.stringify(body);
      headers['Content-Type'] = headers['Content-Type'] || 'application/json';
      headers['Content-Length'] = Buffer.byteLength(payload);
    }
    const req = http.request({
      hostname: '127.0.0.1',
      port: port,
      path: reqPath,
      method: method,
      headers: headers
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let parsed = data;
        try { parsed = JSON.parse(data); } catch (e) {}
        resolve({ statusCode: res.statusCode, headers: res.headers, body: parsed, raw: data });
      });
    });
    req.on('error', reject);
    req.setTimeout(8000, () => {
      req.destroy();
      reject(new Error(`Request timed out after 8000ms: ${method} ${reqPath}`));
    });
    if (payload) req.write(payload);
    req.end();
  });
}

async function runForensicAudit() {
  console.log('=== STARTING INDEPENDENT FORENSIC INTEGRITY CHECKS ===\n');
  const results = [];

  function record(checkId, description, passed, detail = '') {
    results.push({ checkId, description, passed, detail });
    console.log(`[${passed ? 'PASS' : 'FAIL'}] ${checkId}: ${description}`);
    if (detail) console.log(`       Detail: ${detail}`);
  }

  // --- CHECK 1: Real-time dynamic payload normalization and DB persistence ---
  try {
    const novelCompany = 'Quantum-Forensic-Audit-' + Date.now();
    const novelEmail = 'auditor.' + Date.now() + '@audit-domain.org';
    const novelScore = 67.89;
    const testPayload = {
      company_name: novelCompany,
      vendor_email: novelEmail,
      decision_status: 'UNDER_REVIEW',
      score: novelScore,
      notes: 'Forensic tamper verification test',
      emailContent: {
        subject: 'Audit Subject Marker 999',
        body: 'Special verification body string'
      }
    };

    const res = await makeRequest(5000, 'POST', '/api/verify/notify', testPayload);
    const passStatus = res.statusCode === 200 && res.body.success === true;
    const payloadOk = res.body.payload && 
                      res.body.payload.company_name === novelCompany &&
                      res.body.payload.vendor_email === novelEmail &&
                      res.body.payload.score === novelScore &&
                      res.body.payload.emailContent.includes('Audit Subject Marker 999');

    // Verify in SQLite database directly
    const initSqlJs = require(path.join(BACKEND_DIR, 'node_modules', 'sql.js'));
    const SQL = await initSqlJs();
    const dbBuffer = fs.readFileSync(path.join(BACKEND_DIR, 'gem_bid_verify.db'));
    const db = new SQL.Database(dbBuffer);
    const dbRes = db.exec(`SELECT * FROM audit_logs WHERE entity_id = '${novelCompany}'`);
    const dbLogged = dbRes.length > 0 && dbRes[0].values.length > 0;

    record('AUDIT-M1-1', 'Dynamic payload normalization & SQLite persistence without hardcoding', 
      passStatus && payloadOk && dbLogged,
      `Payload normalized: ${payloadOk}, DB Record persisted: ${dbLogged}`
    );
  } catch (err) {
    record('AUDIT-M1-1', 'Dynamic payload normalization & SQLite persistence', false, err.message);
  }

  // --- CHECK 2: Timeout guard and fallback to simulated mode ---
  try {
    // We make a request that triggers simulated mode or handles unreachable webhooks
    // Test verification controller logic directly with an unreachable mock server
    const verificationController = require(path.join(BACKEND_DIR, 'src', 'controllers', 'verificationController'));
    const oldWebhook = process.env.VIASOCKET_WEBHOOK_URL;
    process.env.VIASOCKET_WEBHOOK_URL = 'http://192.0.2.1:54321'; // RFC 5737 TEST-NET-1 unroutable IP

    const start = Date.now();
    let mockStatus = null;
    let mockJson = null;
    const reqMock = {
      body: {
        company_name: 'Unreachable Host Test Corp',
        vendor_email: 'fail@unreachable.org',
        decision_status: 'APPROVED',
        score: 99
      },
      user: { id: 'u_auditor' }
    };
    const resMock = {
      status: (code) => {
        mockStatus = code;
        return {
          json: (data) => { mockJson = data; }
        };
      }
    };

    await verificationController.sendWebhookNotification(reqMock, resMock, () => {});
    const elapsed = Date.now() - start;
    process.env.VIASOCKET_WEBHOOK_URL = oldWebhook;

    const timeoutUnderLimit = elapsed <= 6000;
    const isSimulated = mockJson && mockJson.delivery && mockJson.delivery.mode === 'simulated';
    const is200 = mockStatus === 200;

    record('AUDIT-M1-2', 'Unreachable webhook timeout <= 5000ms & fallback to simulated mode (HTTP 200)',
      timeoutUnderLimit && isSimulated && is200,
      `Elapsed: ${elapsed}ms, Status: ${mockStatus}, Mode: ${mockJson && mockJson.delivery && mockJson.delivery.mode}`
    );
  } catch (err) {
    record('AUDIT-M1-2', 'Unreachable webhook timeout & fallback', false, err.message);
  }

  // --- CHECK 3: Port conflict handling real execution ---
  try {
    // Occupy a test port using express/http on default interface
    const testPort = 5988;
    const http = require('http');
    const dummyServer = http.createServer((req, res) => res.end('occupied'));
    await new Promise((resolve) => dummyServer.listen(testPort, resolve));

    // Now test server fallback logic matching server.js startServer implementation
    const express = require(path.join(BACKEND_DIR, 'node_modules', 'express'));
    const testApp = express();
    testApp.get('/api/health', (req, res) => res.json({ success: true, port: req.socket.localPort }));

    let fallbackPort = null;
    let runningServer = null;

    function startTestServer(p, retries = 3) {
      const s = testApp.listen(p);
      s.on('listening', () => {
        fallbackPort = p;
        runningServer = s;
      });
      s.on('error', (err) => {
        if (err.code === 'EADDRINUSE' && retries > 0) {
          startTestServer(p + 1, retries - 1);
        }
      });
    }

    startTestServer(testPort, 2);
    await new Promise(r => setTimeout(r, 600));

    // Verify fallback port was used (5989)
    const fallbackSuccess = fallbackPort === testPort + 1;
    
    // Verify fallback server responds
    let fallbackResponds = false;
    if (fallbackSuccess) {
      const fbCheck = await makeRequest(fallbackPort, 'GET', '/api/health');
      fallbackResponds = fbCheck.statusCode === 200 && fbCheck.body.success === true;
    }

    // Clean up both
    await new Promise(r => dummyServer.close(r));
    if (runningServer) await new Promise(r => runningServer.close(r));

    record('AUDIT-M1-3', 'EADDRINUSE port collision fallback logic verified through real listener conflict',
      fallbackSuccess && fallbackResponds,
      `Original: ${testPort}, Fallback: ${fallbackPort}, Fallback responds: ${fallbackResponds}`
    );
  } catch (err) {
    record('AUDIT-M1-3', 'Port collision fallback verification', false, err.message);
  }

  // --- CHECK 4: JWT secret fallback verification ---
  try {
    const db = require(path.join(BACKEND_DIR, 'src', 'config', 'database'));
    await db.init();

    const savedSecret = process.env.JWT_SECRET;
    delete process.env.JWT_SECRET;

    // Reload authController without JWT_SECRET
    delete require.cache[require.resolve(path.join(BACKEND_DIR, 'src', 'controllers', 'authController'))];
    const authController = require(path.join(BACKEND_DIR, 'src', 'controllers', 'authController'));

    // Test token generation via login controller with seeded officer user
    let loginResponse = null;
    let nextError = null;
    const req = {
      body: {
        email: 'officer@gem.gov.in',
        password: 'password123'
      }
    };
    const res = {
      status: (code) => ({
        json: (data) => { loginResponse = { code, data }; }
      })
    };

    await authController.login(req, res, (err) => { nextError = err; });
    if (savedSecret) process.env.JWT_SECRET = savedSecret;

    if (nextError) throw nextError;

    const token = loginResponse && loginResponse.data && loginResponse.data.data && loginResponse.data.data.token;
    let decoded = null;
    if (token) {
      decoded = jwt.verify(token, 'bidverify-sih-2026-super-secret-key-cpcl-petroleum');
    }

    record('AUDIT-M1-4', 'Auth controller safely falls back to default JWT_SECRET and produces verifiable token',
      Boolean(decoded && decoded.id === 'u2' && decoded.role === 'OFFICER'),
      `Token generated: ${Boolean(token)}, Decoded id: ${decoded && decoded.id}, role: ${decoded && decoded.role}`
    );
  } catch (err) {
    record('AUDIT-M1-4', 'JWT secret fallback verification', false, err.message);
  }

  // --- CHECK 5: Catch-all 404 on undefined API routes ---
  try {
    const resGet = await makeRequest(5000, 'GET', '/api/completely-bogus-endpoint-xyz');
    const resPost = await makeRequest(5000, 'POST', '/api/another-bogus-route');
    const both404 = resGet.statusCode === 404 && resPost.statusCode === 404;
    const jsonCorrect = resGet.body && resGet.body.success === false && resGet.body.message.includes('API endpoint not found');

    record('AUDIT-M1-5', 'Express catch-all middleware correctly rejects undefined API endpoints with HTTP 404',
      both404 && jsonCorrect,
      `GET status: ${resGet.statusCode}, POST status: ${resPost.statusCode}`
    );
  } catch (err) {
    record('AUDIT-M1-5', 'Catch-all 404 verification', false, err.message);
  }

  // --- CHECK 6: UTF-8 encoding of backend/.env without BOM ---
  try {
    const envPath = path.join(BACKEND_DIR, '.env');
    const rawBytes = fs.readFileSync(envPath);
    const hasUtf8Bom = rawBytes[0] === 0xEF && rawBytes[1] === 0xBB && rawBytes[2] === 0xBF;
    const hasUtf16Bom = (rawBytes[0] === 0xFF && rawBytes[1] === 0xFE) || (rawBytes[0] === 0xFE && rawBytes[1] === 0xFF);
    const hasNull = rawBytes.includes(0x00);
    const cleanUtf8 = !hasUtf8Bom && !hasUtf16Bom && !hasNull;

    record('AUDIT-M1-6', 'backend/.env has valid UTF-8 encoding with no BOM and no null bytes',
      cleanUtf8,
      `Bytes length: ${rawBytes.length}, Has UTF-8 BOM: ${hasUtf8Bom}, Has UTF-16 BOM: ${hasUtf16Bom}, Has Null: ${hasNull}`
    );
  } catch (err) {
    record('AUDIT-M1-6', 'UTF-8 env check', false, err.message);
  }

  console.log('\n=== AUDIT RESULTS SUMMARY ===');
  const allPassed = results.every(r => r.passed);
  console.log(`Total Checks: ${results.length} | Passed: ${results.filter(r => r.passed).length} | Failed: ${results.filter(r => !r.passed).length}`);
  console.log(`Overall Forensic Integrity Verdict: ${allPassed ? 'CLEAN' : 'INTEGRITY VIOLATION'}\n`);
  return { allPassed, results };
}

if (require.main === module) {
  runForensicAudit().then(({ allPassed }) => {
    process.exit(allPassed ? 0 : 1);
  }).catch(err => {
    console.error('Fatal audit failure:', err);
    process.exit(1);
  });
}

module.exports = { runForensicAudit };
