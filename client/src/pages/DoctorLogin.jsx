import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from './context/AuthContext'; 
import './Login.css';

const DoctorLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [role, setRole] = useState('Select Role');
  const [Identity, setIdentity] = useState('');
  const { login } = useAuth();

  const handleTogglePassword = () => {
    const input = document.getElementById('password');
    input.type = input.type === 'password' ? 'text' : 'password';
  };

  const showMessage = (msg, type = 'error') => {
    setMessage(msg);
    setMessageType(type);
  };

  const clearMessage = () => {
    setMessage('');
    setMessageType('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (email === '' || password === '' || Identity === '' || role === 'Select Role') {
      showMessage('Please fill in all fields.', 'error');
      return;
    }

    setIsLoading(true);
    clearMessage();

    try {
      const res = await axios.post(import.meta.env.VITE_BACKEND_SERVER+'/api/auth/login/doctorlogin', {
        email,
        password,
        Identity,
      });
      
      if (res.status === 200) {
        // Use the context login function
        login({
          token: res.data.token,
          name: res.data.name,
          Identity: res.data.Identity,
          role: role 
        });
        
        showMessage('Login successful! Redirecting to dashboard...', 'success');
        
        setTimeout(() => {
          if (role === 'doctor') {
            navigate('/doctor-dashboard');
          } else if (role === 'chief-doctor') {
            navigate('/chief-doctor-dashboard');
          }
        }, 1500);
      }
    } catch (err) {
      console.error('Login error:', err.response?.data);
      
      // Handle specific error cases with explicit messages
      if (err.response?.status === 404) {
        showMessage('Account not found. Please check your credentials.');
      } else if (err.response?.status === 401) {
        showMessage('Incorrect password. Please try again or use "Forgot Password" to reset.');
      } else if (err.response?.status === 400) {
        showMessage('Invalid request. Please check your input and try again.');
      } else if (err.code === 'ECONNREFUSED') {
        showMessage('Cannot connect to server. Please check your internet connection or try again later.');
      } else if (err.response?.data?.message) {
        showMessage(`${err.response.data.message}`);
      } else {
        showMessage('Server error. Please try again later.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-box">
        <center><img src="/images/logo.png" alt="SRM Logo" className="logo" /></center>
        <div className="college-name">SRM DENTAL COLLEGE</div>
        <h2>Doctor Login</h2>

        <form onSubmit={handleLogin}>
          <div className="input-group">
            <input
              type="text"
              placeholder="Email ID"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className="input-group">
            <input
              type="password"
              id="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
            <button
              type="button"
              className="toggle-password"
              onClick={handleTogglePassword}
              disabled={isLoading}
            >
              👁️
            </button>
          </div>

          <div className="forgot-password-link">
            <a href="/reset-password">Forgot Password?</a>
          </div>
          
          <div className="input-group-sign">
            <select 
              value={role} 
              onChange={(e) => setRole(e.target.value)}
              disabled={isLoading}
            >
              <option value="Select Role" disabled>Select Role</option>
              <option value="doctor">Doctor</option>
              <option value="chief-doctor">Chief Doctor</option>
            </select>
          </div>
          
          <div className="input-group">
            <input
              type="text"
              placeholder="Identity"
              value={Identity}
              onChange={(e) => setIdentity(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          
          <button 
            type="submit" 
            className="button"
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>

          <div className="signup-link">
            Don't have an account? <a href="/signup">Sign Up</a>
          </div>
        </form>
      </div>

      {message && (
        <div className={`message-box ${messageType}`}>
          <p>{message}</p>
          <button onClick={clearMessage}>OK</button>
        </div>
      )}
    </div>
  );
};

export default DoctorLogin;