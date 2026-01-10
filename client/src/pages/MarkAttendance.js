import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Circle, Marker, Popup, useMap } from 'react-leaflet';
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

// Map auto-fit component
const MapBoundsManager = ({ userLocation, sessionLocation, radius }) => {
  const map = useMap();

  useEffect(() => {
    if (userLocation && sessionLocation) {
      const bounds = L.latLngBounds([
        [sessionLocation.latitude, sessionLocation.longitude],
        [userLocation[0], userLocation[1]]
      ]);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 18 });
    }
  }, [userLocation, sessionLocation, map]);

  return null;
};

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
  const [locationAccuracy, setLocationAccuracy] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchSession();
    const watchId = startLocationWatch();
    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
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

  const startLocationWatch = () => {
    if (navigator.geolocation) {
      return navigator.geolocation.watchPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation([location.lat, location.lng]);
          setLocationAccuracy(position.coords.accuracy);
          if (session) {
            calculateDistance(location, session.location);
          }
          setLoading(false);
        },
        (error) => {
          let msg = 'Unable to get your location.';
          if (error.code === 1) msg = 'Location access denied. Please enable location permissions.';
          else if (error.code === 2) msg = 'Location unavailable. Try moving to an open area.';
          else if (error.code === 3) msg = 'Location request timed out.';
          setError(msg);
          setLoading(false);
        },
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
      );
    } else {
      setError('Geolocation is not supported by your browser.');
      setLoading(false);
      return null;
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
  const isWithinRadius = distance !== null && distance <= (session.location.radius || 500);

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
          <div className="location-stats">
            <p><strong>Distance:</strong> {distance.toFixed(2)} meters</p>
            {locationAccuracy && (
              <p>
                <strong>Accuracy:</strong> ±{locationAccuracy.toFixed(1)} meters
                {locationAccuracy > 100 && (
                  <span className="accuracy-warning" title="Poor accuracy might be due to indoor environment or GPS still locking"> ⚠️ Poor</span>
                )}
              </p>
            )}
            {userLocation && (
              <p className="raw-coords">
                <strong>Your Coordinates:</strong> {userLocation[0].toFixed(6)}, {userLocation[1].toFixed(6)}
              </p>
            )}
            <div className="location-status-badge">
              {loading ? <span className="tracking">Tracking...</span> : <span className="live">● LIVE</span>}
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <h2>Location Map</h2>
        <p className="map-info">
          The red circle shows the allowed {session.location.radius || 500}-meter radius. You must be within this area to mark attendance.
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
            <MapBoundsManager
              userLocation={userLocation}
              sessionLocation={session.location}
              radius={session.location.radius || 500}
            />
            <Circle
              center={center}
              radius={session.location.radius || 500}
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
            You are outside the allowed location radius. Please move within {session.location.radius || 500} meters of the target location.
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
