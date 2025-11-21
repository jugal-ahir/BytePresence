# Setup Instructions

## Prerequisites
- Node.js (v14 or higher)
- MongoDB (running locally or connection string)
- Google Maps API Key (optional, for map features)

## Installation Steps

1. **Install Backend Dependencies**
```bash
npm install
```

2. **Install Frontend Dependencies**
```bash
cd client
npm install
cd ..
```

3. **Configure Environment Variables**

Create a `.env` file in the root directory:
```
MONGODB_URI=mongodb://localhost:27017/attendance_system
JWT_SECRET=your-secret-key-change-in-production
PORT=5000
```

Create a `client/.env` file (optional, only if you need to customize API URL):
```
REACT_APP_API_URL=http://localhost:5000
```
Note: No API key needed! The app uses Leaflet with OpenStreetMap (completely free).

4. **Create Admin User**

Run the admin creation script:
```bash
npm run create-admin
```

Or manually set environment variables:
```
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123
```

5. **Start MongoDB**

Make sure MongoDB is running on your system.

6. **Run the Application**

Development mode (runs both backend and frontend):
```bash
npm run dev
```

Or run separately:
```bash
# Terminal 1 - Backend
npm run server

# Terminal 2 - Frontend
npm run client
```

7. **Access the Application**

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## First Time Setup

1. Login with admin credentials (created in step 4)
2. Create courses and sections in Admin Dashboard
3. Register students (either by admin or self-registration)
4. Create attendance sessions
5. Students can mark attendance during active sessions

## Notes

- Maps are powered by Leaflet + OpenStreetMap (completely free, no API key required).
- Make sure MongoDB is running before starting the server.
- The session scheduler checks every second for precise timing of scheduled sessions.

