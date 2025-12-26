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
  const [courseSearchTerm, setCourseSearchTerm] = useState('');
  const [tempSelectedCourseNames, setTempSelectedCourseNames] = useState([]);
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
  const [useManualCoordinates, setUseManualCoordinates] = useState(false);
  const [manualLatitude, setManualLatitude] = useState('');
  const [manualLongitude, setManualLongitude] = useState('');
  const [editUseManualCoordinates, setEditUseManualCoordinates] = useState(false);
  const [editManualLatitude, setEditManualLatitude] = useState('');
  const [editManualLongitude, setEditManualLongitude] = useState('');
  const [blockedStudentsCarouselIndex, setBlockedStudentsCarouselIndex] = useState({});
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [blockedStudentsSearch, setBlockedStudentsSearch] = useState('');

  useEffect(() => {
    fetchData();
    getCurrentLocation();
    fetchStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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
    // Update manual input fields when map is clicked
    setManualLatitude(location[0].toFixed(6));
    setManualLongitude(location[1].toFixed(6));
  };

  const handleManualCoordinateChange = (type, value) => {
    const numValue = parseFloat(value);
    if (type === 'latitude') {
      setManualLatitude(value);
      if (!isNaN(numValue) && numValue >= -90 && numValue <= 90) {
        setFormData({
          ...formData,
          location: {
            ...formData.location,
            latitude: numValue
          }
        });
        setMapLocation([numValue, formData.location.longitude || 0]);
      }
    } else if (type === 'longitude') {
      setManualLongitude(value);
      if (!isNaN(numValue) && numValue >= -180 && numValue <= 180) {
        setFormData({
          ...formData,
          location: {
            ...formData.location,
            longitude: numValue
          }
        });
        setMapLocation([formData.location.latitude || 0, numValue]);
      }
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const toggleCourseNameSelection = (courseName) => {
    const isSelected = tempSelectedCourseNames.includes(courseName);
    let newCourseNames;
    if (isSelected) {
      newCourseNames = tempSelectedCourseNames.filter(name => name !== courseName);
      // Also remove all sections of this course from final selection
      setFormData(prev => ({
        ...prev,
        courses: prev.courses.filter(c => c.course !== courseName)
      }));
    } else {
      newCourseNames = [...tempSelectedCourseNames, courseName];
    }
    setTempSelectedCourseNames(newCourseNames);
  };

  const toggleSectionDirect = (courseName, sectionName) => {
    const isSelected = formData.courses.some(
      c => c.course === courseName && c.section === sectionName
    );

    let newCourses;
    if (isSelected) {
      newCourses = formData.courses.filter(
        c => !(c.course === courseName && c.section === sectionName)
      );
    } else {
      newCourses = [...formData.courses, { course: courseName, section: sectionName }];
    }

    setFormData({ ...formData, courses: newCourses });
  };

  const toggleCourseDirect = (courseName, allSections) => {
    const selectedSectionsOfCourse = formData.courses
      .filter(c => c.course === courseName)
      .map(c => c.section);

    const isAllSelected = allSections.length > 0 &&
      allSections.every(s => selectedSectionsOfCourse.includes(s));

    let newCourses;
    if (isAllSelected) {
      // Remove all sections of this course
      newCourses = formData.courses.filter(c => c.course !== courseName);
    } else {
      // Add all sections of this course (avoid duplicates)
      const otherCourses = formData.courses.filter(c => c.course !== courseName);
      const addedSections = allSections.map(s => ({ course: courseName, section: s }));
      newCourses = [...otherCourses, ...addedSections];
    }

    setFormData({ ...formData, courses: newCourses });
  };

  const isSectionSelected = (courseName, sectionName) => {
    return formData.courses.some(c => c.course === courseName && c.section === sectionName);
  };

  const isCourseFullySelected = (courseName, allSections) => {
    if (allSections.length === 0) return false;
    const selectedSectionsOfCourse = formData.courses
      .filter(c => c.course === courseName)
      .map(c => c.section);
    return allSections.every(s => selectedSectionsOfCourse.includes(s));
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
      setError('Please select a location on the map or enter coordinates manually');
      return;
    }

    // Validate coordinates
    if (formData.location.latitude < -90 || formData.location.latitude > 90) {
      setError('Latitude must be between -90 and 90');
      return;
    }
    if (formData.location.longitude < -180 || formData.location.longitude > 180) {
      setError('Longitude must be between -180 and 180');
      return;
    }

    try {
      setGlobalError('');
      setGlobalSuccess('');
      const payload = {
        ...formData,
        startTime: startImmediately ? null : new Date(formData.startTime).toISOString()
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
      setMapLocation(null);
      setManualLatitude('');
      setManualLongitude('');
      setUseManualCoordinates(false);
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
    setEditManualLatitude(session.location.latitude.toFixed(6));
    setEditManualLongitude(session.location.longitude.toFixed(6));
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
    setEditManualLatitude('');
    setEditManualLongitude('');
    setEditUseManualCoordinates(false);
    setBlockedStudentsSearch('');
  };

  const handleEditMapClick = (e) => {
    const { lat, lng } = e.latlng;
    setEditMapLocation([lat, lng]);
    setEditFormData({
      ...editFormData,
      location: { latitude: lat, longitude: lng }
    });
    // Update manual input fields when map is clicked
    setEditManualLatitude(lat.toFixed(6));
    setEditManualLongitude(lng.toFixed(6));
  };

  const handleEditManualCoordinateChange = (type, value) => {
    const numValue = parseFloat(value);
    if (type === 'latitude') {
      setEditManualLatitude(value);
      if (!isNaN(numValue) && numValue >= -90 && numValue <= 90) {
        setEditFormData({
          ...editFormData,
          location: {
            ...editFormData.location,
            latitude: numValue
          }
        });
        setEditMapLocation([numValue, editFormData.location.longitude || 0]);
      }
    } else if (type === 'longitude') {
      setEditManualLongitude(value);
      if (!isNaN(numValue) && numValue >= -180 && numValue <= 180) {
        setEditFormData({
          ...editFormData,
          location: {
            ...editFormData.location,
            longitude: numValue
          }
        });
        setEditMapLocation([editFormData.location.latitude || 0, numValue]);
      }
    }
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
        updateData.startTime = new Date(editFormData.startTime).toISOString();
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
              <label>Select Courses & Sections</label>
              <div className="course-multi-selector">
                {/* Step 1: Course Selection */}
                <div className="selection-step">
                  <div className="step-header">
                    <span className="step-badge">1</span>
                    <label>Select Courses</label>
                  </div>
                  <div className="search-bar-wrapper">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search courses..."
                      value={courseSearchTerm}
                      onChange={(e) => setCourseSearchTerm(e.target.value)}
                    />
                    {courseSearchTerm && (
                      <button
                        type="button"
                        className="clear-search"
                        onClick={() => setCourseSearchTerm('')}
                      >
                        ×
                      </button>
                    )}
                  </div>
                  <div className="course-names-grid">
                    {uniqueCourses
                      .filter(name => name.toLowerCase().includes(courseSearchTerm.toLowerCase()))
                      .map(name => (
                        <label key={name} className={`course-name-label ${tempSelectedCourseNames.includes(name) ? 'active' : ''}`}>
                          <input
                            type="checkbox"
                            checked={tempSelectedCourseNames.includes(name)}
                            onChange={() => toggleCourseNameSelection(name)}
                          />
                          <span>{name}</span>
                        </label>
                      ))}
                  </div>
                </div>

                {/* Step 2: Section Selection */}
                {tempSelectedCourseNames.length > 0 && (
                  <div className="selection-step section-step-container">
                    <div className="step-header">
                      <span className="step-badge">2</span>
                      <label>Select Sections</label>
                    </div>
                    <div className="grouped-sections-list">
                      {tempSelectedCourseNames.map(courseName => {
                        const sectionsForThisCourse = courses
                          .filter(c => c.name === courseName)
                          .map(c => c.section);

                        const isFullySelected = isCourseFullySelected(courseName, sectionsForThisCourse);

                        return (
                          <div key={courseName} className="course-section-group">
                            <div className="course-group-header">
                              <label className="course-group-title">
                                <input
                                  type="checkbox"
                                  checked={isFullySelected}
                                  onChange={() => toggleCourseDirect(courseName, sectionsForThisCourse)}
                                />
                                <span>{courseName}</span>
                              </label>
                              <span className="section-count">
                                ({sectionsForThisCourse.length} sections)
                              </span>
                            </div>
                            <div className="course-group-sections">
                              {sectionsForThisCourse.map(section => (
                                <label key={section} className="section-checkbox-label">
                                  <input
                                    type="checkbox"
                                    checked={isSectionSelected(courseName, section)}
                                    onChange={() => toggleSectionDirect(courseName, section)}
                                  />
                                  <span>{section}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
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
              <label>Location</label>
              <div style={{ marginBottom: '12px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'normal' }}>
                  <input
                    type="radio"
                    name="locationMethod"
                    checked={!useManualCoordinates}
                    onChange={() => {
                      setUseManualCoordinates(false);
                      if (formData.location.latitude && formData.location.longitude) {
                        setMapLocation([formData.location.latitude, formData.location.longitude]);
                      }
                    }}
                  />
                  <span>Select on Map</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'normal' }}>
                  <input
                    type="radio"
                    name="locationMethod"
                    checked={useManualCoordinates}
                    onChange={() => {
                      setUseManualCoordinates(true);
                      if (formData.location.latitude && formData.location.longitude) {
                        setManualLatitude(formData.location.latitude.toFixed(6));
                        setManualLongitude(formData.location.longitude.toFixed(6));
                      }
                    }}
                  />
                  <span>Enter Coordinates Manually</span>
                </label>
              </div>

              {!useManualCoordinates ? (
                <>
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
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: '600' }}>
                        Latitude (-90 to 90)
                      </label>
                      <input
                        type="number"
                        step="any"
                        className="form-control"
                        placeholder="e.g., 28.6139"
                        value={manualLatitude}
                        onChange={(e) => handleManualCoordinateChange('latitude', e.target.value)}
                        min="-90"
                        max="90"
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: '600' }}>
                        Longitude (-180 to 180)
                      </label>
                      <input
                        type="number"
                        step="any"
                        className="form-control"
                        placeholder="e.g., 77.2090"
                        value={manualLongitude}
                        onChange={(e) => handleManualCoordinateChange('longitude', e.target.value)}
                        min="-180"
                        max="180"
                      />
                    </div>
                  </div>
                  {formData.location.latitude && formData.location.longitude && (
                    <p className="location-info">
                      Coordinates: {formData.location.latitude.toFixed(6)}, {formData.location.longitude.toFixed(6)}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      if (formData.location.latitude && formData.location.longitude) {
                        setMapLocation([formData.location.latitude, formData.location.longitude]);
                        setUseManualCoordinates(false);
                      }
                    }}
                    className="btn btn-secondary"
                    disabled={!formData.location.latitude || !formData.location.longitude}
                  >
                    View on Map
                  </button>
                </div>
              )}
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
                  {session.blockedStudents && session.blockedStudents.length > 0 && (() => {
                    const currentIndex = blockedStudentsCarouselIndex[session._id] || 0;
                    const studentsPerView = windowWidth <= 768 ? 1 : 2;
                    const maxIndex = Math.max(0, session.blockedStudents.length - studentsPerView);
                    const canGoLeft = currentIndex > 0;
                    const canGoRight = currentIndex < maxIndex;

                    return (
                      <div className="blocked-students-info">
                        <strong>Blocked Students ({session.blockedStudents.length}):</strong>
                        <div className="blocked-students-carousel">
                          <button
                            className="carousel-arrow carousel-arrow-left"
                            onClick={() => {
                              setBlockedStudentsCarouselIndex({
                                ...blockedStudentsCarouselIndex,
                                [session._id]: Math.max(0, currentIndex - 1)
                              });
                            }}
                            disabled={!canGoLeft}
                            aria-label="Previous students"
                          >
                            ‹
                          </button>
                          <div className="blocked-students-list">
                            {session.blockedStudents
                              .slice(currentIndex, currentIndex + studentsPerView)
                              .map(student => (
                                <span key={student._id || student} className="blocked-student-tag">
                                  {typeof student === 'object' ? `${student.name} (${student.enrollmentNumber})` : 'Loading...'}
                                </span>
                              ))}
                          </div>
                          <button
                            className="carousel-arrow carousel-arrow-right"
                            onClick={() => {
                              setBlockedStudentsCarouselIndex({
                                ...blockedStudentsCarouselIndex,
                                [session._id]: Math.min(maxIndex, currentIndex + 1)
                              });
                            }}
                            disabled={!canGoRight}
                            aria-label="Next students"
                          >
                            ›
                          </button>
                        </div>
                      </div>
                    );
                  })()}
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
                <label>Location</label>
                <div style={{ marginBottom: '12px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'normal' }}>
                    <input
                      type="radio"
                      name="editLocationMethod"
                      checked={!editUseManualCoordinates}
                      onChange={() => {
                        setEditUseManualCoordinates(false);
                        if (editFormData.location.latitude && editFormData.location.longitude) {
                          setEditMapLocation([editFormData.location.latitude, editFormData.location.longitude]);
                        }
                      }}
                    />
                    <span>Select on Map</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'normal' }}>
                    <input
                      type="radio"
                      name="editLocationMethod"
                      checked={editUseManualCoordinates}
                      onChange={() => {
                        setEditUseManualCoordinates(true);
                        if (editFormData.location.latitude && editFormData.location.longitude) {
                          setEditManualLatitude(editFormData.location.latitude.toFixed(6));
                          setEditManualLongitude(editFormData.location.longitude.toFixed(6));
                        }
                      }}
                    />
                    <span>Enter Coordinates Manually</span>
                  </label>
                </div>

                {!editUseManualCoordinates ? (
                  <>
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
                  </>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: '600' }}>
                          Latitude (-90 to 90)
                        </label>
                        <input
                          type="number"
                          step="any"
                          className="form-control"
                          placeholder="e.g., 28.6139"
                          value={editManualLatitude}
                          onChange={(e) => handleEditManualCoordinateChange('latitude', e.target.value)}
                          min="-90"
                          max="90"
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: '600' }}>
                          Longitude (-180 to 180)
                        </label>
                        <input
                          type="number"
                          step="any"
                          className="form-control"
                          placeholder="e.g., 77.2090"
                          value={editManualLongitude}
                          onChange={(e) => handleEditManualCoordinateChange('longitude', e.target.value)}
                          min="-180"
                          max="180"
                        />
                      </div>
                    </div>
                    {editFormData.location.latitude && editFormData.location.longitude && (
                      <p className="location-info">
                        Coordinates: {editFormData.location.latitude.toFixed(6)}, {editFormData.location.longitude.toFixed(6)}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        if (editFormData.location.latitude && editFormData.location.longitude) {
                          setEditMapLocation([editFormData.location.latitude, editFormData.location.longitude]);
                          setEditUseManualCoordinates(false);
                        }
                      }}
                      className="btn btn-secondary"
                      disabled={!editFormData.location.latitude || !editFormData.location.longitude}
                    >
                      View on Map
                    </button>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Block Students from Attendance</label>
                <div style={{ marginBottom: '12px' }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search by name or enrollment number..."
                    value={blockedStudentsSearch}
                    onChange={(e) => setBlockedStudentsSearch(e.target.value)}
                    style={{ marginBottom: 0 }}
                  />
                </div>
                <div className="blocked-students-selector">
                  {(() => {
                    const enrolledStudents = students.filter(student => {
                      // Only show students enrolled in session courses
                      return editFormData.courses.some(sessionCourse => {
                        return student.courses.some(userCourse => {
                          return userCourse.course === sessionCourse.course &&
                            userCourse.section === sessionCourse.section;
                        });
                      });
                    });

                    const filteredStudents = enrolledStudents.filter(student => {
                      if (!blockedStudentsSearch.trim()) return true;
                      const searchTerm = blockedStudentsSearch.toLowerCase().trim();
                      return (
                        student.name.toLowerCase().includes(searchTerm) ||
                        student.enrollmentNumber.toLowerCase().includes(searchTerm)
                      );
                    });

                    if (enrolledStudents.length === 0) {
                      return <p className="no-students-message">No students enrolled in selected courses</p>;
                    }

                    if (filteredStudents.length === 0) {
                      return <p className="no-students-message">No students found matching "{blockedStudentsSearch}"</p>;
                    }

                    return filteredStudents.map(student => (
                      <label key={student._id} className="student-checkbox-label">
                        <input
                          type="checkbox"
                          checked={editFormData.blockedStudents.includes(student._id)}
                          onChange={() => toggleBlockedStudent(student._id)}
                        />
                        <span>{student.name} ({student.enrollmentNumber})</span>
                      </label>
                    ));
                  })()}
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
