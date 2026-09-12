# BidVerify AI — Demo Guide for SIH Presentation

## 🎬 Demo Script (5-minute presentation)

### Slide 1: Problem Statement (30 seconds)
- Show the manual verification pain points
- "3-5 days per bidder, 10+ portals to check manually"
- "60-80% officer time spent on document verification"

### Slide 2: Our Solution — BidVerify AI (30 seconds)
- "AI-powered compliance verification in minutes, not days"
- Show architecture diagram
- Highlight key USPs

### Live Demo (3 minutes)

#### Step 1: Login (15 seconds)
1. Open http://localhost:5173
2. Login with: admin@gem.gov.in / admin123
3. Show the government-familiar interface

#### Step 2: Dashboard Overview (30 seconds)
1. Show stats: Total Tenders, Pending Verifications, Compliance Rate
2. Show compliance distribution chart
3. Show recent activity feed
4. Point out risk overview

#### Step 3: Tender Management (20 seconds)
1. Navigate to Tenders
2. Show list of active tenders
3. Click on a tender to show details
4. Show bid submissions for that tender

#### Step 4: Bidder Verification — THE MAIN DEMO (90 seconds)
1. Navigate to Bidder Verification
2. Select a bidder (e.g., "Bharat Engineering Pvt Ltd")
3. Show the verification dashboard:
   - ✅ Udyam Registration — Verified (Score: 95)
   - ✅ GST Registration — Verified, returns up to date
   - ✅ PAN & IT — Verified, compliant
   - ⚠️ EPFO — Partial compliance (last quarter pending)
   - ✅ No blacklisting found
4. Show the **Compliance Gauge** — Score: 82/100 (Low Risk) 🟢
5. Show **AI Recommendation**:
   - "Recommend conditional approval. EPFO contribution for Q2 2024 is pending."
   - Show reasoning chain (Explainable AI)
6. Show **Cross-Portal Anomaly Detection**:
   - "No anomalies detected across portals"
7. Click "Upload Document" — drop a sample certificate
8. Show OCR extracting text and classifying document type
9. Show the AI verifying document authenticity

#### Step 5: Compliance Report (15 seconds)
1. Navigate to Reports
2. Show detailed compliance report
3. Show print-ready format

#### Step 6: Audit Trail (10 seconds)
1. Navigate to Audit Trail
2. Show complete log of all verifications
3. Highlight immutability and traceability

### Slide 3: Impact & Innovation (30 seconds)
- "60-80% reduction in verification effort"
- "Cross-portal anomaly detection — finds what humans miss"
- "Explainable AI — every decision has evidence"
- "Scalable to all GeM procurement across India"

### Q&A Preparation

**Q: How do you handle real government API integration?**
A: Our architecture uses an adapter pattern. Each portal service is a pluggable module. For the hackathon, we use realistic mock APIs. In production, these modules connect to actual government APIs through official channels.

**Q: What about data privacy and security?**
A: JWT authentication, role-based access, audit trails, data encryption at rest. The platform follows CERT-In security guidelines.

**Q: How scalable is this?**
A: Docker containerized, microservices architecture. Can handle 10,000+ concurrent verifications with horizontal scaling.

**Q: What makes your AI explainable?**
A: Every recommendation shows a reasoning chain — which checks passed, which failed, what anomalies were found, and why the specific recommendation was made.
