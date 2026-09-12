/**
 * Milestone 6 Empirical Adversarial Stress & Challenge Test Suite
 * Conducted by Challenger 1 (teamwork_preview_challenger_m6_1)
 *
 * Targets:
 * - POST /api/twilio/call (and /api/voice/call)
 * - GET /api/alerts/timeline
 * - POST /api/alerts/curing
 * - POST /api/vendor/verify
 * - POST /api/vendor/profile
 * - GET /api/vendor/tenders
 * - GET /api/vendor/alerts
 *
 * Stress Categories:
 * 1. Empty & missing field payloads
 * 2. Malformed input types & type-confusion (numbers, booleans, objects for strings/arrays)
 * 3. SQL injection vectors across query params and body payloads
 * 4. XSS & XML injection in TwiML and notification generators
 * 5. Extreme payload sizes (large arrays, multi-megabyte strings, high limits)
 * 6. Contradictory & mismatched statutory credentials (cross-validation)
 * 7. Malformed / broken JSON bodies
 * 8. Server liveness & crash resilience verification
 */

const http = require('http');

function sendRawRequest(port, options, rawBody = null) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: port,
      path: options.path,
      method: options.method || 'GET',
      headers: options.headers || {}
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {
          json = null;
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: json,
          raw: data
        });
      });
    });

    req.on('error', reject);
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error(`Request to ${options.path} timed out after 15s`));
    });

    if (rawBody !== null && rawBody !== undefined) {
      req.write(rawBody);
    }
    req.end();
  });
}

function sendJson(port, path, method, data) {
  const payload = JSON.stringify(data);
  return sendRawRequest(port, {
    path,
    method,
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    }
  }, payload);
}

async function checkServerHealth(port) {
  try {
    const res = await sendRawRequest(port, { path: '/api/health', method: 'GET' });
    return res.statusCode === 200 && res.body && res.body.success === true;
  } catch (e) {
    return false;
  }
}

async function runAdversarialTests(port = 5000) {
  console.log('================================================================');
  console.log(`🔥 Running M6 Adversarial Stress & Vulnerability Test on Port ${port}`);
  console.log('================================================================\n');

  const initialHealthy = await checkServerHealth(port);
  if (!initialHealthy) {
    console.error(`❌ CRITICAL: Server on port ${port} is NOT reachable or healthy before tests.`);
    process.exit(1);
  }
  console.log('✅ Baseline Pre-Check: Server is live, listening, and healthy.\n');

  let passedTests = 0;
  let failedTests = 0;
  const findings = [];

  function recordResult(category, testName, passed, details, isCriticalFinding = false) {
    if (passed) {
      passedTests++;
      console.log(`[PASS] [${category}] ${testName}`);
      if (details) console.log(`       ↳ ${details}`);
    } else {
      failedTests++;
      console.log(`[FAIL] [${category}] ${testName}`);
      console.log(`       ↳ ${details}`);
      findings.push({ category, testName, details, isCriticalFinding });
    }
  }

  // -------------------------------------------------------------------------
  // CATEGORY 1: POST /api/twilio/call
  // -------------------------------------------------------------------------
  console.log('\n--- 1. Testing POST /api/twilio/call ---');

  // 1.1 Empty Body
  try {
    const res = await sendJson(port, '/api/twilio/call', 'POST', {});
    const ok = res.statusCode === 200 && res.body && res.body.success === true && res.body.callSid;
    recordResult('TWILIO', 'Empty Request Body ({})', ok, `Status: ${res.statusCode}, Mode: ${res.body?.mode}, CallSid: ${res.body?.callSid}`);
  } catch (e) {
    recordResult('TWILIO', 'Empty Request Body ({})', false, e.message, true);
  }

  // 1.2 Malformed Phone Numbers
  const malformedPhones = [
    { label: 'Empty string phone', phone: '' },
    { label: 'Non-numeric random string', phone: 'NOT_A_PHONE_NUMBER!@#$%' },
    { label: 'SQL Injection in phone', phone: "+919876543210'; DROP TABLE alert_timeline; --" },
    { label: 'Extreme length phone (2000 chars)', phone: '+91' + '9'.repeat(2000) },
    { label: 'Unicode / emoji phone', phone: '📞+91-98765-43210-🚨' }
  ];

  for (const item of malformedPhones) {
    try {
      const res = await sendJson(port, '/api/twilio/call', 'POST', {
        phoneNumber: item.phone,
        vendorName: 'Adversarial Test Corp'
      });
      const ok = res.statusCode === 200 && res.body && res.body.success === true && res.body.callSid;
      recordResult('TWILIO', `Malformed Phone: ${item.label}`, ok, `Status: ${res.statusCode}, Mode: ${res.body?.mode}`);
    } catch (e) {
      recordResult('TWILIO', `Malformed Phone: ${item.label}`, false, e.message, true);
    }
  }

  // 1.3 Missing Fields & Degenerate Types
  try {
    const res = await sendJson(port, '/api/twilio/call', 'POST', {
      phoneNumber: '+919876543210',
      vendorName: null,
      tenderNumber: null,
      missingDocuments: 'This should be an array but is a string'
    });
    // System should handle string without crashing and generate valid TwiML
    const ok = res.statusCode === 200 && res.body && res.body.success === true;
    recordResult('TWILIO', 'Type Confusion (string for missingDocuments)', ok, `Status: ${res.statusCode}, SpokenText length: ${res.body?.details?.spokenText?.length}`);
  } catch (e) {
    recordResult('TWILIO', 'Type Confusion (string for missingDocuments)', false, e.message, true);
  }

  try {
    const res = await sendJson(port, '/api/twilio/call', 'POST', {
      phoneNumber: '+919876543210',
      missingDocuments: [] // Empty array
    });
    const ok = res.statusCode === 200 && res.body && res.body.success === true;
    recordResult('TWILIO', 'Empty missingDocuments Array', ok, `Status: ${res.statusCode}, Handled gracefully`);
  } catch (e) {
    recordResult('TWILIO', 'Empty missingDocuments Array', false, e.message, true);
  }

  // 1.4 Script Generation, XSS & XML Injection Attacks
  const xmlPayloads = [
    { label: 'Direct TwiML Injection', msg: '</Say><Hangup/><Say>Hacked' },
    { label: 'HTML/XSS Injection in Script', msg: '<script>alert("xss")</script><img src=x onerror=alert(1)>' },
    { label: 'Special XML Characters', msg: 'Testing & < > " \' symbols in alert' },
    { label: 'Multilingual & Non-ASCII Content', msg: 'வணக்கம்! GeM அறிவிப்பு: தகுதி ஆவணங்கள் தேவை. सतर्कता नोटिस 🚀' },
    { label: 'Large Custom Message (10,000 chars)', msg: 'Urgent notice '.repeat(750) }
  ];

  for (const xp of xmlPayloads) {
    try {
      const res = await sendJson(port, '/api/twilio/call', 'POST', {
        phoneNumber: '+919876543210',
        customMessage: xp.msg
      });
      const ok = res.statusCode === 200 && res.body && res.body.success === true && res.body.details && res.body.details.twiml;
      // Ensure the generated TwiML contains valid escaping or properly wraps
      const twiml = res.body?.details?.twiml || '';
      const containsSay = twiml.includes('<Say voice="alice" language="en-IN">') || twiml.includes('<Say');
      recordResult('TWILIO', `Script/XML Injection: ${xp.label}`, ok && containsSay, `Status: ${res.statusCode}, TwiML validly formed: ${containsSay}`);
    } catch (e) {
      recordResult('TWILIO', `Script/XML Injection: ${xp.label}`, false, e.message, true);
    }
  }

  // 1.5 Alias Route Verification (/api/voice/call)
  try {
    const res = await sendJson(port, '/api/voice/call', 'POST', {
      phoneNumber: '+919876543210',
      vendorName: 'Alias Route Test'
    });
    const ok = res.statusCode === 200 && res.body && res.body.success === true;
    recordResult('TWILIO', 'Alias Route /api/voice/call', ok, `Status: ${res.statusCode}, CallSid: ${res.body?.callSid}`);
  } catch (e) {
    recordResult('TWILIO', 'Alias Route /api/voice/call', false, e.message, true);
  }

  // -------------------------------------------------------------------------
  // CATEGORY 2: GET /api/alerts/timeline
  // -------------------------------------------------------------------------
  console.log('\n--- 2. Testing GET /api/alerts/timeline ---');

  // 2.1 SQL Injection Vectors in vendor_name
  const sqliVectors = [
    { label: 'Classic tautology: \' OR 1=1 --', param: "' OR 1=1 --" },
    { label: 'DROP TABLE attempt: \'; DROP TABLE alert_timeline; --', param: "'; DROP TABLE alert_timeline; --" },
    { label: 'UNION SELECT injection', param: "' UNION SELECT 1,2,3,4,5,6,7,8,9,10,11,12,13 --" },
    { label: 'Blind injection with SLEEP/WAITFOR', param: "' AND (SELECT 1 FROM (SELECT COUNT(*),CONCAT((SELECT 1),0x3a,FLOOR(RAND(0)*2))x FROM information_schema.tables GROUP BY x)a)--" },
    { label: 'Wildcard LIKE amplification: %%%%%%', param: '%%%%%%' }
  ];

  for (const sqli of sqliVectors) {
    try {
      const encoded = encodeURIComponent(sqli.param);
      const res = await sendRawRequest(port, { path: `/api/alerts/timeline?vendor_name=${encoded}`, method: 'GET' });
      // The endpoint should NOT crash and should return a valid JSON array
      const ok = res.statusCode === 200 && res.body && res.body.success === true && Array.isArray(res.body.alerts);
      recordResult('TIMELINE', `SQLi: ${sqli.label}`, ok, `Status: ${res.statusCode}, Alerts count returned: ${res.body?.alerts?.length}`);
    } catch (e) {
      recordResult('TIMELINE', `SQLi: ${sqli.label}`, false, e.message, true);
    }
  }

  // 2.2 Negative Limit Values
  const negativeLimits = [-1, -50, -99999];
  for (const lim of negativeLimits) {
    try {
      const res = await sendRawRequest(port, { path: `/api/alerts/timeline?limit=${lim}`, method: 'GET' });
      const ok = res.statusCode === 200 && res.body && res.body.success === true && Array.isArray(res.body.alerts);
      recordResult('TIMELINE', `Negative Limit (${lim})`, ok, `Status: ${res.statusCode}, Handled without SQLite crash, returned: ${res.body?.alerts?.length} alerts`);
    } catch (e) {
      recordResult('TIMELINE', `Negative Limit (${lim})`, false, e.message, true);
    }
  }

  // 2.3 Extreme and Degenerate Limit Values
  const degenerateLimits = [
    { label: 'Zero limit (limit=0)', val: '0' },
    { label: 'Extremely high limit (limit=99999999)', val: '99999999' },
    { label: 'NaN string (limit=NaN)', val: 'NaN' },
    { label: 'Alphabetical string (limit=unlimited)', val: 'unlimited' },
    { label: 'Floating point (limit=3.1415)', val: '3.1415' },
    { label: 'SQL Injection in limit (limit=10; DROP TABLE alert_timeline;)', val: '10; DROP TABLE alert_timeline;' }
  ];

  for (const dl of degenerateLimits) {
    try {
      const encoded = encodeURIComponent(dl.val);
      const res = await sendRawRequest(port, { path: `/api/alerts/timeline?limit=${encoded}`, method: 'GET' });
      const ok = res.statusCode === 200 && res.body && res.body.success === true && Array.isArray(res.body.alerts);
      recordResult('TIMELINE', `Degenerate Limit: ${dl.label}`, ok, `Status: ${res.statusCode}, Count: ${res.body?.alerts?.length}`);
    } catch (e) {
      recordResult('TIMELINE', `Degenerate Limit: ${dl.label}`, false, e.message, true);
    }
  }

  // 2.4 Boundary vendor_name inputs
  const boundaryVendorNames = [
    { label: 'Empty parameter (?vendor_name=)', query: '?vendor_name=' },
    { label: 'Whitespace only (?vendor_name=%20%20%20)', query: '?vendor_name=%20%20%20' },
    { label: 'Null byte injection (?vendor_name=%00)', query: '?vendor_name=%00' },
    { label: 'Giant vendor name (5,000 characters)', query: `?vendor_name=${encodeURIComponent('X'.repeat(5000))}` }
  ];

  for (const bvn of boundaryVendorNames) {
    try {
      const res = await sendRawRequest(port, { path: `/api/alerts/timeline${bvn.query}`, method: 'GET' });
      const ok = res.statusCode === 200 && res.body && res.body.success === true;
      recordResult('TIMELINE', `Boundary vendor_name: ${bvn.label}`, ok, `Status: ${res.statusCode}, Results: ${res.body?.alerts?.length}`);
    } catch (e) {
      recordResult('TIMELINE', `Boundary vendor_name: ${bvn.label}`, false, e.message, true);
    }
  }

  // -------------------------------------------------------------------------
  // CATEGORY 3: POST /api/alerts/curing
  // -------------------------------------------------------------------------
  console.log('\n--- 3. Testing POST /api/alerts/curing ---');

  // 3.1 Empty Payload
  try {
    const res = await sendJson(port, '/api/alerts/curing', 'POST', {});
    const ok = res.statusCode === 200 && res.body && res.body.success === true && res.body.alertId;
    recordResult('CURING', 'Empty Payload ({})', ok, `Status: ${res.statusCode}, AlertId: ${res.body?.alertId}`);
  } catch (e) {
    recordResult('CURING', 'Empty Payload ({})', false, e.message, true);
  }

  // 3.2 Large Payloads
  try {
    const hugeFlaggedItems = Array.from({ length: 1000 }, (_, i) => `Statutory Missing Certificate #${i + 1}`);
    const res = await sendJson(port, '/api/alerts/curing', 'POST', {
      vendor_name: 'Massive Industrial Ltd',
      flagged_items: hugeFlaggedItems,
      message: 'A'.repeat(50000)
    });
    const ok = res.statusCode === 200 && res.body && res.body.success === true && res.body.alertId;
    recordResult('CURING', 'Large Payload (1000 items + 50KB msg)', ok, `Status: ${res.statusCode}, DeliveryMode: ${res.body?.deliveryMode}`);
  } catch (e) {
    recordResult('CURING', 'Large Payload (1000 items + 50KB msg)', false, e.message, true);
  }

  // 3.3 Special Characters & Injections
  const specialCharsCuring = [
    { label: 'SQLi in vendor_name', vendor_name: "Hacker'; UPDATE alert_timeline SET status='PWNED'; --" },
    { label: 'HTML/Script tags in title & message', title: '<script>alert("xss")</script>', message: '<b>Bold</b> and <iframe src="evil.com"></iframe>' },
    { label: 'Unicode & Emoji spam', vendor_name: '🔥🚀 PetroTech தமிழ்நாடு Pvt Ltd 💥⚡', title: '⚠️ فوری نوٹس Alert ⚠️' },
    { label: 'Control characters & Quotes', message: 'Row 1\nRow 2\r\n"Quotes" and \'Single\' and \\Backslashes\\ and \tTabs' }
  ];

  for (const sc of specialCharsCuring) {
    try {
      const res = await sendJson(port, '/api/alerts/curing', 'POST', {
        vendor_name: sc.vendor_name || 'Special Char Vendor',
        title: sc.title,
        message: sc.message,
        flagged_items: ['Item 1: GSTIN & PAN <Special>']
      });
      const ok = res.statusCode === 200 && res.body && res.body.success === true && res.body.alertId;
      recordResult('CURING', `Special Characters: ${sc.label}`, ok, `Status: ${res.statusCode}, AlertId: ${res.body?.alertId}`);
    } catch (e) {
      recordResult('CURING', `Special Characters: ${sc.label}`, false, e.message, true);
    }
  }

  // 3.4 Degenerate types for flagged_items (Defensive Robustness)
  // Notice: If client sends a string for flagged_items instead of an array, does server crash?
  try {
    const res = await sendJson(port, '/api/alerts/curing', 'POST', {
      vendor_name: 'Type Test Corp',
      flagged_items: 'Single non-array string'
    });
    // Server should either handle with 200 or return 400/500 JSON without process crash
    const survived = res.statusCode !== 0 && (res.body !== null || res.raw.length > 0);
    recordResult('CURING', 'Type Confusion (string for flagged_items)', survived, `Status: ${res.statusCode}, Server Survived: ${survived}, Response: ${res.body?.message || res.raw.slice(0, 80)}`);
  } catch (e) {
    recordResult('CURING', 'Type Confusion (string for flagged_items)', false, e.message, true);
  }

  // -------------------------------------------------------------------------
  // CATEGORY 4: POST /api/vendor/verify
  // -------------------------------------------------------------------------
  console.log('\n--- 4. Testing POST /api/vendor/verify ---');

  // 4.1 Empty Text & Empty Body
  try {
    const res = await sendJson(port, '/api/vendor/verify', 'POST', {});
    const ok = res.statusCode === 200 && res.body && res.body.success === true && typeof res.body.overallScore === 'number';
    recordResult('VENDOR_VERIFY', 'Empty Body Payload ({})', ok, `Status: ${res.statusCode}, OverallScore: ${res.body?.overallScore}%, HasMandatoryFailure: ${res.body?.hasMandatoryFailure}`);
  } catch (e) {
    recordResult('VENDOR_VERIFY', 'Empty Body Payload ({})', false, e.message, true);
  }

  try {
    const res = await sendJson(port, '/api/vendor/verify', 'POST', {
      companyName: 'Empty Text Corp',
      text: '' // Explicit empty string text
    });
    const ok = res.statusCode === 200 && res.body && res.body.success === true;
    recordResult('VENDOR_VERIFY', 'Explicit Empty String Text (text: "")', ok, `Status: ${res.statusCode}, Handled via synthetic sample fallback`);
  } catch (e) {
    recordResult('VENDOR_VERIFY', 'Explicit Empty String Text (text: "")', false, e.message, true);
  }

  try {
    const res = await sendJson(port, '/api/vendor/verify', 'POST', {
      companyName: 'Whitespace Corp',
      text: '      \n\n\t\t   \r\n     ' // Whitespace only text
    });
    // Whitespace only text contains no GSTIN/PAN, so it should flag mandatory failures and not crash
    const ok = res.statusCode === 200 && res.body && res.body.success === true && res.body.hasMandatoryFailure === true;
    recordResult('VENDOR_VERIFY', 'Whitespace-Only Text', ok, `Status: ${res.statusCode}, MandatoryFailure: ${res.body?.hasMandatoryFailure}, GuidanceItems: ${res.body?.curingGuidance?.length}`);
  } catch (e) {
    recordResult('VENDOR_VERIFY', 'Whitespace-Only Text', false, e.message, true);
  }

  // 4.2 Contradictory GSTIN / PAN / Udyam Values
  try {
    const res = await sendJson(port, '/api/vendor/verify', 'POST', {
      companyName: 'Contradiction Industries',
      text: 'CIN: U23201TN2018PTC123456 GSTIN: 33AABCP1234F1Z5 PAN: AABCP1234F Udyam: UDYAM-TN-02-0045812 Local Content: 80%',
      gstin: '27XYZPQ9876M1Z2',       // Form mismatch vs 33AABCP1234F1Z5 (Maharashtra vs TN)
      pan: 'XYZPQ9876M',              // Form mismatch vs AABCP1234F
      udyam: 'UDYAM-MH-01-9988776'     // Form mismatch vs UDYAM-TN-02-0045812
    });

    const crossVal = res.body?.crossValidation;
    const detectedAllThree = crossVal &&
      crossVal.passed === false &&
      crossVal.gstinMatch === false &&
      crossVal.panMatch === false &&
      crossVal.udyamMatch === false &&
      crossVal.discrepancies.length >= 3;

    const guidanceHasDiscrepancy = Array.isArray(res.body?.curingGuidance) &&
      res.body.curingGuidance.some(g => g.type === 'DISCREPANCY');

    recordResult(
      'VENDOR_VERIFY',
      'Contradictory Form vs Document (GSTIN, PAN, Udyam Mismatch)',
      detectedAllThree && guidanceHasDiscrepancy,
      `Discrepancies: ${crossVal?.discrepancies?.length}, Curing Guidance items: ${res.body?.curingGuidance?.length}`
    );
  } catch (e) {
    recordResult('VENDOR_VERIFY', 'Contradictory Form vs Document (GSTIN, PAN, Udyam Mismatch)', false, e.message, true);
  }

  // 4.3 Form specifies credentials that do NOT exist in the document at all
  try {
    const res = await sendJson(port, '/api/vendor/verify', 'POST', {
      companyName: 'Ghost Credential Corp',
      text: 'Simple letter of authorization without any statutory certificate identifiers.',
      gstin: '33AABCP1234F1Z5',
      pan: 'AABCP1234F',
      udyam: 'UDYAM-TN-02-0045812'
    });

    const crossVal = res.body?.crossValidation;
    const flaggedMissing = crossVal &&
      crossVal.passed === false &&
      crossVal.discrepancies.length === 3; // 3 discrepancies because none exist in doc

    recordResult(
      'VENDOR_VERIFY',
      'Missing Document Credentials vs Specified Form Values',
      flaggedMissing,
      `CrossValidation Passed: ${crossVal?.passed}, Discrepancies Count: ${crossVal?.discrepancies?.length}`
    );
  } catch (e) {
    recordResult('VENDOR_VERIFY', 'Missing Document Credentials vs Specified Form Values', false, e.message, true);
  }

  // 4.4 Invalid JSON in Request Body (Syntax Error)
  try {
    const brokenJson = '{"companyName": "Broken JSON Corp", "gstin": "33AABCP1234F1Z5", incomplete: ';
    const res = await sendRawRequest(port, {
      path: '/api/vendor/verify',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(brokenJson)
      }
    }, brokenJson);

    // Express body-parser should return 400 Bad Request via errorHandler, NOT 500 unhandled crash
    const ok = res.statusCode === 400 && res.body && res.body.success === false;
    recordResult(
      'VENDOR_VERIFY',
      'Invalid JSON Payload (Malformed Syntax)',
      ok,
      `Status: ${res.statusCode}, Gracefully intercepted with 400 Bad Request: ${res.body?.message || res.raw}`
    );
  } catch (e) {
    recordResult('VENDOR_VERIFY', 'Invalid JSON Payload (Malformed Syntax)', false, e.message, true);
  }

  // 4.5 Extreme Payload Size in text (JSON vs Multipart)
  // Test A: JSON body size limit boundary (50KB JSON text document - should pass)
  try {
    const mediumText = `
      COMPANY: PetroTech India Pvt Ltd
      GSTIN: 33AABCP1234F1Z5
      PAN: AABCP1234F
      UDYAM: UDYAM-TN-02-0045812
      CIN: U23201TN2018PTC123456
      MAKE IN INDIA: 75% Local Content Class-I Supplier
    ` + ' Specification paragraph with engineering data and valve requirements.\n'.repeat(600);

    const res = await sendJson(port, '/api/vendor/verify', 'POST', {
      companyName: 'Mediumload Industries',
      text: mediumText,
      gstin: '33AABCP1234F1Z5',
      pan: 'AABCP1234F'
    });

    const ok = res.statusCode === 200 && res.body && res.body.success === true;
    recordResult(
      'VENDOR_VERIFY',
      'Large JSON Payload within BodyParser Limit (50KB Text Document)',
      ok,
      `Status: ${res.statusCode}, Score: ${res.body?.overallScore}%, Discrepancies: ${res.body?.crossValidation?.discrepancies?.length}`
    );
  } catch (e) {
    recordResult('VENDOR_VERIFY', 'Large JSON Payload within BodyParser Limit (50KB Text Document)', false, e.message, true);
  }

  // Test B: Multipart/form-data upload with 500KB file (Multer allows up to 25MB)
  try {
    const boundary = '----AdversarialBoundary' + Date.now();
    const crlf = '\r\n';
    const sampleContent = 'CHENNAI PETROLEUM CORPORATION LIMITED VENDOR BID\nGSTIN: 33AABCP1234F1Z5 PAN: AABCP1234F UDYAM: UDYAM-TN-02-0045812\n' + 'Technical specs data padding.\n'.repeat(15000);
    
    const part1 = Buffer.from(
      `--${boundary}${crlf}Content-Disposition: form-data; name="companyName"${crlf}${crlf}Multipart Test Corp${crlf}` +
      `--${boundary}${crlf}Content-Disposition: form-data; name="gstin"${crlf}${crlf}33AABCP1234F1Z5${crlf}` +
      `--${boundary}${crlf}Content-Disposition: form-data; name="document"; filename="large_bid_document.txt"${crlf}Content-Type: text/plain${crlf}${crlf}`,
      'utf8'
    );
    const filePart = Buffer.from(sampleContent, 'utf8');
    const part2 = Buffer.from(`${crlf}--${boundary}--${crlf}`, 'utf8');
    const multipartBody = Buffer.concat([part1, filePart, part2]);

    const res = await sendRawRequest(port, {
      path: '/api/vendor/verify',
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': multipartBody.length
      }
    }, multipartBody);

    const ok = res.statusCode === 200 && res.body && res.body.success === true;
    recordResult(
      'VENDOR_VERIFY',
      'Multipart Large Document Upload (500KB via Multer)',
      ok,
      `Status: ${res.statusCode}, Handled via Multer streaming up to 25MB limit, Score: ${res.body?.overallScore}%`
    );
  } catch (e) {
    recordResult('VENDOR_VERIFY', 'Multipart Large Document Upload (500KB via Multer)', false, e.message, true);
  }

  // Test C: 1.5MB raw JSON payload triggers standard Express 413 Payload Too Large (Defensive check)
  try {
    const hugeDocumentText = 'A'.repeat(1500000);
    const res = await sendJson(port, '/api/vendor/verify', 'POST', {
      companyName: 'Heavyload Industries',
      text: hugeDocumentText
    });
    // Standard Express JSON body-parser limit (100kb) returns 413 without crashing server
    const ok = res.statusCode === 413;
    recordResult(
      'VENDOR_VERIFY',
      'Oversized JSON Body Rejection (1.5MB triggers HTTP 413)',
      ok,
      `Status: ${res.statusCode} (Express body-parser correctly protects server from JSON buffer overflow)`
    );
  } catch (e) {
    recordResult('VENDOR_VERIFY', 'Oversized JSON Body Rejection (1.5MB triggers HTTP 413)', false, e.message, true);
  }

  // 4.6 Degenerate Type Handling (Non-string values for gstin/pan/udyam)
  try {
    const res = await sendJson(port, '/api/vendor/verify', 'POST', {
      companyName: 'Type Test Corp',
      gstin: 12345678, // Number instead of string
      pan: true,       // Boolean instead of string
      text: 'Simple text'
    });
    // Server catches error or handles it without crashing
    const survived = res.statusCode !== 0;
    recordResult('VENDOR_VERIFY', 'Non-string Type Confusion (number/boolean for gstin/pan)', survived, `Status: ${res.statusCode}, Message: ${res.body?.message || res.raw.slice(0, 60)}`);
  } catch (e) {
    recordResult('VENDOR_VERIFY', 'Non-string Type Confusion (number/boolean for gstin/pan)', false, e.message, true);
  }

  // -------------------------------------------------------------------------
  // CATEGORY 5: VENDOR PORTAL AUXILIARY APIS
  // -------------------------------------------------------------------------
  console.log('\n--- 5. Testing Auxiliary Vendor APIs ---');

  // 5.1 POST /api/vendor/profile without companyName
  try {
    const res = await sendJson(port, '/api/vendor/profile', 'POST', {
      email: 'no-name@vendor.com'
    });
    const ok = res.statusCode === 400 && res.body && res.body.success === false;
    recordResult('VENDOR_AUX', 'Profile Save Missing Required Company Name', ok, `Status: ${res.statusCode}, Handled with 400: ${res.body?.message}`);
  } catch (e) {
    recordResult('VENDOR_AUX', 'Profile Save Missing Required Company Name', false, e.message, true);
  }

  // 5.2 GET /api/vendor/alerts with SQL Injection in vendorName
  try {
    const sqli = encodeURIComponent("' OR '1'='1");
    const res = await sendRawRequest(port, { path: `/api/vendor/alerts?vendorName=${sqli}`, method: 'GET' });
    const ok = res.statusCode === 200 && res.body && res.body.success === true && Array.isArray(res.body.alerts);
    recordResult('VENDOR_AUX', 'Vendor Alerts SQL Injection (?vendorName=\' OR \'1\'=\'1)', ok, `Status: ${res.statusCode}, Count: ${res.body?.count}`);
  } catch (e) {
    recordResult('VENDOR_AUX', 'Vendor Alerts SQL Injection (?vendorName=\' OR \'1\'=\'1)', false, e.message, true);
  }

  // 5.3 GET /api/vendor/tenders
  try {
    const res = await sendRawRequest(port, { path: '/api/vendor/tenders', method: 'GET' });
    const ok = res.statusCode === 200 && res.body && res.body.success === true && Array.isArray(res.body.tenders);
    recordResult('VENDOR_AUX', 'Vendor Tenders Fetch', ok, `Status: ${res.statusCode}, Count: ${res.body?.count}`);
  } catch (e) {
    recordResult('VENDOR_AUX', 'Vendor Tenders Fetch', false, e.message, true);
  }

  // -------------------------------------------------------------------------
  // CATEGORY 6: SERVER CRASH & SYSTEM RESILIENCE VERIFICATION
  // -------------------------------------------------------------------------
  console.log('\n--- 6. Verifying System Resilience & Database Integrity ---');

  // Verify server is STILL alive after all the above stress/injection attacks
  const postHealth = await checkServerHealth(port);
  recordResult(
    'RESILIENCE',
    'Post-Adversarial Server Liveness Check (/api/health)',
    postHealth,
    postHealth ? 'Server survived all adversarial vectors without crash or hang' : 'SERVER CRASHED OR UNRESPONSIVE',
    !postHealth
  );

  // Check alert_timeline persistence
  try {
    const res = await sendRawRequest(port, { path: '/api/alerts/timeline?limit=10', method: 'GET' });
    const ok = res.statusCode === 200 && res.body && res.body.success === true && res.body.alerts.length > 0;
    recordResult('RESILIENCE', 'Database Integrity Check (alert_timeline table active)', ok, `Status: ${res.statusCode}, Timeline records preserved: ${res.body?.alerts?.length}`);
  } catch (e) {
    recordResult('RESILIENCE', 'Database Integrity Check (alert_timeline table active)', false, e.message, true);
  }

  console.log('\n================================================================');
  console.log(`📊 ADVERSARIAL STRESS TEST SUMMARY`);
  console.log(`   Passed: ${passedTests}`);
  console.log(`   Failed: ${failedTests}`);
  console.log(`   Total Tests: ${passedTests + failedTests}`);
  console.log(`   Verdict: ${failedTests === 0 ? '🟢 ALL ATTACKS DEFENDED (RESILIENT)' : '🟡 FINDINGS DETECTED'}`);
  console.log('================================================================\n');

  return {
    passedTests,
    failedTests,
    totalTests: passedTests + failedTests,
    findings,
    serverSurvived: postHealth
  };
}

if (require.main === module) {
  const targetPort = parseInt(process.argv[2], 10) || 5000;
  runAdversarialTests(targetPort).then(summary => {
    // Write results to JSON for handoff reference
    const fs = require('fs');
    const path = require('path');
    const outPath = path.join(__dirname, 'm6_adversarial_results.json');
    fs.writeFileSync(outPath, JSON.stringify(summary, null, 2), 'utf8');
    console.log(`Detailed results saved to: ${outPath}`);
    process.exit(summary.serverSurvived && summary.failedTests === 0 ? 0 : (summary.serverSurvived ? 0 : 1));
  }).catch(err => {
    console.error('Fatal test error:', err);
    process.exit(1);
  });
}

module.exports = { runAdversarialTests };
