const express = require('express');
const router = express.Router();
const AttendanceSession = require('../models/AttendanceSession');
const Attendance = require('../models/Attendance');
const { auth, adminAuth } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const { isWithinRadius } = require('../utils/geoLocation');
const { generateAttendanceReport } = require('../utils/pdfGenerator');

// Create attendance session (Admin)
router.post('/', adminAuth, [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('courses').isArray().withMessage('Courses must be an array'),
  body('duration').isInt({ min: 1 }).withMessage('Duration must be a positive number'),
  body('location.latitude').isFloat().withMessage('Valid latitude is required'),
  body('location.longitude').isFloat().withMessage('Valid longitude is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, courses, startTime, duration, location } = req.body;

    let sessionStartTime, sessionEndTime;

    if (startTime) {
      // Scheduled session
      sessionStartTime = new Date(startTime);
      sessionEndTime = new Date(sessionStartTime.getTime() + duration * 60000);
    } else {
      // Start immediately
      sessionStartTime = new Date();
      sessionEndTime = new Date(sessionStartTime.getTime() + duration * 60000);
    }

    const session = new AttendanceSession({
      title,
      courses,
      startTime: sessionStartTime,
      endTime: sessionEndTime,
      duration,
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
        radius: location.radius || 500
      },
      status: startTime ? 'scheduled' : 'active',
      createdBy: req.user._id,
      startedAt: startTime ? null : sessionStartTime
    });

    await session.save();
    res.status(201).json({ message: 'Session created successfully', session });
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all sessions (Admin)
router.get('/admin', adminAuth, async (req, res) => {
  try {
    const sessions = await AttendanceSession.find()
      .populate('createdBy', 'name email')
      .populate('blockedStudents', 'name enrollmentNumber email')
      .sort({ createdAt: -1 });
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get available sessions for student
router.get('/available', auth, async (req, res) => {
  try {
    const user = req.user;
    const now = new Date();

    // Get all active sessions
    const activeSessions = await AttendanceSession.find({
      status: 'active',
      startTime: { $lte: now },
      endTime: { $gte: now }
    });

    // Filter sessions where student is enrolled in at least one course
    const availableSessions = activeSessions.filter(session => {
      return session.courses.some(sessionCourse => {
        return user.courses.some(userCourse => {
          return userCourse.course === sessionCourse.course &&
            userCourse.section === sessionCourse.section;
        });
      });
    });

    // Check attendance status for all available sessions in one query
    const sessionIds = availableSessions.map(s => s._id);
    const attendanceRecords = await Attendance.find({
      session: { $in: sessionIds },
      student: user._id
    });

    const attendanceMap = new Map(attendanceRecords.map(a => [a.session.toString(), a]));

    const sessionsWithAttendance = availableSessions.map(session => {
      const attendance = attendanceMap.get(session._id.toString());
      const sessionData = session.toObject();
      sessionData.attendanceMarked = !!attendance;
      if (attendance) {
        sessionData.markedAt = attendance.markedAt;
      }
      return sessionData;
    });

    res.json(sessionsWithAttendance);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark attendance (Student)
router.post('/:sessionId/mark', auth, [
  body('enrollmentNumber').trim().notEmpty().withMessage('Enrollment number is required'),
  body('location.latitude').isFloat().withMessage('Valid latitude is required'),
  body('location.longitude').isFloat().withMessage('Valid longitude is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { sessionId } = req.params;
    const { enrollmentNumber, location } = req.body;
    const user = req.user;

    // Verify enrollment number matches
    if (user.enrollmentNumber.toUpperCase() !== enrollmentNumber.toUpperCase()) {
      return res.status(403).json({ message: 'Enrollment number does not match' });
    }

    // Get session
    const session = await AttendanceSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Check if session is active
    const now = new Date();
    if (session.status !== 'active' || now < session.startTime || now > session.endTime) {
      return res.status(400).json({ message: 'Session is not active' });
    }

    // Check if student is enrolled in session courses
    const isEnrolled = session.courses.some(sessionCourse => {
      return user.courses.some(userCourse => {
        return userCourse.course === sessionCourse.course &&
          userCourse.section === sessionCourse.section;
      });
    });

    if (!isEnrolled) {
      return res.status(403).json({ message: 'You are not enrolled in this session' });
    }

    // Check if student is blocked
    if (session.blockedStudents && session.blockedStudents.some(id => id.toString() === user._id.toString())) {
      return res.status(403).json({ message: 'You are blocked from marking attendance for this session' });
    }

    // Check location
    const withinRadius = isWithinRadius(
      location.latitude,
      location.longitude,
      session.location.latitude,
      session.location.longitude,
      session.location.radius
    );

    if (!withinRadius) {
      return res.status(400).json({
        message: 'You are not within the allowed location radius',
        distance: 'outside'
      });
    }

    // Check if already marked
    const existingAttendance = await Attendance.findOne({
      session: sessionId,
      student: user._id
    });

    if (existingAttendance) {
      return res.status(400).json({ message: 'Attendance already marked for this session' });
    }

    // Mark attendance
    const attendance = new Attendance({
      session: sessionId,
      student: user._id,
      enrollmentNumber: user.enrollmentNumber,
      location: {
        latitude: location.latitude,
        longitude: location.longitude
      },
      status: 'present'
    });

    await attendance.save();
    res.json({ message: 'Attendance marked successfully', attendance });
  } catch (error) {
    console.error('Error marking attendance:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get session details
router.get('/:sessionId', auth, async (req, res) => {
  try {
    const session = await AttendanceSession.findById(req.params.sessionId)
      .populate('createdBy', 'name email')
      .populate('blockedStudents', 'name enrollmentNumber email');

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Check if student has already marked attendance
    const existingAttendance = await Attendance.findOne({
      session: req.params.sessionId,
      student: req.user._id
    });

    const sessionData = session.toObject();
    sessionData.attendanceMarked = !!existingAttendance;
    if (existingAttendance) {
      sessionData.markedAt = existingAttendance.markedAt;
    }

    res.json(sessionData);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Download attendance report (Admin)
router.get('/:sessionId/report', adminAuth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const pdfBuffer = await generateAttendanceReport(sessionId);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=attendance-report-${sessionId}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ message: 'Error generating report', error: error.message });
  }
});

// Get attendance for a session (Admin)
router.get('/:sessionId/attendance', adminAuth, async (req, res) => {
  try {
    const attendance = await Attendance.find({ session: req.params.sessionId })
      .populate('student', 'name enrollmentNumber email courses')
      .sort({ markedAt: -1 });

    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Close/End an active session (Admin)
router.patch('/:sessionId/close', adminAuth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await AttendanceSession.findById(sessionId);

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    if (session.status === 'ended') {
      return res.status(400).json({ message: 'Session is already ended' });
    }

    const now = new Date();
    // Update endTime to now if session is still active
    if (session.status === 'active' || session.status === 'scheduled') {
      session.endTime = now;
    }
    session.status = 'ended';
    session.endedAt = now;

    await session.save();
    res.json({ message: 'Session closed successfully', session });
  } catch (error) {
    console.error('Error closing session:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update/Edit a session (Admin) - Only for non-ended sessions
router.patch('/:sessionId', adminAuth, [
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
  body('courses').optional().isArray().withMessage('Courses must be an array'),
  body('duration').optional().isInt({ min: 1 }).withMessage('Duration must be a positive number'),
  body('location.latitude').optional().isFloat().withMessage('Valid latitude is required'),
  body('location.longitude').optional().isFloat().withMessage('Valid longitude is required'),
  body('blockedStudents').optional().isArray().withMessage('Blocked students must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { sessionId } = req.params;
    const { title, courses, startTime, duration, location, blockedStudents } = req.body;

    const session = await AttendanceSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Only allow editing non-ended sessions
    if (session.status === 'ended') {
      return res.status(400).json({ message: 'Cannot edit ended sessions' });
    }

    // Update fields if provided
    if (title) session.title = title;
    if (courses) session.courses = courses;
    if (blockedStudents !== undefined) session.blockedStudents = blockedStudents;

    if (duration) {
      session.duration = duration;
      // Recalculate endTime if duration changes
      session.endTime = new Date(session.startTime.getTime() + duration * 60000);
    }

    if (location) {
      session.location = {
        latitude: location.latitude,
        longitude: location.longitude,
        radius: location.radius || session.location.radius || 500
      };
    }

    // If startTime is provided and session is scheduled, update it
    if (startTime && session.status === 'scheduled') {
      const newStartTime = new Date(startTime);
      session.startTime = newStartTime;
      session.endTime = new Date(newStartTime.getTime() + session.duration * 60000);
    }

    await session.save();
    const updatedSession = await AttendanceSession.findById(sessionId)
      .populate('createdBy', 'name email')
      .populate('blockedStudents', 'name enrollmentNumber email');

    res.json({ message: 'Session updated successfully', session: updatedSession });
  } catch (error) {
    console.error('Error updating session:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a session (Admin)
router.delete('/:sessionId', adminAuth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await AttendanceSession.findById(sessionId);

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Delete all attendance records for this session
    await Attendance.deleteMany({ session: sessionId });

    // Delete the session
    await AttendanceSession.findByIdAndDelete(sessionId);

    res.json({ message: 'Session deleted successfully' });
  } catch (error) {
    console.error('Error deleting session:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

