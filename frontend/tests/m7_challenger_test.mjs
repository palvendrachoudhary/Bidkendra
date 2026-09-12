// Empirical Challenger Test Harness for Milestone 7 (Officer UI Enhancements & USPs)
// Tests:
// 1. Voice Assistant Natural Language Query Matching (English & Hindi queries for Score, Missing Docs, Report)
// 2. Twilio Modal State Transitions (IDLE -> DIALING -> RINGING -> IN_PROGRESS -> COMPLETED)
// 3. Early End Call transition & timer cleanup
// 4. Edge cases, Boundary Conditions, and Defect Detection

import assert from 'node:assert';

console.log('================================================================');
console.log('🧪 MILESTONE 7 EMPIRICAL CHALLENGER VERIFICATION HARNESS');
console.log('================================================================\n');

// -------------------------------------------------------------
// PART 1: VOICE ASSISTANT NLP QUERY RESOLUTION ENGINE
// -------------------------------------------------------------
console.log('--- TEST SUITE 1: Voice Assistant Natural Language Matching (EN & HI) ---');

// Replicate the exact NLP resolution logic from VernacularVoiceAssistant.jsx (Lines 115-232)
function processVoiceQuery(rawQuery, queryLang = 'en', state = {}) {
  const q = rawQuery.trim().toLowerCase();
  const overallScore = state.overallScore ?? 85;
  const missingDocs = state.missingDocs ?? ['GSTIN Statutory Validation', 'Class-I Local Content Declaration'];
  const bidderName = state.bidderName ?? 'PetroTech India Pvt Ltd';

  let matchedIntent = 'UNKNOWN';
  let reply = '';
  let triggeredAction = null;

  // 1. Compliance Score Query
  const isScoreQuery = 
    q.includes('compliance score') || 
    q.includes('what is the score') || 
    q.includes('tell me the score') || 
    q.includes('what is score') || 
    q.includes('score') ||
    q.includes('स्कोर') ||
    q.includes('अनुपालन') ||
    q.includes('अंक');

  // 2. Missing Documents Query
  const isMissingQuery = 
    q.includes('missing') || 
    q.includes('document') || 
    q.includes('failed') || 
    q.includes('which documents') || 
    q.includes('what is missing') ||
    q.includes('गायब') ||
    q.includes('दस्तावेज') ||
    q.includes('कागजात') ||
    q.includes('बाकी');

  // 3. Show Report / Navigate Query
  const isReportQuery = 
    q.includes('report') || 
    q.includes('audit') || 
    q.includes('show me the report') || 
    q.includes('open report') || 
    q.includes('view report') || 
    q.includes('रिपोर्ट') || 
    q.includes('दिखाओ') || 
    q.includes('खोलो');

  // 4. Additional: Call Vendor
  const isCallQuery = 
    q.includes('call') || 
    q.includes('phone') || 
    q.includes('vendor call') || 
    q.includes('कॉल') || 
    q.includes('फोन');

  // 5. Additional: Dark Mode
  const isThemeQuery = 
    q.includes('dark mode') || 
    q.includes('theme') || 
    q.includes('लाइट') || 
    q.includes('डार्क');

  // Note: Line 171 in VernacularVoiceAssistant.jsx uses: Number(overallScore) || 85
  const scoreNum = Math.max(0, Math.min(100, Number(overallScore) || 85));
  const riskTxt = scoreNum >= 80 ? 'Low' : scoreNum >= 50 ? 'Medium' : 'High';
  const riskTxtHi = scoreNum >= 80 ? 'कम (सुरक्षित)' : scoreNum >= 50 ? 'मध्यम' : 'उच्च (जोखिमपूर्ण)';

  if (isScoreQuery) {
    matchedIntent = 'SCORE';
    if (queryLang === 'hi') {
      reply = `${bidderName} का समग्र वैधानिक अनुपालन स्कोर ${scoreNum} प्रतिशत है। जोखिम मूल्यांकन ${riskTxtHi} है।`;
    } else {
      reply = `The overall statutory compliance score for ${bidderName} is ${scoreNum} percent with ${riskTxt} risk level.`;
    }
    triggeredAction = 'SHOW_SCORE_TOAST';
  } else if (isMissingQuery) {
    matchedIntent = 'MISSING_DOCS';
    const docStr = missingDocs.slice(0, 3).join(', ');
    if (queryLang === 'hi') {
      reply = `वर्तमान निविदा में अनुपलब्ध या गैर-अनुपालित दस्तावेज हैं: ${docStr}। सक्रिय क्योरिंग अलर्ट भेजा जा सकता है।`;
    } else {
      reply = `The missing or non-compliant statutory documents are: ${docStr}. An active bid curing alert can be dispatched to the vendor.`;
    }
    triggeredAction = 'SHOW_MISSING_DOCS_TOAST';
  } else if (isReportQuery) {
    matchedIntent = 'SHOW_REPORT';
    if (queryLang === 'hi') {
      reply = `सीपीसीएल आधिकारिक वैधानिक अनुपालन रिपोर्ट और निर्णय पैनल खोला जा रहा है।`;
    } else {
      reply = `Navigating to the official CPCL statutory compliance evaluation report.`;
    }
    triggeredAction = 'NAVIGATE_REPORTS';
  } else if (isCallQuery) {
    matchedIntent = 'CALL_VENDOR';
    triggeredAction = 'OPEN_TWILIO_MODAL';
  } else if (isThemeQuery) {
    matchedIntent = 'THEME_TOGGLE';
    triggeredAction = 'TOGGLE_THEME';
  } else {
    matchedIntent = 'UNKNOWN';
    if (queryLang === 'hi') {
      reply = `क्षमा करें, मुझे समझ नहीं आया। आप पूछ सकते हैं: 'अनुपालन स्कोर क्या है?', 'कौन से दस्तावेज गायब हैं?', या 'रिपोर्ट दिखाओ'।`;
    } else {
      reply = `I heard: "${rawQuery}". You can ask: "What is the compliance score?", "Which documents are missing?", or "Show me the report".`;
    }
  }

  return { matchedIntent, reply, triggeredAction, scoreNum, riskTxt, riskTxtHi };
}

// Comprehensive Test Matrix for Natural Language Matching
const nlpTestCases = [
  // English - Score Queries
  { query: 'What is the compliance score?', lang: 'en', expected: 'SCORE', desc: 'Exact preset: What is the compliance score?' },
  { query: 'what is the score', lang: 'en', expected: 'SCORE', desc: 'Lower case without question mark' },
  { query: 'tell me the score', lang: 'en', expected: 'SCORE', desc: 'Alternative phrasing: tell me the score' },
  { query: 'What is score of bidder?', lang: 'en', expected: 'SCORE', desc: 'Variation with bidder suffix' },
  { query: 'COMPLIANCE SCORE', lang: 'en', expected: 'SCORE', desc: 'UPPERCASE compliance score' },
  { query: '   score please   ', lang: 'en', expected: 'SCORE', desc: 'Whitespace padded query' },

  // Hindi - Score Queries
  { query: 'अनुपालन स्कोर क्या है?', lang: 'hi', expected: 'SCORE', desc: 'Hindi preset: अनुपालन स्कोर क्या है?' },
  { query: 'स्कोर बताओ', lang: 'hi', expected: 'SCORE', desc: 'Hindi colloquial: स्कोर बताओ' },
  { query: 'कुल अंक कितने हैं?', lang: 'hi', expected: 'SCORE', desc: 'Hindi alternative keyword: अंक' },
  { query: 'कंपनी का अनुपालन कैसा है?', lang: 'hi', expected: 'SCORE', desc: 'Hindi keyword: अनुपालन' },

  // English - Missing Documents Queries
  { query: 'Which documents are missing?', lang: 'en', expected: 'MISSING_DOCS', desc: 'Exact preset: Which documents are missing?' },
  { query: 'what is missing', lang: 'en', expected: 'MISSING_DOCS', desc: 'Alternative: what is missing' },
  { query: 'Are any document failed?', lang: 'en', expected: 'MISSING_DOCS', desc: 'Keyword: document + failed' },
  { query: 'Which documents failed validation?', lang: 'en', expected: 'MISSING_DOCS', desc: 'Keyword: which documents' },

  // Hindi - Missing Documents Queries
  { query: 'कौन से दस्तावेज गायब हैं?', lang: 'hi', expected: 'MISSING_DOCS', desc: 'Hindi preset: कौन से दस्तावेज गायब हैं?' },
  { query: 'क्या कोई दस्तावेज बाकी है?', lang: 'hi', expected: 'MISSING_DOCS', desc: 'Hindi: दस्तावेज + बाकी' },
  { query: 'कौन से कागजात गायब हैं?', lang: 'hi', expected: 'MISSING_DOCS', desc: 'Hindi colloquial: कागजात' },
  { query: 'लाइसेंस गायब है', lang: 'hi', expected: 'MISSING_DOCS', desc: 'Hindi keyword: गायब' },

  // English - Show Report Queries
  { query: 'Show me the report', lang: 'en', expected: 'SHOW_REPORT', desc: 'Exact preset: Show me the report' },
  { query: 'open report', lang: 'en', expected: 'SHOW_REPORT', desc: 'Variation: open report' },
  { query: 'view report now', lang: 'en', expected: 'SHOW_REPORT', desc: 'Variation: view report' },
  { query: 'Show audit details', lang: 'en', expected: 'SHOW_REPORT', desc: 'Keyword: audit' },

  // Hindi - Show Report Queries
  { query: 'रिपोर्ट दिखाओ', lang: 'hi', expected: 'SHOW_REPORT', desc: 'Hindi preset: रिपोर्ट दिखाओ' },
  { query: 'ऑडिट रिपोर्ट खोलो', lang: 'hi', expected: 'SHOW_REPORT', desc: 'Hindi: रिपोर्ट + खोलो' },
  { query: 'विस्तृत रिपोर्ट दिखाओ', lang: 'hi', expected: 'SHOW_REPORT', desc: 'Hindi: दिखाओ + रिपोर्ट' },

  // Edge & Additional Queries
  { query: 'call vendor', lang: 'en', expected: 'CALL_VENDOR', desc: 'Preset: call vendor' },
  { query: 'वेंडर को कॉल करो', lang: 'hi', expected: 'CALL_VENDOR', desc: 'Hindi preset: वेंडर को कॉल करो' },
  { query: 'toggle dark mode', lang: 'en', expected: 'THEME_TOGGLE', desc: 'Preset: toggle dark mode' },
  { query: 'डार्क मोड ऑन करो', lang: 'hi', expected: 'THEME_TOGGLE', desc: 'Hindi theme query' },
  { query: 'random gibberish query 12345', lang: 'en', expected: 'UNKNOWN', desc: 'Unknown query handling' }
];

let nlpPassed = 0;
let nlpFailed = 0;

for (const tc of nlpTestCases) {
  const res = processVoiceQuery(tc.query, tc.lang);
  const ok = res.matchedIntent === tc.expected;
  if (ok) {
    nlpPassed++;
    console.log(`  ✓ [PASS] [${tc.lang.toUpperCase()}] "${tc.query}" -> ${res.matchedIntent} (${tc.desc})`);
  } else {
    nlpFailed++;
    console.error(`  ✗ [FAIL] [${tc.lang.toUpperCase()}] "${tc.query}" -> Expected ${tc.expected}, got ${res.matchedIntent} (${tc.desc})`);
  }
}

console.log(`\nNLP Matching Summary: ${nlpPassed}/${nlpTestCases.length} passed, ${nlpFailed} failed.\n`);
assert.strictEqual(nlpFailed, 0, `All NLP test cases must pass, but ${nlpFailed} failed.`);


// -------------------------------------------------------------
// PART 2: TWILIO MODAL STATE TRANSITIONS SIMULATION
// -------------------------------------------------------------
console.log('--- TEST SUITE 2: Twilio Modal State Machine Transitions ---');

class MockTwilioStateMachine {
  constructor({ autoProgressDuration = 8, apiShouldFail = false } = {}) {
    this.state = 'IDLE';
    this.duration = 0;
    this.callResult = null;
    this.history = ['IDLE'];
    this.timers = [];
    this.autoProgressDuration = autoProgressDuration;
    this.apiShouldFail = apiShouldFail;
    this.isCompleted = false;
    this.completedPayload = null;
  }

  // Mimics TwilioCallModal.jsx handleInitiateCall (Lines 126-196)
  async initiateCall({ phoneNumber, vendorName = 'PetroTech India Pvt Ltd' }) {
    if (!phoneNumber || phoneNumber.trim().length < 8) {
      throw new Error('Invalid phone number');
    }

    // Step 1: Transition IDLE -> DIALING
    this.state = 'DIALING';
    this.history.push(this.state);
    this.duration = 0;

    return new Promise((resolve, reject) => {
      // Step 2: DIALING (1200ms in UI, scaled to 120ms for test)
      const t1 = setTimeout(async () => {
        // Step 3: Transition DIALING -> RINGING
        this.state = 'RINGING';
        this.history.push(this.state);

        const t2 = setTimeout(async () => {
          if (this.apiShouldFail) {
            this.state = 'FAILED';
            this.history.push(this.state);
            resolve(this.state);
            return;
          }

          // Simulate API resolution
          this.callResult = {
            success: true,
            mode: 'simulated',
            callSid: `CA-SIM-${Date.now()}`,
            status: 'completed'
          };

          // Step 4: Transition RINGING -> IN_PROGRESS
          this.state = 'IN_PROGRESS';
          this.history.push(this.state);

          // Step 5: Active duration ticker
          const interval = setInterval(() => {
            this.duration += 1;

            if (this.duration >= this.autoProgressDuration) {
              clearInterval(interval);
              this.state = 'COMPLETED';
              this.history.push(this.state);
              this.isCompleted = true;
              this.completedPayload = {
                vendorName,
                phoneNumber,
                callSid: this.callResult.callSid,
                mode: this.callResult.mode,
                duration: this.duration
              };
              resolve(this.state);
            }
          }, 50); // 50ms ticks for fast deterministic test

          this.timers.push(interval);
        }, 150); // 150ms ringing

        this.timers.push(t2);
      }, 120); // 120ms dialing

      this.timers.push(t1);
    });
  }

  // Mimics TwilioCallModal.jsx handleEndCallNow
  endCallEarly() {
    this.clearAllTimers();
    this.state = 'COMPLETED';
    this.history.push('COMPLETED (EARLY)');
    this.isCompleted = true;
  }

  // Mimics modal close or unmount
  reset() {
    this.clearAllTimers();
    this.state = 'IDLE';
    this.history.push('IDLE (RESET)');
  }

  clearAllTimers() {
    for (const t of this.timers) {
      clearTimeout(t);
      clearInterval(t);
    }
    this.timers = [];
  }
}

// Subtest 2.1: Full sequential happy-path transition IDLE -> DIALING -> RINGING -> IN_PROGRESS -> COMPLETED
console.log('Testing Subtest 2.1: Full sequential state transition...');
const sm1 = new MockTwilioStateMachine({ autoProgressDuration: 3 });
assert.strictEqual(sm1.state, 'IDLE', 'Initial state must be IDLE');

await sm1.initiateCall({ phoneNumber: '+91 98765 43210', vendorName: 'PetroTech India Pvt Ltd' });

assert.strictEqual(sm1.state, 'COMPLETED', 'Final state must be COMPLETED');
console.log(`  State transition history: ${sm1.history.join(' -> ')}`);
assert.deepStrictEqual(
  sm1.history, 
  ['IDLE', 'DIALING', 'RINGING', 'IN_PROGRESS', 'COMPLETED'],
  'State history must match exact specification: IDLE -> DIALING -> RINGING -> IN_PROGRESS -> COMPLETED'
);
assert.strictEqual(sm1.isCompleted, true, 'isCompleted flag must be true');
assert.ok(sm1.completedPayload.callSid.startsWith('CA-SIM-'), 'Call SID must be present and formatted');
console.log('  ✓ [PASS] Subtest 2.1 passed: Full sequential state transition verified.\n');

// Subtest 2.2: Early Call Termination via handleEndCallNow during IN_PROGRESS
console.log('Testing Subtest 2.2: Early Call Termination during IN_PROGRESS...');
const sm2 = new MockTwilioStateMachine({ autoProgressDuration: 10 });
const callPromise = sm2.initiateCall({ phoneNumber: '+91 98765 43210' });

// Wait until state reaches IN_PROGRESS, then trigger early termination
await new Promise(resolve => {
  const check = setInterval(() => {
    if (sm2.state === 'IN_PROGRESS') {
      clearInterval(check);
      resolve();
    }
  }, 20);
});

console.log(`  Reached state: ${sm2.state}. Invoking endCallEarly()...`);
sm2.endCallEarly();
assert.strictEqual(sm2.state, 'COMPLETED', 'State after early end must be COMPLETED');
console.log(`  State transition history with early termination: ${sm2.history.join(' -> ')}`);
console.log('  ✓ [PASS] Subtest 2.2 passed: Early termination handles transition to COMPLETED cleanly.\n');

// Subtest 2.3: Unmount / Cancellation Cleanup
console.log('Testing Subtest 2.3: Reset / Modal dismissal cleanup...');
const sm3 = new MockTwilioStateMachine();
sm3.reset();
assert.strictEqual(sm3.state, 'IDLE', 'State after reset must be IDLE');
assert.strictEqual(sm3.timers.length, 0, 'All timers must be cleared');
console.log('  ✓ [PASS] Subtest 2.3 passed: Cleanup clears timers and resets to IDLE.\n');


// -------------------------------------------------------------
// PART 3: STRESS-TESTING EDGE CASES & EMPIRICAL BUG DETECTION
// -------------------------------------------------------------
console.log('--- TEST SUITE 3: Edge Cases, Boundary Conditions & Defect Analysis ---');

// Valid scores: 50, 79, 80, 100
const validScores = [
  { score: 49, expectedRisk: 'High', expectedRiskHi: 'उच्च (जोखिमपूर्ण)' },
  { score: 50, expectedRisk: 'Medium', expectedRiskHi: 'मध्यम' },
  { score: 79, expectedRisk: 'Medium', expectedRiskHi: 'मध्यम' },
  { score: 80, expectedRisk: 'Low', expectedRiskHi: 'कम (सुरक्षित)' },
  { score: 100, expectedRisk: 'Low', expectedRiskHi: 'कम (सुरक्षित)' }
];

for (const sc of validScores) {
  const resEn = processVoiceQuery('What is the compliance score?', 'en', { overallScore: sc.score });
  const resHi = processVoiceQuery('अनुपालन स्कोर क्या है?', 'hi', { overallScore: sc.score });
  
  assert.strictEqual(resEn.scoreNum, sc.score, `Score should be ${sc.score}`);
  assert.strictEqual(resEn.riskTxt, sc.expectedRisk, `English risk level for ${sc.score} should be ${sc.expectedRisk}`);
  assert.strictEqual(resHi.riskTxtHi, sc.expectedRiskHi, `Hindi risk level for ${sc.score} should be ${sc.expectedRiskHi}`);
  console.log(`  ✓ [PASS] Score boundary ${sc.score}% -> Score: ${resEn.scoreNum}%, Risk: ${resEn.riskTxt} / ${resHi.riskTxtHi}`);
}

// EMPIRICALLY CONFIRMED DEFECT ANALYSIS:
// In VernacularVoiceAssistant.jsx line 171:
//   const scoreNum = Math.max(0, Math.min(100, Number(overallScore) || 85));
// When overallScore is 0: Number(0) is 0, which is falsy, causing fallback to 85!
console.log('\n--- Empirical Defect Verification: overallScore === 0 Boundary ---');
const zeroScoreRes = processVoiceQuery('What is the compliance score?', 'en', { overallScore: 0 });
console.log(`  Input overallScore = 0:`);
console.log(`    Actual output score: ${zeroScoreRes.scoreNum}%`);
console.log(`    Actual output risk: ${zeroScoreRes.riskTxt}`);
console.log(`    Actual reply: "${zeroScoreRes.reply}"`);
const hasZeroScoreDefect = zeroScoreRes.scoreNum === 85;
if (hasZeroScoreDefect) {
  console.warn(`  ⚠️ CONFIRMED DEFECT: When overallScore=0, "Number(overallScore) || 85" evaluates to 85 due to falsy 0.`);
  console.warn(`     Impact: A 0% non-compliant bidder is erroneously announced as 85% Low Risk by the Voice Assistant.`);
} else {
  console.log(`  ✓ Score 0 evaluated correctly.`);
}

// Edge Case 2: Missing documents slicing when empty or large array
console.log('\n--- Missing Documents Array Bounds ---');
const emptyDocsRes = processVoiceQuery('Which documents are missing?', 'en', { missingDocs: [] });
assert.ok(emptyDocsRes.reply.includes('The missing or non-compliant statutory documents are: .'), 'Handles empty docs gracefully');
console.log('  ✓ [PASS] Empty missing documents array handled gracefully');

const manyDocs = ['Doc1', 'Doc2', 'Doc3', 'Doc4', 'Doc5'];
const manyDocsRes = processVoiceQuery('Which documents are missing?', 'en', { missingDocs: manyDocs });
assert.ok(manyDocsRes.reply.includes('Doc1, Doc2, Doc3'), 'Slices to first 3 documents');
assert.ok(!manyDocsRes.reply.includes('Doc4'), 'Does not include Doc4');
console.log('  ✓ [PASS] Slices large missing documents list to top 3');

// Edge Case 3: Invalid Phone numbers in Twilio Call
console.log('\n--- Phone Number Validation in Twilio Call ---');
const invalidPhoneSm = new MockTwilioStateMachine();
let caughtPhoneErr = false;
try {
  await invalidPhoneSm.initiateCall({ phoneNumber: '123' }); // less than 8 chars
} catch (e) {
  caughtPhoneErr = true;
}
assert.strictEqual(caughtPhoneErr, true, 'Must reject phone numbers with < 8 chars');
console.log('  ✓ [PASS] Short/invalid phone numbers (<8 chars) rejected before dialing');

console.log('\n================================================================');
console.log('🎉 ALL EMPIRICAL CHALLENGER TESTS EXECUTED SUCCESSFULLY');
console.log('================================================================');
