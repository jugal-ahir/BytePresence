import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import api from '../utils/api';
import 'leaflet/dist/leaflet.css';
import './AdminSessionManagement.css';

// Fix for default marker icons in Leaflet with React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const AdminSessionManagement = () => {
  const [sessions, setSessions] = useState([]);
  const [courses, setCourses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    courses: [],
    startTime: '',
    duration: 30,
    location: { latitude: null, longitude: null }
  });
  const [selectedCourse, setSelectedCourse] = useState({ course: '', section: '' });
  const [mapLocation, setMapLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [startImmediately, setStartImmediately] = useState(true);
  const [globalError, setGlobalError] = useState('');
  const [globalSuccess, setGlobalSuccess] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const sessionsPerPage = 6;
  const [editingSession, setEditingSession] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [students, setStudents] = useState([]);
  const [editFormData, setEditFormData] = useState({
    title: '',
    courses: [],
    startTime: '',
    duration: 30,
    location: { latitude: null, longitude: null },
    blockedStudents: []
  });
  const [editMapLocation, setEditMapLocation] = useState(null);

  useEffect(() => {
    fetchData();
    getCurrentLocation();
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await api.get('/api/admin/students');
      setStudents(response.data);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchData = async () => {
    try {
      const [sessionsRes, coursesRes] = await Promise.all([
        api.get('/api/sessions/admin'),
        api.get('/api/admin/courses')
      ]);
      setSessions(sessionsRes.data);
      setCourses(coursesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = [position.coords.latitude, position.coords.longitude];
          setMapLocation(location);
          setFormData({
            ...formData,
            location: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            }
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  const handleMapClick = (e) => {
    const location = [e.latlng.lat, e.latlng.lng];
    setMapLocation(location);
    setFormData({
      ...formData,
      location: {
        latitude: location[0],
        longitude: location[1]
      }
    });
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.courses.length === 0) {
      setError('Please select at least one course');
      return;
    }

    if (!formData.location.latitude || !formData.location.longitude) {
      setError('Please select a location on the map');
      return;
    }

    try {
      setGlobalError('');
      setGlobalSuccess('');
      const payload = {
        ...formData,
        startTime: startImmediately ? null : formData.startTime
      };
      await api.post('/api/sessions', payload);
      setSuccess('Session created successfully!');
      setFormData({
        title: '',
        courses: [],
        startTime: '',
        duration: 30,
        location: { latitude: null, longitude: null }
      });
      setShowForm(false);
      setStartImmediately(true);
      fetchData();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create session');
    }
  };

  const handleDownloadReport = async (sessionId) => {
    try {
      const response = await api.get(`/api/sessions/${sessionId}/report`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attendance-report-${sessionId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert('Error downloading report');
    }
  };

  const handleCloseSession = async (sessionId) => {
    if (!window.confirm('Are you sure you want to close this session? Students will no longer be able to mark attendance.')) {
      return;
    }

    try {
      setGlobalError('');
      setGlobalSuccess('');
      await api.patch(`/api/sessions/${sessionId}/close`);
      setGlobalSuccess('Session closed successfully!');
      fetchData();
      setTimeout(() => setGlobalSuccess(''), 3000);
    } catch (error) {
      setGlobalError(error.response?.data?.message || 'Failed to close session');
      setTimeout(() => setGlobalError(''), 5000);
    }
  };

  const handleDeleteSession = async (sessionId) => {
    if (!window.confirm('Are you sure you want to delete this session? This will also delete all attendance records for this session. This action cannot be undone.')) {
      return;
    }

    try {
      setGlobalError('');
      setGlobalSuccess('');
      await api.delete(`/api/sessions/${sessionId}`);
      setGlobalSuccess('Session deleted successfully!');
      fetchData();
      // Reset to first page if current page becomes empty
      const totalPages = Math.ceil((sessions.length - 1) / sessionsPerPage);
      if (currentPage > totalPages && totalPages > 0) {
        setCurrentPage(totalPages);
      }
      setTimeout(() => setGlobalSuccess(''), 3000);
    } catch (error) {
      setGlobalError(error.response?.data?.message || 'Failed to delete session');
      setTimeout(() => setGlobalError(''), 5000);
    }
  };

  // Helper function to convert Date to local datetime string for datetime-local input
  const formatDateForInput = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleEditSession = (session) => {
    if (session.status === 'ended') {
      setGlobalError('Cannot edit ended sessions');
      setTimeout(() => setGlobalError(''), 3000);
      return;
    }

    setEditingSession(session);
    setEditFormData({
      title: session.title,
      courses: session.courses,
      startTime: session.status === 'scheduled' ? formatDateForInput(session.startTime) : '',
      duration: session.duration,
      location: session.location,
      blockedStudents: session.blockedStudents ? session.blockedStudents.map(s => s._id || s) : []
    });
    setEditMapLocation([session.location.latitude, session.location.longitude]);
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingSession(null);
    setEditFormData({
      title: '',
      courses: [],
      startTime: '',
      duration: 30,
      location: { latitude: null, longitude: null },
      blockedStudents: []
    });
    setEditMapLocation(null);
  };

  const handleEditMapClick = (e) => {
    const { lat, lng } = e.latlng;
    setEditMapLocation([lat, lng]);
    setEditFormData({
      ...editFormData,
      location: { latitude: lat, longitude: lng }
    });
  };

  const handleUpdateSession = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');

      const updateData = {
        title: editFormData.title,
        courses: editFormData.courses,
        duration: editFormData.duration,
        location: editFormData.location,
        blockedStudents: editFormData.blockedStudents
      };

      if (editingSession.status === 'scheduled' && editFormData.startTime) {
        updateData.startTime = editFormData.startTime;
      }

      await api.patch(`/api/sessions/${editingSession._id}`, updateData);
      setSuccess('Session updated successfully!');
      fetchData();
      handleCloseEditModal();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update session');
      setTimeout(() => setError(''), 5000);
    }
  };

  const toggleBlockedStudent = (studentId) => {
    setEditFormData({
      ...editFormData,
      blockedStudents: editFormData.blockedStudents.includes(studentId)
        ? editFormData.blockedStudents.filter(id => id !== studentId)
        : [...editFormData.blockedStudents, studentId]
    });
  };

  const uniqueCourses = [...new Set(courses.map(c => c.name))];
  const sectionsForCourse = courses
    .filter(c => c.name === selectedCourse.course)
    .map(c => c.section);

  // Pagination logic
  const totalPages = Math.ceil(sessions.length / sessionsPerPage);
  const startIndex = (currentPage - 1) * sessionsPerPage;
  const endIndex = startIndex + sessionsPerPage;
  const currentSessions = sessions.slice(startIndex, endIndex);

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  const defaultCenter = mapLocation || [28.6139, 77.2090]; // Default to Delhi if no location

  return (
    <div className="container">
      <div className="page-header">
        <h1>Session Management</h1>
        <div>
          <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
            {showForm ? 'Cancel' : 'Create New Session'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="card">
          <h2>Create Attendance Session</h2>
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Session Title</label>
              <input
                type="text"
                name="title"
                className="form-control"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Start Option</label>
              <div className="radio-group">
                <label>
                  <input
                    type="radio"
                    checked={startImmediately}
                    onChange={() => setStartImmediately(true)}
                  />
                  Start Immediately
                </label>
                <label>
                  <input
                    type="radio"
                    checked={!startImmediately}
                    onChange={() => setStartImmediately(false)}
                  />
                  Schedule for Later
                </label>
              </div>
            </div>

            {!startImmediately && (
              <div className="form-group">
                <label>Start Time</label>
                <input
                  type="datetime-local"
                  name="startTime"
                  className="form-control"
                  value={formData.startTime}
                  onChange={handleChange}
                  required={!startImmediately}
                />
              </div>
            )}

            <div className="form-group">
              <label>Duration (minutes)</label>
              <input
                type="number"
                name="duration"
                className="form-control"
                value={formData.duration}
                onChange={handleChange}
                min="1"
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

            <div className="form-group">
              <label>Select Location (Click on map)</label>
              <div className="leaflet-container-wrapper">
                <MapContainer
                  center={defaultCenter}
                  zoom={15}
                  style={{ height: '300px', width: '100%', borderRadius: '8px' }}
                  scrollWheelZoom={true}
                  eventHandlers={{
                    click: handleMapClick
                  }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {mapLocation && (
                    <Marker position={mapLocation}>
                      <Popup>Selected Location</Popup>
                    </Marker>
                  )}
                </MapContainer>
              </div>
              {formData.location.latitude && (
                <p className="location-info">
                  Selected: {formData.location.latitude.toFixed(6)}, {formData.location.longitude.toFixed(6)}
                </p>
              )}
              <button type="button" onClick={getCurrentLocation} className="btn btn-secondary" style={{ marginTop: '10px' }}>
                Use Current Location
              </button>
            </div>

            <button type="submit" className="btn btn-primary">
              Create Session
            </button>
          </form>
        </div>
      )}

      <div className="card">
        <div className="sessions-header">
          <h2>All Sessions ({sessions.length})</h2>
          {sessions.length > sessionsPerPage && (
            <div className="pagination-info">
              Page {currentPage} of {totalPages}
            </div>
          )}
        </div>
        {globalError && <div className="error-message">{globalError}</div>}
        {globalSuccess && <div className="success-message">{globalSuccess}</div>}
        {sessions.length === 0 ? (
          <div className="no-data">No sessions found. Create your first session above.</div>
        ) : (
          <>
            <div className="sessions-grid">
              {currentSessions.map(session => (
                <div key={session._id} className="session-card">
                  <div className="session-card-header">
                    <h3>{session.title}</h3>
                    <div className="session-card-actions">
                      {session.status !== 'ended' && (
                        <button
                          onClick={() => handleEditSession(session)}
                          className="edit-session-btn"
                          title="Edit Session"
                          aria-label="Edit session"
                        >
                          ✏️
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteSession(session._id)}
                        className="delete-session-btn"
                        title="Delete Session"
                        aria-label="Delete session"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  <p><strong>Status:</strong> 
                    <span className={`status-badge status-${session.status}`}>
                      {session.status}
                    </span>
                  </p>
                  <p><strong>Start:</strong> {new Date(session.startTime).toLocaleString()}</p>
                  <p><strong>End:</strong> {new Date(session.endTime).toLocaleString()}</p>
                  <p><strong>Duration:</strong> {session.duration} minutes</p>
                  <p><strong>Courses:</strong> {session.courses.map(c => `${c.course} - ${c.section}`).join(', ')}</p>
                  {session.blockedStudents && session.blockedStudents.length > 0 && (
                    <div className="blocked-students-info">
                      <strong>Blocked Students ({session.blockedStudents.length}):</strong>
                      <div className="blocked-students-list">
                        {session.blockedStudents.map(student => (
                          <span key={student._id || student} className="blocked-student-tag">
                            {typeof student === 'object' ? `${student.name} (${student.enrollmentNumber})` : 'Loading...'}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="session-actions">
                    {session.status === 'active' && (
                      <button
                        onClick={() => handleCloseSession(session._id)}
                        className="btn btn-danger"
                      >
                        Close Session
                      </button>
                    )}
                    {session.status === 'ended' && (
                      <button
                        onClick={() => handleDownloadReport(session._id)}
                        className="btn btn-success"
                      >
                        Download Report
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {sessions.length > sessionsPerPage && (
              <div className="pagination-controls">
                <button
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className="btn btn-secondary pagination-btn"
                >
                  ← Previous
                </button>
                <span className="pagination-page-info">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="btn btn-secondary pagination-btn"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Edit Session Modal */}
      {showEditModal && editingSession && (
        <div className="modal-overlay" onClick={handleCloseEditModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Session</h2>
              <button className="modal-close" onClick={handleCloseEditModal}>×</button>
            </div>
            <form onSubmit={handleUpdateSession}>
              <div className="form-group">
                <label>Session Title</label>
                <input
                  type="text"
                  className="form-control"
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  required
                />
              </div>

              {editingSession.status === 'scheduled' && (
                <div className="form-group">
                  <label>Start Time</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    value={editFormData.startTime}
                    onChange={(e) => setEditFormData({ ...editFormData, startTime: e.target.value })}
                    required
                  />
                </div>
              )}

              <div className="form-group">
                <label>Duration (minutes)</label>
                <input
                  type="number"
                  className="form-control"
                  value={editFormData.duration}
                  onChange={(e) => setEditFormData({ ...editFormData, duration: parseInt(e.target.value) })}
                  min="1"
                  required
                />
              </div>

              <div className="form-group">
                <label>Select Location (Click on map)</label>
                <div className="leaflet-container-wrapper">
                  <MapContainer
                    center={editMapLocation || [28.6139, 77.2090]}
                    zoom={15}
                    style={{ height: '300px', width: '100%', borderRadius: '8px' }}
                    scrollWheelZoom={true}
                    eventHandlers={{
                      click: handleEditMapClick
                    }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {editMapLocation && (
                      <Marker position={editMapLocation}>
                        <Popup>Selected Location</Popup>
                      </Marker>
                    )}
                  </MapContainer>
                </div>
                {editFormData.location.latitude && (
                  <p className="location-info">
                    Selected: {editFormData.location.latitude.toFixed(6)}, {editFormData.location.longitude.toFixed(6)}
                  </p>
                )}
              </div>

              <div className="form-group">
                <label>Block Students from Attendance</label>
                <div className="blocked-students-selector">
                  {students
                    .filter(student => {
                      // Only show students enrolled in session courses
                      return editFormData.courses.some(sessionCourse => {
                        return student.courses.some(userCourse => {
                          return userCourse.course === sessionCourse.course && 
                                 userCourse.section === sessionCourse.section;
                        });
                      });
                    })
                    .map(student => (
                      <label key={student._id} className="student-checkbox-label">
                        <input
                          type="checkbox"
                          checked={editFormData.blockedStudents.includes(student._id)}
                          onChange={() => toggleBlockedStudent(student._id)}
                        />
                        <span>{student.name} ({student.enrollmentNumber})</span>
                      </label>
                    ))}
                  {students.filter(student => {
                    return editFormData.courses.some(sessionCourse => {
                      return student.courses.some(userCourse => {
                        return userCourse.course === sessionCourse.course && 
                               userCourse.section === sessionCourse.section;
                      });
                    });
                  }).length === 0 && (
                    <p className="no-students-message">No students enrolled in selected courses</p>
                  )}
                </div>
              </div>

              {error && <div className="error-message">{error}</div>}
              {success && <div className="success-message">{success}</div>}

              <div className="modal-actions">
                <button type="button" onClick={handleCloseEditModal} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Update Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSessionManagement;
