import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from './context/AuthContext';
import './Login.css';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [Identity, setIdentity] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
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
    if (email === '' || password === '' || Identity === '') {
      showMessage('Please fill in all fields.', 'error');
      return;
    }

    setIsLoading(true);
    clearMessage();

    try {
      const res = await axios.post(import.meta.env.VITE_BACKEND_SERVER+'/api/auth/login/adminlogin', {
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
          role: res.data.role 
        });
        
        showMessage('Login successful! Redirecting to dashboard...', 'success');
        
        setTimeout(() => {
          navigate('/admin-dashboard');
        }, 1500);
      }
    } catch (err) {
      console.error('Login error:', err.response?.data);
      
      // Handle specific error cases with explicit messages
      if (err.response?.status === 404) {
        showMessage('Account not found. Please check your credentials.');
      } else if (err.response?.status === 403) {
        showMessage('Access denied. Not an administrator account.');
      } else if (err.response?.status === 401) {
        if (err.response.data.message === 'Invalid Admin ID') {
          showMessage('Invalid Admin ID. Please check your credentials.');
        } else {
          showMessage('Invalid password. Please try again.');
        }
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
        <h2>Admin Login</h2>

        <form onSubmit={handleLogin}>
          <div className="input-group">
            <input
              type="text"
              placeholder="Admin ID"
              value={Identity}
              onChange={(e) => setIdentity(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <input
              type="email"
              placeholder="Email ID"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
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
            />
            <button
              type="button"
              className="toggle-password"
              onClick={handleTogglePassword}
            >
              👁️
            </button>
          </div>

          <div className="forgot-password-link">
            <a href="/reset-password">Forgot Password?</a>
          </div>

          <button type="submit" className="button" disabled={isLoading}>
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
          <button onClick={() => setMessage('')}>OK</button>
        </div>
      )}
    </div>
  );
};

export default AdminLogin;