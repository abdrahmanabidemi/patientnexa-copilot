# UI / UX Specification
## PatientNexa Copilot — Mobile-First Interface Design
**Version**: 1.0.0 (MVP)  
**Target Viewports**: Mobile (390px–430px), Tablet/iPad (768px–1024px), Desktop (1280px+)  
**Aesthetic**: Crisp clinical modernism, high contrast, clean typography, calming healthcare blues and greens.

---

## 1. Design System & Style Guide

### Color Palette
- **Primary / Brand**: Medical Teal / Deep Sky
  - Primary Base: `#0284c7` (`sky-600`)
  - Primary Hover: `#0369a1` (`sky-700`)
  - Primary Light: `#e0f2fe` (`sky-100`)
- **Status & Urgency Tokens**:
  - Urgent / Overdue (>7d): `#dc2626` (`rose-600`) / BG: `#ffe4e6` (`rose-100`)
  - Warning / Due Soon (1–7d): `#d97706` (`amber-600`) / BG: `#fef3c7` (`amber-100`)
  - Normal / Due Today: `#2563eb` (`blue-600`) / BG: `#dbeafe` (`blue-100`)
  - Success / Followed Up: `#16a34a` (`emerald-600`) / BG: `#dcfce7` (`emerald-100`)
- **Neutrals**:
  - Background Canvas: `#f8fafc` (`slate-50`)
  - Surface Cards: `#ffffff` (`white`)
  - Text Primary: `#0f172a` (`slate-900`)
  - Text Secondary: `#475569` (`slate-600`)
  - Border / Dividers: `#e2e8f0` (`slate-200`)

### Typography
- Font Family: `Inter`, system `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, sans-serif.
- Headings: Bold, clean tracking (`font-semibold`, `tracking-tight`).
- Touch Targets: Minimum **44px x 44px** on all clickable buttons and chips for tablet/touch usability.

---

## 2. Screen 1: Priority Follow-Up Queue (Main Dashboard)

### Wireframe (Mobile & Desktop Unified Layout)

```
+------------------------------------------------------------------------+
| [PatientNexa Copilot]  (Demo Mode: Metro Clinic)        [+ Daily Digest]|
+------------------------------------------------------------------------+
| SUMMARY METRIC CARDS                                                   |
| [ 8 Overdue (>7d) ]  [ 12 Due Soon ]  [ 6 Due Today ]  [ 14 Resolved ] |
+------------------------------------------------------------------------+
| SEARCH & FILTERS                                                       |
| [🔍 Search patient name, MRN, diagnosis...]  [All Tiers v] [Channel v]  |
+------------------------------------------------------------------------+
| PRIORITY QUEUE LIST                                                    |
|                                                                        |
| [🔴 OVERDUE: 9 DAYS]  Jane Doe (58F) • MRN: #PN-4092                  |
| Reason: Post-Op Knee Arthroscopy Wound Check                          |
| Doctor: Dr. Robert Chen | Phone: (555) 019-2830                       |
| Preferred: SMS | Last contact: None                                   |
| [ Open Copilot Draft -> ]                                              |
| ---------------------------------------------------------------------- |
| [🔴 OVERDUE: 8 DAYS]  Marcus Alvarez (64M) • MRN: #PN-1882             |
| Reason: Type 2 Diabetes HbA1c Lab Follow-Up                           |
| Doctor: Dr. Sarah Vance | Phone: (555) 019-9481                       |
| Preferred: Phone Call | Last contact: Voicemail 2d ago                 |
| [ Open Copilot Draft -> ]                                              |
| ---------------------------------------------------------------------- |
| [🟡 DUE SOON: 3 DAYS]  David Kim (42M) • MRN: #PN-9102                |
| Reason: Hypertension Medication Review                                |
| Doctor: Dr. Robert Chen | Phone: (555) 012-3921                       |
| Preferred: SMS | Last contact: None                                   |
| [ Open Copilot Draft -> ]                                              |
+------------------------------------------------------------------------+
```

### Key Elements:
1. **Header**: Product title, clinic badge, and primary action button for "Daily Summary".
2. **KPI Pills**: Filterable buttons showing counts across urgency tiers. Tapping a pill filters the list.
3. **Queue Cards**:
   - High-contrast urgency pill (`🔴 Overdue 9d`, `🟡 Due Soon 3d`).
   - Core clinical context visible at a glance without needing full chart clicks.
   - Primary Call to Action: `Open Copilot Draft` (one-tap entry to assistant).

---

## 3. Screen 2: Patient Action Drawer / Copilot Panel

When a patient card is selected, a mobile bottom-sheet (or desktop slide-over drawer) opens smoothly:

```
+------------------------------------------------------------------------+
| < Back to Queue        PATIENT COPILOT ACTION             [Close X]    |
+------------------------------------------------------------------------+
| PATIENT SNAPSHOT                                                       |
| Jane Doe (58F) | DOB: 04/12/1968 | MRN: #PN-4092                       |
| Encounter: Post-Op Knee Arthroscopy (Oct 24, 2026)                      |
| Attending: Dr. Robert Chen                                             |
| Clinical Note: "Patient discharged with knee brace. Wound check and    |
| suture evaluation required within 10 days. Monitor for swelling."      |
+------------------------------------------------------------------------+
| AI OUTREACH COPILOT                                                    |
| Channel Select: (●) SMS    ( ) Call Talking Points    ( ) Email        |
|                                                                        |
| [ ✨ Generate Outreach Draft ]                                         |
|                                                                        |
| DRAFT PREVIEW (Editable):                                              |
| +--------------------------------------------------------------------+ |
| | Hi Jane, this is Maria from Metro Health Clinic. Dr. Chen asked    | |
| | us to check in on how your knee is healing following your surgery  | |
| | on Oct 24. We'd like to schedule your routine suture evaluation.   | |
| | Please reply to this text or call us at (555) 019-2830 to book a   | |
| | convenient time.                                                   | |
| +--------------------------------------------------------------------+ |
| AI Guardrail: ✅ Verified: Administrative outreach only (No diagnosis) |
|                                                                        |
| QUICK REFINEMENTS:                                                     |
| [ ⚡ Make Briefer ]  [ 🌿 Gentler Tone ]  [ 🚨 More Urgent ]           |
|                                                                        |
| ACTIONS:                                                               |
| [ 📋 Copy Text ]      [ ✨ Regenerate ]       [ ✅ Approve & Mark Sent ]|
+------------------------------------------------------------------------+
```

### Key Elements:
1. **Clinical Note Card**: Highlights exact physician instructions so staff has 100% context without context switching.
2. **Channel Selector**: Easily toggle between SMS, Call Script, or Email before or after generation.
3. **Editable Text Area**: Allows immediate manual adjustments or quick fine-tuning.
4. **Safety Verification Badge**: Visual reassurance that strict safety boundaries are applied.
5. **Human Approval Gate**: Prominent `Approve & Mark Sent` button triggers the next step.

---

## 4. Screen 3: Outcome Recording Modal

Triggered immediately after clicking `Approve & Mark Sent` or directly from the patient card:

```
+------------------------------------------------------------------------+
| RECORD FOLLOW-UP OUTCOME                            [Cancel X]         |
| Patient: Jane Doe (MRN: #PN-4092)                                      |
+------------------------------------------------------------------------+
| What was the outcome of this outreach?                                 |
|                                                                        |
| [ (●) Appointment Scheduled ]   [ ( ) Left Voicemail ]                 |
| [ ( ) Callback Requested    ]   [ ( ) Patient Declined ]               |
| [ ( ) Contact Unreachable   ]   [ ( ) Escalated to Nurse ]             |
|                                                                        |
| If Appointment Scheduled:                                              |
| Date: [ 2026-11-06 ]   Time: [ 10:30 AM ]  Provider: [ Dr. Chen v ]    |
|                                                                        |
| Staff Note (Optional):                                                 |
| [ Suture check confirmed for Friday morning. Patient reports healing  ] |
|                                                                        |
| [ Save & Next Patient -> ]                                             |
+------------------------------------------------------------------------+
```

### Key Elements:
- Large, finger-friendly radio chips.
- Dynamic conditional fields (e.g., date picker appears if `Appointment Scheduled` is selected).
- `Save & Next Patient` automatically logs outcome and smoothly advances to the next highest-urgency patient in the queue.

---

## 5. Screen 4: Daily Executive Summary & Digest View

Accessible from the top header or triggered at the end of a shift:

```
+------------------------------------------------------------------------+
| 📊 DAILY CLINIC FOLLOW-UP DIGEST                   [Date: Nov 3, 2026]  |
+------------------------------------------------------------------------+
| TODAY'S OUTREACH VELOCITY                                              |
| +--------------------+--------------------+--------------------+       |
| | 24 Patients Due    | 19 Contacted (79%) | 14 Appts Booked    |       |
| +--------------------+--------------------+--------------------+       |
|                                                                        |
| COPILOT EXECUTIVE SUMMARY (Generated by AI):                           |
| +--------------------------------------------------------------------+ |
| | • Performance: Clinic cleared 79% of the overdue follow-up queue    | |
| |   today, converting 14 patients directly into scheduled visits.     | |
| | • High Priority Success: All 4 post-op patients were successfully   | |
| |   contacted with appointments confirmed.                            | |
| | • Bottlenecks & Voicemails: 5 patients left voicemails, with 3      | |
| |   having multiple prior unanswered calls (flagged for review).      | |
| | • Tomorrow's Recommended Focus: 8 diabetic chronic care follow-ups | |
| |   reaching >7 days overdue; recommend morning SMS batch.           | |
| +--------------------------------------------------------------------+ |
|                                                                        |
| [ 📋 Copy Summary to Clipboard ]        [ 📤 Export as Markdown/PDF ]   |
+------------------------------------------------------------------------+
```

---

## 6. Accessibility & Responsive Behaviors
- **Mobile (< 768px)**: Stacked cards, full-width buttons, bottom-sheet sliding panels for action drawers.
- **Desktop (>= 1024px)**: 2-column split view (Left: Prioritized Queue with filters; Right: Fixed sticky Patient Context & Copilot Action Panel for zero-click context viewing).
- **Keyboard Navigation**: Full `Tab`, `Enter`, and `Escape` key navigation support for rapid keyboard-only operations.
