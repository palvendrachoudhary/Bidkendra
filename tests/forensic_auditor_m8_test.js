/**
 * Independent Forensic Audit Test Suite for Milestone 8 (Vendor Self-Service Portal)
 * Auditor: teamwork_preview_auditor_m8_1
 * Role: Forensic Integrity Auditor
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');

const vendorController = require('../backend/src/controllers/vendorController');
const twilioController = require('../backend/src/controllers/twilioController');
const alertController = require('../backend/src/controllers/alertController');
const { scanAndVerifyDocument } = require('../backend/src/services/realOcrService');
const db = require('../backend/src/config/database');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const testResults = [];

async function runCheck(id, description, category, fn) {
  totalTests++;
  const start = Date.now();
  try {
    await fn();
    const duration = Date.now() - start;
    passedTests++;
    testResults.push({ id, description, category, status: 'PASS', duration });
    console.log(`[${category}] ${id}: ${description} -> PASS (${duration}ms)`);
  } catch (err) {
    const duration = Date.now() - start;
    failedTests++;
    testResults.push({ id, description, category, status: 'FAIL', duration, error: err.message });
    console.error(`[${category}] ${id}: ${description} -> FAIL (${duration}ms): ${err.message}`);
  }
}

// Mock Express response helper
function createMockRes() {
  return {
    statusCode: null,
    jsonData: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.jsonData = data;
      return this;
    }
  };
}

async function runAllM8ForensicChecks() {
  console.log('================================================================');
  console.log('STARTING FORENSIC INTEGRITY AUDIT SUITE — MILESTONE 8');
  console.log('================================================================\n');

  // Initialize SQLite database
  await db.init();
  console.log('✓ SQLite database initialized for forensic audit\n');

  // -------------------------------------------------------------
  // 1. CHEATING & HARDCODING DETECTION: Arbitrary Non-PetroTech Data
  // -------------------------------------------------------------
  console.log('--- CHECK 1: CHEATING & HARDCODING DETECTION ---');

  await runCheck('FC1.1', 'Vendor verification dynamically parses arbitrary vendor text (Kaveri Engineering Works, Haryana GSTIN 06AAACK9988F1Z2)', 'CheatingDetection', async () => {
    const mockReq = {
      body: {
        companyName: 'Kaveri Engineering Works Pvt Ltd',
        gstin: '06AAACK9988F1Z2',
        pan: 'AAACK9988F',
        udyam: 'UDYAM-HR-05-0012345',
        text: `
          GOVERNMENT OF INDIA - CPCL VENDOR ENVELOPE
          Company: Kaveri Engineering Works Pvt Ltd
          GSTIN: 06AAACK9988F1Z2
          PAN: AAACK9988F
          Udyam: UDYAM-HR-05-0012345
          Make in India Declaration: Local Content is 85.5% (Class-I Local Supplier)
          EPFO: HR/GUR/0012345/000
          ESIC: 31000123450000101
          CIN: U29100HR2019PTC081234
          Debarment: We have never been blacklisted by any PSU.
        `
      }
    };
    const mockRes = createMockRes();
    await vendorController.verifyVendorDocument(mockReq, mockRes, (err) => { throw err; });

    assert.strictEqual(mockRes.statusCode, 200);
    assert.strictEqual(mockRes.jsonData.success, true);
    assert.strictEqual(mockRes.jsonData.companyName, 'Kaveri Engineering Works Pvt Ltd');
    assert.strictEqual(mockRes.jsonData.crossValidation.passed, true);
    assert.strictEqual(mockRes.jsonData.crossValidation.gstinMatch, true);
    assert.strictEqual(mockRes.jsonData.crossValidation.panMatch, true);
    assert.strictEqual(mockRes.jsonData.crossValidation.udyamMatch, true);
    assert.strictEqual(mockRes.jsonData.crossValidation.discrepancies.length, 0);
  });

  await runCheck('FC1.2', 'Vendor verification detects arbitrary mismatch when form data differs from document (Form PAN XYZCP1234F vs Doc AAACK9988F)', 'CheatingDetection', async () => {
    const mockReq = {
      body: {
        companyName: 'Kaveri Engineering Works Pvt Ltd',
        gstin: '06AAACK9988F1Z2',
        pan: 'XYZCP1234F', // Intentionally mismatched
        udyam: 'UDYAM-HR-05-0012345',
        text: `
          Company: Kaveri Engineering Works Pvt Ltd
          GSTIN: 06AAACK9988F1Z2
          PAN: AAACK9988F
          Udyam: UDYAM-HR-05-0012345
          Make in India: 75% Local Content
          EPFO: HR/GUR/0012345/000
          ESIC: 31000123450000101
        `
      }
    };
    const mockRes = createMockRes();
    await vendorController.verifyVendorDocument(mockReq, mockRes, (err) => { throw err; });

    assert.strictEqual(mockRes.statusCode, 200);
    assert.strictEqual(mockRes.jsonData.crossValidation.passed, false);
    assert.strictEqual(mockRes.jsonData.crossValidation.panMatch, false);
    assert.ok(mockRes.jsonData.crossValidation.discrepancies.some(d => d.includes('PAN Mismatch')));
    assert.ok(mockRes.jsonData.curingGuidance.some(g => g.type === 'DISCREPANCY' && g.action.includes('PAN Mismatch')));
    assert.strictEqual(mockRes.jsonData.isCompliant, false);
  });

  // -------------------------------------------------------------
  // 2. FACADE DETECTION: Genuine Logic & Edge Case Handling
  // -------------------------------------------------------------
  console.log('\n--- CHECK 2: FACADE DETECTION & EDGE CASE HANDLING ---');

  await runCheck('FC2.1', 'verifyVendorDocument handles empty text/file by generating complete fallback document envelope without crashing', 'FacadeDetection', async () => {
    const mockReq = {
      body: {
        companyName: 'Brahmaputra Petrochemicals Ltd',
        gstin: '18AABCB1234F1Z9',
        pan: 'AABCB1234F',
        udyam: 'UDYAM-AS-01-0099887'
      }
    };
    const mockRes = createMockRes();
    await vendorController.verifyVendorDocument(mockReq, mockRes, (err) => { throw err; });

    assert.strictEqual(mockRes.statusCode, 200);
    assert.strictEqual(mockRes.jsonData.success, true);
    assert.strictEqual(mockRes.jsonData.companyName, 'Brahmaputra Petrochemicals Ltd');
    assert.strictEqual(mockRes.jsonData.crossValidation.passed, true);
  });

  await runCheck('FC2.2', 'verifyVendorDocument logs automated Active Bid Curing alert to database table on discrepancy', 'FacadeDetection', async () => {
    const uniqueCompany = 'Discrepant Test Corp ' + Date.now();
    const mockReq = {
      body: {
        companyName: uniqueCompany,
        gstin: '99AABBD9999F1Z9', // Invalid mismatch
        pan: 'AABBD9999F',
        text: 'Document without any GSTIN or PAN numbers.'
      }
    };
    const mockRes = createMockRes();
    await vendorController.verifyVendorDocument(mockReq, mockRes, (err) => { throw err; });

    // Check DB table alert_timeline
    const foundAlert = db.prepare(`
      SELECT * FROM alert_timeline 
      WHERE vendor_name = ? 
      ORDER BY created_at DESC 
      LIMIT 1
    `).get(uniqueCompany);

    assert.ok(foundAlert, 'Alert was logged to alert_timeline in SQLite');
    assert.strictEqual(foundAlert.vendor_name, uniqueCompany);
    assert.strictEqual(foundAlert.alert_type, 'WEBHOOK_CURING');
  });

  await runCheck('FC2.3', 'getOpenTenders returns active tenders from database with proper schema', 'FacadeDetection', async () => {
    const mockReq = {};
    const mockRes = createMockRes();
    vendorController.getOpenTenders(mockReq, mockRes, (err) => { throw err; });

    assert.strictEqual(mockRes.statusCode, 200);
    assert.strictEqual(mockRes.jsonData.success, true);
    assert.ok(Array.isArray(mockRes.jsonData.tenders));
    assert.ok(mockRes.jsonData.tenders.length > 0);
    assert.ok(mockRes.jsonData.tenders[0].tender_number || mockRes.jsonData.tenders[0].id);
  });

  await runCheck('FC2.4', 'saveVendorProfile genuinely persists vendor profile to bidders database table', 'FacadeDetection', async () => {
    const testName = 'Forensic Test Vendor ' + Date.now();
    const mockReq = {
      body: {
        companyName: testName,
        gstin: '33AAACT1234F1Z3',
        pan: 'AAACT1234F',
        udyam: 'UDYAM-TN-02-0088776',
        email: 'test@forensic.gov.in',
        phone: '9840199999'
      }
    };
    const mockRes = createMockRes();
    vendorController.saveVendorProfile(mockReq, mockRes, (err) => { throw err; });

    assert.strictEqual(mockRes.statusCode, 200);
    assert.strictEqual(mockRes.jsonData.success, true);
    assert.ok(mockRes.jsonData.vendor.id.startsWith('b-'));

    // Check in DB
    const bidderInDb = db.prepare('SELECT * FROM bidders WHERE company_name = ?').get(testName);
    assert.ok(bidderInDb, 'Bidder inserted into database');
    assert.strictEqual(bidderInDb.company_name, testName);
  });

  // -------------------------------------------------------------
  // 3. INTEGRITY OF M6 & M7 SUBSYSTEMS
  // -------------------------------------------------------------
  console.log('\n--- CHECK 3: INTEGRITY OF M6 & M7 SUBSYSTEMS ---');

  await runCheck('FC3.1', 'Twilio Controller: Real TwiML generation and fallback with en-IN voice', 'M6_M7_Integrity', async () => {
    const mockReq = {
      body: {
        phoneNumber: '+919876500000',
        vendorName: 'Audit Test Entity',
        tenderNumber: 'CPCL-AUDIT-2026',
        missingDocuments: ['GSTIN Registration', 'Class-I Local Content']
      }
    };
    const mockRes = createMockRes();
    await twilioController.initiateVoiceCall(mockReq, mockRes, (err) => { throw err; });

    assert.strictEqual(mockRes.statusCode, 200);
    assert.strictEqual(mockRes.jsonData.success, true);
    assert.ok(mockRes.jsonData.callSid);
    assert.ok(mockRes.jsonData.details.twiml.includes('alice'));
    assert.ok(mockRes.jsonData.details.twiml.includes('en-IN'));
    assert.ok(mockRes.jsonData.details.twiml.includes('Chennai Petroleum Corporation Limited'));
  });

  await runCheck('FC3.2', 'Alert Controller: Fetches alert timeline with vendor name filter and parsed JSON', 'M6_M7_Integrity', async () => {
    const mockReq = {
      query: { vendor_name: 'PetroTech' }
    };
    const mockRes = createMockRes();
    await alertController.getAlertTimeline(mockReq, mockRes, (err) => { throw err; });

    assert.strictEqual(mockRes.statusCode, 200);
    assert.strictEqual(mockRes.jsonData.success, true);
    assert.ok(Array.isArray(mockRes.jsonData.alerts));
  });

  // -------------------------------------------------------------
  // 4. FRONTEND SOURCE & NAVIGATION INTEGRITY
  // -------------------------------------------------------------
  console.log('\n--- CHECK 4: FRONTEND ROUTING & NAVIGATION INTEGRITY ---');

  await runCheck('FC4.1', 'App.jsx mounts /vendor route outside ProtectedRoute guard', 'FrontendIntegrity', async () => {
    const appPath = path.join(__dirname, '../frontend/src/App.jsx');
    const appContent = fs.readFileSync(appPath, 'utf8');

    assert.ok(appContent.includes("import VendorPortal from './pages/VendorPortal'"), 'VendorPortal imported in App.jsx');
    assert.ok(appContent.includes('<Route path="/vendor" element={<VendorPortal />} />'), '/vendor route mounted');
    // Ensure it is before ProtectedRoute or outside it
    const vendorIdx = appContent.indexOf('<Route path="/vendor"');
    const protectedIdx = appContent.indexOf('<ProtectedRoute>');
    assert.ok(vendorIdx < protectedIdx, '/vendor mounted outside ProtectedRoute');
  });

  await runCheck('FC4.2', 'Header.jsx includes Vendor Portal navigation pill button', 'FrontendIntegrity', async () => {
    const headerPath = path.join(__dirname, '../frontend/src/components/layout/Header.jsx');
    const headerContent = fs.readFileSync(headerPath, 'utf8');

    assert.ok(headerContent.includes("navigate('/vendor')"), "Header navigates to '/vendor'");
    assert.ok(headerContent.includes('BuildingOffice2Icon'), 'BuildingOffice2Icon present in Header');
    assert.ok(headerContent.includes('Vendor Portal'), "'Vendor Portal' text present in Header");
  });

  await runCheck('FC4.3', 'Login.jsx includes prominent Vendor Suvidha Access Banner', 'FrontendIntegrity', async () => {
    const loginPath = path.join(__dirname, '../frontend/src/pages/Login.jsx');
    const loginContent = fs.readFileSync(loginPath, 'utf8');

    assert.ok(loginContent.includes("navigate('/vendor')"), "Login navigates to '/vendor'");
    assert.ok(loginContent.includes('Access CPCL Vendor Suvidha Self-Verification Portal'), 'Banner CTA present');
  });

  await runCheck('FC4.4', 'VendorPortal.jsx contains full state machine and all 3 functional tabs', 'FrontendIntegrity', async () => {
    const vpPath = path.join(__dirname, '../frontend/src/pages/VendorPortal.jsx');
    const vpContent = fs.readFileSync(vpPath, 'utf8');

    assert.ok(vpContent.includes("activeTab === 'tenders'"), 'Tab 1: Active tenders tab present');
    assert.ok(vpContent.includes("activeTab === 'precheck'"), 'Tab 2: Self-verification precheck tab present');
    assert.ok(vpContent.includes("activeTab === 'guidelines'"), 'Tab 3: Statutory guidelines tab present');
    assert.ok(vpContent.includes('evaluateClientSidePreAudit'), 'Offline client-side evaluator present');
    assert.ok(vpContent.includes('handleDownloadTemplate'), 'Downloadable statutory declaration template present');
    assert.ok(vpContent.includes('setShowCertModal'), 'Printable pre-check certificate modal present');
    assert.ok(vpContent.includes('handleLoadDemoVendor'), 'Load Demo MSME Vendor present');
    assert.ok(vpContent.includes('handleLoadVerifiedDemoEnvelope'), 'Load Verified Demo Envelope present');
  });

  console.log('\n================================================================');
  console.log(`FORENSIC AUDIT SUMMARY: ${passedTests} / ${totalTests} CHECKS PASSED`);
  console.log(`VERDICT: ${failedTests === 0 ? 'CLEAN (NO INTEGRITY VIOLATIONS)' : 'INTEGRITY VIOLATION'}`);
  console.log('================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runAllM8ForensicChecks().catch(err => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
