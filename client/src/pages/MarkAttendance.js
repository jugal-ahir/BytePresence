import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Circle, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import 'leaflet/dist/leaflet.css';
import './MarkAttendance.css';

// Fix for default marker icons in Leaflet with React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom icon for user location
const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Custom icon for target location
const targetIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const MarkAttendance = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [session, setSession] = useState(null);
  const [enrollmentNumber, setEnrollmentNumber] = useState(user?.enrollmentNumber || '');
  const [userLocation, setUserLocation] = useState(null);
  const [distance, setDistance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [attendanceMarked, setAttendanceMarked] = useState(false);
  const [markedAt, setMarkedAt] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchSession();
    getCurrentLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const fetchSession = async () => {
    try {
      const response = await api.get(`/api/sessions/${sessionId}`);
      setSession(response.data);
      if (response.data.attendanceMarked) {
        setAttendanceMarked(true);
        setMarkedAt(response.data.markedAt);
      }
    } catch (error) {
      setError('Session not found');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation([location.lat, location.lng]);
          if (session) {
            calculateDistance(location, session.location);
          }
        },
        (error) => {
          setError('Unable to get your location. Please enable location services.');
        }
      );
    } else {
      setError('Geolocation is not supported by your browser.');
    }
  };

  useEffect(() => {
    if (session && userLocation) {
      calculateDistance({ lat: userLocation[0], lng: userLocation[1] }, session.location);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, userLocation]);

  const calculateDistance = (userLoc, targetLoc) => {
    const R = 6371000; // Earth's radius in meters
    const dLat = toRad(targetLoc.latitude - userLoc.lat);
    const dLon = toRad(targetLoc.longitude - userLoc.lng);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(userLoc.lat)) * Math.cos(toRad(targetLoc.latitude)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const calculatedDistance = R * c;
    setDistance(calculatedDistance);
  };

  const toRad = (degrees) => degrees * (Math.PI / 180);

  const handleMarkAttendance = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setMarking(true);

    if (!userLocation) {
      setError('Please allow location access to mark attendance');
      setMarking(false);
      return;
    }

    try {
      await api.post(`/api/sessions/${sessionId}/mark`, {
        enrollmentNumber,
        location: {
          latitude: userLocation[0],
          longitude: userLocation[1]
        }
      });

      setSuccess('Attendance marked successfully!');
      setAttendanceMarked(true);
      setMarkedAt(new Date());
      // Don't navigate immediately, let user see the success message
      setTimeout(() => {
        navigate('/student/dashboard');
      }, 3000);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to mark attendance');
    } finally {
      setMarking(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!session) {
    return <div className="container"><div className="error-message">Session not found</div></div>;
  }

  const now = new Date();
  const isActive = session.status === 'active' && 
                   now >= new Date(session.startTime) && 
                   now <= new Date(session.endTime);
  const isWithinRadius = distance !== null && distance <= (session.location.radius || 10);

  const center = [session.location.latitude, session.location.longitude];

  return (
    <div className="container">
      <div className="mark-attendance-header">
        <h1>Mark Attendance</h1>
        <button onClick={() => navigate('/student/dashboard')} className="btn btn-secondary">
          Back to Dashboard
        </button>
      </div>

      <div className="card">
        <h2>{session.title}</h2>
        <p><strong>Time:</strong> {new Date(session.startTime).toLocaleString()} - {new Date(session.endTime).toLocaleString()}</p>
        <p><strong>Status:</strong> 
          <span className={`status-badge status-${session.status}`}>
            {session.status}
          </span>
        </p>
        {distance !== null && (
          <p><strong>Distance from location:</strong> {distance.toFixed(2)} meters</p>
        )}
      </div>

      <div className="card">
        <h2>Location Map</h2>
        <p className="map-info">
          The red circle shows the allowed {session.location.radius || 10}-meter radius. You must be within this area to mark attendance.
        </p>
        <div className="leaflet-container-wrapper">
          <MapContainer
            center={center}
            zoom={18}
            style={{ height: '400px', width: '100%', borderRadius: '8px' }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Circle
              center={center}
              radius={session.location.radius || 10}
              pathOptions={{
                fillColor: '#ff0000',
                fillOpacity: 0.2,
                color: '#ff0000',
                weight: 2,
                opacity: 0.8
              }}
            />
            <Marker position={center} icon={targetIcon}>
              <Popup>Target Location</Popup>
            </Marker>
            {userLocation && (
              <Marker position={userLocation} icon={userIcon}>
                <Popup>Your Location</Popup>
              </Marker>
            )}
          </MapContainer>
        </div>
      </div>

      <div className="card">
        <h2>Mark Your Attendance</h2>
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        
        {attendanceMarked && (
          <div className="attendance-already-marked">
            <div className="marked-badge">
              <span className="check-icon">✓</span>
              <div>
                <strong>Attendance Already Marked</strong>
                {markedAt && (
                  <p>Marked on: {new Date(markedAt).toLocaleString()}</p>
                )}
              </div>
            </div>
            <p className="marked-message">
              You have already marked your attendance for this session. The button is disabled to prevent duplicate entries.
            </p>
          </div>
        )}

        {!attendanceMarked && !isActive && (
          <div className="error-message">
            This session is not currently active. You can only mark attendance during the session time window.
          </div>
        )}

        {!attendanceMarked && isActive && distance !== null && !isWithinRadius && (
          <div className="error-message">
            You are outside the allowed location radius. Please move within {session.location.radius || 10} meters of the target location.
          </div>
        )}

        <form onSubmit={handleMarkAttendance}>
          <div className="form-group">
            <label>Enrollment Number</label>
            <input
              type="text"
              className="form-control"
              value={enrollmentNumber}
              onChange={(e) => setEnrollmentNumber(e.target.value.toUpperCase())}
              required
              disabled={attendanceMarked}
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={attendanceMarked || marking || !isActive || !isWithinRadius || !userLocation}
          >
            {attendanceMarked 
              ? 'Attendance Already Marked' 
              : marking 
                ? 'Marking...' 
                : 'Mark Attendance'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default MarkAttendance;
