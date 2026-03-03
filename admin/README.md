# OfficeFlow Command Center (Admin Panel)

The Command Center is a premium React 19 application built with Vite and Tailwind CSS 4.0. It provides administrators with real-time visibility into employee attendance, field operations, and system health.

## 🚀 Key Features

- **Live Operational Map**: Real-time tracking of field staff check-ins using Leaflet.
- **Advanced Analytics**: Interactive charts (Recharts) for attendance trends and work hour distribution.
- **Organization Management**: Multi-tenant configuration for different office branches/departments.
- **Approval Queue**: Manage and approve field visit plans and expense reimbursements.
- **Security Audit**: View and manage flags for mock location attempts and device binding violations.

---

## 🛠️ Tech Stack

- **React 19** with Vite
- **Tailwind CSS 4.0** (Liquid/Glassmorphism design)
- **Framer Motion** for micro-animations
- **Lucide Icons**
- **Recharts** (Data Visualization)
- **Leaflet** (Mapping)

---

## ⚙️ Installation

```bash
cd admin
npm install
```

## 🏃 Running Locally

```bash
# Development mode
npm run dev

# Production build
npm run build
```

## 📝 Environment Variables

Create a `.env` file in the `admin` folder:
```env
VITE_API_URL=http://localhost:8001
```

---

## 🎨 Design Language
The UI follows a **Glassmorphic Cyber-Enterprise** aesthetic, utilizing deep navy backgrounds, semi-transparent overlays, and vibrant gradient accents.
