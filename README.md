# MonitorRFID — Personnel Attendance & Real-Time Zone Monitoring System

**Client:** Emiroglio  
**Prepared by:** Dematec Vision  

A turnkey UHF RFID personnel attendance (IN/OUT) and real-time production zone monitoring solution, including a technical & commercial proposal and a zero-install interactive front-end demonstration application.

---

## Repository Structure

- [`app/index.html`](app/index.html) — Interactive Front-End Monitoring App (open directly in any modern browser — no build or server required)
  - [`app/styles.css`](app/styles.css) — Clean light industrial UI & print-ready report/proposal stylesheet
  - [`app/data.js`](app/data.js) — Zone topology, demo employee roster, RFID EPC badges, attendance logs, alerts & editable BOM data
  - [`app/app.js`](app/app.js) — Live isometric SVG map, RFID telemetry simulation, attendance portal simulator, CRUD database, analytics & alert rules engine
- [`OFFER_Emiroglio_RFID.md`](OFFER_Emiroglio_RFID.md) — Full Technical & Commercial Offer (architecture, BOM template, alert rules matrix, 6-week roadmap)
- [`info.txt`](info.txt) — Original client requirements brief

---

## Key Features Demonstrated

1. **Employee Database & RFID Cards** — Manage employee personal details, unique UHF RFID card UIDs, default production zones, authorized zones, and shift/away limits.
2. **IN / OUT Gate Attendance Monitoring** — Directional RFID gate portal logs with an interactive live gate scan simulator.
3. **Real-Time Isometric Floor Positioning** — Interactive 3D isometric production campus with 7 RFID zones, pulsing antenna coverage rings, leader-line callouts, animated employee pins, and live telemetry drawer.
4. **Reports & Analytics** — Hours worked vs. scheduled charts, default-zone compliance analytics, CSV exports, and print-to-PDF reports.
5. **Automated Parameter Alerts** — Configurable threshold rules (restricted zone entry, out-of-default-zone duration, late arrival, overtime) with live toasts and outbound SMS/Email dispatch log.
6. **Interactive Commercial BOM** — Live editable Bill of Materials estimator built into the Client Offer tab.

---

## Quick Start

1. Clone or download this repository.
2. Double-click `app/index.html` to open the live monitoring app in Chrome, Edge, or Firefox.
3. Click **`⚡ Trigger Alert Demo`** in the top bar or click any 3D zone building / employee pin to explore live RFID telemetry.
