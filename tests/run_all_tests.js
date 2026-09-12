/**
 * Master Opaque-Box Automated Test Runner for BidVerify AI
 * Executes all modular test suites across Tiers 1-4, aggregates metrics, and formats audit report.
 * 
 * Usage:
 *   node tests/run_all_tests.js
 *   node tests/run_all_tests.js --tier 1
 *   node tests/run_all_tests.js --verbose
 */

const fs = require('fs');
const path = require('path');
const net = require('net');
const { spawn } = require('child_process');

const { runServerLifecycleTests } = require('./test_server_lifecycle');
const { runWebhookNotifyTests } = require('./test_webhook_notify');
const { runDocumentVerificationTests } = require('./test_document_verification');
const { runStatutoryVerifierTests } = require('./test_statutory_verifiers');
const { runFrontendBuildTests } = require('./test_frontend_build');
const { runE2EScenarioTests } = require('./test_e2e_scenarios');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const BACKEND_DIR = path.join(PROJECT_ROOT, 'backend');
const RESULTS_PATH = path.join(__dirname, 'test_results.json');

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
      setTimeout(check, 300);
    };
    check();
  });
}

async function main() {
  console.log('===============================================================');
  console.log('       BIDVERIFY AI — AUTOMATED OPAQUE-BOX TEST HARNESS        ');
  console.log('  Ministry of Petroleum & Natural Gas / CPCL Tender Platform   ');
  console.log('===============================================================\n');

  const args = process.argv.slice(2);
  const targetTierArg = args.find(a => a.startsWith('--tier=') || a === '--tier');
  let filteredTier = null;
  if (targetTierArg) {
    filteredTier = targetTierArg.includes('=') ? targetTierArg.split('=')[1] : args[args.indexOf('--tier') + 1];
    if (filteredTier && !filteredTier.startsWith('Tier')) filteredTier = 'Tier ' + filteredTier;
    console.log(`🔍 Filter active: Running only ${filteredTier} tests\n`);
  }

  // 1. Determine Backend Server Availability
  let spawnedServer = null;
  let activePort = 5000;
  const is5000Running = await isPortListening(5000);

  if (is5000Running) {
    console.log('📡 Connected to active backend server on port 5000.\n');
  } else {
    console.log('⚙️  No running backend server detected on port 5000. Launching ephemeral test instance...');
    try {
      spawnedServer = spawn('node', ['src/server.js'], {
        cwd: BACKEND_DIR,
        env: { ...process.env, PORT: '5000', NODE_ENV: 'test' },
        stdio: 'pipe'
      });

      spawnedServer.stdout.on('data', (d) => {
        // optionally log server output if verbose
      });

      spawnedServer.stderr.on('data', (d) => {
        // optionally log server errors
      });

      await waitForPort(5000, 7000);
      console.log('✅ Ephemeral test server successfully started on port 5000.\n');
    } catch (err) {
      console.warn(`⚠️  Could not launch server on port 5000 (${err.message}). Attempting port 5001...`);
      const is5001 = await isPortListening(5001);
      if (is5001) {
        activePort = 5001;
        console.log('📡 Connected to server on port 5001.\n');
      }
    }
  }

  const allResults = [];
  const startTime = Date.now();

  async function executeSuite(suiteName, suiteFn, ...args) {
    console.log(`▶ Running Suite: ${suiteName}...`);
    try {
      const suiteResults = await suiteFn(...args);
      suiteResults.forEach(r => {
        r.suite = suiteName;
        allResults.push(r);
        const icon = r.pass ? '✅ PASS' : '❌ FAIL';
        console.log(`  [${r.tier}] ${r.id.padEnd(8)}: ${r.name} -> ${icon} (${r.durationMs}ms)`);
        if (!r.pass) {
          console.log(`     Error: ${r.error}`);
        }
      });
    } catch (err) {
      console.error(`  💥 Suite ${suiteName} encountered critical execution error:`, err.message);
      allResults.push({
        id: 'SUITE_ERR',
        suite: suiteName,
        name: `Suite execution: ${suiteName}`,
        tier: 'System',
        pass: false,
        error: err.message,
        durationMs: 0
      });
    }
    console.log('');
  }

  // 2. Execute Modular Test Suites
  await executeSuite('Statutory Verifiers', runStatutoryVerifierTests);
  await executeSuite('Frontend Build & UI Integrity', runFrontendBuildTests);
  await executeSuite('Server Lifecycle & Startup', runServerLifecycleTests);
  await executeSuite('Webhook Notification Gateway', runWebhookNotifyTests, activePort);
  await executeSuite('Document Verification & OCR Pipeline', runDocumentVerificationTests, activePort);
  await executeSuite('E2E Scenarios & Cross-Feature', runE2EScenarioTests, activePort);

  // 3. Teardown Ephemeral Server if spawned
  if (spawnedServer) {
    console.log('🛑 Tearing down ephemeral test server...');
    spawnedServer.kill('SIGINT');
    await new Promise(r => setTimeout(r, 800));
  }

  // 4. Filter if Tier Specified
  const evaluatedResults = filteredTier 
    ? allResults.filter(r => r.tier === filteredTier || r.tier === 'System')
    : allResults;

  // 5. Calculate Metrics Across Tiers
  const totalDuration = Date.now() - startTime;
  const tierStats = {
    'Tier 1': { total: 0, passed: 0, failed: 0 },
    'Tier 2': { total: 0, passed: 0, failed: 0 },
    'Tier 3': { total: 0, passed: 0, failed: 0 },
    'Tier 4': { total: 0, passed: 0, failed: 0 },
    'Other':  { total: 0, passed: 0, failed: 0 }
  };

  let totalPassed = 0;
  let totalFailed = 0;

  evaluatedResults.forEach(r => {
    const tierKey = tierStats[r.tier] ? r.tier : 'Other';
    tierStats[tierKey].total++;
    if (r.pass) {
      tierStats[tierKey].passed++;
      totalPassed++;
    } else {
      tierStats[tierKey].failed++;
      totalFailed++;
    }
  });

  // 6. Print Formatted Summary Report
  console.log('===============================================================');
  console.log('                  COMPREHENSIVE TEST REPORT                    ');
  console.log('===============================================================');
  console.log(' Tier Breakdown:');
  console.log(' -------------------------------------------------------------');
  console.log(' Tier                         | Total | Passed | Failed | Pass Rate');
  console.log(' -----------------------------+-------+--------+--------+----------');

  Object.entries(tierStats).forEach(([tier, stats]) => {
    if (stats.total > 0) {
      const rate = stats.total > 0 ? ((stats.passed / stats.total) * 100).toFixed(1) : '0.0';
      console.log(` ${tier.padEnd(28)} | ${String(stats.total).padStart(5)} | ${String(stats.passed).padStart(6)} | ${String(stats.failed).padStart(6)} | ${rate.padStart(7)}%`);
    }
  });

  console.log(' -------------------------------------------------------------');
  const overallRate = evaluatedResults.length > 0 ? ((totalPassed / evaluatedResults.length) * 100).toFixed(1) : '0.0';
  console.log(` Total Tests Executed         : ${evaluatedResults.length}`);
  console.log(` Passed                       : ${totalPassed}`);
  console.log(` Failed                       : ${totalFailed}`);
  console.log(` Overall Pass Rate            : ${overallRate}%`);
  console.log(` Total Execution Time         : ${(totalDuration / 1000).toFixed(2)}s`);
  console.log('===============================================================\n');

  // 7. Save JSON Test Results
  const reportPayload = {
    timestamp: new Date().toISOString(),
    totalDurationMs: totalDuration,
    summary: {
      total: evaluatedResults.length,
      passed: totalPassed,
      failed: totalFailed,
      passRate: parseFloat(overallRate)
    },
    tierBreakdown: tierStats,
    results: evaluatedResults
  };

  fs.writeFileSync(RESULTS_PATH, JSON.stringify(reportPayload, null, 2), 'utf8');
  console.log(`📄 Machine-readable audit report saved to: ${RESULTS_PATH}\n`);

  if (totalFailed > 0) {
    console.log(`⚠️  ${totalFailed} test(s) failed. See diagnostic details above.\n`);
    process.exit(1);
  } else {
    console.log('🎉 ALL TESTS PASSED! System verified compliant with CPCL/GeM tender rules.\n');
    process.exit(0);
  }
}

if (require.main === module) {
  main().catch(err => {
    console.error('Fatal Test Runner Exception:', err);
    process.exit(1);
  });
}

module.exports = { main };
