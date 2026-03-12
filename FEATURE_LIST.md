# Project: Attendance & Field Force Management System

## 🌟 Core Overview
A comprehensive ecosystem designed to manage both office-based (Desk) and on-field employees, featuring real-time tracking, automated expense management, and geofenced attendance verification.

---

## 🛠️ 1. Admin Portal (Control Center)
*   **Dashboard:** Real-time metrics on attendance, active field visits, and team performance.
*   **Employee Management:** Complete lifecycle management for Field, Office, and Manager roles.
*   **Org Structure:** Build departments and map reporting hierarchies.
*   **Attendance Logs:** Detailed daily logs with GPS coordinates and timestamps.
*   **Field War Room:** Zomato-style live GPS tracking of field agents (only during active duty).
*   **Territory Manager:** Geofencing using Circular (Radius) or Custom Polygon boundaries.
*   **Visit Approvals:** Integrated workflow to approve, reject, or modify field visit plans.
*   **Alerts Center:** Instant notifications for GPS breaches, late check-ins, or system issues.
*   **Fraud Dashboard:** AI-assisted detection of location spoofing and attendance manipulation.
*   **Leave & OD Management:** Centralized hub to manage leave/On-Duty requests.
*   **Expense Approvals:** Audit and approve travel, food, and miscellaneous expense claims.
*   **Nudge Center:** Send targeted mass or individual notifications to keep teams on track.
*   **Team Leaderboard:** Public and private rankings to drive healthy competition.
*   **Reports & Analytics:** Exportable CSV/PDF reports for payroll and performance auditing.
*   **System Settings:** Customize the portal with Company Logo, Primary Colors, and API configs.

---

## 📱 2. Field App (On-Site Execution)
*   **GPS Attendance:** Check-in/out verified by GPS location and mandatory Selfie.
*   **Visit Planning:** Add and schedule client visits for the day/week.
*   **Live Visit Execution:** "Start" and "Stop" visits at client locations with GPS verification.
*   **Route Map:** Visual map of optimized route and current planned stops.
*   **Expense Claims:** Fast submission of expenses with receipt photo uploads.
*   **Field Leaderboard:** Real-time ranking based on KM covered and visits completed.
*   **Leave/OD Portal:** Mobile-first portal to apply for leaves with status tracking.
*   **Real-time Discussion:** Embedded chat for every leave or expense query with the Admin.
*   **End Day Summary:** Automated card showing total KM, Visits, and Time for the day.
*   **Offline Mode:** Data queuing system that syncs once the internet is restored.

---

## 💻 3. Desk/Employee App (Office Presence)
*   **Scan Attendance:** Quick attendance tagging via QR or Selfie.
*   **Personal History:** Easy access to personal attendance trends and leave balances.
*   **Leave Submission:** Simplified workflow for office staff to apply for time off.
*   **Discussion Hub:** Internal chat for clarifications on attendance or HR policies.
*   **Team Feed:** View organization-wide announcements and performance updates.

---

## 🚀 Master Prompt for Future Agents
*Copy and paste the command below into any AI agent to give it a full context of this project:*

> **"I am working on the 'Attendance & Field Management' project. It consists of a FastAPI backend (MongoDB), a React Admin Portal, and two mobile apps (Field App and Desk App) built with Expo. Please analyze the local directory structure to understand the features, specifically: 1. Admin features in `/admin/src/pages` (War Room, Geofencing, Approvals). 2. Field features in `/field_app/src/screens` (GPS tracking, Visit Plans, Offline Sync). 3. Desk features in `/frontend/src/screens`. I need you to focus on [INSERT YOUR TASK HERE] while maintaining the existing architectural patterns like JWT auth, Lucide icons, and Tailwind styling."**
