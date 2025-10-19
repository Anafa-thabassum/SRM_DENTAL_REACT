import React, { useEffect, useState } from 'react';
import dentalLogo from '/logo.png';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import './PatientDashboard.css';

export default function PatientDashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [patientName, setPatientName] = useState('');
  const [patientId, setPatientId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Redirect to login if not authenticated and load patient data
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/patient-login', { replace: true });
      return;
    }

    // Load patient data
    const name = localStorage.getItem('patientName');
    const id = localStorage.getItem('patientId');
    
    setPatientName(name || 'Patient');
    setPatientId(id || 'N/A');
  }, [navigate]);

  const handleNavigation = (route) => {
    setIsLoading(true);
    console.log(`Navigating to: ${route}`);
    
    // Add smooth transition delay
    setTimeout(() => {
      navigate(route);
      setIsLoading(false);
    }, 150);
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
      navigate('/patient-login', { replace: true });
    }
  };

  // Format patient name for better display
  const formatName = (name) => {
    if (!name || name === 'Patient') return 'Patient';
    
    // Capitalize first letter of each word
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  return (
    <div className="patient-dashboard">
      <div className="dental-hub-container">
        <button 
          onClick={handleLogout} 
          className="logout-btn"
          aria-label="Logout from dashboard"
        >
          Logout
        </button>

        <div className="logo-box-user">
          <img 
            src={dentalLogo} 
            alt="SRM Dental Clinic Logo" 
            className="logo-img-user" 
          />
        </div>

        <h1>Welcome to SRM Dental Clinic</h1>
        <p className="welcome-text">
          {formatName(patientName)}
        </p>

        <div className="patient-id">
          Patient ID: {patientId}
        </div>

        <div className="button-container">
          <button 
            onClick={() => handleNavigation('/my-appointments')}
            disabled={isLoading}
            aria-label="View my appointments"
          >
            My Appointments
          </button>

          <button 
            onClick={() => handleNavigation('/update-patient')}
            disabled={isLoading}
            aria-label="Update my details"
          >
            Update My Details
          </button>

          <button 
            onClick={() => handleNavigation('/my-prescriptions')}
            disabled={isLoading}
            aria-label="View my prescriptions"
          >
            My Prescriptions
          </button>

          <button 
            onClick={() => handleNavigation('/slot-booking')}
            disabled={isLoading}
            aria-label="Book a new appointment"
          >
            Book New Appointment
          </button>
        </div>
      </div>
    </div>
  );
}