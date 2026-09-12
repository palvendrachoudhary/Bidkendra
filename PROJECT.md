# Project: BidVerify AI — Compliance Verification & SIH Demo Polish

## Architecture
- **Backend**: Node.js / Express server (`backend/src/server.js`) on port 5000.
  - SQLite database (`sql.js`) initialized in memory and persisted to disk.
  - Routes: `/api/verify` (`verificationRoutes.js`), `/api/auth` (`authRoutes.js`), `/api/settings` (`settingsRoutes.js`).
  - Document & Statutory Verification Engine: `realOcrService.js`, `complianceEngine.js`, 14 modular verifiers (`backend/src/services/verification/`).
  - Webhook Notification Gateway: `verificationController.sendWebhookNotification` calling Viasocket flow.
- **Frontend**: React (Vite + Tailwind CSS + Lucide Icons) in `frontend/`.
  - 4-Step Wizard (`frontend/src/pages/BidderVerification.jsx`):
    1. Bidder Selection (`BidderList.jsx`)
    2. Document Upload / OCR Scan (`DocumentUpload.jsx`)
    3. Compliance Verification & Detailed Rule Breakdown (`VerificationCard.jsx`, `MultiDocumentViewer.jsx`)
    4. Official Decision & Email Communication (`ComplianceReport.jsx`, `EmailDraftViewer.jsx`)
  - CPCL (Chennai Petroleum Corporation Limited / Ministry of Petroleum & Natural Gas) government branding.
- **E2E Testing Track**: Independent opaque-box test runner validating backend server, webhook payloads, PDF OCR rejection of dummy inputs, frontend build, and state transitions.

## Code Layout
- `backend/src/server.js`: Server lifecycle, port configuration, graceful shutdown, static serving.
- `backend/src/controllers/verificationController.js`: Webhook notification (`sendWebhookNotification`), document verification (`verifyDocument`), bulk document processing.
- `backend/src/services/realOcrService.js`: PDF text extraction (`pdf-parse`) and multi-gate statutory pipeline coordinator.
- `backend/src/services/verification/`: Individual verifier modules (`gstVerifier.js`, `panVerifier.js`, `mcaVerifier.js`, `makeInIndiaVerifier.js`, `udyamVerifier.js`, `epfoVerifier.js`, `esicVerifier.js`, etc.).
- `backend/src/services/aiService.js`: AI recommendation & rejection email draft generation.
- `backend/.env`: Environment configuration (`PORT`, `JWT_SECRET`, `NODE_ENV`, `VIASOCKET_WEBHOOK_URL`).
- `frontend/src/pages/BidderVerification.jsx`: 4-step wizard state machine and coordination.
- `frontend/src/components/verification/EmailDraftViewer.jsx`: Step 4 notification email component.
- `frontend/src/components/verification/DocumentUpload.jsx`: Step 2 upload interface and demo sample loader.
- `frontend/src/components/common/Header.jsx`: CPCL branding, navigation, and officer profile modal.
- `frontend/src/components/verification/ComplianceReport.jsx`: Audit report generation, print/export actions.
- `frontend/vite.config.js`: Vite build configuration and `/api` dev proxy.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Webhook Payload Normalization | Support both snake_case (`vendor_email`, `company_name`, `decision_status`, `score`) and camelCase (`bidderName`, `companyEmail`) | M1 | Survey 1 |
| 2 | Webhook Resilience & Fallback | 5000ms timeout on Viasocket POST, offline demo simulation fallback, audit logging in SQLite | M1 | Survey 1 |
| 3 | Server Port Conflict & Lifecycle | EADDRINUSE error handler, automatic port fallback, SIGINT/SIGTERM graceful shutdown flushes | M1 | Survey 1 |
| 4 | Environment UTF-8 & Auth Fallback | Convert `backend/.env` to UTF-8, add `JWT_SECRET` fallback to prevent unhandled auth crashes | M1 | Survey 1 |
| 5 | Static Serving Safety | Verify `frontend/dist/index.html` exists before `res.sendFile` to prevent 500 crashes | M1 | Survey 1 |
| 6 | Statutory Regex Case-Insensitivity | Add `/i` flag to GSTIN, PAN, CIN, and Udyam regexes so mixed/lowercase OCR passes | M2 | Survey 2 |
| 7 | Make In India Contextual Matching | Remove greedy `(\d+)\s*%` fallback; restrict matching to local content declaration contexts | M2 | Survey 2 |
| 8 | Non-Corporate Entity Support | Make MCA CIN check non-mandatory for LLPs, partnerships, and sole proprietorships | M2 | Survey 2 |
| 9 | Rejection Email Property Bug Fix | Resolve `check.checkStatus` correctly in `aiService.js` so failed checks appear in emails | M2 | Survey 2 |
| 10 | Dummy PDF Failure Validation | Verify dummy PDFs without statutory credentials fail gracefully (0% score, Critical risk, HTTP 200) | M2 | Survey 2 |
| 11 | Step 4 EmailDraftViewer Prop Fix | Pass `draft={extractedDocData?.emailDraft}` to `EmailDraftViewer` and add fallback content | M3 | Survey 3 |
| 12 | Step 2 Primary CTA Auto-Fallback | Auto-load demo sample document in `handleScan` when user clicks scan without attaching files | M3 | Survey 3 |
| 13 | Multi-Bidder Wizard State Reset | Reset evaluation states (`bidderStatus`, `overallScore`, `scanComplete`) on new bidder selection; add reset CTA in Step 4 | M3 | Survey 3 |
| 14 | Vite Dev Proxy Configuration | Add `server.proxy` forwarding `/api` to `http://localhost:5000` for seamless local dev | M3 | Survey 3 |
| 15 | Evaluation State Synchronization | Prevent `handleScan` from executing race-condition `verifyBidderApi` that overwrites document scores | M3 | Survey 3 |
| 16 | CPCL & MoPNG Official Branding | Add authentic CPCL logo, Ministry banner, and synchronize officer persona to S. K. Verma, IOFS | M4 | Survey 3 |
| 17 | Interactive UI Feedback & Actions | Hook up functional `window.print()` and export in ComplianceReport, ensure all modals/buttons provide active feedback | M4 | Survey 3 |
| 18 | E2E Test Suite Creation | Build requirement-driven opaque-box test runner covering Tiers 1-4 | E2E Track | Survey 1-3 |
| 19 | Final Milestone Integration | Verify 100% E2E tests pass, followed by Tier 5 adversarial hardening | M5 | System |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Backend Reliability & Webhook | Features 1-5: Payload normalization, webhook resilience, port conflict handling, UTF-8 env, auth safety | none | DONE |
| M2 | Document Processing & Statutory Pipeline | Features 6-10: Statutory regexes, MII context fix, non-corporate vendor support, email draft fix, dummy PDF rejection | M1 | DONE |
| M3 | Frontend Wizard & State Transitions | Features 11-15: Step 4 draft viewer fix, Step 2 CTA fallback, state reset across bidders, Vite proxy, scan sync | M1 | DONE |
| M4 | SIH Demo Polish & CPCL Branding | Features 16-17: CPCL & Ministry branding, unified officer persona, print/export actions, modal/button feedback | M3 | DONE |
| M5 | Final Milestone: 100% E2E Pass & Hardening | Feature 19: Phase 1 (100% pass of Tiers 1-4 E2E test suite) + Phase 2 (Tier 5 adversarial hardening) | M1, M2, M3, M4, E2E Track | DONE |
| E2E | E2E Testing Track | Feature 18: Build test harness and Tiers 1-4 test cases; publish TEST_READY.md | M1 interface | DONE |

## Interface Contracts

### Backend `/api/verify/notify` (POST)
- Request Body Schema:
  ```json
  {
    "company_name": "string (or bidderName)",
    "vendor_email": "string (or companyEmail)",
    "decision_status": "APPROVED | REJECTED | UNDER_REVIEW (or status)",
    "score": "number",
    "rejection_reason": "string (optional)",
    "emailContent": "string | { subject: string, body: string } (optional)",
    "notes": "string (optional)"
  }
  ```
- Response Schema:
  ```json
  {
    "success": true,
    "message": "Notification dispatched successfully",
    "delivery": {
      "mode": "live | simulated",
      "target": "viasocket_webhook",
      "timestamp": "ISO8601"
    }
  }
  ```
- Error Handling:
  - On Viasocket unreachable / timeout: gracefully fall back to simulated delivery, log to audit trail, return 200 `{ success: true, mode: 'simulated' }` so demo/test flow never crashes.

### Backend `/api/verify/document` (POST)
- Content-Type: `multipart/form-data` with `document` field, OR `application/json` with `{ text, fileName }`.
- Response Schema on Dummy / Non-Compliant File:
  ```json
  {
    "success": true,
    "fileName": "dummy.pdf",
    "overallScore": 0,
    "automationCoverage": 71,
    "riskLevel": "Critical",
    "isCompliant": false,
    "hasMandatoryFailure": true,
    "verdict": "NOT_ELIGIBLE: Failed mandatory statutory compliance gates.",
    "checksDetail": { ... },
    "emailDraft": { "subject": "...", "body": "..." }
  }
  ```
