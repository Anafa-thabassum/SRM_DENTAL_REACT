import React from 'react';
import { useNavigate } from 'react-router-dom';
import campusBg from '/images/campus.png';       // adjust path as needed
import dentalLogo from '/logo.png'; // adjust path as needed
import './UserType.css'; // Ensure you have the styles defined in this file

const UserType = () => {
  const navigate = useNavigate();

  return (
    <div className="container-body-user">
      <div className="container-box-user">
        {/* Logo */}
        <div className="logo-box-user">
          <img src={dentalLogo} alt="Clinic Logo" className="logo-img-user" />
        </div>

        {/* Header */}
        <h2 className="heading-user">Welcome!</h2>
        <p className="subheading-user">Please tell us about yourself:</p>

        {/* Buttons */}
        <center>
        <button
          className="option-button"
          onClick={() => navigate('/login/patientlogin')}
        >
          Existing Patient
        </button>
        <button
          className="option-button"
          onClick={() => navigate('/signup')}
        >
          New Patient
        </button>
        </center>
      </div>
    </div>
  );
};

export default UserType;
