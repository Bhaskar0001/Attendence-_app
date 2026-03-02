# OfficeFlow AI Attendance System (Enterprise Edition)

OfficeFlow is a high-performance, enterprise-grade attendance ecosystem designed for field and office teams. It combines facial recognition, geofencing, and network-level verification to ensure robust, fraud-proof attendance tracking.

## 🚀 Overview

This repository contains the complete full-stack ecosystem for OfficeFlow:
- **Backend**: High-performance FastAPI server with MongoDB and DeepFace.
- **Admin Panel**: Visionary Command Center built with React and Vite.
- **Mobile Apps**: Premium React Native (Expo) apps for both field and desk employees.

---

## 🏗️ Project Structure

```text
attdence_app/
├── admin/            # Command Center (React + Vite + Tailwind)
├── backend/          # API Engine (FastAPI + MongoDB + DeepFace)
├── frontend/         # Desk/Office Mobile App (React Native + Expo)
├── field_app/        # FieldForce Pro Mobile App (React Native + Expo)
├── e2e-tests/        # System-wide validation scripts
└── Environment_Guide.md
```

---

## 🛠️ Technology Stack

### Backend
- **Framework**: FastAPI (Python 3.10+)
- **Database**: MongoDB (Atlas)
- **Security**: JWT (argon2 hashing), Device Binding, BSSID verification.
- **AI/ML**: DeepFace (Facial signature extraction & 1:N matching).
- **Automation**: Background Google Sheets synchronization.

### Admin Panel
- **Framework**: React 19 + Vite
- **Styling**: Tailwind CSS 4.0 (Glassmorphism design)
- **Visualization**: Recharts & Leaflet (Live Operational Map)

### Mobile App (Universal)
- **Framework**: React Native (Expo SDK 54)
- **Styling**: NativeWind (Tailwind CLI)
- **Hardware**: Expo Camera, Expo Location (Mock GPS detection), NetInfo.

---

## 🔑 Key Features

- **Multi-Tenant Architecture**: Support for multiple organizations within one ecosystem.
- **Biometric Face ID**: Fraud-proof liveness checks and facial signature matching.
- **Geofencing**: Strict radial validation (configurable, default 4m for office).
- **Device Binding**: Prevents login from unauthorized devices.
- **Mock Location Detection**: Automatically flags and blocks GPS spoofing attempts.
- **Live Sync**: Real-time attendance streaming to Google Sheets for HR reporting.

---

## ⚙️ Installation & Setup

### 1. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate
pip install -r requirements.txt
# Configure .env file (see .env.example)
uvicorn main:app --port 8001 --reload
```

### 2. Admin Panel Setup
```bash
cd admin
npm install
# Configure .env with EXPO_PUBLIC_API_URL
npm run dev
```

### 3. Mobile App Setup (Frontend/FieldApp)
```bash
# Repeat for both /frontend and /field_app
cd frontend
npm install
npx expo start
```

---

## 📝 Environment Variables

### Backend (`/backend/.env`)
- `MONGO_URI`: MongoDB connection string.
- `OFFICE_LAT`, `OFFICE_LONG`: Coordinates for the central office.
- `GEOFENCE_RADIUS_METERS`: Permitted attendance radius.
- `OFFICE_WIFI_SSID`: Required network SSID for verification.
- `JWT_SECRET`: Secret key for token generation.

---

## 🛡️ Security
This system employs a **Defense-in-Depth** strategy:
1. **Network Layer**: BSSID matching restricts attendance to physical office Wi-Fi.
2. **Device Layer**: UUID binding prevents credentials sharing.
3. **Identity Layer**: DeepFace biometrics verify the physical presence of the employee.
4. **Logic Layer**: Server-side mock location auditing blocks GPS spoofing.

---

## 🚀 Future Scope & Roadmap
To maintain market leadership, the following intelligent features are planned:

1.  **🎙️ Voice-to-Report**: Hands-free field intelligence using LLMs to transcribe and auto-fill visit reports.
2.  **🗺️ AI Smart Scheduling**: Dynamic route optimization based on traffic, priority, and real-time delays.
3.  **🛡️ Deep-Fake & Liveness Detection**: Advanced biometric security with head-turn/blink verification.
4.  **📉 Predictive Productivity Analytics**: AI flagging of "At-Risk Agents" based on subtle behavior patterns.
5.  **📸 AR Shelf Analysis**: Computer vision for automatic product counting and out-of-stock detection.
6.  **🤝 Client Live-Tracking**: "Uber-style" real-time ETA sharing with customers during agent transit.
7.  **🔋 Edge-Sync & CRDT**: High-integrity offline synchronization for patchy network environments.
8.  **🎰 Gamification 2.0 Marketplace**: In-app rewards store to redeem "OfficeFlow Coins" for perks.
9.  **🏥 Safety Guardian Mode**: Automatic fall detection and inactivity alerts for lone field workers.
10. **🔌 Multi-ERP Deep Integration**: One-click sync with SAP, Salesforce, and Zoho for seamless ordering.

---

## 📜 License
Internal Enterprise License - Copyright © 2026 OfficeFlow.
