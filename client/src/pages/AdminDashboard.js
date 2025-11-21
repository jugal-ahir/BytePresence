import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalSessions: 0,
    activeSessions: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [studentsRes, sessionsRes] = await Promise.all([
        api.get('/api/admin/students'),
        api.get('/api/sessions/admin')
      ]);
      setStats({
        totalStudents: studentsRes.data.length,
        totalSessions: sessionsRes.data.length,
        activeSessions: sessionsRes.data.filter(s => s.status === 'active').length
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
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
        <h1>Admin Dashboard</h1>
        <p>Manage students, courses, and attendance sessions</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Students</h3>
          <p className="stat-number">{stats.totalStudents}</p>
        </div>
        <div className="stat-card">
          <h3>Total Sessions</h3>
          <p className="stat-number">{stats.totalSessions}</p>
        </div>
        <div className="stat-card">
          <h3>Active Sessions</h3>
          <p className="stat-number">{stats.activeSessions}</p>
        </div>
      </div>

      <div className="grid">
        <Link to="/admin/courses" className="dashboard-card">
          <h2>📚 Course Management</h2>
          <p>Create and manage courses and sections</p>
        </Link>
        <Link to="/admin/students" className="dashboard-card">
          <h2>👥 Student Management</h2>
          <p>Register and manage students</p>
        </Link>
        <Link to="/admin/sessions" className="dashboard-card">
          <h2>📅 Session Management</h2>
          <p>Create and manage attendance sessions</p>
        </Link>
      </div>
    </div>
  );
};

export default AdminDashboard;

