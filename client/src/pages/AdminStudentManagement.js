import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import './AdminStudentManagement.css';

const AdminStudentManagement = () => {
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    enrollmentNumber: '',
    email: '',
    password: '',
    courses: []
  });
  const [editCourseData, setEditCourseData] = useState({
    courses: []
  });
  const [selectedCourse, setSelectedCourse] = useState({ course: '', section: '' });
  const [editSelectedCourse, setEditSelectedCourse] = useState({ course: '', section: '' });
  const [filterCourse, setFilterCourse] = useState('');
  const [filterSection, setFilterSection] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [studentsRes, coursesRes] = await Promise.all([
        api.get('/api/admin/students'),
        api.get('/api/admin/courses')
      ]);
      setStudents(studentsRes.data);
      setCourses(coursesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
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
      }
    }
  };

  const handleRemoveCourse = (index) => {
    setFormData({
      ...formData,
      courses: formData.courses.filter((_, i) => i !== index)
    });
  };

  const handleEditStudent = (student) => {
    setEditingStudent(student._id);
    setEditCourseData({ courses: [...student.courses] });
    setEditSelectedCourse({ course: '', section: '' });
    setError('');
    setSuccess('');
  };

  const handleCancelEdit = () => {
    setEditingStudent(null);
    setEditCourseData({ courses: [] });
    setEditSelectedCourse({ course: '', section: '' });
  };

  const handleAddEditCourse = () => {
    if (editSelectedCourse.course && editSelectedCourse.section) {
      const exists = editCourseData.courses.some(
        c => c.course === editSelectedCourse.course && c.section === editSelectedCourse.section
      );
      if (!exists) {
        setEditCourseData({
          courses: [...editCourseData.courses, { ...editSelectedCourse }]
        });
        setEditSelectedCourse({ course: '', section: '' });
      } else {
        setError('Course already added');
      }
    }
  };

  const handleRemoveEditCourse = (index) => {
    setEditCourseData({
      courses: editCourseData.courses.filter((_, i) => i !== index)
    });
  };

  const handleUpdateStudentCourses = async (studentId) => {
    try {
      setError('');
      setSuccess('');
      await api.patch(`/api/admin/students/${studentId}/courses`, {
        courses: editCourseData.courses
      });
      setSuccess('Student courses updated successfully!');
      setEditingStudent(null);
      setEditCourseData({ courses: [] });
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update student courses');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.courses.length === 0) {
      setError('Please select at least one course');
      return;
    }

    try {
      await api.post('/api/admin/register-student', formData);
      setSuccess('Student registered successfully!');
      setFormData({
        name: '',
        enrollmentNumber: '',
        email: '',
        password: '',
        courses: []
      });
      setShowForm(false);
      fetchData();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to register student');
    }
  };

  const uniqueCourses = [...new Set(courses.map(c => c.name))];
  const sectionsForCourse = courses
    .filter(c => c.name === selectedCourse.course)
    .map(c => c.section);

  const filterSectionsForCourse = courses
    .filter(c => c.name === filterCourse)
    .map(c => c.section);

  // Filter students based on selected course and section
  const filteredStudents = students.filter(student => {
    if (!filterCourse && !filterSection) {
      return true; // Show all if no filter
    }

    // Check if student has the filtered course-section
    return student.courses.some(course => {
      const courseMatch = !filterCourse || course.course === filterCourse;
      const sectionMatch = !filterSection || course.section === filterSection;
      return courseMatch && sectionMatch;
    });
  });

  const handleClearFilter = () => {
    setFilterCourse('');
    setFilterSection('');
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1>Student Management</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
          {showForm ? 'Cancel' : 'Register New Student'}
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h2>Register New Student</h2>
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-row">
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
            </div>
            <div className="form-row">
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
            <button type="submit" className="btn btn-primary">
              Register Student
            </button>
          </form>
        </div>
      )}

      <div className="card">
        <div className="card-header-with-filter">
          <h2>All Students ({filteredStudents.length} of {students.length})</h2>
        </div>
        
        <div className="filter-section">
          <div className="filter-controls">
            <div className="filter-group">
              <label>Filter by Course</label>
              <select
                className="form-control filter-select"
                value={filterCourse}
                onChange={(e) => {
                  setFilterCourse(e.target.value);
                  setFilterSection(''); // Reset section when course changes
                }}
              >
                <option value="">All Courses</option>
                {uniqueCourses.map(course => (
                  <option key={course} value={course}>{course}</option>
                ))}
              </select>
            </div>
            {filterCourse && (
              <div className="filter-group">
                <label>Filter by Section</label>
                <select
                  className="form-control filter-select"
                  value={filterSection}
                  onChange={(e) => setFilterSection(e.target.value)}
                >
                  <option value="">All Sections</option>
                  {filterSectionsForCourse.map(section => (
                    <option key={section} value={section}>{section}</option>
                  ))}
                </select>
              </div>
            )}
            {(filterCourse || filterSection) && (
              <div className="filter-group">
                <button
                  onClick={handleClearFilter}
                  className="btn btn-secondary filter-clear-btn"
                >
                  Clear Filter
                </button>
              </div>
            )}
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        
        {filteredStudents.length === 0 ? (
          <div className="no-data">
            {filterCourse || filterSection 
              ? 'No students found matching the selected filter.' 
              : 'No students found.'}
          </div>
        ) : (
          <div className="students-table">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Enrollment Number</th>
                <th>Email</th>
                <th>Courses</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map(student => (
                <React.Fragment key={student._id}>
                  <tr>
                    <td>{student.name}</td>
                    <td>{student.enrollmentNumber}</td>
                    <td>{student.email}</td>
                    <td>
                      {student.courses.map((c, i) => (
                        <span key={i} className="course-badge">
                          {c.course} - {c.section}
                        </span>
                      ))}
                    </td>
                    <td>
                      <button
                        onClick={() => handleEditStudent(student)}
                        className="btn btn-secondary btn-sm"
                      >
                        Edit Courses
                      </button>
                    </td>
                  </tr>
                  {editingStudent === student._id && (
                    <tr className="edit-row">
                      <td colSpan="5">
                        <div className="edit-courses-panel">
                          <h3>Edit Courses for {student.name}</h3>
                          <div className="course-selector">
                            <select
                              className="form-control"
                              value={editSelectedCourse.course}
                              onChange={(e) => setEditSelectedCourse({ ...editSelectedCourse, course: e.target.value, section: '' })}
                            >
                              <option value="">Select Course</option>
                              {uniqueCourses.map(course => (
                                <option key={course} value={course}>{course}</option>
                              ))}
                            </select>
                            {editSelectedCourse.course && (
                              <select
                                className="form-control"
                                value={editSelectedCourse.section}
                                onChange={(e) => setEditSelectedCourse({ ...editSelectedCourse, section: e.target.value })}
                              >
                                <option value="">Select Section</option>
                                {courses
                                  .filter(c => c.name === editSelectedCourse.course)
                                  .map(c => c.section)
                                  .map(section => (
                                    <option key={section} value={section}>{section}</option>
                                  ))}
                              </select>
                            )}
                            <button type="button" onClick={handleAddEditCourse} className="btn btn-secondary">
                              Add Course
                            </button>
                          </div>
                          {editCourseData.courses.length > 0 && (
                            <div className="selected-courses">
                              {editCourseData.courses.map((course, index) => (
                                <span key={index} className="course-tag">
                                  {course.course} - {course.section}
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveEditCourse(index)}
                                    className="remove-course"
                                  >
                                    ×
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}
                          <div className="edit-actions">
                            <button
                              onClick={() => handleUpdateStudentCourses(student._id)}
                              className="btn btn-primary"
                            >
                              Save Changes
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="btn btn-secondary"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </div>
    </div>
  );
};

export default AdminStudentManagement;

