# Product Requirements Document (PRD)
## PatientNexa Copilot — Outpatient Follow-Up Assistant
**Challenge Entry**: Maritime AI Agent Challenge  
**Product**: PatientNexa Copilot (MVP)  
**Parent Ecosystem**: PatientNexa Healthcare Suite (Future Integration Target)  
**Status**: Concept & Planning Document  
**Version**: 1.0.0 (MVP)

---

## 1. Executive Summary & Vision
**PatientNexa Copilot** is an AI-powered clinic follow-up copilot designed for outpatient clinic staff (medical assistants, care coordinators, front-desk staff). It automates the tedious, error-prone manual triage of due and overdue patient follow-ups, drafts personalized, empathetic outreach messages across communication channels for human staff approval, logs follow-up outcomes, and generates daily executive operational summaries.

Built as an autonomous-assistive agent for the **Maritime AI Agent Challenge**, PatientNexa Copilot operates with strict clinical safety guardrails: it assists administrative follow-ups without offering medical diagnosis or treatment advice, ensures 100% human-in-the-loop oversight before messages are transmitted, and uses synthetic patient cohorts.

---

## 2. Target Users & Personas

### Primary User: Clinic Care Coordinator / Medical Assistant (MA)
- **Profile**: Coordinates outpatient schedules, calls patients for post-procedure checks, routine chronic disease visits, and lab consultations.
- **Pain Points**:
  - Juggling dozens of overdue patient charts across disparate systems.
  - Typing repetitive outreach messages or leaving unstructured voicemails.
  - Forgetting to log follow-up results back into the record.
  - Decision fatigue regarding who to contact first.
- **Goals**: Rapidly identify who needs attention today, get high-quality outreach text drafted in one click, confirm delivery, and record outcomes in seconds.

### Secondary User: Clinic Practice Manager / Head of Nursing
- **Pain Points**: Lacks visibility into daily follow-up completion rates, no-show trends, and staff outreach bandwidth.
- **Goals**: Review automated end-of-day summaries, track follow-up compliance, and ensure zero patients fall through the cracks.

---

## 3. Problem Statement & Hypotheses to Validate

### Core Problem
Outpatient clinics face significant administrative friction in coordinating follow-up care:
1. **Fragmented Workflows**: Follow-up orders and recall dates are scattered across disparate notes, tickler files, or manual spreadsheets.
2. **Staff Overhead**: Manually checking charts, calculating elapsed days, and drafting individual outreach text consumes substantial staff time.
3. **Inconsistent Tracking**: Staff lack a standardized, transparent queue ordered by due dates, leading to arbitrary follow-up ordering.
4. **Incomplete Outcome Logging**: Contact attempts (e.g., voicemails, rescheduled dates) are frequently left unrecorded due to cumbersome logging interfaces.

### Hypotheses to Validate
- **Hypothesis 1 (Queue Efficiency)**: Presenting staff with a transparent, rule-based queue prioritized by objective elapsed dates (Overdue >7d, Overdue 1–7d, Due Today) reduces daily triage time compared to manual chart reviews.
- **Hypothesis 2 (Outreach Velocity)**: Providing one-click, context-aware message drafts for staff review and manual approval increases completed follow-up contacts per shift without compromising message safety.
- **Hypothesis 3 (Data Completeness)**: A lightweight, single-click outcome recording workflow increases the rate of documented follow-up outcomes compared to standard unstructured notes.
- **Hypothesis 4 (Operational Visibility)**: An automated daily summary of operational metrics (contacts attempted, appointments scheduled, backlog count) gives clinic supervisors actionable visibility into outreach capacity.

---

## 4. Value Proposition
- **Transparent Rule-Based Prioritization**: Follow-ups are categorized and sorted strictly by objective workflow timing rules (Overdue >7 days, Overdue 1–7 days, Due Today, Upcoming), with explicit human-readable reasons (e.g., "9 days past target follow-up date"). No black-box clinical severity scoring.
- **Context-Aware Drafts for Approval**: Copilot synthesizes encounter context into channel-tailored outreach copy (SMS, Call Script, Email) for staff review, editing, and approval.
- **Guaranteed Human-in-the-Loop & Simulated Outreach**: Zero autonomous messaging; outreach is simulated (clipboard copy & audit log) to protect patient safety and avoid external telephony dependencies.
- **Frictionless Outcome Logging**: Rapid structured outcome recording (`Appointment Scheduled`, `Left Voicemail`, `Callback Requested`, `Declined / Opted Out`, `Unreachable`).
- **Operational Daily Digest**: Automated end-of-day operational report summarizing queue clearance rate, contact attempts, and remaining overdue backlog.

---

## 5. Scope & MVP Features

### In-Scope (MVP)
| Feature Module | Description |
| :--- | :--- |
| **1. Rule-Based Priority Queue** | Dashboard categorizing synthetic patients into *Overdue (>7d)*, *Overdue (1–7d)*, *Due Today*, and *Scheduled*, prioritized strictly by objective date rules with transparent reason badges. |
| **2. Patient Context Drawer** | Responsive drawer displaying synthetic demographics, encounter date, attending provider, reason for follow-up, and communication preferences. |
| **3. Copilot Draft Generator** | Generates channel-tailored outreach drafts (SMS, Call Script, Email) referencing encounter context and clinic contact info (Milestone 2). |
| **4. Human Review & Approval Gate** | Staff message editor with one-click tone adjustments and mandatory human approval before simulated dispatch (Milestone 2). |
| **5. Simulated Outreach & Audit** | "Approve & Mark Sent" copies message to clipboard and logs an immutable audit trail without real external transmissions (Milestone 2). |
| **6. Structured Outcome Logger** | Rapid outcome tagger (`Appointment Scheduled`, `Left Voicemail`, `Callback Requested`, `Declined / Opted Out`, `Unreachable`) + optional staff notes (Milestone 2). |
| **7. Operational Daily Summary** | AI-generated summary reporting strictly operational metrics (contacts attempted, appointments booked, voicemails left, queue clearance rate) (Milestone 3). |
| **8. Persistent SQLite Store & Demo Reset** | Standalone SQLite database with realistic synthetic records, persistent across container restarts on Maritime, with an instant 1-click "Reset Demo Data" action. |
| **4. Human Review & Refinement** | Live message editor with quick-action prompt modifiers ("More concise", "Gentle reminder", "Urgent notice", "Switch to Call Script"). |
| **5. Simulation & Send Gate** | Staff approval action: "Approve & Mark Sent" (with clipboard copy for real-world simulation). |
| **6. Structured Outcome Logger** | Rapid outcome tagger (`Appointment Scheduled`, `Left Voicemail`, `Callback Requested`, `Declined / Opted Out`, `Unreachable`) + staff notes. |
| **7. Daily Executive Summary** | One-click AI report summarizing total patients triaged, outcomes breakdown, scheduling conversion rate, and priority recommendations for the next shift. |
| **8. Demo Data Seeder** | Realistic synthetic cohort generator with diverse clinic cases (orthopedic post-op, diabetic follow-up, cardiology BP check, pediatric vaccine check). |

---

## 6. Strict Exclusions & Guardrails (Out of Scope for MVP)
To comply with medical AI safety and challenge constraints:
- ❌ **No Clinical Diagnosis or Treatment Advice**: The agent will never evaluate symptoms, adjust medication, or interpret clinical lab values.
- ❌ **No Autonomous Message Transmission**: The agent will not trigger outbound external SMS/WhatsApp/Email gateways without human approval.
- ❌ **No Live Production EHR Writes**: Standalone data store; no direct FHIR/HL7 production database mutations.
- ❌ **No Real Patient Identifiable Information (PII/PHI)**: 100% synthetic/fictional patient data only.
- ❌ **No Inbound Patient Portal / Chat**: Staff-facing tool only; patients do not directly chat with this agent.

---

## 7. Success Metrics
1. **Time-to-Outreach**: Reduce staff time spent reviewing context and drafting message from ~5 minutes to **under 45 seconds**.
2. **Review Rate**: **100%** of outgoing messages reviewed and approved by staff.
3. **Conversion Tracking**: 100% of outreach attempts result in a recorded structured outcome.
4. **Agent Generation Latency**: Message draft generation under **3 seconds**; Daily summary under **6 seconds**.
5. **System Usability Scale (SUS)**: High staff usability rating (>80) on mobile/tablet interfaces.

---

## 8. Key Assumptions & Dependencies
- **Synthetic Data Validity**: Realistic mock clinical records are sufficient to showcase workflow fidelity during the challenge judging.
- **LLM Capabilities**: Gemini 2.5 Flash provides high-speed, cost-effective generation with reliable prompt guardrail compliance.
- **Maritime Target Environment**: Containerized deployment via Docker running as a web service accessible via modern web browsers.
- **Integration Readiness**: Output data structures (JSON) follow standard FHIR-aligned schema concepts (`Task`, `CommunicationRequest`, `Encounter`) to allow seamless future plug-in to PatientNexa's core platform.
