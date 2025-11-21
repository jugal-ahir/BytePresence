const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Course = require('../models/Course');
const { auth, JWT_SECRET } = require('../middleware/auth');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

// Register Student
router.post('/register/student', [
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

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { enrollmentNumber: enrollmentNumber.toUpperCase() }]
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email or enrollment number' });
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

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'Student registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        enrollmentNumber: user.enrollmentNumber,
        email: user.email,
        role: user.role,
        courses: user.courses
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Login
router.post('/login', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        enrollmentNumber: user.enrollmentNumber,
        email: user.email,
        role: user.role,
        courses: user.courses
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        name: req.user.name,
        enrollmentNumber: req.user.enrollmentNumber,
        email: req.user.email,
        role: req.user.role,
        courses: req.user.courses
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all courses (public endpoint for registration)
router.get('/courses', async (req, res) => {
  try {
    const courses = await Course.find().sort({ name: 1, section: 1 });
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

