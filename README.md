# Student Attendance Management System

A comprehensive web application for managing student attendance with modern UI, geo-location tracking, and automated session management.

## Features

### Student Features
- **Registration**: Students can register with name, enrollment number, email, courses/sections, and password
- **Mark Attendance**: Mark attendance with enrollment number verification
- **Time Restrictions**: Attendance can only be marked within the session time window
- **Geo-location**: Students must be within 10 meters of the admin-set GPS coordinate
- **Map View**: Interactive map showing the 10-meter radius area

### Admin Features
- **Student Management**: Register and manage students
- **Course Management**: Create and manage courses with sections
- **Session Management**: Create attendance sessions with two options:
  - Start Immediately
  - Schedule for Later (auto-starts at exact time with zero delay)
- **PDF Reports**: Download formatted attendance reports after sessions end

## Tech Stack

### Backend
- Node.js with Express
- MongoDB with Mongoose
- JWT Authentication
- Node-cron for scheduled sessions
- PDFKit for report generation

### Frontend
- React
- React Router
- Leaflet + OpenStreetMap (free, no API key required)
- Axios for API calls
- Modern CSS with responsive design

## Installation

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

3. **Environment Setup**
Create a `.env` file in the root directory:
```
MONGODB_URI=mongodb://localhost:27017/attendance_system
JWT_SECRET=your-secret-key-change-in-production
PORT=5000
```

4. **Environment Variables (Optional)**
Create `client/.env` file if you need to customize the API URL:
```
REACT_APP_API_URL=http://localhost:5000
```
Note: No API key needed! The app uses Leaflet with OpenStreetMap (completely free).

## Running the Application

### Development Mode
```bash
npm run dev
```
This will start both the backend server (port 5000) and frontend (port 3000).

### Separate Commands
```bash
# Backend only
npm run server

# Frontend only
npm run client
```

## Default Admin Account

To create an admin account, you'll need to manually set a user's role to 'admin' in MongoDB:

```javascript
// In MongoDB shell or using Mongoose
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { role: "admin" } }
)
```

## Project Structure

```
attendance-management-system/
├── server/
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── middleware/      # Authentication middleware
│   ├── utils/           # Utility functions
│   └── index.js         # Server entry point
├── client/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── context/     # React context
│   │   └── utils/       # Utility functions
│   └── public/
└── package.json
```

## API Endpoints

### Authentication
- `POST /api/auth/register/student` - Student registration
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Admin
- `POST /api/admin/register-student` - Register student (admin)
- `GET /api/admin/students` - Get all students
- `POST /api/admin/courses` - Create course
- `GET /api/admin/courses` - Get all courses

### Sessions
- `POST /api/sessions` - Create session (admin)
- `GET /api/sessions/admin` - Get all sessions (admin)
- `GET /api/sessions/available` - Get available sessions (student)
- `POST /api/sessions/:sessionId/mark` - Mark attendance
- `GET /api/sessions/:sessionId/report` - Download PDF report

## Key Features Implementation

### Scheduled Sessions
Sessions are checked every second using node-cron to ensure precise timing. Sessions automatically start and end at the exact scheduled times.

### Geo-location
Uses Haversine formula to calculate distance between student location and session location. Students must be within 10 meters to mark attendance.

### PDF Reports
Generates professional PDF reports with student details, enrollment numbers, courses, and attendance status.

## Security Features
- Password hashing with bcrypt
- JWT token authentication
- Role-based access control
- Input validation
- Secure API endpoints

## License

ISC

