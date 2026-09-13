# Bidकेन्द्र (Bidkendra) — Unified Full-Stack Platform

> **AI-Enabled Automated Bidder Compliance Verification for GeM Procurement**  
> Problem Statement 26100 | Ministry of Petroleum & Natural Gas / CPCL

---

## 🌟 Architecture Overview

This is the unified **Next.js (App Router)** full-stack implementation of Bidकेन्द्र. It unifies the React frontend and Node.js backend logic into a single serverless repository:

- **Frontend**: Next.js 14 App Router (React 18, Tailwind CSS, Dark Mode, Hindi/English Translation, Vernacular Voice Assistant).
- **Backend**: Native Next.js Serverless Route Handlers (`app/api/**/route.js`).
- **Database**: PostgreSQL (Supabase) via `@/lib/db.js` with zero-downtime mock fallback.
- **External Integrations**:
  - **Twilio**: Automated Voice Calling Agent (`/api/twilio/call`) with live & demo simulation modes.
  - **viaSocket**: Automated webhook email delivery (`/api/verify/notify`, `/api/alerts/curing`).

---

## 🚀 Local Development

```bash
# 1. Navigate to the unified app directory
cd unified-app

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev

# 4. Open in browser
http://localhost:3000
```

---

## ☁️ Vercel Deployment

Deploying this unified Next.js application to Vercel is seamless because Next.js is Vercel's native framework:

1. Push this repository to GitHub.
2. In Vercel, import the repository.
3. Set **Root Directory** to `unified-app`.
4. **Framework Preset**: `Next.js` (automatically detected).
5. Add the following **Environment Variables** in Vercel Project Settings:
   - `DATABASE_URL`: `postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres`
   - `VIASOCKET_WEBHOOK_URL`: `https://flow.sokt.io/func/scrioLbZ4rJB`
   - `TWILIO_ACCOUNT_SID`: (Optional) Your Twilio SID
   - `TWILIO_AUTH_TOKEN`: (Optional) Your Twilio Auth Token
   - `TWILIO_PHONE_NUMBER`: (Optional) Your Twilio Phone Number
   - `JWT_SECRET`: `bidkendra-sih-2026-production-jwt-secret-key-cpcl`
6. Click **Deploy**!
