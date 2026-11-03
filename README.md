# PatientNexa Copilot

> **Maritime AI Agent Challenge Entry**  
> AI-assisted outpatient follow-up copilot prioritizing recall queues with transparent workflow rules, human approval gates, simulated outreach, and structured outcome logging.

---

## 🏥 Product Overview

**PatientNexa Copilot** helps clinic care coordinators and medical assistants triage due and overdue outpatient follow-ups, draft personalized and respectful outreach communications for human staff review, record follow-up outcomes, and generate daily executive operational briefings.

### Core Capabilities
1. **Rule-Based Prioritized Queue**: Ranks patients strictly by elapsed days overdue and recall dates (Overdue >7d, Overdue 1–7d, Due Today). No black-box clinical triage.
2. **Multi-Channel Copilot Drafting**: Generates context-aware SMS, Phone-Call Talking Point scripts, and Emails using only synthetic patient context and physician directives.
3. **Clinical Safety Boundaries**: Prohibits medical diagnosis, medication recommendations, and clinical advice. Detects acute symptoms and halts outreach with clear instructions to follow clinic escalation protocols.
4. **Human-in-the-Loop & Simulated Outreach**: Requires deliberate staff approval. Outreach is simulated (copies text to clipboard and records SQLite audit logs without external telephony dependencies).
5. **Structured Outcome Logging**: Tracks 6 standard outcomes (*Appointment scheduled*, *Contacted*, *Follow-up needed*, *No response*, *Unable to reach*, *Declined*) with optional staff notes.
6. **Daily Operational Digest**: End-of-shift operational summary of due volume, backlog clearance, scheduled visits, and outreach velocity.
7. **Zero-Config Persistent Storage**: Built on Node.js native `node:sqlite` (WAL mode). Automatically seeds 12 diverse synthetic clinic cases on fresh deployments.

---

## 🛠️ Technology Stack

- **Framework**: Next.js 14+ (App Router, TypeScript, React 18)
- **Styling**: Tailwind CSS, Lucide React icons
- **Database**: SQLite via Node.js native `node:sqlite` (`DatabaseSync` with WAL mode)
- **AI Engine**: Google Gemini API (`gemini-2.5-flash`) via server-side execution with automatic deterministic template fallback
- **Containerization**: Multi-stage Docker build with standalone output

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env.local` to configure:

| Variable | Description | Default | Required? |
| :--- | :--- | :--- | :--- |
| `PORT` | HTTP port the application listens on | `3000` | No |
| `HOSTNAME` | Hostname interface to bind to | `0.0.0.0` | No |
| `DATA_DIR` | Directory path where SQLite database file is persisted | `./data` (or `/data` in Docker) | No |
| `SQLITE_DB_PATH` | Explicit full path to the SQLite `.db` file | `$DATA_DIR/patientnexa.db` | No |
| `GEMINI_API_KEY` | Google Gemini API Key for AI message drafting | *(None — uses deterministic templates)* | No |
| `NODE_ENV` | Node runtime environment | `production` / `development` | No |

> 🔒 **Security Notice**: Never commit `.env` files or API keys. Keys are only used server-side in API routes and are never exposed to browser clients.

---

## 🚀 Local Development & Execution

### 1. Install Dependencies
```bash
npm install
```

### 2. Type Check
```bash
npx tsc --noEmit
```

### 3. Build Production Standalone Bundle
```bash
npm run build
```

### 4. Run Standalone Server
```bash
npm start
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🐳 Docker Packaging

### Build Docker Image
```bash
docker build -t patientnexa-copilot:latest .
```

### Run with Persistent Volume
Mount a host volume to `/data` so SQLite database changes survive container restarts:
```bash
docker run -d \
  -p 3000:3000 \
  -v patientnexa-data:/data \
  -e GEMINI_API_KEY="your-gemini-key-optional" \
  --name patientnexa-app \
  patientnexa-copilot:latest
```

### Verify Container Health
```bash
curl http://localhost:3000/api/health
```

---

## 🚢 Maritime Deployment Guide

Follow these steps to deploy PatientNexa Copilot on Maritime:

1. **Push to GitHub**:
   - Initialize a private or public GitHub repository.
   - Commit all files (the `.gitignore` ensures `data/*.db`, `.env`, and `node_modules` are excluded).
   - Push to your `main` branch.
2. **Connect to Maritime**:
   - Log into your Maritime console.
   - Click **New Service / Deploy from Git**.
   - Select your GitHub repository.
3. **Configure Environment in Maritime**:
   - Set Build Command: `npm run build` (or leave default Dockerfile detection).
   - Set Environment Variables:
     - `PORT`: `3000` (or Maritime default)
     - `DATA_DIR`: `/data`
     - `GEMINI_API_KEY`: *(Optional)* Your Google Gemini API key.
4. **Attach Persistent Storage**:
   - In the Maritime dashboard, add a persistent volume mounted at `/data`.
5. **Deploy & Verify**:
   - Maritime will build using the multi-stage `Dockerfile`.
   - Once online, visit `/api/health` to confirm healthy status.

---

## 🧪 Automated Test Suite

Run the Milestone 2 & 3 test suite:
```bash
node tests/milestone2.test.js
```
Verifies:
- Database seeding and SQLite transactions
- SMS, Phone Script, and Email draft generation
- Missing context handling & safe fallback
- Urgent symptom detection and clinical escalation notice
- Prohibited clinical phrasing guardrails
- Staff review, simulated approval, and audit logging
- All 6 outcome types and real-time metric recalculation.
