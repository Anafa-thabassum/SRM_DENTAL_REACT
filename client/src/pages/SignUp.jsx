import React, { useState } from 'react';
import './Signup.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const SignUp = () => {
  const navigate = useNavigate();
  const [otpVerified, setOtpVerified] = useState(false);
  const [message, setMessage] = useState('');
  const [showMessage, setShowMessage] = useState(false);
  const [role, setRole] = useState('patient');
  const [Identity, setIdentity] = useState('');
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [otpError, setOtpError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordHint, setPasswordHint] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  const showMessageBox = (msg) => {
    setMessage(msg);
    setShowMessage(true);
  };

  const hideMessageBox = () => {
    setShowMessage(false);
  };

  // Handle email input change
  const handleEmailChange = (e) => {
    const email = e.target.value.trim();
    if (email === '') {
      setEmailError('');
    } else {
      setEmailError(validateEmail(email));
    }
  };

  // Handle phone input change
  const handlePhoneChange = (e) => {
    const phone = e.target.value.trim();
    if (phone === '') {
      setPhoneError('');
    } else {
      setPhoneError(validatePhone(phone));
    }
  };

  // Handle password input change with strength calculation
  const handlePasswordChange = (e) => {
    const password = e.target.value;
    const { strength, hint } = calculatePasswordStrength(password);
    setPasswordStrength(strength);
    setPasswordHint(hint);
  };

  // Get strength class for styling
  const getStrengthClass = (strength) => {
    switch (strength) {
      case 1: return 'strength-weak';
      case 2: return 'strength-fair';
      case 3: return 'strength-good';
      case 4: return 'strength-strong';
      case 5: return 'strength-excellent';
      default: return '';
    }
  };

  const sendOTP = async () => {
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const method = document.querySelector('input[name="otpMethod"]:checked').value;

    const errors = [];

    if (name === '') errors.push('Please enter your name.');
    if (method === 'email' && email === '') errors.push('Please enter your email.');
    if (method === 'phone' && phone === '') errors.push('Please enter your phone number.');

    // Check email validation
    if (method === 'email' && email) {
      const emailValidationError = validateEmail(email);
      if (emailValidationError) {
        errors.push(emailValidationError);
      }
    }

    // Check phone validation
    if (method === 'phone' && phone) {
      const phoneValidationError = validatePhone(phone);
      if (phoneValidationError) {
        errors.push(phoneValidationError);
      }
    }

    if (errors.length > 0) {
      return showMessageBox(errors.join('\n'));
    }

    setIsSendingOtp(true);
    setOtpVerified(false);
    setOtpError('');

    try {
      console.log('Sending OTP request for:', { name, email: method === 'email' ? email : 'N/A', phone: method === 'phone' ? phone : 'N/A', method });
      
      // Only send the email or phone based on the selected method
      const requestData = {
        name,
        method
      };
      
      if (method === 'email') {
        requestData.email = email;
      } else if (method === 'phone') {
        requestData.phone = phone;
      }

      console.log('Request data:', requestData);

      const res = await axios.post(import.meta.env.VITE_BACKEND_SERVER+'/api/otp/send-otp', requestData, {
        timeout: 10000,
        validateStatus: function (status) {
          return status < 500;
        }
      });
      
      console.log('OTP response status:', res.status);
      console.log('OTP response data:', res.data);
      
      if (res.status === 200 && res.data.success) {
        setOtpError('');
        if (method === 'email') {
          showMessageBox(`✅ OTP sent to your email`);
        } else {
          showMessageBox(`✅ OTP sent to your phone`);
        }
      } else {
        const errorMessage = res.data.message || res.data.error || 'Failed to send OTP';
        console.log('Error message from server:', errorMessage);
        
        if (errorMessage.includes('already exists') || errorMessage.includes('already registered')) {
          showMessageBox('❌ This email or phone number is already registered. Please use a different one or login instead.');
        } else if (errorMessage.includes('Invalid method')) {
          showMessageBox('❌ Please select a valid OTP method.');
        } else if (errorMessage.includes('required')) {
          showMessageBox(`❌ ${errorMessage}`);
        } else {
          showMessageBox(`❌ ${errorMessage}`);
        }
      }
    } catch (err) {
      console.error('Error sending OTP:', err);
      console.error('Error details:', err.response?.data);
      
      if (err.code === 'ECONNREFUSED') {
        showMessageBox('❌ Cannot connect to server. Please make sure the backend is running on port 5000.');
      } else if (err.response) {
        const errorMessage = err.response.data?.message || err.response.data?.error || 'Unknown server error';
        showMessageBox(`❌ Server error: ${errorMessage}`);
      } else if (err.request) {
        showMessageBox('❌ No response from server. Please check your connection.');
      } else {
        showMessageBox('❌ Failed to send OTP. Please try again.');
      }
    } finally {
      setIsSendingOtp(false);
    }
  };

  const verifyOTP = async () => {
    const userOTP = document.getElementById('otpInput').value.trim();
    const method = document.querySelector('input[name="otpMethod"]:checked').value;
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    
    // Clear previous errors
    setOtpError('');
    hideMessageBox();
    
    if (userOTP === '') {
      setOtpError('Please enter the OTP');
      return;
    }

    if (userOTP.length !== 6) {
      setOtpError('OTP must be 6 digits');
      return;
    }
    
    setIsVerifyingOtp(true);

    try {
      const response = await fetch(import.meta.env.VITE_BACKEND_SERVER+'/api/otp/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          otp: userOTP,
          method,
          email: method === 'email' ? email : undefined,
          phone: method === 'phone' ? phone : undefined
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setOtpVerified(true);
        setOtpError('');
        showMessageBox('✅ OTP verified successfully!');
        
        setTimeout(() => {
          hideMessageBox();
        }, 2000);
      } else {
        setOtpVerified(false);
        setOtpError(data.message || 'Incorrect OTP. Please try again.');
        showMessageBox(`❌ ${data.message || 'Incorrect OTP. Please try again.'}`);
      }
    } catch (err) {
      console.error('OTP verification error:', err);
      setOtpError('Failed to verify OTP. Please try again.');
      showMessageBox('❌ Failed to verify OTP. Please try again.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const togglePassword = (id) => {
    const input = document.getElementById(id);
    input.type = input.type === 'password' ? 'text' : 'password';
  };

  const finalSignup = async () => {
    // Prevent multiple submissions
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    const name = document.getElementById('name').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    let Identity = (role !== 'patient') ? document.getElementById('Identity').value.trim() : "";

    if (name === '' || !otpVerified) {
      showMessageBox('Please complete all previous steps and verify OTP.');
      setIsSubmitting(false);
      return;
    }

    // Password strength validation
    const { strength, checks } = calculatePasswordStrength(password);
    if (strength < 5) {
      const missingRequirements = [];
      if (!checks.length) missingRequirements.push('At least 6 characters');
      if (!checks.uppercase) missingRequirements.push('One uppercase letter');
      if (!checks.lowercase) missingRequirements.push('One lowercase letter');
      if (!checks.number) missingRequirements.push('One number');
      if (!checks.special) missingRequirements.push('One special character');
      
      showMessageBox('❌ Password does not meet requirements:\n• ' + missingRequirements.join('\n• '));
      setIsSubmitting(false);
      return;
    }

    if (password !== confirmPassword) {
      showMessageBox('❌ Passwords do not match.');
      setIsSubmitting(false);
      return;
    }

    if (role === 'doctor' && !Identity) {
      showMessageBox('Please enter your Doctor ID.');
      setIsSubmitting(false);
      return;
    }
    
    if (role === 'admin' && !Identity) {
      showMessageBox('Please enter your Admin ID.');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch(import.meta.env.VITE_BACKEND_SERVER+'/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone: document.getElementById('phone').value,
          email: document.getElementById('email').value,
          password,
          role,
          Identity
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        if (role === 'patient') {
          localStorage.setItem("patientId", data.Identity);
        }
        
        if (data.message === 'User registered successfully') {
          showMessageBox('✅ Registration successful! Redirecting to login...');
          
          // Redirect after a short delay
          setTimeout(() => {
            if (role === 'admin') {
              navigate('/login/adminlogin');
            } else if (role === 'doctor') {
              navigate('/login/doctorlogin');
            } else {
              navigate('/login/patientlogin');
            }
          }, 2000);
        } else {
          showMessageBox(`❌ ${data.message}`);
        }
      } else {
        showMessageBox(`❌ ${data.message || 'Registration failed'}`);
      }
    } catch (err) {
      console.error('Signup Error:', err);
      showMessageBox('❌ Server error during signup. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className='signup-body'>
      <div className="signup-box">
        <center><img src="logo.png" alt="SRM Logo" className="logo" /></center>
        <div className="college-name">SRM DENTAL COLLEGE</div>
        <h2>Sign Up</h2>

        <form id="signupForm" onSubmit={(e) => e.preventDefault()}>
          <div className="input-group">
            <input type="text" id="name" placeholder="Full Name" required />
          </div>

          <div className="input-group-sign">
            <input 
              type="email" 
              id="email" 
              placeholder="Email ID" 
              onChange={handleEmailChange}
            />
            {emailError && <div className="error-message">{emailError}</div>}
          </div>

          <div className="input-group-sign">
            <input 
              type="tel" 
              id="phone" 
              placeholder="Phone Number" 
              onChange={handlePhoneChange}
            />
            {phoneError && <div className="error-message">{phoneError}</div>}
          </div>

          <div className="checkbox-group">
            <label><input type="radio" name="otpMethod" value="email" defaultChecked /> Email</label>
            <label><input type="radio" name="otpMethod" value="phone" /> Phone</label>
          </div>

          <div className="input-group-sign otp-container">
            <button 
              type="button" 
              className="button send-otp-btn" 
              onClick={sendOTP}
              disabled={isSendingOtp}
            >
              {isSendingOtp ? 'Sending...' : 'Send OTP'}
            </button>
            <input 
              type="text" 
              id="otpInput" 
              placeholder="Enter OTP" 
              className="otp-input" 
              maxLength={6}
            />
            <button 
              type="button" 
              className="button verify-otp-btn" 
              onClick={verifyOTP}
              disabled={isVerifyingOtp || otpVerified}
            >
              {isVerifyingOtp ? 'Verifying...' : 'Verify'}
            </button>
          </div>
          {otpError && <div className="error-message">{otpError}</div>}

          {otpVerified && (
            <div className="verified-box">
              ✅ OTP Verified Successfully!
            </div>
          )}

          <div className="input-group-sign password-container">
            <input
              type="password"
              id="password"
              placeholder="Create Password"
              required
              onChange={handlePasswordChange}
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => togglePassword('password')}
            >
              👁️
            </button>
            
            <div className="password-progress">
              <div 
                className={`password-progress-fill strength-${passwordStrength}`}
              ></div>
            </div>
            
            <div className={`password-hint ${getStrengthClass(passwordStrength)}`}>
              {passwordHint}
            </div>
          </div>

          <div className="input-group-sign">
            <input 
              type="password" 
              id="confirmPassword" 
              placeholder="Confirm Password" 
              required 
            />
            <button type="button" className="toggle-password" onClick={() => togglePassword('confirmPassword')}>👁️</button>
          </div>

          <div className="input-group-sign">
            <select id="role" value={role} onChange={(e) => setRole(e.target.value)} required>
              <option value="patient">Patient</option>
              <option value="doctor">Doctor</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {(role === 'doctor' || role === 'admin') && (
            <div className="input-group-sign">
              <input 
                type="text" 
                id="Identity" 
                value={Identity}
                onChange={(e) => setIdentity(e.target.value)}
                placeholder={role === "doctor" ? "Enter Doctor ID" : "Enter Admin ID"} 
                required 
              />
            </div>
          )}

          <button 
            type="submit" 
            className="button" 
            onClick={finalSignup}
            disabled={isSubmitting || !otpVerified}
          >
            {isSubmitting ? 'Signing Up...' : 'Sign Up'}
          </button>
        </form>

        <div className="signup-link">
          Already have an account? <a href="/login">Log In</a>
        </div>

        {showMessage && (
          <div className="message-box">
            <p>{message}</p>
            <button onClick={hideMessageBox}>OK</button>
          </div>
        )}
      </div>
    </section>
  );
};

export default SignUp; //Validate email format and domain
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Invalid email format.';
    }
    
    // Check for common email domains
    const commonDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com', 'protonmail.com', 'eec.srmrmp.edu.in'];
    const domain = email.split('@')[1];
    
    if (!commonDomains.some(d => domain.includes(d))) {
      return 'Please use a valid email provider (Gmail, Yahoo, Outlook, etc.).';
    }
    
    return '';
  };

  // Validate phone number
  const validatePhone = (phone) => {
    if (!/^[0-9]{10}$/.test(phone)) {
      return 'Phone must be exactly 10 digits.';
    }
    if (/[@#$%^&*()\-\+=:;<>?\/|{}\[\]~]/.test(phone)) {
      return 'Phone number should not contain special characters.';
    }
    return '';
  };

  // Calculate password strength and return appropriate values
  const calculatePasswordStrength = (password) => {
    let strength = 0;
    const checks = {
      length: password.length >= 6,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    // Count satisfied requirements
    Object.values(checks).forEach(check => {
      if (check) strength++;
    });

    // Generate hint based on strength
    let hint = '';
    switch (strength) {
      case 0:
      case 1:
        hint = 'Very Weak - Add more characters';
        break;
      case 2:
        hint = 'Weak - Missing requirements';
        break;
      case 3:
        hint = 'Fair - Getting better';
        break;
      case 4:
        hint = 'Strong - Almost there';
        break;
      case 5:
        hint = 'Excellent - Password meets all requirements';
        break;
      default:
        hint = '';
    }

    return { strength, hint, checks };
  };
