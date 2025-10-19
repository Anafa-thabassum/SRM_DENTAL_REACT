import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Signup.css';
import axios from 'axios';

const ForgetPassword = () => {
  const navigate = useNavigate();
  const [otpVerified, setOtpVerified] = useState(false);
  const [message, setMessage] = useState('');
  const [showMessage, setShowMessage] = useState(false);
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

  const hideMessageBox = () => setShowMessage(false);

  // Handle email/phone validation
  const handleEmailChange = (e) => {
    const email = e.target.value.trim();
    setEmailError(email ? validateEmail(email) : '');
  };

  const handlePhoneChange = (e) => {
    const phone = e.target.value.trim();
    setPhoneError(phone ? validatePhone(phone) : '');
  };

  // Password strength
  const handlePasswordChange = (e) => {
    const password = e.target.value;
    const { strength, hint } = calculatePasswordStrength(password);
    setPasswordStrength(strength);
    setPasswordHint(hint);
  };

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

  // Send OTP - FIXED: Remove the direct User model usage
  const sendOTP = async () => {
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const method = document.querySelector('input[name="otpMethod"]:checked').value;

    const errors = [];
    if (method === 'email' && !email) errors.push('Please enter your email.');
    if (method === 'phone' && !phone) errors.push('Please enter your phone number.');

    if (errors.length > 0) {
      showMessageBox(errors.join('\n'));
      return;
    }

    setIsSendingOtp(true);
    setOtpVerified(false);
    setOtpError('');

    try {
      // For forget password, we need to check if user exists first
      // We'll do this by making an API call to check user existence
      let userExists = false;
      
      if (method === 'email') {
        // Check if email exists by trying to find user
        try {
          const response = await axios.post(import.meta.env.VITE_BACKEND_SERVER+'/api/auth/check-user', { email });
          userExists = response.data.exists;
        } catch (err) {
          console.log('User check failed, proceeding with OTP send anyway');
          userExists = true; // Assume user exists for forget password flow
        }
      } else if (method === 'phone') {
        // Check if phone exists
        try {
          const response = await axios.post(import.meta.env.VITE_BACKEND_SERVER+'/api/auth/check-user', { phone });
          userExists = response.data.exists;
        } catch (err) {
          console.log('User check failed, proceeding with OTP send anyway');
          userExists = true; // Assume user exists for forget password flow
        }
      }

      if (!userExists) {
        showMessageBox('❌ No account found with the provided credentials');
        setIsSendingOtp(false);
        return;
      }

      const requestData = { 
        name: "User", // Placeholder name for OTP
        method 
      };
      
      if (method === 'email') requestData.email = email;
      if (method === 'phone') requestData.phone = phone;

      const res = await axios.post(import.meta.env.VITE_BACKEND_SERVER+'/api/otp/send-otp-reset', requestData);

      if (res.data.success) {
        showMessageBox(`✅ OTP sent to your ${method}`);
      } else {
        showMessageBox(`❌ ${res.data.message || 'Failed to send OTP'}`);
      }
    } catch (err) {
      console.error('OTP send error:', err);
      if (err.response?.status === 400) {
        showMessageBox(`❌ ${err.response.data.message || 'Failed to send OTP'}`);
      } else {
        showMessageBox('❌ Error sending OTP. Please try again.');
      }
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Verify OTP - FIXED
  const verifyOTP = async () => {
    const otp = document.getElementById('otpInput').value.trim();
    const method = document.querySelector('input[name="otpMethod"]:checked').value;
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();

    if (!otp || otp.length !== 6) {
      setOtpError('OTP must be 6 digits');
      return;
    }

    setIsVerifyingOtp(true);
    try {
      const res = await axios.post(import.meta.env.VITE_BACKEND_SERVER+'/api/otp/verify-otp', {
        otp,
        method,
        email: method === 'email' ? email : undefined,
        phone: method === 'phone' ? phone : undefined,
      });

      if (res.data.success) {
        setOtpVerified(true);
        setOtpError('');
        showMessageBox('✅ OTP verified successfully!');
      } else {
        setOtpVerified(false);
        setOtpError(res.data.message || 'Invalid OTP');
        showMessageBox(`❌ ${res.data.message || 'Invalid OTP'}`);
      }
    } catch (err) {
      console.error('OTP verify error:', err);
      setOtpError('❌ Failed to verify OTP');
      showMessageBox('❌ Failed to verify OTP. Please try again.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Reset password - FIXED
  const resetPassword = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (!otpVerified) {
      showMessageBox('Please verify OTP first.');
      setIsSubmitting(false);
      return;
    }

    if (password !== confirmPassword) {
      showMessageBox('❌ Passwords do not match.');
      setIsSubmitting(false);
      return;
    }

    const { strength } = calculatePasswordStrength(password);
    if (strength < 3) {
      showMessageBox('❌ Password is too weak. Please follow requirements.');
      setIsSubmitting(false);
      return;
    }

    try {
      // Call the password reset API
      const res = await axios.post(import.meta.env.VITE_BACKEND_SERVER+'/api/auth/reset-password', {
        email,
        phone,
        password,
      });

      if (res.data.success) {
        showMessageBox('✅ Password reset successful! Redirecting to login...');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        showMessageBox(`❌ ${res.data.message || 'Password reset failed'}`);
      }
    } catch (err) {
      console.error('Password reset error:', err);
      showMessageBox('❌ Server error during password reset.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="signup-body">
      <div className="signup-box">
        <center><img src="logo.png" alt="SRM Logo" className="logo" /></center>
        <div className="college-name">SRM DENTAL COLLEGE</div>
        <h2>Reset Password</h2>

        <form onSubmit={(e) => e.preventDefault()}>
          {/* Email / Phone */}
          <div className="input-group-sign">
            <input type="email" id="email" placeholder="Email ID" onChange={handleEmailChange} />
            {emailError && <div className="error-message">{emailError}</div>}
          </div>

          <div className="input-group-sign">
            <input type="tel" id="phone" placeholder="Phone Number" onChange={handlePhoneChange} />
            {phoneError && <div className="error-message">{phoneError}</div>}
          </div>

          {/* OTP Method Selection */}
          <div className="checkbox-group">
            <label><input type="radio" name="otpMethod" value="email" defaultChecked /> Email</label>
            <label><input type="radio" name="otpMethod" value="phone" /> Phone</label>
          </div>

          {/* OTP Input */}
          <div className="input-group-sign otp-container">
            <button type="button" className="button send-otp-btn" onClick={sendOTP} disabled={isSendingOtp}>
              {isSendingOtp ? 'Sending...' : 'Send OTP'}
            </button>
            <input type="text" id="otpInput" placeholder="Enter OTP" maxLength={6} className="otp-input" />
            <button type="button" className="button verify-otp-btn" onClick={verifyOTP} disabled={isVerifyingOtp || otpVerified}>
              {isVerifyingOtp ? 'Verifying...' : 'Verify'}
            </button>
          </div>
          {otpError && <div className="error-message">{otpError}</div>}

          {/* New Password (only show after OTP verification) */}
          {otpVerified && (
            <>
              <div className="input-group-sign password-container">
                <input type="password" id="password" placeholder="New Password" required onChange={handlePasswordChange} />
                <div className="password-progress">
                  <div className={`password-progress-fill strength-${passwordStrength}`}></div>
                </div>
                <div className={`password-hint ${getStrengthClass(passwordStrength)}`}>{passwordHint}</div>
              </div>

              <div className="input-group-sign">
                <input type="password" id="confirmPassword" placeholder="Confirm Password" required />
              </div>

              <button type="submit" className="button" onClick={resetPassword} disabled={isSubmitting}>
                {isSubmitting ? 'Resetting...' : 'Reset Password'}
              </button>
            </>
          )}
        </form>

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

/* --- Validation helpers --- */
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) ? '' : 'Invalid email format.';
};

const validatePhone = (phone) => {
  return /^[0-9]{10}$/.test(phone) ? '' : 'Phone must be 10 digits.';
};

const calculatePasswordStrength = (password) => {
  let strength = 0;
  const checks = {
    length: password.length >= 6,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };
  
  Object.values(checks).forEach((c) => c && strength++);
  
  let hint = '';
  switch (strength) {
    case 0:
    case 1: hint = 'Very Weak - Add more characters'; break;
    case 2: hint = 'Weak - Add uppercase letters and numbers'; break;
    case 3: hint = 'Fair - Good start'; break;
    case 4: hint = 'Strong - Almost there'; break;
    case 5: hint = 'Excellent - Strong password'; break;
    default: break;
  }
  
  return { strength, hint, checks };
};

export default ForgetPassword;