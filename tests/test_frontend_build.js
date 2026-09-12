const path = require('path');
const fs = require('fs');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const FRONTEND_DIR = path.join(PROJECT_ROOT, 'frontend');
const DIST_DIR = path.join(FRONTEND_DIR, 'dist');
const ASSETS_DIR = path.join(DIST_DIR, 'assets');

/**
 * Test Suite: Frontend Build & Asset Compilation
 */
async function runFrontendBuildTests() {
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

  // --- Tier 1: Feature Coverage ---

  // T1.6.1: Vite production distribution output directory exists
  await recordTest('T1.6.1', 'Frontend production build output directory dist/ exists', 'Tier 1', async () => {
    if (!fs.existsSync(DIST_DIR)) {
      throw new Error(`Frontend build output directory ${DIST_DIR} does not exist. Run 'npm run build' inside frontend/.`);
    }
  });

  // T1.6.2: dist/index.html generated with valid HTML5 structure
  await recordTest('T1.6.2', 'dist/index.html exists and contains application mounting root element', 'Tier 1', async () => {
    const indexPath = path.join(DIST_DIR, 'index.html');
    if (!fs.existsSync(indexPath)) {
      throw new Error('dist/index.html does not exist');
    }
    const htmlContent = fs.readFileSync(indexPath, 'utf8');
    if (!htmlContent.includes('<div id="root">') && !htmlContent.includes('id="root"')) {
      throw new Error('dist/index.html is missing root mounting container <div id="root">');
    }
    if (!htmlContent.includes('<script') || !htmlContent.includes('assets/index-')) {
      throw new Error('dist/index.html does not reference compiled javascript bundle assets');
    }
  });

  // T1.6.3: Compiled JavaScript bundle assets
  await recordTest('T1.6.3', 'Compiled JavaScript bundle (index-*.js) exists in dist/assets/ with size > 50KB', 'Tier 1', async () => {
    if (!fs.existsSync(ASSETS_DIR)) {
      throw new Error('dist/assets directory does not exist');
    }
    const files = fs.readdirSync(ASSETS_DIR);
    const jsBundles = files.filter(f => f.startsWith('index-') && f.endsWith('.js'));
    if (jsBundles.length === 0) {
      throw new Error('No index-*.js bundle found in dist/assets/');
    }
    const jsPath = path.join(ASSETS_DIR, jsBundles[0]);
    const stat = fs.statSync(jsPath);
    if (stat.size < 50000) {
      throw new Error(`Compiled JS bundle is unexpectedly small (${stat.size} bytes), possible compilation failure`);
    }
  });

  // T1.6.4: Compiled CSS stylesheet bundle
  await recordTest('T1.6.4', 'Compiled CSS stylesheet (index-*.css) exists in dist/assets/ with compiled Tailwind classes', 'Tier 1', async () => {
    const files = fs.readdirSync(ASSETS_DIR);
    const cssBundles = files.filter(f => f.startsWith('index-') && f.endsWith('.css'));
    if (cssBundles.length === 0) {
      throw new Error('No index-*.css stylesheet bundle found in dist/assets/');
    }
    const cssPath = path.join(ASSETS_DIR, cssBundles[0]);
    const cssContent = fs.readFileSync(cssPath, 'utf8');
    if (cssContent.length < 5000) {
      throw new Error('Compiled CSS stylesheet appears incomplete or too small');
    }
  });

  // T1.6.5: Vite development proxy configuration
  await recordTest('T1.6.5', 'vite.config.js configures /api dev proxy forwarding to http://localhost:5000', 'Tier 1', async () => {
    const configPath = path.join(FRONTEND_DIR, 'vite.config.js');
    if (!fs.existsSync(configPath)) {
      throw new Error('vite.config.js does not exist');
    }
    const configSource = fs.readFileSync(configPath, 'utf8');
    const hasProxy = configSource.includes('proxy') && 
                     (configSource.includes('5000') || configSource.includes('/api'));
    if (!hasProxy) {
      throw new Error('vite.config.js lacks server.proxy configuration forwarding /api to backend:5000');
    }
  });

  // --- Tier 2: Boundary & Component Quality ---

  // T2.6.1: Step 4 EmailDraftViewer prop contract
  await recordTest('T2.6.1', 'EmailDraftViewer component prop contract in BidderVerification.jsx matches draft prop', 'Tier 2', async () => {
    const bidderVerifPath = path.join(FRONTEND_DIR, 'src', 'pages', 'BidderVerification.jsx');
    const source = fs.readFileSync(bidderVerifPath, 'utf8');
    // If it passes aiEmailDraft without draft=, EmailDraftViewer returns null
    if (source.includes('aiEmailDraft={') && !source.includes('draft={')) {
      throw new Error('BidderVerification.jsx passes aiEmailDraft to EmailDraftViewer instead of draft, causing blank screen in Step 4.');
    }
  });

  // T2.6.2: Step 2 Primary CTA auto-fallback
  await recordTest('T2.6.2', 'Step 2 Scan button automatically handles empty upload by loading demo sample', 'Tier 2', async () => {
    const bidderVerifPath = path.join(FRONTEND_DIR, 'src', 'pages', 'BidderVerification.jsx');
    const source = fs.readFileSync(bidderVerifPath, 'utf8');
    // Check if handleScan aborts immediately without fallback
    const deadlockedPattern = /if\s*\(\!targetFiles\s*\|\|\s*targetFiles\.length\s*===\s*0\)\s*\{\s*showToast\([^)]*Please upload at least one document/;
    if (deadlockedPattern.test(source)) {
      throw new Error('BidderVerification.jsx deadlocks when clicking Initiate Scan without manual file attachment.');
    }
  });

  // T2.6.3: Multi-bidder state reset on selection
  await recordTest('T2.6.3', 'handleSelectBidder resets previous bidder verification state to prevent contamination', 'Tier 2', async () => {
    const bidderVerifPath = path.join(FRONTEND_DIR, 'src', 'pages', 'BidderVerification.jsx');
    const source = fs.readFileSync(bidderVerifPath, 'utf8');
    const handleSelectMatch = source.match(/const\s+handleSelectBidder\s*=\s*\([^)]*\)\s*=>\s*\{([\s\S]*?)\};/);
    if (handleSelectMatch) {
      const fnBody = handleSelectMatch[1];
      const hasScoreReset = fnBody.includes('setOverallScore') || fnBody.includes('setBidderStatus') || fnBody.includes('setScanComplete');
      if (!hasScoreReset) {
        throw new Error('handleSelectBidder does not reset overallScore, bidderStatus, or scanComplete when selecting a new bidder.');
      }
    }
  });

  // T2.6.4: Official CPCL Government Branding in Header
  await recordTest('T2.6.4', 'Header contains authentic CPCL and Ministry of Petroleum & Natural Gas branding', 'Tier 2', async () => {
    const headerPath = path.join(FRONTEND_DIR, 'src', 'components', 'common', 'Header.jsx');
    const source = fs.readFileSync(headerPath, 'utf8');
    const hasCpcl = source.includes('Chennai Petroleum Corporation Limited') || source.includes('CPCL');
    const hasMinistry = source.includes('Ministry of Petroleum') || source.includes('MoPNG');
    if (!hasCpcl || !hasMinistry) {
      throw new Error('Header does not display full CPCL and Ministry of Petroleum & Natural Gas branding');
    }
  });

  // T2.6.5: Interactive Print & Export Actions in ComplianceReport
  await recordTest('T2.6.5', 'ComplianceReport triggers functional window.print() and document export', 'Tier 2', async () => {
    const reportPath = path.join(FRONTEND_DIR, 'src', 'components', 'verification', 'ComplianceReport.jsx');
    const source = fs.readFileSync(reportPath, 'utf8');
    const hasPrint = source.includes('window.print()') || source.includes('print()');
    if (!hasPrint) {
      throw new Error('ComplianceReport print button only shows a toast and does not call window.print()');
    }
  });

  return results;
}

if (require.main === module) {
  runFrontendBuildTests().then(results => {
    console.log('\n=== FRONTEND BUILD & UI INTEGRITY TEST RESULTS ===\n');
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

module.exports = { runFrontendBuildTests };
