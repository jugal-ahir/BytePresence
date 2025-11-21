import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import './StudentRegister.css';

const StudentRegister = () => {
  const [formData, setFormData] = useState({
    name: '',
    enrollmentNumber: '',
    email: '',
    password: '',
    confirmPassword: '',
    courses: []
  });
  const [availableCourses, setAvailableCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState({ course: '', section: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await api.get('/api/auth/courses');
      setAvailableCourses(response.data);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleAddCourse = () => {
    if (selectedCourse.course && selectedCourse.section) {
      const exists = formData.courses.some(
        c => c.course === selectedCourse.course && c.section === selectedCourse.section
      );
      if (!exists) {
        setFormData({
          ...formData,
          courses: [...formData.courses, { ...selectedCourse }]
        });
        setSelectedCourse({ course: '', section: '' });
      } else {
        setError('Course already added');
      }
    }
  };

  const handleRemoveCourse = (index) => {
    setFormData({
      ...formData,
      courses: formData.courses.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.courses.length === 0) {
      setError('Please select at least one course');
      return;
    }

    setLoading(true);

    const { confirmPassword, ...registerData } = formData;
    const result = await register(registerData);

    if (result.success) {
      setSuccess('Registration successful! Redirecting...');
      setTimeout(() => {
        navigate('/student/dashboard');
      }, 1500);
    } else {
      setError(result.message || 'Registration failed');
    }

    setLoading(false);
  };

  const uniqueCourses = [...new Set(availableCourses.map(c => c.name))];
  const sectionsForCourse = availableCourses
    .filter(c => c.name === selectedCourse.course)
    .map(c => c.section);

  return (
    <div className="register-container">
      <div className="register-card">
        <h1>Student Registration</h1>
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              name="name"
              className="form-control"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Enrollment Number</label>
            <input
              type="text"
              name="enrollmentNumber"
              className="form-control"
              value={formData.enrollmentNumber}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              className="form-control"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              className="form-control"
              value={formData.password}
              onChange={handleChange}
              minLength="6"
              required
            />
          </div>
          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              className="form-control"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Select Courses</label>
            <div className="course-selector">
              <select
                className="form-control"
                value={selectedCourse.course}
                onChange={(e) => setSelectedCourse({ ...selectedCourse, course: e.target.value, section: '' })}
              >
                <option value="">Select Course</option>
                {uniqueCourses.map(course => (
                  <option key={course} value={course}>{course}</option>
                ))}
              </select>
              {selectedCourse.course && (
                <select
                  className="form-control"
                  value={selectedCourse.section}
                  onChange={(e) => setSelectedCourse({ ...selectedCourse, section: e.target.value })}
                >
                  <option value="">Select Section</option>
                  {sectionsForCourse.map(section => (
                    <option key={section} value={section}>{section}</option>
                  ))}
                </select>
              )}
              <button type="button" onClick={handleAddCourse} className="btn btn-secondary">
                Add Course
              </button>
            </div>
            {formData.courses.length > 0 && (
              <div className="selected-courses">
                {formData.courses.map((course, index) => (
                  <span key={index} className="course-tag">
                    {course.course} - {course.section}
                    <button
                      type="button"
                      onClick={() => handleRemoveCourse(index)}
                      className="remove-course"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
        <p className="register-footer">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default StudentRegister;

