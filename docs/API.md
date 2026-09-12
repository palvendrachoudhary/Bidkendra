# BidVerify AI — API Documentation

## Base URLs

| Service | URL |
|---------|-----|
| Backend API | `http://localhost:5000/api` |
| AI Engine API | `http://localhost:8000/api/ai` |

## Authentication

All API endpoints (except login/register) require a Bearer token:

```
Authorization: Bearer <jwt_token>
```

---

## Backend API Endpoints

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login with email/password |
| POST | `/api/auth/register` | Register new user |
| GET | `/api/auth/me` | Get current user profile |

#### POST /api/auth/login
```json
// Request
{
  "email": "admin@gem.gov.in",
  "password": "admin123"
}

// Response
{
  "success": true,
  "data": {
    "token": "eyJhbGciOi...",
    "user": {
      "id": "1",
      "name": "Admin Officer",
      "email": "admin@gem.gov.in",
      "role": "admin"
    }
  }
}
```

### Dashboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/stats` | Overview statistics |
| GET | `/api/dashboard/recent-activity` | Recent verification activities |
| GET | `/api/dashboard/compliance-distribution` | Compliance score distribution |
| GET | `/api/dashboard/risk-overview` | Risk level overview |

### Tenders

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tenders` | List all tenders |
| GET | `/api/tenders/:id` | Get tender details |
| POST | `/api/tenders` | Create tender |
| PUT | `/api/tenders/:id` | Update tender |
| GET | `/api/tenders/:id/submissions` | Get bid submissions |

### Bidders

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/bidders` | List all bidders |
| GET | `/api/bidders/:id` | Get bidder details |
| POST | `/api/bidders` | Add bidder |
| GET | `/api/bidders/:id/verify` | Trigger verification |

### Verification

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/verify/bidder/:bidderId` | Run full compliance verification |
| GET | `/api/verify/status/:submissionId` | Get verification status |
| POST | `/api/verify/document` | Upload and verify document |
| GET | `/api/verify/score/:submissionId` | Get compliance score |

### Audit

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/audit` | List audit logs (paginated) |
| GET | `/api/audit/:entityType/:entityId` | Get entity audit trail |

---

## AI Engine API Endpoints

### OCR

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/ocr/extract` | Extract text from document |
| POST | `/api/ai/ocr/extract-fields` | Extract specific fields |

### Verification

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/verify/document` | Verify document authenticity |
| POST | `/api/ai/verify/cross-check` | Cross-check data sources |

### Recommendations

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/recommend` | Generate AI recommendation |
| POST | `/api/ai/score` | Calculate compliance score |
| POST | `/api/ai/anomalies` | Detect anomalies |

---

## Standard Response Format

```json
{
  "success": true,
  "data": {},
  "message": "Operation completed successfully"
}
```

## Error Response Format

```json
{
  "success": false,
  "error": "Error description",
  "message": "Human-readable error message"
}
```
