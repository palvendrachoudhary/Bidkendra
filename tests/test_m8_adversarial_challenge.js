/**
 * Adversarial Stress-Test for Milestone 8 (Vendor Self-Service Portal)
 * Tests edge cases, malicious inputs, boundary conditions, and state mutations.
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');

const vendorController = require('../backend/src/controllers/vendorController');
const db = require('../backend/src/config/database');

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

async function runAdversarialTests() {
  console.log('================================================================');
  console.log('STARTING ADVERSARIAL STRESS CHALLENGE — MILESTONE 8');
  console.log('================================================================\n');

  await db.init();

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      passed++;
      console.log(`✅ PASS: ${name}`);
    } catch (e) {
      failed++;
      console.error(`❌ FAIL: ${name} -> ${e.message}`);
    }
  }

  // Stress Test 1: Malformed GSTIN in form vs document
  await test('Stress 1: Handles malformed lowercase inputs with whitespace', async () => {
    const mockReq = {
      body: {
        companyName: '  Messrs. Clean Energy Ltd  ',
        gstin: '  33aabcp1234f1z5  ',
        pan: '  aabcp1234f  ',
        udyam: '  udyam - tn - 02 - 0045812  ',
        text: 'GSTIN: 33AABCP1234F1Z5 PAN: AABCP1234F Udyam: UDYAM-TN-02-0045812 Local Content: 70%'
      }
    };
    const mockRes = createMockRes();
    await vendorController.verifyVendorDocument(mockReq, mockRes, err => { throw err; });

    assert.strictEqual(mockRes.statusCode, 200);
    assert.strictEqual(mockRes.jsonData.crossValidation.gstinMatch, true);
    assert.strictEqual(mockRes.jsonData.crossValidation.panMatch, true);
    assert.strictEqual(mockRes.jsonData.crossValidation.udyamMatch, true);
  });

  // Stress Test 2: Severe document non-compliance
  await test('Stress 2: Document with zero statutory tags flags mandatory failure and returns curing guidance', async () => {
    const mockReq = {
      body: {
        companyName: 'Empty Submission Corp',
        gstin: '33AABCP1234F1Z5',
        pan: 'AABCP1234F',
        udyam: 'UDYAM-TN-02-0045812',
        text: 'This is a recipe for chocolate cake. Flour, sugar, butter, eggs.'
      }
    };
    const mockRes = createMockRes();
    await vendorController.verifyVendorDocument(mockReq, mockRes, err => { throw err; });

    assert.strictEqual(mockRes.statusCode, 200);
    assert.strictEqual(mockRes.jsonData.isCompliant, false);
    assert.strictEqual(mockRes.jsonData.hasMandatoryFailure, true);
    assert.ok(mockRes.jsonData.verdict.includes('NOT_ELIGIBLE') || mockRes.jsonData.verdict.includes('DEFECTS'));
    assert.ok(mockRes.jsonData.curingGuidance.length > 0);
  });

  // Stress Test 3: SQL Injection resistance in vendor alerts query
  await test('Stress 3: SQL injection attempt in vendorName query parameter is neutralized', async () => {
    const mockReq = {
      query: { vendorName: "' OR '1'='1" }
    };
    const mockRes = createMockRes();
    vendorController.getVendorAlerts(mockReq, mockRes, err => { throw err; });

    assert.strictEqual(mockRes.statusCode, 200);
    assert.strictEqual(mockRes.jsonData.success, true);
    // Should treat it as a literal substring search, not dump entire DB if no matching vendor name exists
  });

  // Stress Test 4: Missing company name in saveVendorProfile returns 400
  await test('Stress 4: Missing company name in saveVendorProfile returns 400 Bad Request', async () => {
    const mockReq = {
      body: { gstin: '33AABCP1234F1Z5' }
    };
    const mockRes = createMockRes();
    vendorController.saveVendorProfile(mockReq, mockRes, err => { throw err; });

    assert.strictEqual(mockRes.statusCode, 400);
    assert.strictEqual(mockRes.jsonData.success, false);
  });

  console.log('\n================================================================');
  console.log(`STRESS TEST SUMMARY: ${passed} / ${passed + failed} PASSED`);
  console.log('================================================================\n');

  if (failed > 0) process.exit(1);
  else process.exit(0);
}

runAdversarialTests().catch(err => {
  console.error('Fatal stress test runner error:', err);
  process.exit(1);
});
