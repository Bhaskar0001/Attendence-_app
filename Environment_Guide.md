# OfficeFlow Environment Configuration Guide

This guide provides detailed instructions on how to configure the environment variables for the entire OfficeFlow ecosystem.

---

## 🏢 Backend Configuration (`/backend/.env`)

The backend is the brain of the system. Accurate configuration is critical for security and geofencing.

### 1. Database (MongoDB Atlas)
- **`MONGODB_URL`**: Your MongoDB connection string. Ensure the user has read/write permissions.
- **`DATABASE_NAME`**: Default is `officeflow`.

### 2. Security (JWT)
- **`JWT_SECRET`**: A random, long string for signing access tokens. Keep this private.
- **`ALGORITHM`**: Usually `HS256`.
- **`ACCESS_TOKEN_EXPIRE_MINUTES`**: How long a session remains valid (e.g., `43200` for 30 days).

### 3. Geofencing (Digital Perimeter)
- **`OFFICE_LAT`** & **`OFFICE_LONG`**: The GPS coordinates of your office center point.
- **`GEOFENCE_RADIUS_METERS`**: The allowed distance from the office center (e.g., `100` for 100 meters).

### 4. Network (Wi-Fi Enforcement)
- **`OFFICE_WIFI_BSSID`**: The unique MAC address of your office router. This is much more secure than just checking the SSID name.
- **`OFFICE_WIFI_SSID`**: The public name of your office Wi-Fi network.
- **`MIN_WIFI_SIGNAL_STRENGTH`**: Minimum signal strength (e.g., `-80`) to ensure the user is actually inside the building.

---

## 💻 Admin Panel Configuration (`/admin/.env`)

### 1. API Connection
- **`VITE_API_URL`**: The URL where your backend is running (e.g., `http://localhost:8001`).

---

## 📱 Mobile App Configuration (`/frontend/.env` & `/field_app/.env`)

### 1. API Connection
- **`EXPO_PUBLIC_API_URL`**: The URL of your backend.
  - **Important**: When testing on a real device, you **must** use your computer's local IP address (e.g., `http://192.168.1.15:8001`) instead of `localhost`.

---

## 🛠️ How to get your Router's BSSID?

**On Android:**
1. Connect to your Office Wi-Fi.
2. Go to Wi-Fi Settings > [Your Network] > Advanced.
3. Look for "BSSID" or "MAC Address".

**On macOS:**
1. Hold `Option` and click the Wi-Fi icon in the menu bar.
2. The BSSID will be listed under the network name.

**On Windows:**
1. Open Command Prompt.
2. Type `netsh wlan show interfaces`.
3. Look for the "BSSID" field.
