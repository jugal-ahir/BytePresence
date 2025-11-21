import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import './StudentDashboard.css';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [availableSessions, setAvailableSessions] = useState([]);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [sessionsRes, historyRes] = await Promise.all([
        api.get('/api/sessions/available'),
        api.get('/api/student/attendance')
      ]);
      setAvailableSessions(sessionsRes.data);
      setAttendanceHistory(historyRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="container">
      <div className="dashboard-header">
        <h1>Student Dashboard</h1>
        <p>Welcome, {user?.name} ({user?.enrollmentNumber})</p>
      </div>

      <div className="card">
        <h2>Available Attendance Sessions</h2>
        {availableSessions.length === 0 ? (
          <p className="no-data">No active sessions available at the moment.</p>
        ) : (
          <div className="grid">
            {availableSessions.map(session => (
              <div key={session._id} className="session-card">
                <h3>{session.title}</h3>
                <p><strong>Time:</strong> {new Date(session.startTime).toLocaleString()} - {new Date(session.endTime).toLocaleString()}</p>
                <p><strong>Courses:</strong> {session.courses.map(c => `${c.course} - ${c.section}`).join(', ')}</p>
                {session.attendanceMarked ? (
                  <div className="attendance-status-marked">
                    <span className="check-icon-small">✓</span>
                    <span>Attendance Already Marked</span>
                    {session.markedAt && (
                      <span className="marked-time">({new Date(session.markedAt).toLocaleString()})</span>
                    )}
                  </div>
                ) : (
                  <Link
                    to={`/student/mark-attendance/${session._id}`}
                    className="btn btn-primary"
                  >
                    Mark Attendance
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h2>Attendance History</h2>
        {attendanceHistory.length === 0 ? (
          <p className="no-data">No attendance records yet.</p>
        ) : (
          <div className="attendance-table">
            <table>
              <thead>
                <tr>
                  <th>Session</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {attendanceHistory.map(record => (
                  <tr key={record._id}>
                    <td>{record.session?.title}</td>
                    <td>{new Date(record.markedAt).toLocaleDateString()}</td>
                    <td>{new Date(record.markedAt).toLocaleTimeString()}</td>
                    <td>
                      <span className={`status-badge status-${record.status}`}>
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;

