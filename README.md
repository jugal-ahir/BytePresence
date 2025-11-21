# 📚 BytePresence - Student Attendance Management System

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-ISC-green.svg)
![Node](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen.svg)
![React](https://img.shields.io/badge/react-18.2.0-blue.svg)

A comprehensive, full-stack web application for managing student attendance with real-time geo-location verification, automated session scheduling, and detailed reporting. Built with modern web technologies to provide a seamless experience for both students and administrators.

[Features](#-features) • [Installation](#-installation) • [Usage](#-usage) • [Tech Stack](#-tech-stack) • [API Documentation](#-api-documentation) • [Contributing](#-contributing)

</div>

---

## ✨ Features

### 👨‍🎓 Student Features

- **🔐 Easy Registration**: Self-registration with course and section selection
- **✅ Smart Attendance Marking**: Mark attendance with enrollment number verification
- **📍 Geo-Location Verification**: Automatic GPS-based location validation (10-meter radius)
- **🗺️ Interactive Map View**: Visual map display showing allowed attendance area with real-time position tracking
- **📊 Real-Time Status**: View available sessions and complete attendance history
- **🔒 One-Time Marking**: Prevents duplicate attendance entries automatically
- **⏰ Time Window Enforcement**: Attendance can only be marked within scheduled session times
- **📱 Mobile Responsive**: Fully optimized for mobile devices with touch-friendly interface

### 👨‍💼 Admin Features

- **👥 Student Management**: 
  - Register, view, and manage students
  - Edit student courses and sections
  - Filter students by course and section
  - Inline editing capabilities
  
- **📖 Course Management**: 
  - Create and manage courses with multiple sections
  - Delete courses when needed
  
- **📅 Flexible Session Management**: 
  - **Start Immediately**: Create and activate sessions instantly
  - **Schedule for Later**: Auto-start sessions at precise scheduled times (zero delay)
  - **Edit Sessions**: Modify non-completed sessions (title, time, location, blocked students)
  - **Manual Closure**: Close active sessions manually when needed
  - **Session Deletion**: Remove sessions with automatic cleanup
  
- **🚫 Student Blocking**: Block specific students from marking attendance for any session
- **📄 Comprehensive Reports**: Download detailed PDF attendance reports with:
  - Separate sections for present and absent students
  - Student names, enrollment numbers, and course details
  - Professional formatting and statistics
  
- **📑 Pagination**: View sessions in organized pages (6 per page) with navigation controls
- **🎨 Modern UI**: Clean, intuitive interface with responsive design

## 🛠️ Tech Stack

### Frontend
- **React 18.2.0** - Modern UI framework
- **React Router 6.20.1** - Client-side routing
- **Leaflet 1.9.4** - Interactive maps
- **OpenStreetMap** - Free map tiles (no API key required)
- **Axios 1.6.2** - HTTP client
- **CSS3** - Responsive, mobile-first design

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication & authorization
- **Node-cron** - Automated session scheduling
- **PDFKit** - PDF report generation
- **Bcrypt** - Password hashing

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v14.0.0 or higher)
- **MongoDB** (running locally or connection string)
- **npm** or **yarn** package manager

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/jugal-ahir/BytePresence.git
cd BytePresence
```

### 2. Install Backend Dependencies

```bash
npm install
```

### 3. Install Frontend Dependencies

```bash
cd client
npm install
cd ..
```

### 4. Environment Configuration

Create a `.env` file in the root directory:

```env
MONGODB_URI=mongodb://localhost:27017/attendance_system
JWT_SECRET=your-secret-key-change-in-production
PORT=5000
```

**Note**: Replace `your-secret-key-change-in-production` with a strong, random secret key for production use.

### 5. Create Admin User

Run the admin creation script:

```bash
npm run create-admin
```

Or set environment variables before running:

```env
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123
```

## 🎯 Usage

### Development Mode

Start both backend and frontend servers simultaneously:

```bash
npm run dev
```

This will start:
- **Backend Server**: http://localhost:5000
- **Frontend Application**: http://localhost:3000

### Separate Servers

Run backend and frontend in separate terminals:

```bash
# Terminal 1 - Backend
npm run server

# Terminal 2 - Frontend
npm run client
```

### First Time Setup

1. **Login** with admin credentials (created in installation step 5)
2. **Create Courses**: Navigate to Course Management and add courses with sections
3. **Register Students**: 
   - Admin can register students directly
   - Students can self-register from the registration page
4. **Create Sessions**: 
   - Create attendance sessions (immediate or scheduled)
   - Set location using the interactive map
   - Select applicable courses/sections
5. **Mark Attendance**: Students can mark attendance during active sessions

## 📖 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register/student` | Student self-registration | No |
| POST | `/api/auth/login` | User login | No |
| GET | `/api/auth/me` | Get current user | Yes |
| GET | `/api/auth/courses` | Get all courses (public) | No |

### Admin Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/admin/register-student` | Register student (admin) | Admin |
| GET | `/api/admin/students` | Get all students | Admin |
| PATCH | `/api/admin/students/:id/courses` | Update student courses | Admin |
| POST | `/api/admin/courses` | Create course | Admin |
| GET | `/api/admin/courses` | Get all courses | Admin |
| DELETE | `/api/admin/courses/:id` | Delete course | Admin |

### Session Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/sessions` | Create session | Admin |
| GET | `/api/sessions/admin` | Get all sessions (admin) | Admin |
| GET | `/api/sessions/available` | Get available sessions | Student |
| GET | `/api/sessions/:sessionId` | Get session details | Yes |
| POST | `/api/sessions/:sessionId/mark` | Mark attendance | Student |
| PATCH | `/api/sessions/:sessionId` | Update session | Admin |
| PATCH | `/api/sessions/:sessionId/close` | Close session | Admin |
| DELETE | `/api/sessions/:sessionId` | Delete session | Admin |
| GET | `/api/sessions/:sessionId/report` | Download PDF report | Admin |
| GET | `/api/sessions/:sessionId/attendance` | Get session attendance | Admin |

### Student Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/student/attendance` | Get attendance history | Student |

## 🏗️ Project Structure

```
BytePresence/
├── server/
│   ├── models/              # MongoDB models
│   │   ├── User.js          # User/Student model
│   │   ├── Course.js        # Course model
│   │   ├── AttendanceSession.js  # Session model
│   │   └── Attendance.js    # Attendance record model
│   ├── routes/              # API routes
│   │   ├── auth.js          # Authentication routes
│   │   ├── admin.js         # Admin routes
│   │   ├── sessions.js      # Session routes
│   │   └── student.js       # Student routes
│   ├── middleware/          # Express middleware
│   │   └── auth.js          # JWT authentication
│   ├── utils/               # Utility functions
│   │   ├── geoLocation.js   # GPS distance calculation
│   │   ├── pdfGenerator.js  # PDF report generation
│   │   ├── sessionScheduler.js  # Session automation
│   │   └── createAdmin.js   # Admin creation script
│   └── index.js             # Server entry point
├── client/
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   │   ├── Navbar.js    # Navigation bar
│   │   │   └── PrivateRoute.js  # Route protection
│   │   ├── pages/           # Page components
│   │   │   ├── Login.js
│   │   │   ├── StudentRegister.js
│   │   │   ├── StudentDashboard.js
│   │   │   ├── MarkAttendance.js
│   │   │   ├── AdminDashboard.js
│   │   │   ├── AdminStudentManagement.js
│   │   │   ├── AdminSessionManagement.js
│   │   │   └── AdminCourseManagement.js
│   │   ├── context/         # React context
│   │   │   └── AuthContext.js
│   │   ├── utils/           # Utility functions
│   │   │   └── api.js       # Axios configuration
│   │   ├── App.js           # Main app component
│   │   └── index.js         # React entry point
│   └── public/              # Static files
├── .env                     # Environment variables
├── .gitignore
├── package.json
├── README.md
└── SETUP.md
```

## 🔐 Security Features

- **Password Hashing**: Bcrypt with salt rounds
- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control**: Separate permissions for students and admins
- **Input Validation**: Server-side validation for all inputs
- **Protected Routes**: Frontend and backend route protection
- **Geo-Location Verification**: Prevents proxy attendance marking
- **Time Window Enforcement**: Attendance only allowed during active sessions
- **Duplicate Prevention**: One attendance mark per student per session

## 🎨 Key Features Implementation

### Automated Session Scheduling
Sessions are checked every second using `node-cron` to ensure precise timing. Scheduled sessions automatically start and end at the exact scheduled times with zero delay.

### Geo-Location Verification
Uses the Haversine formula to calculate the distance between student location and session location. Students must be within 10 meters (configurable) to mark attendance. Real-time map visualization helps students understand their position.

### PDF Report Generation
Generates professional PDF reports with:
- Separate sections for present and absent students
- Student details (name, enrollment number, course, section)
- Session information (date, time, duration)
- Summary statistics (total, present, absent counts)
- Professional formatting suitable for official records

### Student Blocking
Admins can block specific students from marking attendance for any session. Blocked students are clearly displayed in session cards, and the system prevents them from marking attendance even if they attempt to.

## 📱 Mobile Responsive Design

The application is fully responsive and optimized for mobile devices:
- **Hamburger Menu**: Collapsible navigation for mobile
- **Touch-Friendly**: Large buttons and touch targets
- **Optimized Layouts**: Stacked layouts for small screens
- **Responsive Forms**: Full-width inputs and buttons on mobile
- **Map Optimization**: Adjusted map heights for mobile viewing

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 👤 Author

**Jugal Ahir**

## 👤 Contributor

**Nitant Jain**

- GitHub: [@jugal-ahir](https://github.com/jugal-ahir)
- Repository: [BytePresence](https://github.com/jugal-ahir/BytePresence)

## 🙏 Acknowledgments

- [Leaflet](https://leafletjs.com/) - Open-source JavaScript library for mobile-friendly interactive maps
- [OpenStreetMap](https://www.openstreetmap.org/) - Free, editable map of the world
- [React](https://reactjs.org/) - A JavaScript library for building user interfaces
- [Express.js](https://expressjs.com/) - Fast, unopinionated web framework for Node.js

## 📞 Support

If you encounter any issues or have questions, please open an issue on the [GitHub repository](https://github.com/jugal-ahir/BytePresence/issues).

---

<div align="center">

**⭐ Star this repository if you find it helpful! ⭐**

Made with ❤️ by Jugal Ahir

</div>
