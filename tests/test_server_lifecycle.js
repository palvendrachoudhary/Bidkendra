const http = require('http');
const net = require('net');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const BACKEND_DIR = path.join(PROJECT_ROOT, 'backend');
const SERVER_PATH = path.join(BACKEND_DIR, 'src', 'server.js');

/**
 * Helper to make HTTP requests
 */
function httpRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let parsed = data;
        try { parsed = JSON.parse(data); } catch (e) {}
        resolve({ statusCode: res.statusCode, headers: res.headers, body: parsed, rawBody: data });
      });
    });
    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error(`HTTP request timed out after 5000ms: ${options.path}`));
    });
    if (postData) {
      if (typeof postData === 'string' || Buffer.isBuffer(postData)) {
        req.write(postData);
      } else {
        req.write(JSON.stringify(postData));
      }
    }
    req.end();
  });
}

/**
 * Check if a port is currently listening
 */
function isPortInUse(port) {
  return new Promise((resolve) => {
    const client = new net.Socket();
    client.once('connect', () => {
      client.destroy();
      resolve(true);
    });
    client.once('error', () => {
      client.destroy();
      resolve(false);
    });
    client.connect(port, '127.0.0.1');
  });
}

/**
 * Test Suite: Server Lifecycle & Startup
 */
async function runServerLifecycleTests() {
  const results = [];
  const startSuiteTime = Date.now();

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

  // T1.3.1: Verify server health endpoint on active port
  await recordTest('T1.3.1', 'Server responds to /api/health with HTTP 200 and success: true', 'Tier 1', async () => {
    const inUse5000 = await isPortInUse(5000);
    const inUse5001 = await isPortInUse(5001);
    const activePort = inUse5000 ? 5000 : (inUse5001 ? 5001 : null);

    if (!activePort) {
      throw new Error('No backend server running on port 5000 or 5001. Please start server via node src/server.js.');
    }

    const res = await httpRequest({
      hostname: 'localhost',
      port: activePort,
      path: '/api/health',
      method: 'GET'
    });

    if (res.statusCode !== 200) {
      throw new Error(`Expected HTTP 200, received ${res.statusCode}`);
    }
    if (!res.body || res.body.success !== true) {
      throw new Error(`Expected body.success === true, received ${JSON.stringify(res.body)}`);
    }
  });

  // T1.3.2: Verify Server Port Conflict Handling (EADDRINUSE resilience)
  await recordTest('T1.3.2', 'Server intercepts port collision and handles conflict gracefully', 'Tier 1', async () => {
    // Check server.js code for EADDRINUSE handling or test running dummy collision process
    const serverSource = fs.readFileSync(SERVER_PATH, 'utf8');
    const hasEaddrinuseHandler = serverSource.includes('EADDRINUSE') || 
                                 serverSource.includes('address already in use') ||
                                 serverSource.includes('server.on(\'error\'');

    if (!hasEaddrinuseHandler) {
      throw new Error('EADDRINUSE port collision handler not detected in server.js. Server will crash if port is occupied.');
    }
  });

  // T1.3.3: Verify Health Check response structure
  await recordTest('T1.3.3', 'Health check API payload contains informative running message', 'Tier 1', async () => {
    const inUse5000 = await isPortInUse(5000);
    const port = inUse5000 ? 5000 : 5001;
    const res = await httpRequest({
      hostname: 'localhost',
      port: port,
      path: '/api/health',
      method: 'GET'
    });

    if (!res.body || typeof res.body.message !== 'string' || !res.body.message.includes('BidVerify AI')) {
      throw new Error(`Expected message containing 'BidVerify AI', received ${JSON.stringify(res.body)}`);
    }
  });

  // T1.3.4: Verify Graceful Shutdown Handlers in server source
  await recordTest('T1.3.4', 'Server registers SIGINT/SIGTERM handlers for database state preservation', 'Tier 1', async () => {
    const serverSource = fs.readFileSync(SERVER_PATH, 'utf8');
    const hasSigint = serverSource.includes('SIGINT');
    const hasSigterm = serverSource.includes('SIGTERM');

    if (!hasSigint && !hasSigterm) {
      throw new Error('Neither SIGINT nor SIGTERM shutdown hooks found in server.js. In-memory SQLite state may be lost on restart.');
    }
  });

  // T1.3.5: Verify Static Asset Serving Safety (Index fallback check)
  await recordTest('T1.3.5', 'Static catch-all checks existence of dist/index.html to prevent 500 crash', 'Tier 1', async () => {
    const serverSource = fs.readFileSync(SERVER_PATH, 'utf8');
    const hasFileExistenceCheck = serverSource.includes('existsSync') || 
                                  serverSource.includes('frontend/dist/index.html') && serverSource.includes('fs.');

    // Alternatively test via HTTP request to non-existent route
    const inUse5000 = await isPortInUse(5000);
    if (inUse5000) {
      const res = await httpRequest({
        hostname: 'localhost',
        port: 5000,
        path: '/some/unmatched/spa/route',
        method: 'GET'
      });
      // Should not return 500 Internal Server Error
      if (res.statusCode === 500) {
        throw new Error('Request to SPA route returned 500 Internal Server Error due to missing index.html check');
      }
    } else if (!hasFileExistenceCheck) {
      throw new Error('server.js blindly executes res.sendFile without checking if dist/index.html exists');
    }
  });

  // --- Tier 2: Boundary & Corner Cases ---

  // T2.1.1: Request invalid API endpoint returns 404 cleanly
  await recordTest('T2.1.1', 'Server returns clean 404 on undefined API endpoints', 'Tier 2', async () => {
    const inUse = await isPortInUse(5000);
    const port = inUse ? 5000 : 5001;
    const res = await httpRequest({
      hostname: 'localhost',
      port: port,
      path: '/api/non_existent_endpoint_xyz',
      method: 'GET'
    });

    if (res.statusCode !== 404) {
      throw new Error(`Expected HTTP 404 for non-existent endpoint, received ${res.statusCode}`);
    }
  });

  // T2.1.2: Environment UTF-8 Encoding Verification
  await recordTest('T2.1.2', 'backend/.env is UTF-8 encoded without BOM', 'Tier 2', async () => {
    const envPath = path.join(BACKEND_DIR, '.env');
    if (!fs.existsSync(envPath)) {
      throw new Error('backend/.env does not exist');
    }
    const rawBytes = fs.readFileSync(envPath);
    // Check for UTF-16LE BOM (FF FE) or UTF-16BE (FE FF)
    if (rawBytes.length >= 2 && ((rawBytes[0] === 0xFF && rawBytes[1] === 0xFE) || (rawBytes[0] === 0xFE && rawBytes[1] === 0xFF))) {
      throw new Error('backend/.env is encoded in UTF-16 with BOM; dotenv cannot parse this correctly');
    }
    // Check for null bytes (typical in UTF-16)
    if (rawBytes.includes(0x00)) {
      throw new Error('backend/.env contains null bytes indicative of UTF-16 encoding');
    }
  });

  // T2.1.3: JWT Secret Fallback in auth controller
  await recordTest('T2.1.3', 'JWT token generation has fallback to prevent unhandled secret crashes', 'Tier 2', async () => {
    const authControllerPath = path.join(BACKEND_DIR, 'src', 'controllers', 'authController.js');
    const authSource = fs.readFileSync(authControllerPath, 'utf8');
    const hasSecretFallback = authSource.includes('process.env.JWT_SECRET ||') || 
                              authSource.includes("|| '");

    if (!hasSecretFallback) {
      throw new Error('authController.js lacks JWT_SECRET fallback. Token generation crashes when JWT_SECRET is unset.');
    }
  });

  // T2.1.4: CORS Headers configured
  await recordTest('T2.1.4', 'Server responds with permissive CORS headers for GeM/CPCL portal access', 'Tier 2', async () => {
    const inUse = await isPortInUse(5000);
    const port = inUse ? 5000 : 5001;
    const res = await httpRequest({
      hostname: 'localhost',
      port: port,
      path: '/api/health',
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:5173',
        'Access-Control-Request-Method': 'POST'
      }
    });

    if (res.statusCode !== 200 && res.statusCode !== 204) {
      // If OPTIONS isn't handled by endpoint directly, check GET response headers
      const getRes = await httpRequest({
        hostname: 'localhost',
        port: port,
        path: '/api/health',
        method: 'GET'
      });
      if (!getRes.headers['access-control-allow-origin']) {
        throw new Error('CORS access-control-allow-origin header missing from response');
      }
    }
  });

  // T2.1.5: Helmet Security Headers configured
  await recordTest('T2.1.5', 'Server attaches Helmet security headers on API responses', 'Tier 2', async () => {
    const inUse = await isPortInUse(5000);
    const port = inUse ? 5000 : 5001;
    const res = await httpRequest({
      hostname: 'localhost',
      port: port,
      path: '/api/health',
      method: 'GET'
    });

    const hasSecurityHeader = res.headers['x-content-type-options'] || res.headers['x-frame-options'];
    if (!hasSecurityHeader) {
      throw new Error('Expected Helmet security headers (e.g. x-content-type-options), but none detected');
    }
  });

  return results;
}

if (require.main === module) {
  runServerLifecycleTests().then(results => {
    console.log('\n=== SERVER LIFECYCLE & STARTUP TEST RESULTS ===\n');
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

module.exports = { runServerLifecycleTests };
