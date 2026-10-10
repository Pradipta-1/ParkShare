# 🅿️ ParkShare — Next-Gen Peer-to-Peer Smart Parking & Urban Mobility Platform

> **Transforming unused spaces into smart parking nodes** — reducing urban traffic congestion, cutting idle vehicle emissions, and unlocking seamless passive revenue for property owners.

[![Fullstack Web Application](https://img.shields.io/badge/ParkShare-Production--Ready-10b981?style=for-the-badge&logo=react)](http://localhost:5173/)
[![Node.js & Express](https://img.shields.io/badge/Node.js-REST--API-blue?style=for-the-badge&logo=node.js)](http://localhost:5000/api/health)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict--Mode-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Database](https://img.shields.io/badge/Database-MongoDB%20%2B%20In--Memory-47A248?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)

---

## 📌 Mission & Value Proposition

In rapidly densifying urban centers, **up to 30% of traffic congestion** stems from drivers circling blocks in search of vacant parking spots. At the same time, millions of square feet of private driveways, residential bays, commercial garages, and corporate lots sit unoccupied throughout the day.

**ParkShare** bridges this disparity through a hyper-local, peer-to-peer parking marketplace that pairs drivers seeking guaranteed parking with hosts ready to monetize spare space.

### Core Value Pillars

| Stakeholder | Key Value Proposition |
|---|---|
| 🚗 **Drivers** | **Guaranteed peace of mind.** Search on an interactive 40/60 split map, lock in pre-reserved bays, bypass street-cruising stress, enjoy dynamic fair pricing, and check in via contactless QR gates. |
| 🏡 **Space Owners & Hosts** | **Zero-effort monetization.** Transform driveways, basements, and open bays into recurring passive income. Leverage dynamic surge pricing, flexible availability calendars, automated payout deposits, and verified guest screenings. |
| 🏙️ **Smart Cities & Climate** | **Sustainable urban mobility.** Reduces curb-cruising vehicle emissions, minimizes street bottlenecking, optimizes existing spatial infrastructure, and delivers zero-footprint urban scalability. |

---

## 🌟 Key Features

### 1. Driver Experience
- **Interactive Map Search**: Leaflet + OpenStreetMap engine with dark mode styling, custom price pill markers (₹40, ₹60, ₹35, etc.), pulsing availability rings, and instant hover cards.
- **Smart 40/60 Split Screen**: Desktop split screen with 40% listing cards and 60% interactive map; swipeable bottom sheets on mobile.
- **Multi-Faceted Filtering**: Filter by Price Slider, Distance Chips (Within 500m, 1km, 3km, 5km), Parking Structure (Covered, Basement, Garage, Driveway, Open), Vehicle Compatibility (Car, Bike, SUV, EV), and Amenities (CCTV, EV Charging, 24/7 Access, Security Guard, Gated).
- **Multi-Step Reservation**: 6-step booking flow (Date → Slot Hours → Vehicle Selection → Price Breakdown → Payment with UPI/Card/Wallet → Confirmation).
- **Contactless QR Entry & Check-In**: High-resolution QR code generator with simulated hardware gate scanner triggers for entry (`✓ Check-in successful, Bay: P-24`) and checkout (`✓ Duration: 2h 56m, Settled Amount: ₹120`).
- **Vehicle Garage**: Register and manage cars, bikes, SUVs, and EVs with automated barrier recognition.
- **Active Booking Live Timer**: Live countdown timer (`01:42:18 remaining`) with low-time warning indicators.
- **Driver-Owner Messaging**: Integrated chat module with sticky booking context headers.
- **Saved / Favorite Parking**: 1-click animated bookmarking.

### 2. Space Owner Experience
- **Host Dashboard**: High-level KPIs: Today's Earnings (`₹1,240`), Active Bookings (`8`), Occupancy Rate (`74%`), Superhost Rating (`4.8/5`).
- **Revenue Analytics**: Recharts AreaChart weekly earnings breakdown and hourly occupancy heat profile.
- **7-Step Listing Wizard**: Add a new parking spot with draggable Leaflet map coordinates pin, photo selector, dimensions, security specifications, and dynamic pricing.
- **Availability Calendar & Yield Management**: Day-by-day heatmap occupancy rates, weekend price premiums, and instant date blocking.
- **Payouts & Direct Deposits**: Payout request modal, settlement history, linked bank account details, and CSV statement download.

### 3. Admin Governance & Trust Operations
- **Platform Analytics**: Total users (`24,820`), listed parking spaces (`6,431`), completed bookings (`18,294`), gross platform GMV (`₹18.4L`).
- **Listing Verification Queue**: Review submitted government identity documents, ownership deeds, and photo angles with instant `[ Approve ]` (awards `✓ Verified Parking` badge) and `[ Reject ]` controls.
- **Dispute & Report Ticket System**: Triage user reports (e.g. `Incorrect location`, `Payment issue`, `Parking unavailable`) through ticket lifecycles (`Open` → `Investigating` → `Resolved` → `Rejected`).

### 4. 1-Click Persona Demo Switcher
Switch between roles at any time via the top navigation bar:
- **Driver Demo**: Preloaded with active booking at Central Avenue, vehicle garage, saved spots, and wallet balance.
- **Owner Demo**: Preloaded with multi-spot earnings, live occupancy, and calendar controls.
- **Admin Demo**: Access to verification queues, platform metrics, and dispute tickets.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Tailwind CSS v4, React Router v7, Leaflet & OpenStreetMap, Recharts, Lucide React, qrcode.react, Canvas Confetti |
| **Backend** | Node.js, Express.js, TypeScript (`tsx`), JWT authentication, bcryptjs, UUID |
| **Persistence** | Dual-mode: MongoDB Atlas via Mongoose with high-performance in-memory repository store fallback |
| **Build & Tooling** | Vite v8 with `@tailwindcss/vite` |

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)

### Installation
Clone the repository and install dependencies:

```bash
# Clone the repository
git clone https://github.com/your-repo/parkshare.git
cd parkshare

# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
npm install
```

### Running Locally

**Option A: Start Both Services Simultaneously (Recommended)**
From the repository root, start both the Express API and Vite frontend concurrently:
```bash
npm run dev
# Starts Backend (http://localhost:5000) and Frontend (http://localhost:5173) together
```

**Option B: Start Services Individually**

1. **Start the Backend Server (Port 5000):**
```bash
cd server
npm run dev
# Running on http://localhost:5000
```

2. **Start the Frontend Development Server (Port 5173):**
```bash
cd client
npm run dev
# Running on http://localhost:5173
```

3. **Open in Browser:**
Navigate to `http://localhost:5173/`.

---

## 📡 REST API Endpoints

### Auth
- `POST /api/auth/register` — Register a driver or space owner
- `POST /api/auth/login` — Login with email and password
- `POST /api/auth/demo` — 1-click role switcher login
- `GET /api/auth/me` — Fetch authenticated user profile

### Parking Spaces
- `GET /api/parking` — List all spaces with multi-faceted filtering (`q`, `type`, `vehicle`, `distance`, `maxPrice`, `amenities`, `verifiedOnly`, `instantOnly`)
- `GET /api/parking/:id` — Get parking space details
- `POST /api/parking` — Create new parking listing
- `PUT /api/parking/:id` — Update listing details
- `DELETE /api/parking/:id` — Delete listing

### Bookings
- `POST /api/bookings` — Create reservation & calculate fees
- `GET /api/bookings` — List user or owner bookings
- `GET /api/bookings/:id` — Get single booking details with QR code
- `PUT /api/bookings/:id/cancel` — Cancel booking with automatic wallet refund
- `POST /api/bookings/:id/checkin` — Simulated gate QR check-in
- `POST /api/bookings/:id/checkout` — Simulated gate QR check-out & final receipt

### Vehicles, Reviews, Favorites & Messaging
- `GET /api/vehicles` & `POST /api/vehicles` — Vehicle garage
- `GET /api/reviews/:parkingId` & `POST /api/reviews` — Reviews and ratings
- `GET /api/favorites` & `POST /api/favorites` — Saved parking spots
- `GET /api/messages/:bookingId` & `POST /api/messages` — Real-time chat

### Owner & Admin Operations
- `GET /api/owner/metrics` & `GET /api/owner/spaces` — Host metrics & spaces
- `PUT /api/owner/calendar/:spaceId` — Availability & surge pricing
- `GET /api/admin/metrics` — Platform overview
- `GET /api/admin/verification` & `POST /api/admin/verification/:id/approve` — Listing verification
- `GET /api/admin/reports` & `PUT /api/admin/reports/:id/status` — Dispute tickets
