# EvolveNet – EV Route Planner & Station Management

![EvolveNet Banner](assets/banner.png) <!-- Optional: Add project banner image -->

EvolveNet is a real-time web application designed for **Electric Vehicle (EV) users and station operators**. It helps users find optimal charging stations, plan routes, and book charging slots, while empowering station operators with real-time monitoring, queue management, and billing analytics.

---

## 🔹 Features

### **User App**
- **Login Page**
  - Enter username, email, select vehicle, and current battery percentage.
  - Vehicle data dynamically fetched from Firebase.
- **Map Page**
  - Displays user location and EV stations on an interactive map.
  - Click to set destination and compute routes.
  - Intelligent **station recommendations** based on:
    - Distance & travel time
    - Wait time at station
    - Charging duration
    - Cost of charging
    - Station reliability (Trust Score)
  - Highlight recommended station with a glow effect.
- **Booking**
  - Reserve a slot at a charging station.
  - Updates real-time queue in Firebase.

### **Operator App (EvolveNet Manager)**
- **Real-Time Station Monitoring**
  - Displays live data: available ports, wait times, pricing, trust score.
- **Queue Management**
  - Monitor drivers charging and waiting.
  - Emergency vehicle priority handling.
- **Billing & Receipts**
  - Calculates cost based on energy consumed.
  - Generates digital receipts with QR codes.
- **Ledger & Analytics**
  - Persistent record of all charging sessions.
  - Insights on peak hours, revenue trends, and station usage.
- **AI-Powered Issue Reporting**
  - Users report station issues.
  - Genkit AI determines severity (low, medium, high) for prioritization.

---

## 🔹 Technology Stack

**Frontend**
- HTML, CSS, JavaScript
- [Leaflet.js](https://leafletjs.com/) for interactive maps
- Next.js + React + TypeScript (for operator dashboard)
- Tailwind CSS + ShadCN UI for styling
- Lucide React icons
- `qrcode.react` for QR code generation

**Backend**
- Firebase Realtime Database (serverless)
- Genkit AI for automated issue reporting

**APIs**
- OSRM for route computation
- Firebase REST API for real-time data access

---

## 🔹 How It Works

1. **User selects vehicle & battery level** → stored in local storage.
2. **User clicks on map** → destination is set.
3. **System computes best charging station** using weighted metric:
   - Total time (travel + wait + charging)
   - Distance
   - Cost
   - Trust Score
4. **Recommended station highlighted** → user can view details and book a slot.
5. **Station operators** monitor usage, queues, and billing in real-time via dashboard.

---

## 🔹 Setup Instructions

1. Clone the repository:
```bash
git clone https://github.com/yourusername/EvolveNet.git
cd EvolveNet
