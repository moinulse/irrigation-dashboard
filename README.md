# 🌱 ESP32 Irrigation Dashboard

A responsive dashboard for monitoring soil moisture, temperature, and humidity across 8 irrigation zones using ESP32 devices.  
Each ESP32 sends sensor data every few minutes via a secure POST request to a Supabase Edge Function.  
The dashboard displays the latest readings in a modern UI (built with ShadCN + Tailwind + React) and allows CSV export of historical data.

---

## 🚀 Live Demo

👉 [Dashboard Live Link](#)  
👉 [API Endpoint](#)  

(*replace `#` with your deployed Netlify/Cloudflare/Supabase links once available*)

---

## 🛠️ Tech Stack

- **Frontend**
  - [React + Vite](https://vitejs.dev/) – fast dev + build tooling
  - [TailwindCSS](https://tailwindcss.com/) – utility-first styling
  - [shadcn/ui](https://ui.shadcn.com/) – accessible, modern UI components
  - [Supabase JS](https://supabase.com/) – auth + data fetching
  - Deployable to **Netlify** or **Cloudflare Pages**

- **Backend / Data**
  - [Supabase](https://supabase.com/)
    - Postgres Database with RLS policies
    - Edge Functions (Deno) for authenticated ingestion
    - Auth (email/password) for dashboard access
  - Row Level Security ensures only authenticated users can read data

- **Devices**
  - ESP32 boards with soil moisture, temperature, and humidity sensors
  - Each ESP sends JSON payloads every 5 minutes (configurable) with:
    ```json
    {
      "soil_1": 75,
      "soil_2": 72,
      "soil_3": 73,
      "soil_4": 70,
      "temp_1": 30,
      "hum_1": 60,
      "temp_2": 29,
      "hum_2": 63
    }
    ```

---

## ✨ Features

- **Secure ingestion**: ESP32 → Supabase Edge Function with shared API key
- **Responsive dashboard**: works on desktop and mobile
- **Color-coded tiles**:
  - 🟩 Soil moisture
  - 🟥 Temperature
  - 🟦 Humidity
- **Status indicators**: Fresh / Stale readings
- **CSV Export**: select start & end date to download sensor history
- **Basic Auth**: dashboard requires Supabase Auth login

---

## 📦 Getting Started

### 1. Clone & install
```bash
git clone https://github.com/your-org/esp32-irrigation-dashboard.git
cd esp32-irrigation-dashboard
npm install
```
### 2. Environment variables
```bash
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```
### 3. Run locally
```bash
npm run dev
```