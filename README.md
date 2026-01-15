# SAHAYA — Emergency Visibility & Response Platform

A real-time emergency reporting and response management platform designed for stressed users, low time, and high urgency situations.

## Tech Stack

- **Frontend:** React (Vite) + shadcn/ui + Mapbox GL JS
- **Backend:** Node.js + Express
- **Database:** MongoDB
- **Realtime:** Socket.io
- **Maps:** Mapbox GL JS

## Setup Instructions

### Prerequisites

- Node.js (v18+)
- MongoDB (local or cloud instance)

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file (optional, defaults provided):
```
MONGODB_URI=mongodb://localhost:27017/sahaay
FRONTEND_URL=http://localhost:5173
PORT=3000
```

4. Start MongoDB (if running locally)

5. Start backend server:
```bash
npm run dev
```

Backend runs on `http://localhost:3000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

Frontend runs on `http://localhost:5173`

## Features

### Citizen Portal
- Single-screen emergency reporting form
- Interactive Mapbox map for location selection
- Dynamic form based on incident category
- Real-time incident submission

### Response Desk
- Real-time map view with incident markers (color-coded by severity)
- Overview panel with key statistics
- Incident detail dialogs
- Response capability management

## Mapbox Configuration

The application uses a provided Mapbox public token. The token is configured in `frontend/src/components/MapboxMap.jsx`.

## Data Models

### Incident
- category (String)
- detail (String)
- severity (Low | Medium | High | Critical)
- notes (String, optional)
- lat (Number)
- lng (Number)
- timestamp (Date)
- status (Active | Resolved)

### Response Capability
- domain (String)
- description (String)
- status (Available | Deployed | Unavailable)
- lat (Number)
- lng (Number)

## UI Philosophy

- Calm, clear, fast, and obvious
- High contrast dark theme
- Large, touch-friendly buttons
- Minimal text
- No decorative elements
- Red used only for critical severity

## Development

The application uses Socket.io for real-time updates across sessions. All incident creation and updates are broadcast in real-time.
