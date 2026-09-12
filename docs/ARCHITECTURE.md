# BidVerify AI — System Architecture

## Overview

BidVerify AI follows a **microservices architecture** with three main services:

1. **Frontend** (React) — User-facing dashboard
2. **Backend** (Node.js Express) — API server and business logic
3. **AI Engine** (Python FastAPI) — AI/ML processing

## Architecture Diagram

```
                    ┌─────────────────────────┐
                    │    Government Officer    │
                    │    (Web Browser)         │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │   Nginx Reverse Proxy    │
                    │   (Port 80)              │
                    └──┬──────────┬──────────┬─┘
                       │          │          │
           ┌───────────▼┐  ┌─────▼─────┐  ┌▼───────────┐
           │  Frontend   │  │  Backend   │  │  AI Engine  │
           │  React      │  │  Express   │  │  FastAPI    │
           │  Port 3000  │  │  Port 5000 │  │  Port 8000  │
           └─────────────┘  └─────┬──────┘  └──────┬─────┘
                                  │                 │
                            ┌─────▼─────┐          │
                            │  SQLite   │          │
                            │  Database │          │
                            └───────────┘          │
                                                   │
                    ┌──────────────────────────────┘
                    │  Government Portal Mock APIs
                    ├── Udyam Registration Portal
                    ├── GSTN Portal
                    ├── Income Tax / PAN Portal
                    ├── MCA21 (Company Affairs)
                    ├── EPFO Portal
                    ├── ESIC Portal
                    ├── DigiLocker
                    ├── Startup India
                    ├── NSIC Portal
                    └── Blacklist Database
```

## Data Flow

### Bidder Verification Flow

1. **Officer uploads** bidder documents via Frontend
2. **Frontend** sends documents to Backend API
3. **Backend** forwards documents to AI Engine for OCR & analysis
4. **AI Engine** extracts text, classifies documents, checks for forgery
5. **Backend** queries Government Portal APIs (mock) for verification
6. **Backend** runs Compliance Engine to compute scores
7. **AI Engine** generates recommendations and anomaly reports
8. **Results** are stored in SQLite with audit trail
9. **Dashboard** displays compliance score, risk level, and recommendations

### Authentication Flow

1. Officer logs in with email/password
2. Backend validates credentials and issues JWT token
3. Frontend stores token and includes in all API requests
4. Token expires after 24 hours

## Database Schema

### Core Tables

| Table | Purpose |
|-------|---------|
| users | Procurement officers and admins |
| tenders | Tender/bid details |
| bidders | Bidder company information |
| bid_submissions | Links bidders to tenders |
| compliance_checks | Individual verification results per category |
| compliance_scores | Overall score and AI recommendation |
| audit_logs | Complete audit trail |

## API Structure

| Service | Base URL | Purpose |
|---------|----------|---------|
| Backend | `/api/` | CRUD operations, auth, compliance |
| AI Engine | `/api/ai/` | OCR, NLP, scoring, recommendations |

## Security

- JWT-based authentication
- Role-based access control (Admin, Officer, Viewer)
- Helmet.js for HTTP security headers
- CORS configured for frontend origin
- Input validation on all endpoints
- Audit logging for accountability
