import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMobileMenuOpen(false);
  };

  const handleBrandClick = (e) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    if (isAuthenticated) {
      if (user?.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    } else {
      navigate('/login');
    }
  };

  const handleLinkClick = () => {
    setMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand-wrapper">
          <a href="#" onClick={handleBrandClick} className="navbar-brand">
            📚 Attendance System
          </a>
          <button 
            className="hamburger-menu" 
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
          >
            <span className={mobileMenuOpen ? 'hamburger-line open' : 'hamburger-line'}></span>
            <span className={mobileMenuOpen ? 'hamburger-line open' : 'hamburger-line'}></span>
            <span className={mobileMenuOpen ? 'hamburger-line open' : 'hamburger-line'}></span>
          </button>
        </div>
        <div className={`navbar-menu ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          {isAuthenticated ? (
            <>
              {user?.role === 'admin' ? (
                <>
                  <Link to="/admin/dashboard" className="navbar-link" onClick={handleLinkClick}>
                    Dashboard
                  </Link>
                  <Link to="/admin/courses" className="navbar-link" onClick={handleLinkClick}>
                    Courses
                  </Link>
                  <Link to="/admin/students" className="navbar-link" onClick={handleLinkClick}>
                    Students
                  </Link>
                  <Link to="/admin/sessions" className="navbar-link" onClick={handleLinkClick}>
                    Sessions
                  </Link>
                </>
              ) : (
                <Link to="/student/dashboard" className="navbar-link" onClick={handleLinkClick}>
                  Dashboard
                </Link>
              )}
              <div className="navbar-user-section">
                <span className="navbar-user">Welcome, {user?.name}</span>
                <button onClick={handleLogout} className="btn btn-secondary navbar-logout-btn">
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="navbar-link" onClick={handleLinkClick}>
                Login
              </Link>
              <Link to="/register" className="navbar-link" onClick={handleLinkClick}>
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

