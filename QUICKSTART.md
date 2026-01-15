# Quick Start Guide

## Prerequisites
- Node.js 18+ installed
- MongoDB running (local or cloud)

## Setup Steps

### 1. Backend Setup

```bash
cd backend
npm install
npm run seed  # Optional: Seed sample response capabilities
npm run dev   # Starts server on http://localhost:3000
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev   # Starts dev server on http://localhost:5173
```

### 3. Access the Application

- Open http://localhost:5173 in your browser
- Use **Citizen Portal** tab to report emergencies
- Use **Response Desk** tab to view incidents and manage response capabilities

## Testing

1. **Report an Incident:**
   - Go to Citizen Portal
   - Select incident category, detail, severity
   - Click on the map to select location
   - Click "Report Emergency"

2. **View Incidents:**
   - Go to Response Desk
   - View real-time map with incident markers
   - Click on markers to see incident details

3. **Real-time Updates:**
   - Open two browser windows
   - Report an incident in one window
   - See it appear instantly in the other window

## Notes

- MongoDB connection: Defaults to `mongodb://localhost:27017/sahaay`
- Mapbox token is already configured
- Socket.io handles real-time updates automatically
