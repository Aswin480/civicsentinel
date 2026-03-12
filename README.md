# 🛡️ CivicSentinel: Command Center for Urban Intelligence

CivicSentinel is an advanced, AI-integrated urban governance platform designed to bridge the gap between citizens and administrators. It transforms city-scale reports into actionable "Tactical Intelligence," allowing authorities to monitor, triage, and resolve infrastructure issues in real-time through a command-center-style interface.

---

## 🚀 Vision

Empower communities by turning every citizen into a "Sentinel." By leveraging AI-automated analysis and real-time mapping, CivicSentinel ensures that critical infrastructure failures—from water leaks to road damage—are detected, prioritized, and addressed with military precision.

---

## 🏗️ Technical Architecture

CivicSentinel is built on a modern, distributed stack designed for high reliability and real-time synchronization.

### 1. Frontend (The Tactical HUD)
- **Framework**: React 19 + Vite (for lightning-fast development).
- **Styling**: Tailwind CSS with a "Command Center" aesthetic (Dark mode, glassmorphism).
- **Mapping**: Leaflet + OpenStreetMap for real-time geospatial visualization of reports.
- **State Management**: A custom, local-first `GrievanceStore` that handles:
  - **Local Persistence**: Zero-latency UI updates using `localStorage`.
  - **Cloud Sync**: Background synchronization with the Node.js API.
  - **Cross-Tab Sync**: Real-time updates across multiple browser windows via the Storage API.

### 2. Backend (The Operational Core)
- **Server**: Node.js + Express.
- **Database**: PostgreSQL (Relational storage for structured reports, JSONB for flexible AI analysis and chat logs).
- **Storage**: Multer-based media handling for evidence photos and files.
- **REST API**: Clean endpoints for CRUD operations on grievances, voting, and status workflows.

### 3. Intelligence (Optional / Extensible)
- **AI Integration**: Designed for Google Gemini. It automates category prediction, image-based damage assessment, and priority scoring to help administrators focus on what matters most.

---

## 🛠️ Installation & Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [pnpm](https://pnpm.io/) (Recommended package manager)
- [PostgreSQL](https://www.postgresql.org/) (Running locally or via Docker)

### 1. Database Setup
Ensure PostgreSQL is running and create the schema:
```sql
-- Create database
CREATE DATABASE civicsentinel;

-- Run server/schema.sql
```

### 2. Backend Configuration
Navigate to the `server` directory and install dependencies:
```bash
cd server
pnpm install
```
Create a `.env` file in `server/` with your database credentials.

### 3. Frontend Configuration
In the root directory, install dependencies:
```bash
pnpm install
```

### 4. Running the Project
Use the unified startup script (Windows):
```bash
run_all.bat
```
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api

---

## 📲 How It Works: The Lifecycle of a Report

### Step 1: Citizen Reporting
A citizen opens the **Citizen Portal**, captures a photo of an issue (e.g., a burst pipe), and submits a report. The portal automatically tracks GPS coordinates and compresses the image for fast transmission.

### Step 2: AI Triage
As soon as the report hits the system, the **Intelligence Engine** analyzes the description and metadata:
- **Prioritization**: Categorizes the issue (Infrastructure, Water, etc.).
- **Strategic Assessment**: Generates an impact radius and priority score.

### Step 3: Tactical Intervention
Administrators in the **War Room** see a new "Tactical Signal" (red marker) appear on the map. They can:
- **Inspect Intel**: View evidence photos and AI assessments.
- **Communicate**: Use the **Secure Comm Channel** to chat directly with the reporting citizen.
- **Deploy**: Update the status (Open -> In Progress -> Resolved) as ground teams fix the issue.

### Step 4: Community Validation
The **Town Hall** (Public Feed) allows other citizens to see nearby reports and upvote them, signaling to administrators which issues are affecting the most people.

---

## 📊 Feature Highlights
- **Tactical Map**: Leaflet-based clustering of urban grievances.
- **Intelligence Dashboard**: Recharts-powered analytics for urban health monitoring.
- **Admin HUD**: Premium, high-contrast UI for fast decision-making.
- **Offline Resilience**: Local-first storage ensures no data loss during network flakes.

---

*CivicSentinel — Defending the Infrastructure of Tomorrow, Today.*
