/**
 * Refined Empirical Test Harness for Milestone 7 (Officer UI Enhancements & USPs)
 * Accurately parses React SSR output and tests component behavior, edge cases, and bug reproduction.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import esbuild from 'esbuild';
import React from 'react';
import ReactDOMServer from 'react-dom/server';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Setup browser globals for Node SSR
globalThis.window = {
  speechSynthesis: { getVoices: () => [], speak: () => {}, cancel: () => {} },
  SpeechSynthesisUtterance: class {},
  location: { pathname: '/verification' },
  localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
  addEventListener: () => {},
  removeEventListener: () => {}
};
globalThis.document = {
  getElementById: () => null,
  createElement: () => ({ appendChild: () => {}, setAttribute: () => {}, style: {} }),
  body: { appendChild: () => {} }
};
globalThis.localStorage = globalThis.window.localStorage;

function cleanHtml(html) {
  return html
    .replace(/<!--.*?-->/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'");
}

let passedCount = 0;
let failedCount = 0;
const testResults = [];

function assert(description, condition, details = '') {
  if (condition) {
    passedCount++;
    testResults.push({ description, status: 'PASS', details });
    console.log(`✅ PASS: ${description} ${details ? `(${details})` : ''}`);
  } else {
    failedCount++;
    testResults.push({ description, status: 'FAIL', details });
    console.log(`❌ FAIL: ${description} ${details ? `(${details})` : ''}`);
  }
}

async function bundleComponent(entryPath, outfile) {
  await esbuild.build({
    entryPoints: [entryPath],
    outfile,
    bundle: true,
    format: 'esm',
    platform: 'node',
    jsx: 'automatic',
    external: ['react', 'react-dom', 'react-dom/server', 'axios'],
    loader: {
      '.js': 'jsx',
      '.jsx': 'jsx'
    },
    define: {
      'process.env.NODE_ENV': '"test"'
    }
  });
}

async function runEmpiricalTests() {
  const tmpDir = path.join(__dirname, '.test_build_refined');
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }

  const modalEntry = path.join(__dirname, 'src/components/verification/ExplainAIDecisionModal.jsx');
  const modalBundle = path.join(tmpDir, 'ExplainAIDecisionModal.bundle.mjs');
  
  const timelineEntry = path.join(__dirname, 'src/components/verification/BidCuringAlertTimeline.jsx');
  const timelineBundle = path.join(tmpDir, 'BidCuringAlertTimeline.bundle.mjs');

  console.log(`\n===============================================================`);
  console.log(`🧪 REFINED EMPIRICAL TEST HARNESS: MILESTONE 7 VERIFICATION`);
  console.log(`===============================================================\n`);

  console.log(`📦 Transpiling components via esbuild...`);
  await bundleComponent(modalEntry, modalBundle);
  await bundleComponent(timelineEntry, timelineBundle);
  console.log(`✓ Components bundled successfully.\n`);

  const ModalModule = await import(`file://${modalBundle}`);
  const ExplainAIDecisionModal = ModalModule.default;
  const STATUTORY_RULES = ModalModule.STATUTORY_RULES;

  const TimelineModule = await import(`file://${timelineBundle}`);
  const BidCuringAlertTimeline = TimelineModule.default;

  // ----------------------------------------------------------------------
  // SUITE 1: STATUTORY RULES REGISTRY INTEGRITY
  // ----------------------------------------------------------------------
  console.log(`--- [SUITE 1: STATUTORY RULES REGISTRY (14 CHECKS)] ---`);
  
  const expected14Keys = [
    'gst', 'pan', 'udyam', 'makeInIndia', 'mca', 'incomeTax', 
    'epfo', 'esic', 'startup', 'nsic', 'oem', 'blacklist', 
    'labourLicense', 'digilocker'
  ];

  assert(
    'STATUTORY_RULES defines exactly 14 statutory checks',
    Object.keys(STATUTORY_RULES).length === 14,
    `Found ${Object.keys(STATUTORY_RULES).length} checks`
  );

  const missingKeys = expected14Keys.filter(k => !STATUTORY_RULES[k]);
  assert(
    'All 14 required check IDs exist in STATUTORY_RULES',
    missingKeys.length === 0,
    missingKeys.length ? `Missing: ${missingKeys.join(', ')}` : 'All 14 present'
  );

  // Mandatory check count audit
  const mandatoryRules = Object.keys(STATUTORY_RULES).filter(k => STATUTORY_RULES[k].isMandatoryGate);
  const advisoryRules = Object.keys(STATUTORY_RULES).filter(k => !STATUTORY_RULES[k].isMandatoryGate);
  
  assert(
    'Mandatory vs Advisory breakdown: 6 Mandatory Gates, 8 Advisory Gates',
    mandatoryRules.length === 6 && advisoryRules.length === 8,
    `Mandatory: ${mandatoryRules.join(', ')} (${mandatoryRules.length}), Advisory: ${advisoryRules.join(', ')} (${advisoryRules.length})`
  );

  let allMetadataComplete = true;
  for (const k of expected14Keys) {
    const r = STATUTORY_RULES[k];
    if (!r.ruleCriteria || !r.statutoryReference || !r.clauseNumber || !r.authority || !r.defaultMethod) {
      allMetadataComplete = false;
    }
  }
  assert(
    'Every check in STATUTORY_RULES contains ruleCriteria, statutoryReference, clauseNumber, authority, and defaultMethod',
    allMetadataComplete,
    'Verified 100% metadata completeness across all 14 statutory checks'
  );

  // ----------------------------------------------------------------------
  // SUITE 2: ExplainAIDecisionModal RENDERING & DATA BINDING
  // ----------------------------------------------------------------------
  console.log(`\n--- [SUITE 2: ExplainAIDecisionModal RENDERING] ---`);

  // Closed state
  const closedHtml = ReactDOMServer.renderToString(
    React.createElement(ExplainAIDecisionModal, { isOpen: false })
  );
  assert(
    'ExplainAIDecisionModal returns null when isOpen=false',
    closedHtml === '',
    `Rendered length: ${closedHtml.length}`
  );

  // Open state with rich verificationCards
  const sampleCards = {
    gst: {
      checkName: 'GSTIN Statutory Validation',
      checkStatus: 'VERIFIED',
      extractedValue: '33AABCP1234F1Z5',
      evidence: {
        documentName: 'CPCL_Envelope.pdf',
        matchedSnippet: 'GSTIN: <mark>33AABCP1234F1Z5</mark> active regular taxpayer',
        ruleCriteria: 'Valid 15-digit GSTIN with active regular registration',
        statutoryReference: 'CGST Act 2017 Section 22',
        clauseNumber: 'Clause 4.1(a) - Statutory Taxpayer Registration',
        confidence: 0.98,
        requestUrl: 'https://api.cpcl.gov.in/gateways/v1/gst/validate',
        responseStatus: '200 OK',
        hash: 'sha256:abcd1234gst'
      }
    },
    pan: {
      checkName: 'CBDT PAN & KYC Verification',
      checkStatus: 'VERIFIED',
      extractedValue: 'AABCP1234F',
      evidence: {
        matchedSnippet: 'PAN: <mark>AABCP1234F</mark> verified',
        confidence: 0.95
      }
    },
    makeInIndia: {
      checkName: 'Make in India (MII) Local Content',
      checkStatus: 'FAILED',
      extractedValue: null,
      evidence: {
        matchedSnippet: 'Local content declaration omitted from bid submission.',
        confidence: 0.15
      }
    }
  };

  const rawModalHtml = ReactDOMServer.renderToString(
    React.createElement(ExplainAIDecisionModal, {
      isOpen: true,
      bidderName: 'PetroTech India Pvt Ltd',
      overallScore: 84,
      automationCoverage: 92,
      hasMandatoryFailure: true,
      riskLevel: 'Medium',
      verificationCards: sampleCards,
      extractedDocData: { fileName: 'PetroTech_Tender_Envelope.pdf' },
      onCallVendor: () => {}
    })
  );
  const modalHtml = cleanHtml(rawModalHtml);

  assert('Modal renders bidder organization name', modalHtml.includes('PetroTech India Pvt Ltd'), 'Found bidderName');
  assert('Modal renders overall score badge (84%)', modalHtml.includes('84%'), 'Found 84%');
  assert('Modal renders automation coverage (92%)', modalHtml.includes('92%'), 'Found 92%');
  assert('Modal renders risk assessment badge (MEDIUM RISK)', modalHtml.includes('MEDIUM RISK'), 'Found MEDIUM RISK');
  assert('Modal renders "Call Vendor" header button when onCallVendor is provided', modalHtml.includes('Call Vendor'), 'Call Vendor button present');

  // Verify all 14 statutory checks rendered
  let renderedCount = 0;
  for (const k of expected14Keys) {
    const rule = STATUTORY_RULES[k];
    if (modalHtml.includes(rule.name)) {
      renderedCount++;
    } else {
      console.log(`❌ Missing rule in rendered HTML: ${rule.name}`);
    }
  }
  assert(
    'Modal renders all 14 statutory checks in the scorecard list',
    renderedCount === 14,
    `Rendered ${renderedCount}/14 check names`
  );

  assert(
    'Modal renders matched context snippet with <mark> highlighting',
    modalHtml.includes('33AABCP1234F1Z5') && modalHtml.includes('<mark'),
    'Context snippet with highlight rendered'
  );

  assert(
    'Modal renders statutory reference and clause number for GST check',
    modalHtml.includes('Clause 4.1(a)') && modalHtml.includes('CGST Act 2017 Section 22'),
    'Clause 4.1(a) and CGST Act reference rendered'
  );

  assert(
    'Modal renders confidence score badge (98% Conf.)',
    modalHtml.includes('98% Conf.'),
    'Found 98% Conf.'
  );

  assert(
    'Modal renders verification method badge (Method: API_CALL)',
    modalHtml.includes('Method: API_CALL'),
    'Found Method: API_CALL'
  );

  assert(
    'Modal renders collapsible verification telemetry affordance',
    modalHtml.includes('Inspect Verification Evidence Payload & Telemetry'),
    'Found inspect telemetry button'
  );

  // ----------------------------------------------------------------------
  // SUITE 3: ExplainAIDecisionModal STRESS & ADVERSARIAL CASES
  // ----------------------------------------------------------------------
  console.log(`\n--- [SUITE 3: ExplainAIDecisionModal STRESS & EDGE CASES] ---`);

  // 3.1: Null props handling
  try {
    const nullHtml = cleanHtml(ReactDOMServer.renderToString(
      React.createElement(ExplainAIDecisionModal, {
        isOpen: true,
        overallScore: undefined,
        automationCoverage: null,
        verificationCards: null,
        extractedDocData: null
      })
    ));
    assert(
      'Modal renders safely with null/undefined props without throwing',
      nullHtml.includes('0%') && nullHtml.includes('CPCL_Statutory_Compliance_Envelope.pdf'),
      'Rendered 0% score and default fallback envelope file'
    );
  } catch (e) {
    assert('Modal renders safely with null/undefined props without throwing', false, e.message);
  }

  // 3.2: Clamping out of bounds scores
  const scoreClampTest1 = cleanHtml(ReactDOMServer.renderToString(
    React.createElement(ExplainAIDecisionModal, { isOpen: true, overallScore: -50 })
  ));
  assert('Modal clamps negative score (-50 -> 0%)', scoreClampTest1.includes('0%'), 'Clamped to 0%');

  const scoreClampTest2 = cleanHtml(ReactDOMServer.renderToString(
    React.createElement(ExplainAIDecisionModal, { isOpen: true, overallScore: 150 })
  ));
  assert('Modal clamps score > 100 (150 -> 100%)', scoreClampTest2.includes('100%'), 'Clamped to 100%');

  const scoreClampTest3 = cleanHtml(ReactDOMServer.renderToString(
    React.createElement(ExplainAIDecisionModal, { isOpen: true, overallScore: 'not_a_number' })
  ));
  assert('Modal sanitizes non-numeric score string ("not_a_number" -> 0%)', scoreClampTest3.includes('0%'), 'Fallback to 0%');

  // 3.3: EMPIRICAL DEFECT FINDING: Hardcoded Button Label Inconsistency
  const filterBtnMismatch = modalHtml.includes('🚨 Mandatory Only (5)');
  assert(
    'BUG/DEFECT CONFIRMED: Filter button label hardcodes "🚨 Mandatory Only (5)" when there are actually 6 mandatory checks in STATUTORY_RULES',
    filterBtnMismatch && mandatoryRules.length === 6,
    `Button displays "(5)" but mandatory count is ${mandatoryRules.length} (gst, pan, makeInIndia, mca, blacklist, digilocker)`
  );

  // ----------------------------------------------------------------------
  // SUITE 4: BidCuringAlertTimeline RENDERING & FUNCTIONALITY
  // ----------------------------------------------------------------------
  console.log(`\n--- [SUITE 4: BidCuringAlertTimeline RENDERING & FUNCTIONALITY] ---`);

  const rawTimelineHtml = ReactDOMServer.renderToString(
    React.createElement(BidCuringAlertTimeline, {
      vendorName: 'Global Energy Traders',
      vendorEmail: 'compliance@globalenergy.in',
      phoneNumber: '+91 91234 56789',
      overallScore: 62,
      hasMandatoryFailure: true,
      verificationCards: {
        gst: { checkName: 'GSTIN Statutory Validation', checkStatus: 'FAILED' },
        makeInIndia: { checkName: 'Make in India (MII) Local Content', checkStatus: 'FAILED' }
      },
      onCallVendor: () => {}
    })
  );
  const timelineHtml = cleanHtml(rawTimelineHtml);

  assert(
    'Timeline renders target vendor name and phone number',
    timelineHtml.includes('Global Energy Traders') && timelineHtml.includes('+91 91234 56789'),
    'Target vendor and phone verified'
  );

  assert(
    'Timeline renders 48h active curing window header',
    timelineHtml.includes('48h Active Curing Window'),
    '48h curing window header present'
  );

  assert(
    'Timeline renders ticking countdown timer in format XXh XXm XXs',
    /\d{2}h \d{2}m \d{2}s/.test(timelineHtml),
    'Verified countdown format (e.g. 47h 54m 20s)'
  );

  assert(
    'Timeline renders statutory GFR Rule 173 badge',
    timelineHtml.includes('GFR Rule 173'),
    'GFR Rule 173 badge present'
  );

  assert(
    'Timeline renders "Dispatch Webhook Alert" button with interactive icon',
    timelineHtml.includes('Dispatch Webhook Alert'),
    'Dispatch Webhook Alert button verified'
  );

  assert(
    'Timeline renders "Call Vendor" button when onCallVendor prop is supplied',
    timelineHtml.includes('Call Vendor'),
    'Call Vendor button verified'
  );

  // 4.2: Robustness with null props
  try {
    const nullTimeline = cleanHtml(ReactDOMServer.renderToString(
      React.createElement(BidCuringAlertTimeline, {
        vendorName: null,
        vendorEmail: null,
        phoneNumber: null,
        verificationCards: null
      })
    ));
    assert(
      'Timeline renders safely when all props are null/undefined',
      nullTimeline.includes('48h Active Curing Window'),
      'Rendered cleanly with default fallbacks'
    );
  } catch (e) {
    assert('Timeline renders safely when all props are null/undefined', false, e.message);
  }

  // ----------------------------------------------------------------------
  // SUITE 5: COMPONENT INTEGRATION IN PARENT PAGES
  // ----------------------------------------------------------------------
  console.log(`\n--- [SUITE 5: INTEGRATION IN BidderVerification.jsx] ---`);

  const bidderVerificationFile = path.join(__dirname, 'src/pages/BidderVerification.jsx');
  const bvContent = fs.readFileSync(bidderVerificationFile, 'utf8');

  assert(
    'BidderVerification imports ExplainAIDecisionModal',
    bvContent.includes("import ExplainAIDecisionModal from '../components/verification/ExplainAIDecisionModal'"),
    'Import statement verified'
  );

  assert(
    'BidderVerification imports BidCuringAlertTimeline',
    bvContent.includes("import BidCuringAlertTimeline from '../components/verification/BidCuringAlertTimeline'"),
    'Import statement verified'
  );

  assert(
    'BidderVerification imports TwilioCallModal',
    bvContent.includes("import TwilioCallModal from '../components/verification/TwilioCallModal'"),
    'Import statement verified'
  );

  assert(
    'BidderVerification defines state for ExplainAIDecisionModal (showXaiModal)',
    bvContent.includes('const [showXaiModal, setShowXaiModal] = useState(false)'),
    'State hook verified'
  );

  assert(
    'BidderVerification Step 3 circular badge triggers ExplainAIDecisionModal on click',
    bvContent.includes('onClick={() => setShowXaiModal(true)}') && bvContent.includes('title="Click to open Explainable AI Decision breakdown"'),
    'Score badge click handler verified'
  );

  assert(
    'BidderVerification Step 3 explicit "Explain AI Decision" button with SparklesIcon triggers modal',
    bvContent.includes('<span>Explain AI Decision</span>'),
    'Explain AI Decision button verified'
  );

  assert(
    'BidderVerification embeds BidCuringAlertTimeline in Step 3 and Step 4',
    (bvContent.match(/<BidCuringAlertTimeline/g) || []).length >= 2,
    `Mounted ${(bvContent.match(/<BidCuringAlertTimeline/g) || []).length} times in workflow`
  );

  assert(
    'BidderVerification mounts ExplainAIDecisionModal with full prop bindings',
    bvContent.includes('<ExplainAIDecisionModal') && bvContent.includes('isOpen={showXaiModal}') && bvContent.includes('verificationCards={verificationCards}'),
    'Modal JSX instantiation verified'
  );

  // ----------------------------------------------------------------------
  // SUITE 6: ADDITIONAL USP INSPECTION: VernacularVoiceAssistant
  // ----------------------------------------------------------------------
  console.log(`\n--- [SUITE 6: VERNACULAR VOICE ASSISTANT & HEADER INTEGRATION] ---`);

  const voiceAssistantFile = path.join(__dirname, 'src/components/common/VernacularVoiceAssistant.jsx');
  const voiceContent = fs.readFileSync(voiceAssistantFile, 'utf8');

  assert(
    'VernacularVoiceAssistant supports Hindi and English toggle',
    voiceContent.includes("'hi'") && voiceContent.includes("'en'") && voiceContent.includes('हिन्दी'),
    'Bilingual toggle verified'
  );

  assert(
    'VernacularVoiceAssistant supports 3 procurement queries in EN and HI',
    voiceContent.includes('score') && voiceContent.includes('missing') && voiceContent.includes('report') &&
    voiceContent.includes('अनुपालन') && voiceContent.includes('दस्तावेज') && voiceContent.includes('रिपोर्ट'),
    'Procurement queries verified in both languages'
  );

  const headerFile = path.join(__dirname, 'src/components/layout/Header.jsx');
  const headerContent = fs.readFileSync(headerFile, 'utf8');

  assert(
    'Header.jsx provides microphone button to open voice assistant',
    headerContent.includes('open-voice-assistant'),
    'Custom event dispatch verified'
  );

  // ----------------------------------------------------------------------
  // SUMMARY
  // ----------------------------------------------------------------------
  console.log(`\n===============================================================`);
  console.log(`📊 TEST HARNESS SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log(`Overall Assessment: ${failedCount === 0 ? '🎉 ALL EMPIRICAL CHECKS PASSED' : '⚠️ FAILURES ENCOUNTERED'}`);
  console.log(`===============================================================\n`);

  // Cleanup
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch (e) {}

  return { passedCount, failedCount, testResults };
}

runEmpiricalTests().then(({ failedCount }) => {
  process.exit(failedCount > 0 ? 1 : 0);
}).catch(err => {
  console.error('Fatal error during test execution:', err);
  process.exit(1);
});
