import React, { useState, useEffect } from "react";
import axios from "axios";
import "./UpdatePatient.css";
import { useNavigate } from 'react-router-dom';

const UpdatePatientDetails = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [message, setMessage] = useState("");

  const patientId = localStorage.getItem("patientId"); // Identity stored on login
  const navigate = useNavigate();
  useEffect(() => {
    // Load existing details from localStorage or API
    const savedData = localStorage.getItem("patientDetails");
    if (savedData) {
      const data = JSON.parse(savedData);
      setName(data.name || "");
      setEmail(data.email || "");
      setPhone(data.phone || "");
    }
  }, []);

  const sendOtp = async () => {
    try {
      const res = await axios.post("http://localhost:5000/api/otp/send-otp", {
        phone,
        method: "phone",
      });
      setOtpSent(true);
      setMessage(`OTP sent: ${res.data.otp}`); // Display OTP for testing
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to send OTP");
    }
  };

  const verifyOtpAndUpdate = async () => {
    try {
      const verifyRes = await axios.post("http://localhost:5000/api/otp/verify-otp", {
        phone,
        otp,
      });

      if (verifyRes.data.success) {
        // Update patient details
        const updateRes = await axios.post("http://localhost:5000/api/otp/update", {
          Identity: patientId,
          name,
          email,
          phone,
        });
        setMessage(updateRes.data.message);
        localStorage.setItem(
          "patientDetails",
          JSON.stringify({ name, email, phone })
        );
        navigate("/patient-dashboard")
      } else {
        setMessage("OTP verification failed");
      }
    } catch (err) {
      setMessage(err.response?.data?.message || "Update failed");
    }
  };

  return (
   <div className="updatebody" style={{ backgroundImage: "url('Campus.png')" }}>
    <div className="update-form-container">
    <h1 className="form-title">Update Your Details</h1>

    {message && (
      <div className="message-box">{message}</div>
    )}

    <form className="form-group">
     <div className="form-group">
        <label htmlFor="name">Name</label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="form-group-input"
        />
      </div>

      <div className="form-group">
        <label htmlFor="email">Email</label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="form-group-input"
        />
      </div>

      <div className="form-group">
        <label htmlFor="phone">Phone</label>
        <input
          type="tel"
          id="phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="form-group-input"
        />
      </div>

      {!otpSent ? (
        <button
          type="button"
          className="button"
          onClick={() => {
            if (phone !== "" && phone.length > 10) {
              sendOtp();
            }
          }}
        >
          Send OTP
        </button>
      ) : (
        <>
          <div className="form-group">
            <label htmlFor="otp">Enter OTP</label>
            <input
              type="text"
              id="otp"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="form-group-input"
            />
          </div>
          <button
            type="button"
            className="button"
            onClick={verifyOtpAndUpdate}
          >
            Verify OTP & Update
          </button>
        </>
      )}

      <button
        type="button"
        className="button"
        onClick={() => window.location.href = "/patient-dashboard"}
      >
        Back to Dashboard
      </button>
    </form>
  </div>
</div>
  );
};

export default UpdatePatientDetails;
