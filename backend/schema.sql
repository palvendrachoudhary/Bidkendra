CREATE TABLE users (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tenders (
  id VARCHAR(255) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  tender_number VARCHAR(255) UNIQUE NOT NULL,
  department VARCHAR(255) NOT NULL,
  category VARCHAR(255) NOT NULL,
  deadline TIMESTAMP NOT NULL,
  status VARCHAR(50) NOT NULL,
  description TEXT,
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE bidders (
  id VARCHAR(255) PRIMARY KEY,
  company_name VARCHAR(255) NOT NULL,
  registration_number VARCHAR(255) UNIQUE,
  contact_person VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  pan_number VARCHAR(50),
  gst_number VARCHAR(50),
  udyam_number VARCHAR(50),
  address TEXT,
  city VARCHAR(255),
  state VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE bid_submissions (
  id VARCHAR(255) PRIMARY KEY,
  tender_id VARCHAR(255) NOT NULL,
  bidder_id VARCHAR(255) NOT NULL,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50) NOT NULL,
  documents_json TEXT
);

CREATE TABLE compliance_checks (
  id VARCHAR(255) PRIMARY KEY,
  bid_submission_id VARCHAR(255) NOT NULL,
  category VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL,
  score REAL,
  details_json TEXT,
  verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  verified_by VARCHAR(255)
);

CREATE TABLE compliance_scores (
  id VARCHAR(255) PRIMARY KEY,
  bid_submission_id VARCHAR(255) NOT NULL,
  overall_score REAL NOT NULL,
  risk_level VARCHAR(50) NOT NULL,
  ai_recommendation TEXT,
  category_scores_json TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE audit_logs (
  id VARCHAR(255) PRIMARY KEY,
  action VARCHAR(255) NOT NULL,
  entity_type VARCHAR(255) NOT NULL,
  entity_id VARCHAR(255),
  user_id VARCHAR(255),
  details TEXT,
  ip_address VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE alert_timeline (
  id VARCHAR(255) PRIMARY KEY,
  bidder_id VARCHAR(255),
  vendor_name VARCHAR(255) NOT NULL,
  vendor_email VARCHAR(255),
  phone_number VARCHAR(50),
  alert_type VARCHAR(50) NOT NULL,
  severity VARCHAR(50) DEFAULT 'WARNING',
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  flagged_items_json TEXT,
  status VARCHAR(50) NOT NULL,
  delivery_mode VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cloud_blobs (
  id VARCHAR(255) PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  mimetype VARCHAR(255) NOT NULL,
  base64_data TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
