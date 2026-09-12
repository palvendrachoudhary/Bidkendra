# Test Infrastructure Specification: BidVerify AI
**Tender Compliance Verification & SIH Demonstration Suite**  
**Document Version:** 1.0.0  
**Test Harness:** Opaque-Box Automated Node.js Engine (`tests/run_all_tests.js`)  
**Target Environment:** Node.js 18+ / Windows / Linux / macOS  
**Target Project:** `gem-bid-verify`

---

## 1. Executive Summary & Quality Mandate

BidVerify AI is an AI-assisted statutory compliance verification platform built for Chennai Petroleum Corporation Limited (CPCL, Ministry of Petroleum & Natural Gas) and Government e-Marketplace (GeM) tender evaluation. The system automates the multi-gate compliance checking of vendor bid envelopes against statutory registries (GSTN, CBDT PAN, MCA21 CIN, MSME Udyam, DPIIT Make-In-India, EPFO, ESIC, Debarment registers).

The testing infrastructure guarantees system integrity across **four rigorous tiers**:
1. **Tier 1: Feature Coverage** — Primary execution paths (happy paths) ensuring functional compliance across all components (minimum 5 test cases per feature).
2. **Tier 2: Boundary & Corner Cases** — Extreme values, malformed inputs, format corruptions, case-insensitivity variations, and resource boundaries (minimum 5 test cases per feature).
3. **Tier 3: Cross-Feature Combinations** — Pairwise and multi-module interaction tests validating state handoffs between parser, compliance engine, database, and webhook dispatch.
4. **Tier 4: Real-World Application Scenarios** — End-to-end realistic CPCL refinery tender evaluation workflows matching actual public procurement cases.

---

## 2. Test Architecture & Modular Layout

```
gem-bid-verify/
├── TEST_INFRA.md                     # This specification
├── TEST_READY.md                     # Readiness report & execution guide
└── tests/
    ├── run_all_tests.js              # Master test runner & reporting engine
    ├── test_server_lifecycle.js      # Server startup, port conflict, health & shutdown
    ├── test_webhook_notify.js        # /api/verify/notify normalization & offline resilience
    ├── test_document_verification.js # /api/verify/document PDF/text OCR & gate scoring
    ├── test_statutory_verifiers.js   # Isolated statutory verifier logic (GST, PAN, CIN, Udyam, MII)
    ├── test_frontend_build.js        # Frontend Vite compilation & asset verification
    ├── test_e2e_scenarios.js         # Real-world CPCL multi-step tender evaluation workflows
    └── fixtures/
        ├── cpcl_compliant_bid.txt    # Legitimate PetroTech India CPCL bid envelope
        ├── dummy_noncompliant.txt    # Generic dummy file without statutory numbers
        ├── non_corporate_bid.txt     # Partnership / LLP MSME bid envelope
        └── test_fixtures.js          # Synthetic buffer & fixture generators
```

---

## 3. Tier 1: Feature Coverage (>=5 Test Cases per Feature)

Tier 1 validates standard functional specifications under normal operating conditions.

### Feature 1: Webhook Payload Normalization & Dispatch (`/api/verify/notify`)
- **Authoritative Source:** `gem-bid-verify/PROJECT.md` § Interface Contracts (`/api/verify/notify`).
- **T1.1.1 (Snake-case payload):** Submit `{ company_name: "PetroTech India Pvt Ltd", vendor_email: "compliance@petrotech.in", decision_status: "APPROVED", score: 92 }`.  
  *Expected Output:* HTTP 200, `{ success: true, message: "Notification dispatched successfully", delivery: { mode: "live" | "simulated" } }`.
- **T1.1.2 (Camel-case payload):** Submit `{ bidderName: "PetroTech India Pvt Ltd", companyEmail: "compliance@petrotech.in", status: "REJECTED", rejectionReason: "Missing GSTIN" }`.  
  *Expected Output:* HTTP 200, payload fields mapped successfully without errors, rejection reason propagated.
- **T1.1.3 (Object emailContent payload):** Submit `emailContent: { subject: "CPCL Tender Decision", body: "Your bid is approved." }`.  
  *Expected Output:* HTTP 200, object properly unpacked or serialized without `[object Object]` truncation.
- **T1.1.4 (String emailContent payload):** Submit `emailContent: "Official CPCL bid approval notice."`.  
  *Expected Output:* HTTP 200, string preserved in outbound payload.
- **T1.1.5 (Under Review decision status):** Submit `{ decision_status: "UNDER_REVIEW", score: 65, notes: "Requires physical document audit" }`.  
  *Expected Output:* HTTP 200, `decision_status: "UNDER_REVIEW"` accepted and logged.

### Feature 2: Webhook Resilience & Offline Simulation Fallback
- **Authoritative Source:** `ORIGINAL_REQUEST.md` R1 & `PROJECT.md` Feature 2.
- **T1.2.1 (Viasocket unreachable / offline):** Post notification with webhook URL unreachable or in demo offline mode.  
  *Expected Output:* HTTP 200, `{ success: true, delivery: { mode: "simulated" } }`. Zero 500 crashes.
- **T1.2.2 (Audit log recording):** Trigger notification. Inspect database `audit_logs` table.  
  *Expected Output:* A record with `action: 'NOTIFICATION_DISPATCH'` is inserted into SQLite.
- **T1.2.3 (Timeout guard):** Viasocket HTTP client timeout is configured to $\le 5000\text{ms}$.  
  *Expected Output:* Request completes within 5500ms even if remote host hangs.
- **T1.2.4 (Simulated delivery structure):** Delivery metadata returns timestamp and destination target.  
  *Expected Output:* `delivery.timestamp` matches ISO8601 string, `delivery.target` indicates target gateway.
- **T1.2.5 (Response structure compliance):** Verify response contains top-level `success: true`.  
  *Expected Output:* `res.body.success === true`.

### Feature 3: Server Port Conflict & Lifecycle Management
- **Authoritative Source:** `ORIGINAL_REQUEST.md` Acceptance Criteria: *"The backend server starts successfully without port conflicts."*
- **T1.3.1 (Standard port 5000 startup):** Launch server when port 5000 is free.  
  *Expected Output:* Server listens on port 5000, responds to GET `/api/health` with HTTP 200 `{ success: true }`.
- **T1.3.2 (Port occupied conflict resilience):** Pre-occupy port 5000 with a dummy TCP socket. Launch server.  
  *Expected Output:* Server intercepts `EADDRINUSE` error, does NOT crash with unhandled exception, logs warning, and binds to fallback port (e.g. 5001) or gracefully handles collision.
- **T1.3.3 (Health check API):** Send GET request to `/api/health`.  
  *Expected Output:* HTTP 200, `{ success: true, message: "BidVerify AI Backend is running 🚀" }`.
- **T1.3.4 (Graceful SIGINT shutdown):** Emit `SIGINT` to running server process.  
  *Expected Output:* Process handles signal, flushes in-memory SQLite state, closes HTTP listener, exits with code 0.
- **T1.3.5 (Static asset serving safety):** Send GET request to `/index.html` and unknown path `/dashboard`.  
  *Expected Output:* If `frontend/dist/index.html` exists, serves HTML; if absent, does not crash process with unhandled 500 `ENOENT`.

### Feature 4: Document Verification & Dummy PDF Disqualification (`/api/verify/document`)
- **Authoritative Source:** `PROJECT.md` § Interface Contracts (`/api/verify/document`) & `ORIGINAL_REQUEST.md` Acceptance Criteria.
- **T1.4.1 (Dummy document rejection):** Upload synthetic dummy PDF or text containing zero statutory identifiers.  
  *Expected Output:* HTTP 200, `overallScore: 0`, `riskLevel: "Critical"`, `isCompliant: false`, `hasMandatoryFailure: true`, `verdict` starts with `"NOT_ELIGIBLE"`.
- **T1.4.2 (Legitimate CPCL tender document):** Upload complete PetroTech CPCL submission containing valid GSTIN, PAN, CIN, Udyam, MII (72.4%).  
  *Expected Output:* HTTP 200, `overallScore >= 80`, `riskLevel: "Low"`, `isCompliant: true`, `hasMandatoryFailure: false`, `verdict` starts with `"ELIGIBLE"`.
- **T1.4.3 (AI enrichment output):** Verify document scan output payload.  
  *Expected Output:* Contains `aiSummary` (string), `aiTranslation` (string), `emailDraft` (`{ subject, body }`).
- **T1.4.4 (JSON text payload input):** Post `{ text: "...", fileName: "bid.txt" }` as `application/json`.  
  *Expected Output:* HTTP 200, parsed identically to file upload.
- **T1.4.5 (Database score persistence):** After verifying document for submission `sub101`, query `compliance_scores` table.  
  *Expected Output:* Record matches returned `overallScore` and `riskLevel`.

### Feature 5: Statutory Verifiers (GST, PAN, CIN, Udyam, Make-In-India)
- **Authoritative Source:** `backend/src/services/verification/` & `PROJECT.md` Features 6-8.
- **T1.5.1 (GSTIN Verifier standard format):** Verify `33AABCP1234F1Z5` (Tamil Nadu state code 33).  
  *Expected Output:* `checkStatus: "VERIFIED"`, `isMandatoryGate: true`, `extractedValue: "33AABCP1234F1Z5"`.
- **T1.5.2 (PAN Verifier standard corporate):** Verify `AABCP1234F` (4th char 'C' for Company).  
  *Expected Output:* `checkStatus: "VERIFIED"`, `isMandatoryGate: true`, `extractedValue: "AABCP1234F"`.
- **T1.5.3 (MCA CIN Verifier standard corporate):** Verify `U23201TN2018PTC123456`.  
  *Expected Output:* `checkStatus: "VERIFIED"`, `isMandatoryGate: true`, `extractedValue: "U23201TN2018PTC123456"`.
- **T1.5.4 (MSME Udyam Verifier standard):** Verify `UDYAM-TN-02-0045812`.  
  *Expected Output:* `checkStatus: "VERIFIED"`, `extractedValue: "UDYAM-TN-02-0045812"`.
- **T1.5.5 (Make In India Class-I Supplier):** Verify text `"Local Content in CPCL tender is 72.4%"`.  
  *Expected Output:* `checkStatus: "VERIFIED"` or `"NEEDS_MANUAL_REVIEW"`, `extractedValue: "72.4%"`, classified as Class-I Local Supplier ($\ge 50\%$).

### Feature 6: Frontend Build Integrity
- **Authoritative Source:** `ORIGINAL_REQUEST.md` Acceptance Criteria: *"npm run build in the frontend directory completes with zero warnings or errors."*
- **T1.6.1 (Production build completion):** Execute Vite production build in `frontend/`.  
  *Expected Output:* Exit code 0, `frontend/dist/index.html` created.
- **T1.6.2 (Javascript asset generation):** Check `frontend/dist/assets/index-*.js` exists and is non-empty.  
  *Expected Output:* File exists, size $> 100\text{ KB}$.
- **T1.6.3 (CSS asset generation):** Check `frontend/dist/assets/index-*.css` exists and is non-empty.  
  *Expected Output:* File exists, Tailwind styles compiled.
- **T1.6.4 (Zero error output):** Build stderr contains zero compiler syntax errors or broken imports.  
  *Expected Output:* 0 errors.
- **T1.6.5 (Vite proxy configuration):** Inspect `frontend/vite.config.js`.  
  *Expected Output:* Contains proxy rule mapping `/api` to `http://localhost:5000`.

---

## 4. Tier 2: Boundary & Corner Cases (>=5 Test Cases per Feature)

Tier 2 exposes the system to extreme inputs, edge encodings, adversarial boundaries, and anomalous formatting.

### Feature 1: Webhook Boundary & Malformed Inputs
- **T2.1.1 (Empty payload):** POST `{}` to `/api/verify/notify`.  
  *Expected Output:* Gracefully falls back to default company/email values, returns HTTP 200, does not throw unhandled TypeError.
- **T2.1.2 (Extreme string lengths):** Submit `notes` and `emailContent` containing 50,000 characters.  
  *Expected Output:* Handles payload without buffer overflow or process termination.
- **T2.1.3 (Adversarial Unicode & Emojis):** Submit `company_name: "🛢️ PetroTech भारत 100% 🚀 \u0000\n\r\t"`.  
  *Expected Output:* Preserves UTF-8 fidelity, sanitizes control characters, returns HTTP 200.
- **T2.1.4 (Boundary scores):** Submit `score: 0`, `score: 100`, `score: -1`, `score: 101`.  
  *Expected Output:* Normalizes or accepts boundary scores without crashing database insertion.
- **T2.1.5 (Null / undefined fields):** Submit `{ company_name: null, vendor_email: null, decision_status: undefined }`.  
  *Expected Output:* HTTP 200, fallback defaults activated.

### Feature 2: Statutory Verifiers Case-Insensitivity & OCR Text Glitches
- **T2.2.1 (Lowercase GSTIN):** OCR returns `33aabcp1234f1z5` in lowercase.  
  *Expected Output:* Case-insensitive matching (`/i`) recognizes valid GSTIN, normalizes to uppercase, `checkStatus: "VERIFIED"`.
- **T2.2.2 (Lowercase PAN):** OCR returns `aabcp1234f`.  
  *Expected Output:* Recognized, verified as corporate entity 'C'.
- **T2.2.3 (Lowercase CIN):** OCR returns `u23201tn2018ptc123456`.  
  *Expected Output:* Recognized and verified.
- **T2.2.4 (Lowercase Udyam):** OCR returns `udyam-tn-02-0045812`.  
  *Expected Output:* Recognized and verified.
- **T2.2.5 (Hyphen variations & surrounding whitespace):** Text contains `" UDYAM - TN - 02 - 0045812 "`.  
  *Expected Output:* Verifier handles spacing or cleanly distinguishes invalid formats.

### Feature 3: Make In India Contextual Boundaries & False Positive Traps
- **T2.3.1 (Commercial invoice percentage trap):** Document contains `"Payment terms: 10% advance, 90% against delivery. GST applicable @ 18%."` without local content declaration.  
  *Expected Output:* Must NOT latch onto `10%` or `18%` as local content percentage; returns `checkStatus: "FAILED"` with "No valid Make in India / Local Content affidavit found".
- **T2.3.2 (Boundary Class-II threshold: Exactly 20.0%):** Text declares `"Local content is 20.0%"`.  
  *Expected Output:* `localContentPct = 20`, meets minimum statutory threshold, classified as Class-II Local Supplier ($20 \le \text{pct} < 50$).
- **T2.3.3 (Sub-threshold: Exactly 19.9%):** Text declares `"Local content is 19.9%"`.  
  *Expected Output:* Fails statutory threshold ($\ge 20\%$), `checkStatus: "FAILED"`.
- **T2.3.4 (Boundary Class-I threshold: Exactly 50.0%):** Text declares `"Local content is 50.0%"`.  
  *Expected Output:* Qualifies as Class-I Local Supplier ($\ge 50\%$).
- **T2.3.5 (Extreme local content values):** Text contains `"Local content is 100%"` and `"Local content is 0%"`.  
  *Expected Output:* 100% classified as Class-I; 0% classified as FAILED.

### Feature 4: Non-Corporate Vendor Support (MCA CIN Exemption)
- **T2.4.1 (Sole Proprietorship tenderer):** Bidder is an individual sole proprietor (PAN 4th char 'P', valid Udyam, no 21-char CIN).  
  *Expected Output:* Does NOT automatically disqualify bidder with Critical risk; MCA gate recognizes non-corporate entity type or marks as non-applicable / review.
- **T2.4.2 (Partnership Firm):** Bidder is a partnership firm (PAN 4th char 'F', no CIN).  
  *Expected Output:* Evaluated appropriately without mandatory corporate gate failure.
- **T2.4.3 (LLP with LLPIN):** Bidder is an LLP with LLPIN format `AAA-1234`.  
  *Expected Output:* Recognized as valid LLP.
- **T2.4.4 (Invalid state code GSTIN):** GSTIN starts with `99` (outside 01-38 range).  
  *Expected Output:* `validateGSTIN` returns `false`, triggers FAILED gate.
- **T2.4.5 (Invalid PAN entity character):** PAN is `AABCE1234F` ('E' is invalid entity).  
  *Expected Output:* `validatePAN` returns `false`, triggers FAILED gate.

### Feature 5: Document Upload Boundaries & Stress
- **T2.5.1 (Zero-byte document):** Send empty file buffer (`length: 0`).  
  *Expected Output:* Handled cleanly, returns HTTP 200 with 0% score and NOT_ELIGIBLE verdict without unhandled exception.
- **T2.5.2 (Oversized 10MB text buffer):** Upload large text payload.  
  *Expected Output:* Truncated safely at max scan limit, processes without Out-Of-Memory crash.
- **T2.5.3 (Binary garbage / corrupted PDF header):** Buffer `"%PDF-1.4 %âãÏÓ \x00\xFF\xFE"`.  
  *Expected Output:* Handled safely by parser fallback, returns NOT_ELIGIBLE.
- **T2.5.4 (SQL Injection strings in document text):** Text contains `' OR '1'='1'; DROP TABLE compliance_checks; --`.  
  *Expected Output:* Prepared statements prevent injection, document evaluated safely.
- **T2.5.5 (Rapid concurrent verification requests):** Send 10 concurrent requests to `/api/verify/document`.  
  *Expected Output:* All 10 requests complete with HTTP 200 and unique SHA-256 document hashes.

---

## 5. Tier 3: Cross-Feature Combinations (Pairwise Interaction Matrix)

Tier 3 tests how different subsystems interact across module boundaries.

| Test ID | Primary Feature | Paired Feature | Interaction Verification Point |
|---|---|---|---|
| **T3.1** | Webhook Notify | Offline Simulation Mode | Verifies that `/api/verify/notify` falls back to simulated mode when network is disconnected AND simultaneously creates an audit record in SQLite. |
| **T3.2** | Document Verification | AI Email Draft Generation | Verifies that `verifyDocument` passes failed checks with correct property name (`checkStatus`) to `aiService.generateEmailDraft`, producing populated itemized rejection bullets. |
| **T3.3** | Statutory OCR | Database Persistence | Verifies that parsed statutory entities (`extractedEntities`) in `realOcrService` correctly synchronize with `compliance_scores.category_scores_json` in the SQLite database. |
| **T3.4** | Non-Corporate Bidder | Mandatory Gate Engine | Verifies that a partnership firm with valid PAN and Udyam but no CIN passes mandatory gates and achieves an overall score $> 70\%$. |
| **T3.5** | Lowercase OCR | Scoring Engine | Verifies that lowercase GSTIN, PAN, and Udyam all pass simultaneously and compute an overall score $\ge 80\%$ with Low risk. |
| **T3.6** | Server Port Collision | Health Check & API Route | Verifies that after resolving port collision, all API routes (`/api/health`, `/api/verify/notify`, `/api/verify/document`) operate correctly on the active port. |
| **T3.7** | Bulk Upload | Database Audit Log | Verifies that bulk processing multiple documents generates distinct audit logs with corresponding SHA-256 hashes without database lock errors. |
| **T3.8** | Static Asset Fallback | Client-Side Routing | Verifies that requesting non-API routes returns `index.html` when built, but returns a safe 404/warning message if `dist/` is not yet compiled. |

---

## 6. Tier 4: Real-World Application Scenarios (Realistic CPCL Workflows)

Tier 4 simulates actual procurement scenarios from Chennai Petroleum Corporation Limited tender operations.

### Scenario 1: CPCL Pipeline Replacement Bid — PetroTech India Pvt Ltd (Full Compliance Approval)
- **Tender Reference:** CPCL-2026-T1001 (Refinery High-Pressure Piping System)
- **Bidder:** PetroTech India Pvt Ltd (CIN: `U23201TN2018PTC123456`, GSTIN: `33AABCP1234F1Z5`, PAN: `AABCP1234F`, Udyam: `UDYAM-TN-02-0045812`, MII: `72.4%`).
- **Workflow Execution:**
  1. POST document payload to `/api/verify/document`.
  2. Verify: `overallScore >= 80`, `riskLevel: "Low"`, `isCompliant: true`, `verdict: "ELIGIBLE..."`.
  3. Verify all 5 primary statutory checks (GST, PAN, MCA, Udyam, MII) pass.
  4. Dispatch official tender acceptance notification via `/api/verify/notify` with `decision_status: "APPROVED"`.
  5. Verify delivery is confirmed (live or simulated) and audit entry is created.

### Scenario 2: CPCL Refinery Valve Supply — Shell Entity Disqualification (Zero Credentials)
- **Tender Reference:** CPCL-2026-V802 (Control Valve Packages)
- **Bidder:** Unregistered Broker / Shell Entity (No statutory credentials).
- **Workflow Execution:**
  1. POST dummy proposal to `/api/verify/document`.
  2. Verify: `overallScore: 0`, `riskLevel: "Critical"`, `isCompliant: false`, `hasMandatoryFailure: true`, `verdict: "NOT_ELIGIBLE: Failed mandatory statutory compliance gates."`.
  3. Verify rejection email draft contains itemized statutory gate failures.
  4. Dispatch rejection notice via `/api/verify/notify` with `decision_status: "REJECTED"` and `rejection_reason`.
  5. Verify audit log captures disqualification evidence.

### Scenario 3: MSME Local Fabricator — Kaveri Engineering Works (Partnership Exemption)
- **Tender Reference:** CPCL-2026-M404 (Fabrication & Structural Works)
- **Bidder:** Kaveri Engineering Works (Partnership: PAN 4th char 'F', Udyam: `UDYAM-TN-08-0012345`, MII: `65.0%`, No CIN).
- **Workflow Execution:**
  1. POST partnership bid to `/api/verify/document`.
  2. Verify GSTIN and PAN pass; Udyam registers as MSME; MII registers as Class-I Local Supplier.
  3. Verify missing corporate CIN does NOT trigger Critical risk failure.
  4. Verify overall score is eligible for purchase preference consideration.

### Scenario 4: Invoice Tax Rate Confusion Guard (False Failure Prevention)
- **Tender Reference:** CPCL-2026-C303 (Electrical Cable Laying)
- **Bidder:** PowerGrid Solutions (Legitimate credentials, proposal contains "GST 18%", "Payment 10% advance", and separate MII declaration of 55%).
- **Workflow Execution:**
  1. POST proposal to `/api/verify/document`.
  2. Verify Make-In-India engine captures the 55% declaration and ignores 18% and 10%.
  3. Verify score reflects Class-I Local Supplier status.

### Scenario 5: Offline SIH Hackathon Demonstration Flow
- **Context:** Complete end-to-end evaluation conducted entirely offline during competition presentation.
- **Workflow Execution:**
  1. Server boots with fallback handling.
  2. Document scanned, AI summary & translation generated locally.
  3. Notification dispatched with offline simulation fallback returning HTTP 200.
  4. Zero network exceptions thrown, complete audit trail persisted in SQLite.

---

## 7. Execution & Pass/Fail Criteria

### Master Test Command
```bash
node tests/run_all_tests.js
```

### Modular Test Commands
```bash
node tests/test_server_lifecycle.js
node tests/test_webhook_notify.js
node tests/test_document_verification.js
node tests/test_statutory_verifiers.js
node tests/test_frontend_build.js
node tests/test_e2e_scenarios.js
```

### Pass Criteria
- 100% of Tier 1 feature tests PASS.
- 100% of Tier 2 boundary and corner case tests PASS.
- 100% of Tier 3 cross-feature combination tests PASS.
- 100% of Tier 4 real-world scenario tests PASS.
- Zero uncaught exceptions or unhandled promise rejections.
- Frontend compilation terminates with exit code 0.
