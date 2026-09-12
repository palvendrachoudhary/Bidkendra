# BidVerify AI — Setup Guide

## Prerequisites

### Required
- **Node.js 18+** — [Download](https://nodejs.org/)
- **Python 3.11+** — [Download](https://www.python.org/downloads/)
- **npm** (comes with Node.js)
- **pip** (comes with Python)

### Optional
- **Docker Desktop** — For containerized deployment
- **Tesseract OCR** — For real document OCR (platform has mock fallback)
- **Git** — Version control

---

## Installation

### Step 1: Clone the Project

```bash
git clone <repository-url>
cd gem-bid-verify
```

### Step 2: Setup Environment

```bash
cp .env.example .env
```

### Step 3: Install & Start Backend

```bash
cd backend
npm install
npm run dev
```

The backend will:
- Start on `http://localhost:5000`
- Auto-create SQLite database
- Seed with dummy data (users, tenders, bidders)

### Step 4: Install & Start AI Engine

```bash
cd ai-engine
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

The AI engine will:
- Start on `http://localhost:8000`
- Load mock ML models
- API docs available at `http://localhost:8000/docs`

### Step 5: Install & Start Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend will:
- Start on `http://localhost:5173`
- Connect to backend at `http://localhost:5000`

---

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@gem.gov.in | admin123 |
| Officer | officer@cpcl.gov.in | officer123 |
| Viewer | viewer@gem.gov.in | viewer123 |

---

## Docker Setup (Alternative)

```bash
# Build and start all services
docker-compose up --build

# Access the application
# Frontend: http://localhost:3000
# Backend: http://localhost:5000
# AI Engine: http://localhost:8000
```

---

## Troubleshooting

### Port already in use
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :5000
kill -9 <PID>
```

### Python dependencies fail
```bash
# Try with virtual environment
python -m venv venv
.\venv\Scripts\activate  # Windows
source venv/bin/activate # Linux/Mac
pip install -r requirements.txt
```

### SQLite errors
```bash
# Delete and recreate database
cd backend
del data\bidverify.db   # Windows
rm data/bidverify.db    # Linux/Mac
npm run dev  # Will recreate
```
