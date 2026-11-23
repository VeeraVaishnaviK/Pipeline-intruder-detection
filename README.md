# Pipelined Intruder Detection System (Web App)
**Project Title:** Implementation of an Intruder Detection Framework Based on Pipelined Data Path Design

---

## 1. Project Overview & Architecture
This web application is a software simulation of an intrusion detection framework that adopts **pipelined data path concepts from Computer Architecture**. Network requests pass through a **6-stage pipeline** where each stage performs a specific operation. Multiple records occupy different stages simultaneously (true pipelining), vastly reducing latency, mitigating high-frequency bottlenecks, and achieving a **~4.8× empirical speedup** over sequential baseline execution.

### How This Maps to Computer Architecture:
| Computer Architecture Concept | Pipelined Intruder Detection System Implementation |
|---|---|
| **Pipeline Stages (IF, ID, EX, MEM, WB)** | **6 Hardware-modeled Stages:** Stage 01 (Input Fetch), Stage 02 (Preprocessing), Stage 03 (Feature Analysis), Stage 04 (Detection Logic), Stage 05 (Decision), Stage 06 (Alert Generation). |
| **Pipeline Registers / Latches** | Dedicated async stage input queues buffering data between clock ticks without data loss. |
| **Clock Cycle Delay ($\tau$)** | Simulated clock delay (configurable from 50 ms to 1500 ms, default 500 ms). |
| **Pipelined Execution Time** | $T_{\text{pipelined}} = (k + n - 1) \times \tau$ (where $k=6$ stages, $n=\text{number of records}$, $\tau=\text{clock delay}$). |
| **Sequential Execution Time** | $T_{\text{sequential}} = n \times k \times \tau$. |
| **Speedup ($S$)** | $S = \frac{T_{\text{sequential}}}{T_{\text{pipelined}}} = \frac{n \times k}{k + n - 1}$. For $n=20$, $S \approx 4.8\times$. |
| **Bottleneck & Critical Path** | Stage 04 (Detection Logic) has the highest execution time, acting as the critical path limiter. |
| **Pipeline Efficiency** | Percentage of busy stage cycles vs. total functional unit capacity. |

---

## 2. Tech Stack
- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, Framer Motion, Recharts, Lucide React.
- **Backend:** Node.js, Express, TypeScript, Server-Sent Events (SSE) for live stage driving, bcryptjs, JSON Web Tokens (JWT).
- **Storage:** Transactional persistent JSON data store with disk auto-save.
- **Zero External Paid APIs:** Runs 100% locally.

---

## 3. Directory Structure
```
c:\Intruder Detection/
├── package.json               # Root scripts (install:all, dev, build, start, test)
├── .env.example               # Environment variable templates
├── test_verification.mjs      # End-to-end automated verification script
├── server/                    # Node.js + Express TypeScript Backend
│   ├── src/
│   │   ├── auth/              # JWT & bcrypt authentication, RBAC
│   │   ├── sensor/            # Module 1: Sensor Interface & Data Acquisition
│   │   ├── pipeline/          # Module 2: Pipelined Data Path Engine & Queues
│   │   ├── detection/         # Module 3: Features, Rules R1-R4, Anomaly Z-Score
│   │   ├── metrics/           # Module 4: Latency, Throughput, Gantt, Comparison
│   │   ├── alerts/            # Module 5: Alert Generation, Outbox, Self-test
│   │   ├── db/                # In-memory persistent database
│   │   └── index.ts           # Express REST API & SSE /api/pipeline/stream
│   └── package.json
└── client/                    # React + Vite + Tailwind Frontend
    ├── src/
    │   ├── components/        # Navbar, Footer, InputPanel, Visualizer, Output, Modals
    │   ├── context/           # AuthContext & PipelineContext (SSE listener)
    │   ├── pages/             # Dashboard, Batch/Stream, Hit-Miss, Comparison, Logs, Rules, Architecture, About, Login
    │   ├── services/          # API client
    │   └── types/             # TypeScript interfaces
    └── package.json
```

---

## 4. Quick Start & Setup

### Prerequisites
- Node.js (v18+) and npm installed.

### Installation
Run from root directory:
```bash
npm run install:all
```

### Running in Development Mode
Starts both Express backend (port 3001) and Vite frontend (port 5173) concurrently:
```bash
npm run dev
```
Open your browser at: **`http://localhost:5173`**

### Running in Production Mode
```bash
npm run build
npm start
```
Open your browser at: **`http://localhost:3001`**

---

## 5. Seed User Credentials
| Username | Password | Role | Access Permissions |
|---|---|---|---|
| `admin` | `admin123` | Administrator | Full access: run pipeline, view metrics, manage R1–R4 rules & thresholds. |
| `analyst` | `analyst123` | SOC Analyst | Run pipeline, view logs, acknowledge alerts. |

*(Quick one-click login buttons are also provided on the Login screen).*

---

## 6. How to Demo (Step-by-Step)

### Demo 1: Safe Sample Traffic
1. Sign in as `analyst` or `admin`.
2. On the **Dashboard**, click the green button **"Sample Safe"**.
   - Input populates: IP `192.168.1.100`, Port `8080`, Packet Size `1024 KB`, Access Type `HTTPS`, Request Rate `10 req/s`.
3. Click **"EXECUTE PIPELINE"**.
4. Observe the **6 vertically stacked stage cards** light up cyan in sequence (Stage 01 → Stage 06) with progress bars filling.
5. Watch the **Pipeline Output** card display:  
   `✓ SAFE ACCESS – No intrusion detected – Traffic appears legitimate`
6. Check the **Performance Metrics** row: Latency ~3000 ms, Processed count increments by 1.

### Demo 2: Critical Intrusion Attack Sample
1. On the **Dashboard**, click the red button **"Sample Attack"**.
   - Input populates: IP `203.0.113.195` (External), Port `23` (Telnet attack port), Packet Size `8000 KB` (Abnormal), Access Type `Telnet` (Insecure), Request Rate `500 req/s` (High rate).
2. Click **"EXECUTE PIPELINE"**.
3. Watch the pipeline process the packet through Stage 01 → 06.
4. An **"INTRUSION DETECTED"** modal pops up over a dimmed backdrop with threat level **CRITICAL** and matched rules (`R2: Attack Port + Abnormal Packet`, `R3: External IP + High Threat Score`, `R4: Multiple Threat Indicators`).
5. Click **"ACKNOWLEDGE"** to log the analyst's acknowledgement.
6. The **Pipeline Output** card glows red with the full rule breakdown.

### Demo 3: Batch & Real-Time Stream Simulation (True Pipelining)
1. Navigate to **Batch / Stream**.
2. Select **Run Batch of 20** or toggle **Continuous Stream**.
3. Observe the **Concurrent Stage Occupancy** grid: multiple stages are active at the exact same time, each displaying the specific packet ID (`[REC-00004]`, `[REC-00005]`, etc.) currently inside it.
4. Confirm **Datapath Integrity Check**: Records In = Records Out (0 records lost).

### Demo 4: Performance & Gantt Timing Diagram (Module 4)
1. Navigate to **Performance & Gantt**.
2. Review the side-by-side **Pipelined vs Sequential** comparison charts:
   - Theoretical speedup: $S = \frac{20 \times 6}{6 + 20 - 1} = 4.8\times$.
   - Measured speedup: ~4.7×.
3. Inspect the classic **Instruction Pipeline Gantt Timing Diagram** showing the diagonal stagger across clock cycles.
4. Read the **Bottleneck Detection** advice identifying Stage 04 (Detection Logic) as the critical path.

### Demo 5: Hit–Miss Analysis (Module 3)
1. Navigate to **Hit-Miss Analysis**.
2. View the real-time **Confusion Matrix (TP, TN, FP, FN)**, Accuracy (%), Precision (%), Recall (%), F1-Score (%), Donut distribution, and Accuracy Trend line over continuous streams.

---

## 7. Project Metadata
- **Guided by:** Dr. I. Sudha (Professor/CSE), Dr. R. Sarasu (Associate Professor/CSE)
- **Presented by:**
  - K. Guzhalinitha [192425232]
  - R. Srividya [192472261]
  - Prithika B H [192424403]
  - Allaparthi Bhavana [192472141]
  - K.S.N. Vinay Dutt [192472191]
