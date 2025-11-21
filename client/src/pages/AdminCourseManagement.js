import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import './AdminCourseManagement.css';

const AdminCourseManagement = () => {
  const [courses, setCourses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    section: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await api.get('/api/admin/courses');
      setCourses(response.data);
    } catch (error) {
      console.error('Error fetching courses:', error);
      setError('Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.name.trim() || !formData.section.trim()) {
      setError('Both course name and section are required');
      return;
    }

    try {
      await api.post('/api/admin/courses', formData);
      setSuccess('Course created successfully!');
      setFormData({ name: '', section: '' });
      setShowForm(false);
      fetchCourses();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create course');
    }
  };

  const handleDelete = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course?')) {
      return;
    }

    try {
      await api.delete(`/api/admin/courses/${courseId}`);
      setSuccess('Course deleted successfully!');
      fetchCourses();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to delete course');
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  // Group courses by name
  const groupedCourses = courses.reduce((acc, course) => {
    if (!acc[course.name]) {
      acc[course.name] = [];
    }
    acc[course.name].push(course);
    return acc;
  }, {});

  return (
    <div className="container">
      <div className="page-header">
        <h1>Course Management</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
          {showForm ? 'Cancel' : 'Add New Course'}
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h2>Add New Course</h2>
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Course Name</label>
                <input
                  type="text"
                  name="name"
                  className="form-control"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., Computer Science"
                  required
                />
              </div>
              <div className="form-group">
                <label>Section</label>
                <input
                  type="text"
                  name="section"
                  className="form-control"
                  value={formData.section}
                  onChange={handleChange}
                  placeholder="e.g., A, B, C or 1, 2, 3"
                  required
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary">
              Create Course
            </button>
          </form>
        </div>
      )}

      <div className="card">
        <h2>All Courses ({courses.length})</h2>
        {courses.length === 0 ? (
          <p className="no-data">No courses found. Create your first course above.</p>
        ) : (
          <div className="courses-list">
            {Object.keys(groupedCourses).map(courseName => (
              <div key={courseName} className="course-group">
                <h3>{courseName}</h3>
                <div className="sections-list">
                  {groupedCourses[courseName].map(course => (
                    <div key={course._id} className="course-item">
                      <span className="section-badge">Section {course.section}</span>
                      <button
                        onClick={() => handleDelete(course._id)}
                        className="btn btn-danger btn-sm"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCourseManagement;

