# AYNI HEALTH

**Autonomous health monitoring for astronauts on long-duration space missions.**

AYNI HEALTH is an educational prototype built for the **NASA Space Apps Challenge 2026** challenge:
*"Create Health Monitoring Software for Astronauts on Space Missions."* It combines a React web
application, an Express API, a MySQL/MariaDB relational model, offline-first support, and a
privacy-aware AI assistant. The app helps crew members record health indicators, understand their
state, and know when to escalate to the flight surgeon and mission control. It does **not**
diagnose or replace medical evaluation.

> Educational prototype, not a medical device.

---

## 1. Features

- Authentication with short-lived JWT access tokens and rotating refresh tokens.
- Role-based access: `administrador`, `medico`, and `tripulante`.
- Crew management and a reference-data filter for imported datasets.
- Eleven health record types: vital signs, sleep, mental health, radiation, diary, glucose,
  mood, exercise, immune symptoms, behavioral state, and environment.
- Automatic alerts for blood pressure, heart rate, SpO2, temperature, glucose, radiation,
  sleep, and PHQ-9 item 9.
- Emergency protocol for chest pain, shortness of breath, fainting, confusion, bleeding,
  self-harm thoughts, severe hypoxia, and hypertensive crisis.
- Sleep, PHQ-9, GAD-7, mood, radiation, and vital-sign tracking.
- Personalized nutrition with Andean superfoods and pantry items.
- Scientific foundation page with sources and team criteria.
- AI assistant with local fallback, explicit consent, daily/monthly limits, and no diagnostic claims.
- Audit log, soft delete, restore, CSV/PDF/Excel export, themes, Spanish/English UI, PWA, and
  an offline outbox with idempotency keys.
- Optional NASA DONKI space-weather notice in the radiation tab.

---

## 2. Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite 5, React Router 7, TanStack Query 5, Zustand 5, React Hook Form + Zod |
| UI | Tailwind CSS 3, lucide-react, framer-motion, sonner, cmdk, vaul, Recharts |
| Backend | Node.js, Express 4, Sequelize 6, mysql2, Zod, JWT, bcrypt |
| Database | MySQL 8 / MariaDB (XAMPP), InnoDB, utf8mb4 |
| Tests | Vitest, Testing Library, Supertest, Playwright |
| Quality | ESLint, Prettier, custom verification scripts |

---

## 3. Requirements

- Node.js 20 or newer.
- npm 10 or newer.
- MySQL 8 or MariaDB running on `127.0.0.1:3313` (or configure `DB_*`).
- Optional: MySQL Workbench for `database/modeloMYSQL.mwb`.
- Optional: NASA API key for DONKI (`DEMO_KEY` works for local demos).

---

## 4. Installation

```bash
# 1. Install dependencies
npm install

# 2. Create the environment file
cp .env.example .env y completa los valores

# 3. Create the database, schema, thresholds, catalog, and demo data
npm run db:setup

# 4. Start frontend and backend
npm run dev
```

Open http://localhost:5173.

### Demo user

With `DEMO_MODE=true` and `VITE_DEMO_MODE=true`:

- Email: `admin@ayni.health`
- Password: `admin123`

The demo user has the `administrador` role and a linked crew profile. You can also create a new
account from the registration page; new accounts receive the `tripulante` role.

---

## 5. Database

The current schema is created by Sequelize models and migrations:

```bash
npm run db:setup     # first installation: databases, sync, migrations, seed
npm run db:migrate   # apply pending migrations to an existing database
npm run db:reset     # development only: recreate tables and seed
```

`database/schema.sql` is **reference only** and is intentionally not used to create the database.
It does not include every table or the latest enum values. The source of truth is
`server/db/modelos.js` plus `server/db/migraciones.js`.

JSON columns use the `campoJSON` helper in `server/db/modelos.js`, which parses JSON returned as
text by MariaDB.

---

## 6. Clinical thresholds

`EQUIPO` means **team criterion**. The app shows the source or "team criterion" for each indicator.

| Indicator | Final threshold | Source / criterion |
|---|---|---|
| Blood pressure | Normal < 120/80; elevated 120–139/80–89 (amber only); alert >= 140/90; crisis > 180/120 | AHA. Crisis triggers the emergency protocol. |
| Heart rate | Normal 60–100 bpm; critical < 40 or > 150 bpm | AHA; critical limits: team criterion. |
| SpO2 | Normal >= 95%; attention 90–94%; critical < 90% | WHO (2016). At 3,400 m (Cusco), normal saturation may be lower. |
| Temperature | Normal 36–37.5 °C; fever/alert >= 38 °C; critical < 34 °C | CDC (fever); low limit: team criterion. |
| Fasting glucose | Normal 70–99; elevated 100–125; low < 70; severe < 54; critical > 250 mg/dL | ADA/CDC; high critical: team criterion. |
| Sleep | Recommended >= 7 h; alert after several consecutive nights < 7 h | Watson et al. (2015); consecutive-night alert: team criterion. |
| PHQ-9 | 0–4 minimal; 5–9 mild; 10–14 moderate; 15–19 moderately severe; 20–27 severe | Kroenke et al. (2001). Item 9 != "never" always creates a critical alert. |
| GAD-7 | 0–4 minimal; 5–9 mild; 10–14 moderate; 15–21 severe | Spitzer et al. (2006). |
| Radiation | Cumulative >= 600 mSv alert; single event >= 250 mSv alert; cumulative 480–599 attention | NASA-STD-3001 Vol. 1 Rev. C; 480–599 = 80% of the limit (team criterion). |
| Mood 1–10 | No clinical threshold; self-assessment only | Team criterion. PHQ-9 is the validated instrument. |
| Body mass | No normal/critical range; record only | Team criterion: no source for a universal 50–90 kg range. |

### Emergency protocol

The app detects emergency terms in Spanish and English, a written SpO2 below 90%, a structured
SpO2 below 90%, or a hypertensive crisis (> 180/120 mmHg). It then answers with the protocol
first and creates a critical alert (through the API when online; through the outbox when offline).
The protocol is informational and does not replace medical evaluation.

---

## 7. Data sources

### NASA and space agencies

- NASA (2026a). *5 Hazards of Human Spaceflight*. https://www.nasa.gov/hrp/hazards/
- NASA (2026c). *Risks of Human Spaceflight*. https://www.nasa.gov/hrp/risks/
- NASA (2026b). *Ongoing HRP Research in Space*. https://www.nasa.gov/hrp/ongoing-hrp-research/
- NASA (2025). *Risk from Inadequate Sleep and Irregular Schedules*.
  https://www.nasa.gov/reference/risk-from-inadequate-sleep-and-irregular-schedules/
- NASA. *Standard Measures*. https://www.nasa.gov/reference/standard-measures/ (context only;
  this source is not used for measurement instructions).
- NASA (2023). *NASA-STD-3001, Vol. 1, Rev. C: Crew Health*.
  https://standards.nasa.gov/sites/default/files/standards/NASA/C/nasa-std-3001-vol-1-rev-c-signature.pdf
- Hassler et al. (2014). *Mars' Surface Radiation Environment Measured with the MSL Curiosity
  Rover*. Science, 343(6169). https://doi.org/10.1126/science.1244797 (Mars absorbed dose context;
  not converted to mSv).
- CSA (2026). *Monitoring Radiation for Astronaut Health*.
  https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp
- CSA (2025). *Why Do We Conduct Science Experiments in Space?*
  https://www.asc-csa.gc.ca/eng/iss/science/why-do-we-conduct-science-experiments-in-space.asp
- CSA. *Bio-Monitor*. https://www.asc-csa.gc.ca/eng/sciences/bio-monitor.asp

### Medical sources

- AHA. *All About Heart Rate (Pulse)*.
  https://www.heart.org/en/health-topics/high-blood-pressure/the-facts-about-high-blood-pressure/all-about-heart-rate-pulse
- AHA. *Understanding Blood Pressure Readings*.
  https://www.heart.org/en/health-topics/high-blood-pressure/understanding-blood-pressure-readings
- CDC. *Definitions of Signs, Symptoms, and Conditions of Ill Travelers* (fever >= 38 °C).
  https://www.cdc.gov/port-health/php/definitions-symptoms-reportable-illness/index.html
- CDC. *Low Blood Sugar (Hypoglycemia)* (< 70 mg/dL; severe < 54).
  https://www.cdc.gov/diabetes/about/low-blood-sugar-hypoglycemia.html
- ADA (2026). *Diagnosis and Classification of Diabetes: Standards of Care 2026*.
  Diabetes Care, 49(Suppl. 1), S27–S49.
- WHO (2016). *Oxygen Therapy for Children: A Manual for Health Workers*.
  https://www.who.int/publications/i/item/9789241549554
- Watson et al. (2015). *Recommended Amount of Sleep for a Healthy Adult*.
  https://doi.org/10.5664/jcsm.4758
- Kroenke et al. (2001). *The PHQ-9*.
  https://doi.org/10.1046/j.1525-1497.2001.016009606.x
- Spitzer et al. (2006). *The GAD-7*.
  https://doi.org/10.1001/archinte.166.10.1092
- Saldivia et al. (2019). *PHQ-9 validated in Spanish*.
  https://doi.org/10.4067/S0034-98872019000100053

### Real datasets

- PhysioNet: Goldberger et al. (2000). *PhysioBank, PhysioToolkit, and PhysioNet*.
  Circulation, 101(23), e215–e220. https://doi.org/10.1161/01.CIR.101.23.e215
- Non-EEG Dataset for Assessment of Neurological Status v1.0.0 (UT Dallas; 20 people).
  https://physionet.org/content/noneeg/1.0.0/
  Cite Birjandtalab et al. (2016), IEEE SiPS.
- BIG IDEAs Lab Glycemic Variability and Wearable Device Data v1.1.2 (Duke; Dexcom glucose).
  https://physionet.org/content/big-ideas-glycemic-wearable/1.1.2/
  License: ODC-BY 1.0. Authors: Cho, Kim, Bent, and Dunn.
- MMASH v1.0.0 (22 people; sleep, heart rate, activity, stress).
  https://physionet.org/content/mmash/1.0.0/
- NHANES 2021–2023 (CDC, public domain):
  - BPXO_L: https://wwwn.cdc.gov/nchs/nhanes/search/datapage.aspx?Component=Examination&Cycle=2021-2023
  - DPQ_L and GLU_L: verified for the 2021–2023 cycle in this project.
  DPQ_L answers 7 (refused) and 9 (don't know) are discarded; all nine items must be valid.
  Empty BP readings are discarded.

All tools, models, libraries, and datasets used in this project are from non-Chinese sources.

---

## 8. Real reference data

Reference data is stored under `data/externos/` (raw, not committed) and converted to JSON under
`data/convertidos/` (not committed). Only the conversion scripts are committed.

```bash
# Non-EEG: first 5 subjects, 4 protocol phases -> 20 vital-sign records
python -I scripts/datos-reales/noneeg.py \
  --entrada data/externos/noneeg-1.0.0.zip \
  --salida data/convertidos/noneeg.json

# BIG IDEAs: 3 subjects, daily minimum glucose, ayunas = false
python -I scripts/datos-reales/bigideas.py \
  --entrada data/externos \
  --salida data/convertidos/bigideas.json

# MMASH: one night per subject (subject 11 has no sleep data) -> 21 sleep records
python -I scripts/datos-reales/mmash.py \
  --entrada data/externos/extract/mmash/multilevel-monitoring-of-activity-and-sleep-in-healthy-people-1.0.0/MMASH.zip \
  --salida data/convertidos/mmash.json

# NHANES: 2 people with BP, PHQ-9, and fasting glucose
python -I scripts/datos-reales/nhanes.py \
  --entrada data/externos \
  --salida data/convertidos/nhanes.json

# Dry-run first, then import
npm run db:importar -- data/convertidos/noneeg.json --dry-run
npm run db:importar -- data/convertidos/noneeg.json
```

The importer is idempotent for records with the same crew member, type, timestamp, and origin.
The app hides reference crew members by default; use the **Ver datos de referencia** filter in the
crew list or the crew selector. Reference crew members show the label
**"Datos reales de referencia (PhysioNet / CDC)"**; demo crew members show **"Datos simulados"**.

Reference data is not presented as astronaut data. It comes from healthy people on Earth and is
used only to exercise the same thresholds and alert logic.

### Reference import included in this repository

| Dataset | Reference crew | Records | Notes |
|---|---:|---:|---|
| PhysioNet Non-EEG | 5 | 20 | 4 protocol phases per subject |
| PhysioNet BIG IDEAs | 3 | 28 | daily minimum glucose; `ayunas = false` |
| PhysioNet MMASH | 22 | 21 | one night per subject; subject 11 has no sleep |
| NHANES 2021-2023 | 2 | 6 | BP + PHQ-9 + fasting glucose |
| **Total** | **32** | **75** | raw data and converted JSON are not committed |

The import generated 11 alerts (1 non-EEG, 6 BIG IDEAs, 0 MMASH, 4 NHANES) with the
same thresholds used by the application.

---

## 9. Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Start Vite + Express in development. |
| `npm run build` | Build the frontend into `dist/`. |
| `npm start` | Start Express and serve `dist/`. |
| `npm run lint` | ESLint over `src` and `server`. |
| `npm test` | Unit and integration tests (Vitest). |
| `npm run test:e2e` | Playwright E2E tests. |
| `npm run db:setup` | Create databases, sync schema, migrate, seed. |
| `npm run db:migrate` | Apply pending migrations. |
| `npm run db:reset` | Development-only database reset. |
| `npm run db:importar` | Import crew and health records from JSON. |
| `npm run verificar:presupuesto` | Check the initial bundle gzip budget. |
| `npm run verificar:secretos` | Scan for API keys and secrets. |
| `npm run verificar:colores` | Enforce theme tokens instead of hard-coded colors. |

---

## 10. Security and privacy

- Passwords are hashed with bcrypt (cost 12).
- Access JWT lasts 15 minutes; refresh tokens are opaque, rotated, hashed with SHA-256, and stored
  in an httpOnly, SameSite=Strict cookie.
- Login lockout after 5 failed attempts; persistent rate limits in MySQL.
- Zod validation and explicit field allowlists on every endpoint.
- Role and ownership checks on the server (anti-IDOR).
- Audit log without clinical content.
- AI cloud use requires explicit consent, has daily/monthly limits, and is never used to diagnose.
- Message content is not written to the audit log.
- `.env` is not committed. Never commit API keys.

Environment variables: see `.env.example`. `NASA_API_KEY` is optional and falls back to
`DEMO_KEY` for local demonstrations.

---

## 11. Tests

```bash
npm run lint
npm test
npm run build
npm run verificar:presupuesto
npm run verificar:secretos
npm run verificar:colores
```

The suite covers domain rules, API integration, authentication, lockout, rate limits, alerts,
emergency detection, offline sync, seed behavior, and UI regressions. Playwright covers login,
navigation, crew context, records, screenshots, and synchronization.

---

## 12. Use of AI

The code was developed with support from **ChatGPT (OpenAI)** and **Claude Code (Anthropic)**.
All generated suggestions were reviewed, adapted, tested, and validated by the team. AI tools were
not used as medical authorities, and the application does not diagnose or prescribe.

---

## 13. License

MIT. See [LICENSE](./LICENSE).

---

## 14. 3D model attribution

The "My body" view uses the **Cute Home Robot** model by **Yandrack** (Sketchfab),
licensed under **CC-BY-4.0**. Source:
https://sketchfab.com/3d-models/cute-home-robot-7b75f204eb3e42b6babd883773e0789d

The model is distributed under its own CC-BY-4.0 license and is attributed in the
interface. The rest of the source code remains under the MIT license.

---

## 15. Disclaimer

AYNI HEALTH is an educational prototype. It is not a certified medical device, does not diagnose,
and does not replace the flight surgeon, mission control, or emergency procedures. Always follow
the mission's medical protocol.
