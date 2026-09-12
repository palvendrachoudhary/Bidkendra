-- BidVerify AI Database Schema
-- SQLite compatible

-- Users table (Procurement Officers)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'officer' CHECK(role IN ('admin', 'officer', 'viewer')),
    department TEXT,
    designation TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tenders table
CREATE TABLE IF NOT EXISTS tenders (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    tender_number TEXT UNIQUE NOT NULL,
    department TEXT NOT NULL,
    category TEXT NOT NULL,
    estimated_value REAL,
    deadline DATETIME NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('draft', 'active', 'evaluation', 'awarded', 'closed', 'cancelled')),
    description TEXT,
    eligibility_criteria TEXT, -- JSON
    make_in_india_required INTEGER DEFAULT 0,
    msme_reserved INTEGER DEFAULT 0,
    created_by TEXT REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Bidders table
CREATE TABLE IF NOT EXISTS bidders (
    id TEXT PRIMARY KEY,
    company_name TEXT NOT NULL,
    registration_number TEXT,
    contact_person TEXT,
    email TEXT,
    phone TEXT,
    pan_number TEXT,
    gst_number TEXT,
    udyam_number TEXT,
    cin_number TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    pincode TEXT,
    company_type TEXT, -- Proprietorship, Partnership, Pvt Ltd, Ltd, LLP
    annual_turnover REAL,
    employee_count INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Bid Submissions (links bidders to tenders)
CREATE TABLE IF NOT EXISTS bid_submissions (
    id TEXT PRIMARY KEY,
    tender_id TEXT REFERENCES tenders(id),
    bidder_id TEXT REFERENCES bidders(id),
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'under_review', 'verified', 'approved', 'rejected')),
    bid_amount REAL,
    documents_json TEXT, -- JSON array of uploaded documents
    UNIQUE(tender_id, bidder_id)
);

-- Individual Compliance Checks
CREATE TABLE IF NOT EXISTS compliance_checks (
    id TEXT PRIMARY KEY,
    bid_submission_id TEXT REFERENCES bid_submissions(id),
    category TEXT NOT NULL, -- udyam, gst, pan_it, make_in_india, epfo, esic, startup, nsic, oem, blacklist, digilocker
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'verified', 'failed', 'partial', 'not_applicable')),
    score INTEGER DEFAULT 0 CHECK(score >= 0 AND score <= 100),
    details_json TEXT, -- JSON with detailed verification results
    portal_response_json TEXT, -- Raw response from portal
    verified_at DATETIME,
    verified_by TEXT, -- 'ai_engine' or user id
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Overall Compliance Scores
CREATE TABLE IF NOT EXISTS compliance_scores (
    id TEXT PRIMARY KEY,
    bid_submission_id TEXT UNIQUE REFERENCES bid_submissions(id),
    overall_score INTEGER DEFAULT 0 CHECK(overall_score >= 0 AND overall_score <= 100),
    risk_level TEXT CHECK(risk_level IN ('low', 'medium', 'high', 'critical')),
    ai_recommendation TEXT, -- Detailed AI-generated recommendation
    recommendation_type TEXT CHECK(recommendation_type IN ('approve', 'conditional', 'reject', 'review')),
    category_scores_json TEXT, -- JSON with per-category scores
    anomalies_json TEXT, -- JSON with detected anomalies
    reasoning_json TEXT, -- JSON with AI reasoning chain
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    action TEXT NOT NULL, -- verification_started, document_uploaded, score_calculated, etc.
    entity_type TEXT, -- tender, bidder, submission, compliance_check
    entity_id TEXT,
    user_id TEXT REFERENCES users(id),
    details TEXT, -- Human-readable description
    metadata_json TEXT, -- Additional context
    ip_address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tenders_status ON tenders(status);
CREATE INDEX IF NOT EXISTS idx_submissions_tender ON bid_submissions(tender_id);
CREATE INDEX IF NOT EXISTS idx_submissions_bidder ON bid_submissions(bidder_id);
CREATE INDEX IF NOT EXISTS idx_checks_submission ON compliance_checks(bid_submission_id);
CREATE INDEX IF NOT EXISTS idx_scores_submission ON compliance_scores(bid_submission_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);
