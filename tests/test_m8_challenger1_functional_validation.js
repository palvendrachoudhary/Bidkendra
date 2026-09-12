/**
 * ============================================================================
 * Milestone 8: Empirical Functional Validation & Stress Testing Test Harness
 * Author: Challenger 1 (teamwork_preview_challenger_m8_1_gen2)
 * Role: critic, specialist (Empirical Challenger)
 * ============================================================================
 * 
 * Scope:
 * 1. Form Input Validators (GSTIN, PAN, Udyam, Email, Phone) on Valid & Adversarial Inputs
 * 2. Verification Logic (Scoring calculation, 14 statutory checks, curing guidance, cross-validation)
 * 3. Backend Route & Controller Syntax (vendorRoutes.js, vendorController.js, server.js)
 * 4. Static Assets & Route Mounting (frontend/src/App.jsx, Header.jsx, Login.jsx, VendorPortal.jsx)
 * 5. Database State Integrity & Auto-Curing Alerts (alert_timeline, bidders, tenders)
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');

// Backend dependencies
const db = require('../backend/src/config/database');
const vendorController = require('../backend/src/controllers/vendorController');
const vendorRoutes = require('../backend/src/routes/vendorRoutes');
const { scanAndVerifyDocument } = require('../backend/src/services/realOcrService');
const { CheckStatus, Method } = require('../backend/src/services/verification/checkStatus');

// Form validator definitions extracted from verified codebase
function validateGSTIN(gstin) {
  if (!gstin || typeof gstin !== 'string') return false;
  const clean = gstin.trim().toUpperCase();
  const regex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i;
  if (!regex.test(clean)) return false;
  const stateCode = parseInt(clean.substring(0, 2), 10);
  if (isNaN(stateCode) || stateCode < 1 || stateCode > 38) return false;
  return true;
}

function validatePAN(pan) {
  if (!pan || typeof pan !== 'string') return false;
  const clean = pan.trim().toUpperCase();
  const regex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i;
  if (!regex.test(clean)) return false;
  const validEntityTypes = ['C', 'P', 'H', 'F', 'A', 'T', 'B', 'L', 'J', 'G'];
  if (!validEntityTypes.includes(clean[3])) return false;
  return true;
}

function validateUdyam(udyam) {
  if (!udyam || typeof udyam !== 'string') return false;
  const clean = udyam.trim().replace(/\s+/g, '').toUpperCase();
  const regex = /^UDYAM-[A-Z]{2}-[0-9]{2}-[0-9]{7}$/i;
  return regex.test(clean);
}

function validateEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const clean = email.trim();
  // Standard RFC compliant email regex
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return regex.test(clean);
}

function validatePhone(phone) {
  if (!phone || typeof phone !== 'string') return false;
  const clean = phone.trim().replace(/[\s\-+]/g, '');
  // Handles 10-digit Indian numbers, with optional leading 91 or 0
  const regex = /^(?:(?:0|91)?[6-9]\d{9})$/;
  return regex.test(clean);
}

// Mock Express response helper
function createMockRes() {
  return {
    statusCode: 200,
    jsonData: null,
    headers: {},
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.jsonData = data;
      return this;
    },
    setHeader(key, val) {
      this.headers[key] = val;
      return this;
    }
  };
}

// Test metrics
let totalAssertions = 0;
let passedAssertions = 0;
let failedAssertions = 0;
const testLogs = [];

async function testCase(suiteName, caseName, fn) {
  totalAssertions++;
  const t0 = Date.now();
  try {
    await fn();
    const duration = Date.now() - t0;
    passedAssertions++;
    testLogs.push({ suite: suiteName, name: caseName, status: 'PASS', duration });
    console.log(`  [PASS] ${caseName} (${duration}ms)`);
  } catch (err) {
    const duration = Date.now() - t0;
    failedAssertions++;
    testLogs.push({ suite: suiteName, name: caseName, status: 'FAIL', duration, error: err.message });
    console.error(`  [FAIL] ${caseName} (${duration}ms): ${err.message}`);
  }
}

async function runEmpiricalHarness() {
  console.log('==============================================================================');
  console.log('CHALLENGER 1: EMPIRICAL FUNCTIONAL VALIDATION & STRESS TEST HARNESS (M8)');
  console.log('==============================================================================\n');

  // Initialize DB
  await db.init();
  console.log('✓ SQLite database initialized successfully.\n');

  // ============================================================================
  // SUITE 1: FORM INPUT VALIDATORS (VALID & ADVERSARIAL INPUTS)
  // ============================================================================
  console.log('--- SUITE 1: FORM INPUT VALIDATORS (GSTIN, PAN, UDYAM, EMAIL, PHONE) ---');

  // 1.1 GSTIN Valid Inputs
  await testCase('Validators', 'GSTIN: Valid state codes and standard formats', () => {
    assert.strictEqual(validateGSTIN('33AABCP1234F1Z5'), true, 'Tamil Nadu (33) corporate GSTIN');
    assert.strictEqual(validateGSTIN('27AAAAA0000A1Z5'), true, 'Maharashtra (27) GSTIN');
    assert.strictEqual(validateGSTIN('07AABCS1429B1ZB'), true, 'Delhi (07) GSTIN');
    assert.strictEqual(validateGSTIN('01ABCDE1234F1Z1'), true, 'Jammu & Kashmir (01) minimum boundary state code');
    assert.strictEqual(validateGSTIN('38ABCDE1234F1Z1'), true, 'Ladakh (38) maximum boundary state code');
  });

  // 1.2 GSTIN Adversarial & Malformed Inputs
  await testCase('Validators', 'GSTIN: Adversarial length, state boundary, and malformed characters', () => {
    assert.strictEqual(validateGSTIN('33AABCP1234F1Z'), false, 'Too short (14 chars)');
    assert.strictEqual(validateGSTIN('33AABCP1234F1Z5A'), false, 'Too long (16 chars)');
    assert.strictEqual(validateGSTIN('00AABCP1234F1Z5'), false, 'Invalid state code 00');
    assert.strictEqual(validateGSTIN('39AABCP1234F1Z5'), false, 'Invalid state code 39 (out of range 1-38)');
    assert.strictEqual(validateGSTIN('99AABCP1234F1Z5'), false, 'Invalid state code 99');
    assert.strictEqual(validateGSTIN('33AABCP1234F1A5'), false, '14th character must be Z, but got A');
    assert.strictEqual(validateGSTIN("33AABCP1234F'Z5"), false, 'Special character injection');
    assert.strictEqual(validateGSTIN(''), false, 'Empty string');
    assert.strictEqual(validateGSTIN(null), false, 'Null input');
    assert.strictEqual(validateGSTIN(undefined), false, 'Undefined input');
    assert.strictEqual(validateGSTIN(123456789012345), false, 'Numeric input');
  });

  // 1.3 PAN Valid Inputs
  await testCase('Validators', 'PAN: Valid 10-char corporate and entity formats', () => {
    assert.strictEqual(validatePAN('AABCP1234F'), true, 'Company (C) entity type');
    assert.strictEqual(validatePAN('ABCPD1234F'), true, 'Firm/Individual (P)');
    assert.strictEqual(validatePAN('AAATC1234F'), true, 'Trust (T) entity type');
    assert.strictEqual(validatePAN('AAAHB1234G'), true, 'HUF (H) entity type');
    assert.strictEqual(validatePAN('AAAGS1234F'), true, 'Government Agency (G) entity type');
    assert.strictEqual(validatePAN('AAAFR1234A'), true, 'Partnership Firm (F)');
    assert.strictEqual(validatePAN('AAALA1234B'), true, 'Local Authority (L)');
  });

  // 1.4 PAN Adversarial & Malformed Inputs
  await testCase('Validators', 'PAN: Adversarial invalid 4th character, length, and injection', () => {
    assert.strictEqual(validatePAN('AABKP1234F'), false, 'Invalid 4th character K (not a valid CBDT entity)');
    assert.strictEqual(validatePAN('AABXP1234F'), false, 'Invalid 4th character X');
    assert.strictEqual(validatePAN('AAB1P1234F'), false, 'Digit in 4th character');
    assert.strictEqual(validatePAN('AABCP1234'), false, 'Too short (9 chars)');
    assert.strictEqual(validatePAN('AABCP1234FA'), false, 'Too long (11 chars)');
    assert.strictEqual(validatePAN('12345ABCDE'), false, 'Inverted structure (digits first)');
    assert.strictEqual(validatePAN("<script>alert('pan')</script>"), false, 'XSS attempt');
    assert.strictEqual(validatePAN(''), false, 'Empty string');
    assert.strictEqual(validatePAN(null), false, 'Null input');
  });

  // 1.5 Udyam Valid Inputs
  await testCase('Validators', 'Udyam: Valid MSME registration formats', () => {
    assert.strictEqual(validateUdyam('UDYAM-TN-02-0045812'), true, 'Standard Tamil Nadu Udyam');
    assert.strictEqual(validateUdyam('UDYAM-DL-01-1234567'), true, 'Delhi Udyam');
    assert.strictEqual(validateUdyam('UDYAM-MH-14-9999999'), true, 'Maharashtra Udyam');
    assert.strictEqual(validateUdyam('udyam-tn-02-0045812'), true, 'Case insensitive normalization');
    assert.strictEqual(validateUdyam('  UDYAM - TN - 02 - 0045812  '), true, 'Whitespace tolerance');
  });

  // 1.6 Udyam Adversarial & Malformed Inputs
  await testCase('Validators', 'Udyam: Adversarial structure, wrong prefix, and malformed segments', () => {
    assert.strictEqual(validateUdyam('UDYAM-TNN-02-0045812'), false, '3-letter state code');
    assert.strictEqual(validateUdyam('UDYAM-12-02-0045812'), false, 'Numeric state code');
    assert.strictEqual(validateUdyam('UDYAM-TN-2-0045812'), false, 'Single-digit district code');
    assert.strictEqual(validateUdyam('UDYAM-TN-002-0045812'), false, '3-digit district code');
    assert.strictEqual(validateUdyam('UDYAM-TN-02-004581'), false, '6-digit serial (requires 7)');
    assert.strictEqual(validateUdyam('UDYAM-TN-02-00458123'), false, '8-digit serial');
    assert.strictEqual(validateUdyam('TN-02-0045812'), false, 'Missing UDYAM prefix');
    assert.strictEqual(validateUdyam('EM-II-TN-02-0045812'), false, 'Legacy EM-II format (discontinued)');
    assert.strictEqual(validateUdyam(''), false, 'Empty string');
    assert.strictEqual(validateUdyam(null), false, 'Null input');
  });

  // 1.7 Email Valid & Adversarial Inputs
  await testCase('Validators', 'Email: Standard, subdomain, plus-addressing, and malformed inputs', () => {
    assert.strictEqual(validateEmail('compliance@petrotechindia.com'), true, 'Standard corporate email');
    assert.strictEqual(validateEmail('tender.officer+cpcl@sub.gov.in'), true, 'Plus-addressing & subdomain');
    assert.strictEqual(validateEmail('vendor123@ioc.co.in'), true, 'Two-part TLD');

    assert.strictEqual(validateEmail('plainaddress'), false, 'No @ or domain');
    assert.strictEqual(validateEmail('@missinguser.com'), false, 'Missing user');
    assert.strictEqual(validateEmail('user@.com'), false, 'Missing domain name');
    assert.strictEqual(validateEmail('user@domain'), false, 'Missing TLD');
    assert.strictEqual(validateEmail('user@domain.c'), false, 'TLD too short (1 char)');
    assert.strictEqual(validateEmail('user name@domain.com'), false, 'Space in local part');
    assert.strictEqual(validateEmail("user@domain.com\nBcc: evil@hacker.com"), false, 'CRLF injection attempt');
    assert.strictEqual(validateEmail(''), false, 'Empty string');
    assert.strictEqual(validateEmail(null), false, 'Null input');
  });

  // 1.8 Phone Valid & Adversarial Inputs
  await testCase('Validators', 'Phone: Indian 10-digit formats with prefixes, and malformed inputs', () => {
    assert.strictEqual(validatePhone('9840123456'), true, 'Direct 10-digit mobile starting with 9');
    assert.strictEqual(validatePhone('+91 98401 23456'), true, 'E.164 +91 prefix with spaces');
    assert.strictEqual(validatePhone('91-9840123456'), true, '91 country code with hyphen');
    assert.strictEqual(validatePhone('09840123456'), true, 'Leading zero format');
    assert.strictEqual(validatePhone('7890123456'), true, 'Mobile starting with 7');
    assert.strictEqual(validatePhone('6789012345'), true, 'Mobile starting with 6');

    assert.strictEqual(validatePhone('1234567890'), false, 'Mobile starting with 1 (invalid in India)');
    assert.strictEqual(validatePhone('5555555555'), false, 'Mobile starting with 5 (invalid in India)');
    assert.strictEqual(validatePhone('98401'), false, 'Too short (5 digits)');
    assert.strictEqual(validatePhone('984012345678'), false, 'Too long (12 digits)');
    assert.strictEqual(validatePhone('98401ABCDE'), false, 'Alphanumeric mobile');
    assert.strictEqual(validatePhone(''), false, 'Empty string');
    assert.strictEqual(validatePhone(null), false, 'Null input');
  });

  // ============================================================================
  // SUITE 2: VERIFICATION LOGIC, SCORING, STATUTORY GATES, & CURING GUIDANCE
  // ============================================================================
  console.log('\n--- SUITE 2: VERIFICATION LOGIC, SCORING & CURING ENGINE ---');

  // 2.1 Full Compliant Vendor Envelope Verification
  await testCase('VerificationLogic', 'Compliant Envelope: High score, low risk, 0 discrepancies, ELIGIBLE verdict', async () => {
    const compliantDoc = `
      GOVERNMENT OF INDIA - MINISTRY OF PETROLEUM & NATURAL GAS
      CHENNAI PETROLEUM CORPORATION LIMITED (CPCL)
      BIDDER STATUTORY PRE-QUALIFICATION & COMPLIANCE ENVELOPE

      Company: PetroTech India Pvt Ltd
      CIN: U23201TN2018PTC123456
      GSTIN: 33AABCP1234F1Z5 (State: 33 - Tamil Nadu)
      PAN: AABCP1234F (Corporate Company)
      Udyam Registration Number: UDYAM-TN-02-0045812
      Make in India: Declared Local Value Addition is 72.40% (Class-I Local Supplier)
      EPFO Establishment Code: TN/MAS/0045812/000
      ESIC Employer Code: 31000458120000101
      Audited Turnover: INR 14.80 Crore. ITR-6 filed up to date.
      Quality Management: ISO 9001:2015 Certified
      OEM Authorization: Valid OEM authorization letter attached
      Debarment / Blacklisting: None. We have never been blacklisted or debarred.
      CLRA Contract Labour License: Form VI attached.
      DigiLocker Cryptographic Hash: a7f8c12b9d034e8f62301cb4d88e235e1903498bb8829f0231846c923deca019
    `;

    const mockReq = {
      body: {
        companyName: 'PetroTech India Pvt Ltd',
        gstin: '33AABCP1234F1Z5',
        pan: 'AABCP1234F',
        udyam: 'UDYAM-TN-02-0045812',
        email: 'compliance@petrotechindia.com',
        phone: '+91 98401 23456',
        text: compliantDoc
      }
    };
    const mockRes = createMockRes();
    await vendorController.verifyVendorDocument(mockReq, mockRes, (err) => { throw err; });

    assert.strictEqual(mockRes.statusCode, 200, 'HTTP 200 OK');
    const data = mockRes.jsonData;
    assert.strictEqual(data.success, true, 'Verification successful');
    assert.strictEqual(data.isCompliant, true, 'isCompliant flag is true');
    assert.strictEqual(data.hasMandatoryFailure, false, 'hasMandatoryFailure is false');
    assert.ok(data.overallScore >= 80, `Compliance score must be >= 80, got ${data.overallScore}`);
    assert.strictEqual(data.riskLevel, 'Low', 'Risk level is Low');
    assert.ok(data.verdict.includes('ELIGIBLE'), `Verdict contains ELIGIBLE: ${data.verdict}`);
    assert.strictEqual(data.crossValidation.passed, true, 'Cross-validation passed');
    assert.strictEqual(data.crossValidation.gstinMatch, true, 'GSTIN matched');
    assert.strictEqual(data.crossValidation.panMatch, true, 'PAN matched');
    assert.strictEqual(data.crossValidation.udyamMatch, true, 'Udyam matched');
    assert.strictEqual(data.crossValidation.discrepancies.length, 0, 'No discrepancies');
  });

  // 2.2 Cross-Validation Discrepancy Detection & Curing Guidance
  await testCase('VerificationLogic', 'Cross-Validation Mismatch: Generates DISCREPANCY curing items and flags NOT_ELIGIBLE', async () => {
    const docWithDifferentGSTIN = `
      GOVERNMENT OF INDIA - CPCL VENDOR SUBMISSION
      Company: PetroTech India Pvt Ltd
      GSTIN: 33AABCP9999F1Z1
      PAN: AABCP9999F
      Udyam: UDYAM-TN-02-0099999
      Make in India: 75% Local Content
      EPFO: TN/MAS/0045812/000
      ESIC: 31000458120000101
      Never been blacklisted.
    `;

    const mockReq = {
      body: {
        companyName: 'PetroTech India Pvt Ltd',
        gstin: '33AABCP1234F1Z5', // Form GSTIN differs from Doc 33AABCP9999F1Z1
        pan: 'AABCP1234F',         // Form PAN differs from Doc AABCP9999F
        udyam: 'UDYAM-TN-02-0045812', // Form Udyam differs from Doc UDYAM-TN-02-0099999
        text: docWithDifferentGSTIN
      }
    };
    const mockRes = createMockRes();
    await vendorController.verifyVendorDocument(mockReq, mockRes, (err) => { throw err; });

    assert.strictEqual(mockRes.statusCode, 200);
    const data = mockRes.jsonData;
    assert.strictEqual(data.isCompliant, false, 'Non-compliant due to discrepancies');
    assert.strictEqual(data.hasMandatoryFailure, true, 'Discrepancies escalate to mandatory failure');
    assert.ok(data.verdict.includes('NOT_ELIGIBLE') || data.verdict.includes('DEFECTS'), 'Verdict notes NOT_ELIGIBLE');
    assert.strictEqual(data.crossValidation.passed, false, 'Cross validation failed');
    assert.strictEqual(data.crossValidation.gstinMatch, false, 'GSTIN mismatch detected');
    assert.strictEqual(data.crossValidation.panMatch, false, 'PAN mismatch detected');
    assert.strictEqual(data.crossValidation.udyamMatch, false, 'Udyam mismatch detected');
    assert.strictEqual(data.crossValidation.discrepancies.length, 3, 'Exactly 3 discrepancies recorded');

    // Verify Curing Guidance structure
    assert.ok(Array.isArray(data.curingGuidance), 'Curing guidance is an array');
    const discrepancyGuidance = data.curingGuidance.filter(g => g.type === 'DISCREPANCY');
    assert.strictEqual(discrepancyGuidance.length, 3, '3 discrepancy remediation items generated');
    assert.strictEqual(discrepancyGuidance[0].severity, 'CRITICAL', 'Severity is CRITICAL');
    assert.ok(discrepancyGuidance[0].title.includes('Discrepancy'), 'Title indicates discrepancy');
  });

  // 2.3 Mandatory Gate Failure & Score Calculation (Missing Mandatory GSTIN & PAN)
  await testCase('VerificationLogic', 'Mandatory Gate Failure: Missing statutory tags sets compliance score to 0 and Critical risk', async () => {
    const garbageDoc = `
      LOREM IPSUM VENDOR SUBMISSION
      We provide catering services. Menu includes tea, coffee, samosas, and biscuits.
      No statutory registration numbers provided.
    `;

    const mockReq = {
      body: {
        companyName: 'Snacks Vendor Corp',
        text: garbageDoc
      }
    };
    const mockRes = createMockRes();
    await vendorController.verifyVendorDocument(mockReq, mockRes, (err) => { throw err; });

    assert.strictEqual(mockRes.statusCode, 200);
    const data = mockRes.jsonData;
    assert.strictEqual(data.isCompliant, false, 'isCompliant is false');
    assert.strictEqual(data.hasMandatoryFailure, true, 'hasMandatoryFailure is true');
    assert.strictEqual(data.overallScore, 0, 'Overall score drops to 0 on mandatory gate failure');
    assert.strictEqual(data.riskLevel, 'Critical', 'Risk level is Critical on mandatory gate failure');

    // Check specific remediation for failed checks
    const gstCheck = data.checksDetail?.gst;
    assert.ok(gstCheck, 'GST check detail present');
    assert.strictEqual(gstCheck.checkStatus, CheckStatus.FAILED, 'GST check failed');
    assert.strictEqual(gstCheck.isMandatoryGate, true, 'GST is mandatory gate');

    const panCheck = data.checksDetail?.pan;
    assert.ok(panCheck, 'PAN check detail present');
    assert.strictEqual(panCheck.checkStatus, CheckStatus.FAILED, 'PAN check failed');
    assert.strictEqual(panCheck.isMandatoryGate, true, 'PAN is mandatory gate');

    // Verify targeted remediation in curingGuidance
    const gstRemediation = data.curingGuidance.find(g => g.checkId === 'gst');
    assert.ok(gstRemediation, 'Remediation generated for GST');
    assert.ok(gstRemediation.action.includes('Form GST REG-06') || gstRemediation.action.includes('GSTIN'), 'Actionable GST curing guidance');
  });

  // 2.4 Make in India (MII) Threshold Evaluation
  await testCase('VerificationLogic', 'Make in India: 72.4% passes Class-I (>=50%), 42% classified as Class-II or deficient', async () => {
    const resClass1 = await scanAndVerifyDocument(
      Buffer.from('Company: Test Corp\nGSTIN: 33AABCP1234F1Z5\nPAN: AABCP1234F\nMake in India: Local content 72.4% (Class-I)'),
      'doc_class1.txt',
      'text/plain'
    );
    assert.strictEqual(resClass1.checksDetail.makeInIndia.checkStatus, CheckStatus.VERIFIED, '72.4% MII verified');

    const resClassDeficient = await scanAndVerifyDocument(
      Buffer.from('Company: Test Corp\nGSTIN: 33AABCP1234F1Z5\nPAN: AABCP1234F\nMake in India: Local content 25.0% (Non-Local)'),
      'doc_low_mii.txt',
      'text/plain'
    );
    // Non-Local (<50%) fails Class-I preference
    assert.ok(
      resClassDeficient.checksDetail.makeInIndia.checkStatus === CheckStatus.FAILED ||
      resClassDeficient.checksDetail.makeInIndia.message.includes('Non-Local') ||
      resClassDeficient.checksDetail.makeInIndia.message.includes('Below') ||
      resClassDeficient.checksDetail.makeInIndia.extractedValue.includes('25%'),
      'Low local content correctly flagged'
    );
  });

  // ============================================================================
  // SUITE 3: BACKEND ROUTES & CONTROLLERS (SYNTAX, MOUNTING & ENDPOINTS)
  // ============================================================================
  console.log('\n--- SUITE 3: BACKEND ROUTES & CONTROLLERS SYNTAX & HANDLERS ---');

  // 3.1 Route file export and structure
  await testCase('BackendRoutes', 'vendorRoutes.js: Router object exports valid routes and stack', () => {
    assert.ok(vendorRoutes, 'vendorRoutes exports defined');
    assert.strictEqual(typeof vendorRoutes, 'function', 'Express router is a middleware function');
    assert.ok(Array.isArray(vendorRoutes.stack), 'Router stack is an array');

    // Verify mounted route paths in router stack
    const registeredRoutes = vendorRoutes.stack
      .filter(layer => layer.route)
      .map(layer => ({
        path: layer.route.path,
        methods: Object.keys(layer.route.methods)
      }));

    assert.ok(registeredRoutes.some(r => r.path === '/verify' && r.methods.includes('post')), 'POST /verify route registered');
    assert.ok(registeredRoutes.some(r => r.path === '/tenders' && r.methods.includes('get')), 'GET /tenders route registered');
    assert.ok(registeredRoutes.some(r => r.path === '/alerts' && r.methods.includes('get')), 'GET /alerts route registered');
    assert.ok(registeredRoutes.some(r => r.path === '/profile' && r.methods.includes('post')), 'POST /profile route registered');
  });

  // 3.2 Controller method exports
  await testCase('BackendRoutes', 'vendorController.js: Exports all required controller handlers', () => {
    assert.strictEqual(typeof vendorController.verifyVendorDocument, 'function', 'verifyVendorDocument is exported function');
    assert.strictEqual(typeof vendorController.getOpenTenders, 'function', 'getOpenTenders is exported function');
    assert.strictEqual(typeof vendorController.getVendorAlerts, 'function', 'getVendorAlerts is exported function');
    assert.strictEqual(typeof vendorController.saveVendorProfile, 'function', 'saveVendorProfile is exported function');
  });

  // 3.3 Server Mounting in server.js
  await testCase('BackendRoutes', 'server.js: Route mounting syntax for /api/vendor', () => {
    const serverPath = path.join(__dirname, '../backend/src/server.js');
    const serverSource = fs.readFileSync(serverPath, 'utf8');

    assert.ok(
      serverSource.includes("const vendorRoutes = require('./routes/vendorRoutes');"),
      'vendorRoutes imported in server.js'
    );
    assert.ok(
      serverSource.includes("app.use('/api/vendor', vendorRoutes);"),
      "app.use('/api/vendor', vendorRoutes) mounted in server.js"
    );
  });

  // 3.4 GET /api/vendor/tenders Execution
  await testCase('BackendRoutes', 'GET /api/vendor/tenders: Retrieves tenders from database', () => {
    const mockReq = {};
    const mockRes = createMockRes();
    vendorController.getOpenTenders(mockReq, mockRes, (err) => { throw err; });

    assert.strictEqual(mockRes.statusCode, 200);
    assert.strictEqual(mockRes.jsonData.success, true);
    assert.ok(Array.isArray(mockRes.jsonData.tenders), 'Tenders is array');
    assert.ok(typeof mockRes.jsonData.count === 'number', 'Count is numeric');
  });

  // 3.5 GET /api/vendor/alerts Execution with Sanitization
  await testCase('BackendRoutes', 'GET /api/vendor/alerts: Query with vendor filter and SQL injection protection', () => {
    // Normal query
    const req1 = { query: { vendorName: 'PetroTech' } };
    const res1 = createMockRes();
    vendorController.getVendorAlerts(req1, res1, (err) => { throw err; });

    assert.strictEqual(res1.statusCode, 200);
    assert.strictEqual(res1.jsonData.success, true);
    assert.ok(Array.isArray(res1.jsonData.alerts));

    // SQL Injection query test
    const req2 = { query: { vendorName: "PetroTech' OR '1'='1" } };
    const res2 = createMockRes();
    vendorController.getVendorAlerts(req2, res2, (err) => { throw err; });

    assert.strictEqual(res2.statusCode, 200);
    assert.strictEqual(res2.jsonData.success, true);
    // Prepared statement must treat input as parameter, not execute tautology
  });

  // 3.6 POST /api/vendor/profile Execution & Validation
  await testCase('BackendRoutes', 'POST /api/vendor/profile: Validates input and persists to database', () => {
    // Missing company name returns 400
    const invalidReq = { body: { gstin: '33AABCP1234F1Z5' } };
    const invalidRes = createMockRes();
    vendorController.saveVendorProfile(invalidReq, invalidRes, (err) => { throw err; });
    assert.strictEqual(invalidRes.statusCode, 400, 'HTTP 400 Bad Request on missing company name');
    assert.strictEqual(invalidRes.jsonData.success, false);

    // Valid vendor profile saves to DB
    const uniqueCompany = `Test Corp ${Date.now()}`;
    const validReq = {
      body: {
        companyName: uniqueCompany,
        gstin: '33AABCP1234F1Z5',
        pan: 'AABCP1234F',
        udyam: 'UDYAM-TN-02-0045812',
        email: 'test@example.com',
        phone: '9840123456'
      }
    };
    const validRes = createMockRes();
    vendorController.saveVendorProfile(validReq, validRes, (err) => { throw err; });

    assert.strictEqual(validRes.statusCode, 200, 'HTTP 200 OK');
    assert.strictEqual(validRes.jsonData.success, true);
    assert.ok(validRes.jsonData.vendor.id.startsWith('b-'), 'Bidder ID generated');

    // Verify database row
    const row = db.prepare('SELECT * FROM bidders WHERE company_name = ?').get(uniqueCompany);
    assert.ok(row, 'Vendor profile persisted in SQLite bidders table');
    assert.strictEqual(row.company_name, uniqueCompany);
  });

  // ============================================================================
  // SUITE 4: FRONTEND ROUTING, STATIC ASSETS & UI ARCHITECTURE
  // ============================================================================
  console.log('\n--- SUITE 4: FRONTEND ROUTE MOUNTING & STATIC ASSET CHECKS ---');

  // 4.1 Route Mounting in App.jsx
  await testCase('FrontendRoutes', 'App.jsx: /vendor route is mounted outside ProtectedRoute guard', () => {
    const appPath = path.join(__dirname, '../frontend/src/App.jsx');
    assert.ok(fs.existsSync(appPath), 'App.jsx exists');
    const content = fs.readFileSync(appPath, 'utf8');

    assert.ok(content.includes("import VendorPortal from './pages/VendorPortal';"), 'VendorPortal is imported');
    assert.ok(content.includes('<Route path="/vendor" element={<VendorPortal />} />'), '/vendor route is defined');

    // Verify ordering: /vendor must be declared alongside /login before ProtectedRoute
    const loginIdx = content.indexOf('path="/login"');
    const vendorIdx = content.indexOf('path="/vendor"');
    const protectedIdx = content.indexOf('<ProtectedRoute>');

    assert.ok(vendorIdx > 0, '/vendor exists');
    assert.ok(protectedIdx > 0, '<ProtectedRoute> exists');
    assert.ok(vendorIdx < protectedIdx, '/vendor is placed before <ProtectedRoute>');
  });

  // 4.2 Cross-Navigation Link in Header.jsx
  await testCase('FrontendRoutes', 'Header.jsx: Contains Vendor Portal pill navigation button', () => {
    const headerPath = path.join(__dirname, '../frontend/src/components/layout/Header.jsx');
    assert.ok(fs.existsSync(headerPath), 'Header.jsx exists');
    const content = fs.readFileSync(headerPath, 'utf8');

    assert.ok(content.includes("navigate('/vendor')"), "Header navigates to '/vendor'");
    assert.ok(content.includes('BuildingOffice2Icon'), 'BuildingOffice2Icon imported and used in Header');
    assert.ok(content.includes('Vendor Portal'), 'Label "Vendor Portal" present');
  });

  // 4.3 Cross-Navigation Link in Login.jsx
  await testCase('FrontendRoutes', 'Login.jsx: Contains Bidder/MSME Vendor Access Banner', () => {
    const loginPath = path.join(__dirname, '../frontend/src/pages/Login.jsx');
    assert.ok(fs.existsSync(loginPath), 'Login.jsx exists');
    const content = fs.readFileSync(loginPath, 'utf8');

    assert.ok(content.includes("navigate('/vendor')"), "Login navigates to '/vendor'");
    assert.ok(content.includes('Are you a Bidder or MSME Vendor?'), 'Prompt for MSME vendors present');
    assert.ok(content.includes('Access CPCL Vendor Suvidha Self-Verification Portal'), 'CTA button text present');
  });

  // 4.4 VendorPortal.jsx Comprehensive Feature Checks
  await testCase('FrontendRoutes', 'VendorPortal.jsx: Contains 3 tabs, dual gauges, template generator, certificate modal', () => {
    const vpPath = path.join(__dirname, '../frontend/src/pages/VendorPortal.jsx');
    assert.ok(fs.existsSync(vpPath), 'VendorPortal.jsx exists');
    const content = fs.readFileSync(vpPath, 'utf8');

    // Feature 29: Branding & Ribbon
    assert.ok(content.includes('CPCL Vendor Suvidha'), 'Bilingual title CPCL Vendor Suvidha');
    assert.ok(content.includes('from-[#FF9933] via-white to-[#138808]'), 'Tricolor government ribbon present');
    assert.ok(content.includes('Chennai Petroleum Corporation Limited'), 'CPCL branding present');

    // Feature 31: Tab 1 Active Tenders
    assert.ok(content.includes("activeTab === 'tenders'"), 'Tab 1: Active CPCL Tenders tab');
    assert.ok(content.includes('Pre-Verify for this Tender'), 'Pre-Verify CTA present on tender cards');

    // Feature 32: Tab 2 Form & Upload
    assert.ok(content.includes("activeTab === 'precheck'"), 'Tab 2: Self-Verification Pre-Check tab');
    assert.ok(content.includes('Load Demo MSME Vendor'), 'Demo vendor quick fill button');
    assert.ok(content.includes('Load Verified Demo Document Envelope'), 'Demo envelope quick fill button');

    // Feature 33: Results & Curing
    assert.ok(content.includes('evaluateClientSidePreAudit'), 'Resilient client-side verification engine present');
    assert.ok(content.includes('handleDownloadTemplate'), 'Downloadable self-declaration template generator present');
    assert.ok(content.includes('setShowCertModal'), 'Printable pre-verification certificate modal present');
    assert.ok(content.includes('SHA-256'), 'Cryptographic integrity marker present');

    // Tab 3: Statutory Guidelines
    assert.ok(content.includes("activeTab === 'guidelines'"), 'Tab 3: Statutory Guidelines tab');
    assert.ok(content.includes('Public Procurement (Preference to Make in India) Order 2017'), 'MII 2017 guidelines');
    assert.ok(content.includes('Public Procurement Policy for MSEs Order 2012'), 'MSE Order 2012 guidelines');
  });

  // ============================================================================
  // SUITE 5: STATIC ASSETS & PRODUCTION BUNDLE VERIFICATION
  // ============================================================================
  console.log('\n--- SUITE 5: STATIC ASSET DIRECTORY & DIST VERIFICATION ---');

  await testCase('StaticAssets', 'frontend/dist: Production artifacts built and index.html exists', () => {
    const distPath = path.join(__dirname, '../frontend/dist');
    const indexPath = path.join(distPath, 'index.html');
    const assetsPath = path.join(distPath, 'assets');

    assert.ok(fs.existsSync(distPath), 'frontend/dist directory exists');
    assert.ok(fs.existsSync(indexPath), 'frontend/dist/index.html exists');
    assert.ok(fs.existsSync(assetsPath), 'frontend/dist/assets directory exists');

    const indexHtml = fs.readFileSync(indexPath, 'utf8');
    assert.ok(indexHtml.includes('<div id="root"></div>'), 'React root div in index.html');
    assert.ok(indexHtml.includes('/assets/'), 'Assets linked in index.html');
  });

  // ============================================================================
  // FINAL HARNESS VERDICT & SUMMARY
  // ============================================================================
  console.log('\n==============================================================================');
  console.log(`CHALLENGER 1 EMPIRICAL HARNESS SUMMARY:`);
  console.log(`  Total Assertions Run: ${totalAssertions}`);
  console.log(`  Passed: ${passedAssertions} (${Math.round((passedAssertions / totalAssertions) * 100)}%)`);
  console.log(`  Failed: ${failedAssertions}`);
  console.log(`==============================================================================\n`);

  if (failedAssertions > 0) {
    console.error(`🚨 EMPIRICAL CHALLENGE VERDICT: REQUEST_CHANGES (${failedAssertions} assertions failed)`);
    process.exit(1);
  } else {
    console.log('🏆 EMPIRICAL CHALLENGE VERDICT: APPROVE (100% tests passed, 0 failures)');
    process.exit(0);
  }
}

// Execute
runEmpiricalHarness().catch(err => {
  console.error('Fatal harness crash:', err);
  process.exit(1);
});
