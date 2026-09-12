/**
 * Empirical Challenge Suite: Server Lifecycle & Port Management
 * Author: Challenger M1_2
 *
 * Objectives:
 * 1. Pre-bind port 5000 with a dummy socket, then launch backend server to verify EADDRINUSE resilience.
 * 2. Pre-bind multiple cascading ports (5000, 5001) to verify multiple fallback attempts.
 * 3. Challenge port exhaustion behavior when maxRetries is exceeded.
 * 4. Verify graceful shutdown flushes data and closes cleanly on SIGINT and SIGTERM.
 * 5. Verify database persistence on disk across graceful shutdown.
 * 6. Verify that all test processes and sockets terminate promptly without hanging.
 */

const net = require('net');
const http = require('http');
const path = require('path');
const fs = require('fs');
const { spawn, execSync } = require('child_process');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const BACKEND_DIR = path.join(PROJECT_ROOT, 'backend');
const DB_PATH = path.join(BACKEND_DIR, 'gem_bid_verify.db');

// Helper to check if a port is listening on either IPv6 [::1] or IPv4 127.0.0.1
function isPortListening(port) {
  return new Promise((resolve) => {
    let resolved = false;

    const tryV4 = () => {
      const s4 = new net.Socket();
      s4.on('error', () => {
        s4.destroy();
        if (!resolved) {
          resolved = true;
          resolve(false);
        }
      });
      s4.once('connect', () => {
        if (!resolved) {
          resolved = true;
          s4.end();
          s4.destroy();
          resolve(true);
        }
      });
      s4.connect(port, '127.0.0.1');
    };

    const tryV6 = () => {
      const s6 = new net.Socket();
      s6.on('error', () => {
        s6.destroy();
        if (!resolved) tryV4();
      });
      s6.once('connect', () => {
        if (!resolved) {
          resolved = true;
          s6.end();
          s6.destroy();
          resolve(true);
        }
      });
      s6.connect(port, '::1');
    };

    tryV6();
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
      setTimeout(check, 200);
    };
    check();
  });
}

function waitForPortToFree(port, timeoutMs = 8000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = async () => {
      const listening = await isPortListening(port);
      if (!listening) return resolve(true);
      if (Date.now() - start > timeoutMs) {
        return reject(new Error(`Port ${port} was not released within ${timeoutMs}ms`));
      }
      setTimeout(check, 200);
    };
    check();
  });
}

function httpRequest({ hostname = 'localhost', port, path = '/', method = 'GET', headers = {}, timeout = 10000 }, postData = null) {
  return new Promise((resolve, reject) => {
    let payload = null;
    const reqHeaders = { ...headers };
    if (postData !== null) {
      payload = typeof postData === 'string' ? postData : JSON.stringify(postData);
      if (!reqHeaders['Content-Type']) {
        reqHeaders['Content-Type'] = 'application/json';
      }
      reqHeaders['Content-Length'] = Buffer.byteLength(payload);
    }

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
        let parsed = null;
        try { parsed = JSON.parse(rawData); } catch (e) { parsed = rawData; }
        resolve({ statusCode: res.statusCode, headers: res.headers, body: parsed, rawBody: rawData });
      });
    });

    req.on('error', reject);
    req.setTimeout(timeout, () => {
      req.destroy();
      reject(new Error(`HTTP request to ${path} timed out after ${timeout}ms`));
    });

    if (payload !== null) req.write(payload);
    req.end();
  });
}

// In Node.js on Windows, app.listen(port) defaults to binding '::' (IPv6 dual-stack).
// Binding dummy sockets on '::' triggers EADDRINUSE in Express on port conflict.
function createDummyServer(port) {
  return new Promise((resolve, reject) => {
    const server = net.createServer((socket) => {
      socket.on('error', () => {});
      socket.write('HTTP/1.1 200 OK\r\nContent-Length: 5\r\n\r\nDUMMY');
      socket.end();
    });
    server.on('error', (e) => reject(e));
    server.listen(port, '::', () => {
      resolve({
        server,
        port,
        close: () => new Promise((res) => server.close(res))
      });
    });
  });
}

function killProcessSafely(proc) {
  return new Promise((resolve) => {
    if (!proc || !proc.pid) return resolve();
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

// --- Main Challenge Runner ---

async function runChallenge() {
  console.log('===============================================================');
  console.log('   CHALLENGER M1_2: SERVER LIFECYCLE & PORT EMPIRICAL SUITE     ');
  console.log('   Targets: EADDRINUSE Resilience, Graceful Shutdown, DB Flush ');
  console.log('===============================================================\n');

  const results = [];
  const findings = [];
  const startTime = Date.now();

  async function recordTest(id, name, testFn) {
    const t0 = Date.now();
    try {
      await testFn();
      const dur = Date.now() - t0;
      results.push({ id, name, pass: true, durationMs: dur });
      console.log(`[CHALLENGE] ${id.padEnd(20)}: ${name} -> ? PASS (${dur}ms)`);
    } catch (err) {
      const dur = Date.now() - t0;
      results.push({ id, name, pass: false, error: err.message, durationMs: dur });
      console.log(`[CHALLENGE] ${id.padEnd(20)}: ${name} -> ? FAIL (${dur}ms)`);
      console.log(`   Error: ${err.message}`);
    }
  }

  // Ensure baseline clean state: ports 5000-5006 free
  for (let p = 5000; p <= 5006; p++) {
    const inUse = await isPortListening(p);
    if (inUse) {
      console.warn(`?? Warning: Port ${p} was in use prior to test. Waiting for release...`);
      await waitForPortToFree(p, 5000);
    }
  }

  // ----------------------------------------------------------------
  // CHALLENGE 1: Pre-bind Port 5000 with Dummy Socket -> Auto-fallback to 5001
  // ----------------------------------------------------------------
  await recordTest('CHAL-PORT-01', 'Pre-bind port 5000 with dummy socket; backend detects EADDRINUSE and binds 5001', async () => {
    const dummy = await createDummyServer(5000);
    let backendProc = null;
    let stdoutData = '';
    let stderrData = '';

    try {
      backendProc = spawn('node', ['src/server.js'], {
        cwd: BACKEND_DIR,
        env: { ...process.env, PORT: '5000', NODE_ENV: 'test' },
        stdio: 'pipe'
      });

      backendProc.stdout.on('data', d => stdoutData += d.toString());
      backendProc.stderr.on('data', d => stderrData += d.toString());

      // Wait for port 5001 to open
      await waitForPort(5001, 8000);

      // Verify log message shows EADDRINUSE warning and fallback to 5001
      const combinedLogs = stdoutData + stderrData;
      const detectedWarning = combinedLogs.includes('Port 5000 is in use (EADDRINUSE). Attempting fallback to port 5001');
      if (!detectedWarning) {
        throw new Error(`Expected EADDRINUSE fallback warning in logs, got:\n${combinedLogs}`);
      }

      // Verify HTTP /api/health responds on port 5001
      const health = await httpRequest({ port: 5001, path: '/api/health' });
      if (health.statusCode !== 200 || !health.body || health.body.success !== true) {
        throw new Error(`Health check on port 5001 failed: ${JSON.stringify(health.body)}`);
      }

      // Verify dummy socket on 5000 is intact
      const dummyInUse = await isPortListening(5000);
      if (!dummyInUse) {
        throw new Error('Dummy socket on 5000 was unexpectedly closed or killed');
      }

      // Verify /api/verify/notify responds on fallback port 5001
      const notifyRes = await httpRequest({
        port: 5001,
        path: '/api/verify/notify',
        method: 'POST'
      }, {
        company_name: 'Fallback Test Ltd',
        vendor_email: 'fallback@test.gov.in',
        decision_status: 'APPROVED',
        score: 95
      });
      if (notifyRes.statusCode !== 200 || !notifyRes.body.success) {
        throw new Error(`POST /api/verify/notify on port 5001 failed: ${JSON.stringify(notifyRes.body)}`);
      }
    } finally {
      if (backendProc) await killProcessSafely(backendProc);
      await dummy.close();
      await waitForPortToFree(5000, 4000);
      await waitForPortToFree(5001, 4000);
    }
  });

  // ----------------------------------------------------------------
  // CHALLENGE 2: Multi-port Cascade (Pre-bind 5000 AND 5001) -> Fallback to 5002
  // ----------------------------------------------------------------
  await recordTest('CHAL-PORT-02', 'Pre-bind ports 5000 AND 5001; backend cascades to port 5002', async () => {
    const dummy1 = await createDummyServer(5000);
    const dummy2 = await createDummyServer(5001);
    let backendProc = null;
    let stdoutData = '';
    let stderrData = '';

    try {
      backendProc = spawn('node', ['src/server.js'], {
        cwd: BACKEND_DIR,
        env: { ...process.env, PORT: '5000', NODE_ENV: 'test' },
        stdio: 'pipe'
      });

      backendProc.stdout.on('data', d => stdoutData += d.toString());
      backendProc.stderr.on('data', d => stderrData += d.toString());

      // Wait for port 5002 to open
      await waitForPort(5002, 8000);

      const combinedLogs = stdoutData + stderrData;
      const saw5000 = combinedLogs.includes('Port 5000 is in use (EADDRINUSE). Attempting fallback to port 5001');
      const saw5001 = combinedLogs.includes('Port 5001 is in use (EADDRINUSE). Attempting fallback to port 5002');

      if (!saw5000 || !saw5001) {
        throw new Error(`Missing expected cascade log messages. Logs:\n${combinedLogs}`);
      }

      // Verify health check on 5002
      const health = await httpRequest({ port: 5002, path: '/api/health' });
      if (health.statusCode !== 200 || !health.body.success) {
        throw new Error(`Health check on port 5002 failed: ${JSON.stringify(health.body)}`);
      }
    } finally {
      if (backendProc) await killProcessSafely(backendProc);
      await dummy1.close();
      await dummy2.close();
      await waitForPortToFree(5000, 4000);
      await waitForPortToFree(5001, 4000);
      await waitForPortToFree(5002, 4000);
    }
  });

  // ----------------------------------------------------------------
  // CHALLENGE 3: Port Exhaustion Beyond maxRetries
  // ----------------------------------------------------------------
  await recordTest('CHAL-PORT-03', 'Port exhaustion (5000..5003 occupied): server logs max retries error without crashing', async () => {
    const dummies = [];
    for (let p = 5000; p <= 5003; p++) {
      dummies.push(await createDummyServer(p));
    }

    let backendProc = null;
    let stdoutData = '';
    let stderrData = '';

    try {
      backendProc = spawn('node', ['src/server.js'], {
        cwd: BACKEND_DIR,
        env: { ...process.env, PORT: '5000', NODE_ENV: 'test' },
        stdio: 'pipe'
      });

      backendProc.stdout.on('data', d => stdoutData += d.toString());
      backendProc.stderr.on('data', d => stderrData += d.toString());

      await new Promise(r => setTimeout(r, 3000));

      const combinedLogs = stdoutData + stderrData;
      const sawExceeded = combinedLogs.includes('max retries exceeded');
      if (!sawExceeded) {
        throw new Error(`Server did not log max retries exceeded:\n${combinedLogs}`);
      }

      // Check whether process exited or remained hanging
      const isStillAlive = backendProc.exitCode === null;
      if (isStillAlive) {
        findings.push({
          severity: 'MEDIUM',
          title: 'Process hangs on port exhaustion without calling process.exit(1)',
          description: 'When all retry ports are occupied (maxRetries exceeded), server.js logs an error but does not exit the process. The database auto-save timer keeps the process running indefinitely without an active HTTP listener.'
        });
      }
    } finally {
      if (backendProc) await killProcessSafely(backendProc);
      for (const d of dummies) {
        await d.close();
      }
      for (let p = 5000; p <= 5003; p++) {
        await waitForPortToFree(p, 4000);
      }
    }
  });

  // ----------------------------------------------------------------
  // CHALLENGE 4: Graceful Shutdown & Database State Preservation (SIGINT)
  // ----------------------------------------------------------------
  await recordTest('CHAL-SHUTDOWN-01', 'Graceful shutdown on SIGINT invokes db.save(), flushes to disk, and closes cleanly', async () => {
    const testRunnerCode = `
      const fs = require('fs');
      const path = require('path');
      const db = require('./src/config/database');
      const app = require('./src/server');

      async function testGraceful() {
        await db.ready;
        const testId = 'audit_chal_' + Date.now();
        const testAction = 'GRACEFUL_SHUTDOWN_TEST';
        
        // Insert a unique test record directly into SQLite
        db.prepare('INSERT INTO audit_logs (id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)')
          .run(testId, testAction, 'CHALLENGER', 'CHAL_M1_2', 'Checking disk persistence on graceful shutdown');

        console.log('AUDIT_RECORD_INSERTED:' + testId);

        // Wait a brief moment for server to be fully listening
        await new Promise(r => setTimeout(r, 1000));

        // Listen for exit
        process.on('exit', (code) => {
          console.log('EXIT_CODE:' + code);
        });

        // Trigger graceful shutdown hook via SIGINT
        console.log('TRIGGERING_SIGINT');
        process.emit('SIGINT');
      }

      testGraceful().catch(err => {
        console.error('Graceful test runner error:', err);
        process.exit(1);
      });
    `;

    const runnerPath = path.join(BACKEND_DIR, 'temp_shutdown_challenge.js');
    fs.writeFileSync(runnerPath, testRunnerCode);

    let child = null;
    let out = '';
    let err = '';

    try {
      child = spawn('node', ['temp_shutdown_challenge.js'], {
        cwd: BACKEND_DIR,
        env: { ...process.env, PORT: '5004', NODE_ENV: 'test' },
        stdio: 'pipe'
      });

      child.stdout.on('data', d => out += d.toString());
      child.stderr.on('data', d => err += d.toString());

      const exitPromise = new Promise((resolve, reject) => {
        child.on('exit', (code) => resolve(code));
        setTimeout(() => reject(new Error('Graceful shutdown process did not exit within 6000ms')), 6000);
      });

      const exitCode = await exitPromise;
      if (exitCode !== 0) {
        throw new Error(`Expected clean exit code 0, received ${exitCode}. Stderr: ${err}`);
      }

      // Verify output messages
      if (!out.includes('Received SIGINT. Initiating graceful shutdown')) {
        throw new Error(`Graceful shutdown signal not received. Output:\n${out}`);
      }
      if (!out.includes('Database state flushed to disk')) {
        throw new Error(`Database state was not flushed during shutdown. Output:\n${out}`);
      }
      if (!out.includes('HTTP server closed cleanly')) {
        throw new Error(`HTTP server did not close cleanly. Output:\n${out}`);
      }

      // Extract inserted testId and verify disk persistence
      const match = out.match(/AUDIT_RECORD_INSERTED:([a-zA-Z0-9_]+)/);
      if (!match) {
        throw new Error('Test record ID was not generated');
      }
      const testId = match[1];

      // Read database file directly from disk using backend's sql.js
      const initSqlJs = require(path.join(BACKEND_DIR, 'node_modules', 'sql.js'));
      const SQL = await initSqlJs();
      const diskData = fs.readFileSync(DB_PATH);
      const verifyDb = new SQL.Database(diskData);
      const stmt = verifyDb.prepare('SELECT id, action, entity_id FROM audit_logs WHERE id = ?');
      stmt.bind([testId]);
      const found = stmt.step();
      let row = null;
      if (found) {
        const vals = stmt.get();
        row = { id: vals[0], action: vals[1], entity_id: vals[2] };
      }
      stmt.free();

      if (!row || row.id !== testId) {
        throw new Error(`Record ${testId} was not persisted to disk in gem_bid_verify.db during graceful shutdown!`);
      }

      // Verify port 5004 is free
      await waitForPortToFree(5004, 3000);
    } finally {
      if (child) await killProcessSafely(child);
      if (fs.existsSync(runnerPath)) fs.unlinkSync(runnerPath);
      await waitForPortToFree(5004, 3000);
    }
  });

  // ----------------------------------------------------------------
  // CHALLENGE 5: Graceful Shutdown on SIGTERM
  // ----------------------------------------------------------------
  await recordTest('CHAL-SHUTDOWN-02', 'Graceful shutdown on SIGTERM invokes db.save() and exits cleanly with code 0', async () => {
    const testRunnerCode = `
      const fs = require('fs');
      const path = require('path');
      const db = require('./src/config/database');
      const app = require('./src/server');

      async function testSigterm() {
        await db.ready;
        await new Promise(r => setTimeout(r, 1000));
        console.log('TRIGGERING_SIGTERM');
        process.emit('SIGTERM');
      }

      testSigterm().catch(err => {
        console.error('SIGTERM test error:', err);
        process.exit(1);
      });
    `;

    const runnerPath = path.join(BACKEND_DIR, 'temp_sigterm_challenge.js');
    fs.writeFileSync(runnerPath, testRunnerCode);

    let child = null;
    let out = '';
    let err = '';

    try {
      child = spawn('node', ['temp_sigterm_challenge.js'], {
        cwd: BACKEND_DIR,
        env: { ...process.env, PORT: '5005', NODE_ENV: 'test' },
        stdio: 'pipe'
      });

      child.stdout.on('data', d => out += d.toString());
      child.stderr.on('data', d => err += d.toString());

      const exitPromise = new Promise((resolve, reject) => {
        child.on('exit', (code) => resolve(code));
        setTimeout(() => reject(new Error('SIGTERM shutdown did not exit within 6000ms')), 6000);
      });

      const exitCode = await exitPromise;
      if (exitCode !== 0) {
        throw new Error(`Expected exit code 0 on SIGTERM, got ${exitCode}. Stderr: ${err}`);
      }

      if (!out.includes('Received SIGTERM. Initiating graceful shutdown')) {
        throw new Error(`SIGTERM was not handled. Output:\n${out}`);
      }
      if (!out.includes('Database state flushed to disk')) {
        throw new Error(`Database was not flushed on SIGTERM. Output:\n${out}`);
      }
      if (!out.includes('HTTP server closed cleanly')) {
        throw new Error(`HTTP server did not close cleanly on SIGTERM. Output:\n${out}`);
      }

      await waitForPortToFree(5005, 3000);
    } finally {
      if (child) await killProcessSafely(child);
      if (fs.existsSync(runnerPath)) fs.unlinkSync(runnerPath);
      await waitForPortToFree(5005, 3000);
    }
  });

  // ----------------------------------------------------------------
  // CHALLENGE 6: Prompt Termination of Test Processes & Zero Hanging Sockets
  // ----------------------------------------------------------------
  await recordTest('CHAL-CLEAN-01', 'All ports (5000-5006) are released promptly and zero orphan processes remain', async () => {
    for (let p = 5000; p <= 5006; p++) {
      const listening = await isPortListening(p);
      if (listening) {
        throw new Error(`Port ${p} is still open after tests! Socket leak detected.`);
      }
    }
  });

  // ----------------------------------------------------------------
  // Summary
  // ----------------------------------------------------------------
  const total = results.length;
  const passed = results.filter(r => r.pass).length;
  const failed = total - passed;
  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('\n===============================================================');
  console.log('   CHALLENGER M1_2: EMPIRICAL CHALLENGE EXECUTION SUMMARY      ');
  console.log('===============================================================');
  console.log(` Total Scenarios Tested       : ${total}`);
  console.log(` Passed                       : ${passed}`);
  console.log(` Failed                       : ${failed}`);
  console.log(` Total Duration               : ${durationSec}s`);

  if (findings.length > 0) {
    console.log('\n--- EMPIRICAL FINDINGS & OBSERVATIONS ---');
    findings.forEach((f, i) => {
      console.log(`\nFinding #${i+1} [${f.severity}]: ${f.title}`);
      console.log(`Details: ${f.description}`);
    });
  }
  console.log('===============================================================\n');

  if (failed > 0) {
    console.error(`? ${failed} challenge scenario(s) failed.`);
    process.exit(1);
  } else {
    console.log('? ALL SERVER LIFECYCLE & PORT CHALLENGES PASSED EMPIRICALLY!\n');
    process.exit(0);
  }
}

if (require.main === module) {
  runChallenge().catch(err => {
    console.error('Fatal Challenge Suite Error:', err);
    process.exit(1);
  });
}

module.exports = { runChallenge };
