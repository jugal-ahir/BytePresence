const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const { auth } = require('../middleware/auth');

// Get student's attendance history
router.get('/attendance', auth, async (req, res) => {
  try {
    const attendance = await Attendance.find({ student: req.user._id })
      .populate('session', 'title startTime endTime courses')
      .sort({ markedAt: -1 });
    
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get attendance statistics by course
router.get('/attendance/stats', auth, async (req, res) => {
  try {
    const AttendanceSession = require('../models/AttendanceSession');
    const student = req.user;
    
    // Get all sessions for courses the student is enrolled in
    const studentCourses = student.courses || [];
    const courseStats = {};
    
    // Initialize stats for each course
    studentCourses.forEach(course => {
      const courseKey = `${course.course}-${course.section}`;
      courseStats[courseKey] = {
        course: course.course,
        section: course.section,
        totalSessions: 0,
        attendedSessions: 0,
        percentage: 0
      };
    });
    
    // Get all sessions that match student's courses
    const allSessions = await AttendanceSession.find({
      status: 'ended',
      courses: {
        $elemMatch: {
          $or: studentCourses.map(sc => ({
            course: sc.course,
            section: sc.section
          }))
        }
      }
    }).select('_id courses startTime endTime');
    
    // Count total sessions per course
    allSessions.forEach(session => {
      session.courses.forEach(sessionCourse => {
        const courseKey = `${sessionCourse.course}-${sessionCourse.section}`;
        if (courseStats[courseKey]) {
          courseStats[courseKey].totalSessions++;
        }
      });
    });
    
    // Get all attendance records for this student
    const attendanceRecords = await Attendance.find({ student: student._id })
      .populate('session', 'courses')
      .select('session');
    
    // Count attended sessions per course
    attendanceRecords.forEach(record => {
      if (record.session && record.session.courses) {
        record.session.courses.forEach(sessionCourse => {
          const courseKey = `${sessionCourse.course}-${sessionCourse.section}`;
          if (courseStats[courseKey]) {
            courseStats[courseKey].attendedSessions++;
          }
        });
      }
    });
    
    // Calculate percentage for each course
    const statsArray = Object.values(courseStats).map(stat => ({
      ...stat,
      percentage: stat.totalSessions > 0 
        ? Math.round((stat.attendedSessions / stat.totalSessions) * 100) 
        : 0
    }));
    
    res.json(statsArray);
  } catch (error) {
    console.error('Error fetching attendance stats:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get student profile
router.get('/profile', auth, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        name: req.user.name,
        enrollmentNumber: req.user.enrollmentNumber,
        email: req.user.email,
        courses: req.user.courses
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

