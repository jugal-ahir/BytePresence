const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Course = require('../models/Course');
const { adminAuth } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Register student (Admin)
router.post('/register-student', adminAuth, [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('enrollmentNumber').trim().notEmpty().withMessage('Enrollment number is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('courses').isArray().withMessage('Courses must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, enrollmentNumber, email, password, courses } = req.body;

    const existingUser = await User.findOne({
      $or: [{ email }, { enrollmentNumber: enrollmentNumber.toUpperCase() }]
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = new User({
      name,
      enrollmentNumber: enrollmentNumber.toUpperCase(),
      email,
      password,
      role: 'student',
      courses: courses || []
    });

    await user.save();

    res.status(201).json({
      message: 'Student registered successfully',
      user: {
        id: user._id,
        name: user.name,
        enrollmentNumber: user.enrollmentNumber,
        email: user.email,
        courses: user.courses
      }
    });
  } catch (error) {
    console.error('Error registering student:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all students
router.get('/students', adminAuth, async (req, res) => {
  try {
    const students = await User.find({ role: 'student' })
      .select('-password')
      .sort({ enrollmentNumber: 1 });
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create course
router.post('/courses', adminAuth, [
  body('name').trim().notEmpty().withMessage('Course name is required'),
  body('section').trim().notEmpty().withMessage('Section is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, section } = req.body;

    const course = new Course({
      name,
      section,
      createdBy: req.user._id
    });

    await course.save();
    res.status(201).json({ message: 'Course created successfully', course });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Course with this name and section already exists' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all courses
router.get('/courses', adminAuth, async (req, res) => {
  try {
    const courses = await Course.find().sort({ name: 1, section: 1 });
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete course
router.delete('/courses/:id', adminAuth, async (req, res) => {
  try {
    await Course.findByIdAndDelete(req.params.id);
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update student courses
router.patch('/students/:id/courses', adminAuth, [
  body('courses').isArray().withMessage('Courses must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { courses } = req.body;
    const student = await User.findById(req.params.id);

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    if (student.role !== 'student') {
      return res.status(400).json({ message: 'User is not a student' });
    }

    student.courses = courses;
    await student.save();

    res.json({
      message: 'Student courses updated successfully',
      user: {
        id: student._id,
        name: student.name,
        enrollmentNumber: student.enrollmentNumber,
        email: student.email,
        courses: student.courses
      }
    });
  } catch (error) {
    console.error('Error updating student courses:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

