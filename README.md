# EscalateHQ 🛡️
> **Autonomous Corporate Grievance Routing & Franchise Accountability Protocol**

EscalateHQ is a full-stack MERN application that empowers customers to report rude staff, overcharging/billing fraud, or unsanitary conditions at local franchise branches (petrol pumps, bank branches, fast food restaurants, retail stores) and routes verified evidence directly to corporate headquarters, enforcing an automated **48-hour SLA resolution guarantee**.

---

## 🏗️ Architecture & Technology Stack

| Layer | Technologies Used | Key Purpose |
|---|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide React, Axios, React Router DOM | Mobile-first UI, 3-step complaint wizard, live GPS proximity check, brand scorecard dashboards |
| **Backend API** | Node.js, Express.js | RESTful gateway, JWT authentication, role-based authorization |
| **Database** | MongoDB & Mongoose (with embedded in-memory fallback) | GeoJSON 2dsphere indexing, complaint ledger, franchise aggregates |
| **Cloud Storage** | AWS S3 (`@aws-sdk/client-s3` + `multer`) | Secure upload of proof photos & receipts (with local disk fallback) |
| **Geolocation** | Google Maps Places API & Geolocation API (Haversine formula) | On-premises verification ensuring complainant is within 750m radius |
| **Automation & SLA** | Nodemailer + Node-Cron | Hourly cron scan auto-escalating tickets older than 48 hours; email alerts |

---

## 🚀 Key Features

1. **3-Step Grievance Wizard (`/report`):**
   - **Step 1:** Select franchise branch + 1-click **"Use My Current GPS"** location detection.
   - **Step 2:** Select violation tag (`Rude Staff`, `Overcharging`, `Poor Hygiene`, `Service Delay`, `Other`) and write incident description.
   - **Step 3:** Upload proof images/receipts with thumbnail preview and dispatch to corporate grievance email.

2. **On-Premises GPS Proximity Verification:**
   - Evaluates device coordinates `[lat, lon]` against branch GeoJSON coordinates using the Haversine formula.
   - If user is within **750 meters**, ticket receives the verified **"GPS-Verified On-Premises"** badge.

3. **48-Hour Corporate SLA Sentinel:**
   - Hourly Node-Cron job scans all open tickets.
   - Any ticket unresolved after 48 hours is automatically upgraded to **"Escalated (SLA Breached)"** on the public ledger.
   - Automated escalation alert email dispatched to corporate directors.

4. **Brand Scorecards (`/brands/:slug`):**
   - Resolution rate %, total grievances, and average customer sentiment score.
   - **Worst Performing Branches Leaderboard** vs. **Top Responsive Branches**.
   - Grievance breakdown by violation type.

5. **1-Click Token Email Resolution:**
   - Corporate grievance officers can mark grievances resolved directly via unique secret tokens delivered in emails or through authenticated Brand Admin credentials.

---

## 📦 Monorepo Directory Structure

```
escalate-hq/
├── client/                     # React (Vite) + Tailwind CSS Frontend
│   ├── src/
│   │   ├── components/         # StatusPill, ComplaintCard, FilterBar, GpsBadge, ResolveModal
│   │   ├── context/            # AuthContext (JWT + Demo Switcher)
│   │   ├── pages/              # HomePage, ReportPage, BrandScorecard, DetailPage, AdminDesk
│   │   ├── services/           # Axios API Client
│   │   ├── utils/              # Haversine distance, date formatters, SLA calculators
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── server/                     # Node.js + Express + Mongoose Backend
│   ├── src/
│   │   ├── config/             # MongoDB connection, AWS S3 client, Nodemailer
│   │   ├── controllers/        # auth, brand, branch, complaint controllers
│   │   ├── cron/               # 48-hour SLA escalation hourly cron worker
│   │   ├── middleware/         # JWT auth, Multer upload, global error handler
│   │   ├── models/             # User, Brand, Branch, Complaint Mongoose schemas
│   │   ├── routes/             # REST API routers
│   │   ├── utils/              # Haversine proximity math & seed script
│   │   └── server.js           # Server entry point
│   ├── package.json
│   └── .env
└── package.json                # Root concurrent runner
```

---

## ⚡ Quick Start & Local Execution

### 1. Install Dependencies
```bash
# In server directory
cd server
npm install

# In client directory
cd ../client
npm install
```

### 2. Configure Environment Variables
A default `.env` is pre-configured in `server/.env`.
```env
PORT=5000
MONGODB_URI= # Leave empty to automatically launch zero-config in-memory MongoDB!
JWT_SECRET=escalate_hq_super_secure_jwt_secret_key_2026_dev
AWS_ACCESS_KEY_ID= # Optional: falls back gracefully to local static uploads
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
AWS_S3_BUCKET=escalatehq-proofs
CLIENT_URL=http://localhost:5173
```

### 3. Run the Development Servers
From the root directory:
```bash
# Start backend server (port 5000)
npm run server

# In another terminal, start client (port 5173)
npm run client
```

Or run both concurrently from root:
```bash
npm start
```

---

## 🔑 Pre-Seeded Demo Accounts

The UI includes a **1-Click Persona Switcher** in the top navigation bar:

| Role | Email | Password | Privileges |
|---|---|---|---|
| **Consumer** | `priya.sharma@example.com` | `password123` | File grievances, upload receipts, GPS proximity check |
| **Brand Admin** | `grievance.lead@dominos.com` | `password123` | Review & resolve franchise branch tickets, add audit notes |
| **Super Admin** | `admin@escalatehq.org` | `password123` | Platform oversight, SLA monitoring, trigger cron tests |

---

## 📡 Core API Reference

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register new user account |
| `POST` | `/api/auth/login` | Public | Sign in and retrieve JWT token |
| `GET` | `/api/brands` | Public | List parent brands with resolution stats |
| `GET` | `/api/brands/:slug` | Public | Detailed brand scorecard & branch benchmarks |
| `POST` | `/api/branches/find-or-create`| Public | Match or save franchise branch with GeoJSON coordinates |
| `POST` | `/api/complaints` | Protected | Multipart upload proof to S3, check GPS, dispatch email |
| `GET` | `/api/complaints` | Public | Filtered feed (city, brand, category, status, GPS-verified) |
| `GET` | `/api/complaints/:id` | Public | Ticket detail, timeline audit trail & evidence gallery |
| `PATCH` | `/api/complaints/:id/status`| Token/Auth | Update ticket status (`Resolved` / `Escalated`) |
| `POST` | `/api/complaints/trigger-cron`| Admin/Dev | Manually execute 48-hour SLA escalation check |
| `GET` | `/api/stats/overview` | Public | Global platform KPI summary |
| `GET` | `/api/stats/email-logs` | Public | Inspect simulated outgoing corporate emails |
